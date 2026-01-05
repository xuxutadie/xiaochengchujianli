
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Volcengine (Ark)
const VOLC_API_KEY = process.env.VOLC_API_KEY;
const VOLC_ENDPOINT_ID = process.env.VOLC_ENDPOINT_ID;

console.log('AI Configuration:', {
  hasApiKey: !!VOLC_API_KEY,
  hasEndpointId: !!VOLC_ENDPOINT_ID
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection and initialize table
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        is_used BOOLEAN DEFAULT false,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Database init error:', err);
  }
};
initDb();

// Verify code endpoint
app.post('/api/verify', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: '请输入验证码' });
  }

  try {
    // 优先尝试数据库
    try {
      const result = await pool.query(
        'SELECT * FROM verification_codes WHERE code = $1',
        [code]
      );

      if (result.rows.length > 0) {
        const codeData = result.rows[0];
        if (codeData.is_used) {
          return res.status(400).json({ success: false, message: '该验证码已被使用' });
        }
        await pool.query(
          'UPDATE verification_codes SET is_used = true, used_at = NOW() WHERE code = $1',
          [code]
        );
        return res.json({ success: true });
      }
    } catch (dbErr) {
      console.log('Database not available, falling back to local codes.json');
    }

    // 兜底方案：读取本地 codes.json (适用于未配置数据库的情况)
    const fs = require('fs');
    const path = require('path');
    const codesPath = path.join(__dirname, '..', 'public', 'codes.json');
    
    if (fs.existsSync(codesPath)) {
      const codesData = JSON.parse(fs.readFileSync(codesPath, 'utf8'));
      if (codesData.includes(code)) {
        return res.json({ success: true, note: 'validated via local fallback' });
      }
    }

    res.status(404).json({ success: false, message: '验证码不存在' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, message: '验证校验服务异常' });
  }
});

// Admin endpoint to add codes (For initial setup)
app.post('/api/admin/add-codes', async (req, res) => {
  const { codes, adminKey } = req.body;
  
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ success: false, message: '无权操作' });
  }

  try {
    for (const code of codes) {
      await pool.query(
        'INSERT INTO verification_codes (code) VALUES ($1) ON CONFLICT DO NOTHING',
        [code]
      );
    }
    res.json({ success: true, message: `成功导入 ${codes.length} 个验证码` });
  } catch (err) {
    console.error('Add codes error:', err);
    res.status(500).json({ success: false, message: '导入失败' });
  }
});

// AI Polish endpoint
app.post('/api/ai/polish', async (req, res) => {
  const { text, section, instruction } = req.body;
  console.log(`[AI Edit] Request for section: "${section}", instruction: "${instruction || 'none'}", text length: ${text?.length}`);
  
  if (!VOLC_API_KEY || !VOLC_ENDPOINT_ID) {
    return res.status(500).json({ success: false, message: '火山引擎 AI 服务未配置' });
  }

  if (!text && !instruction) {
    return res.status(400).json({ success: false, message: '请输入需要处理的内容或指令' });
  }

  // 基础指令逻辑
  let coreTask = `你的任务是根据用户提供的原内容，撰写或润色学生简历中的 "${section || '简历内容'}" 部分。`;
  if (instruction) {
    coreTask = `你的任务是严格根据用户的自定义指令 "${instruction}"，来修改或生成学生简历中的 "${section || '简历内容'}" 部分。`;
  }

  // 针对不同部分的字数控制逻辑
  let lengthInstruction = '润色后的字数应控制在原文字数的 1.2 倍以内，避免冗长，确保精炼。';
  if (instruction) {
    lengthInstruction = '请根据用户的指令来控制字数，如果没有明确字数要求，则保持篇幅适中。';
  }
  
  let structureInstruction = '仅返回处理后的文本内容，不要包含任何解释、引言或引号。';
  
  const isClosingSection = section && (
     section.includes('自荐信') || 
     section.includes('自我推荐') ||
     section === 'closing'
   );

  if (isClosingSection) {
     console.log('[AI Polish] Applying long-form closing letter instruction');
     lengthInstruction = '润色后的总字数必须严格达到 320 字以上，甚至可以接近 400 字，绝对不能低于 300 字。如果原文字数较少，请根据小升初自荐信的常见内容（如：对学校的向往、自己的学习态度、未来的展望）进行合理、丰富的扩充和润色，确保篇幅宏大、文采斐然。';
     structureInstruction = `必须严格遵循以下排版格式，严禁合并段落：
1. 第一行：顶格书写“尊敬的贵校老师：”。
2. 第二行：空行。
3. 第三段起：开始正文，正文必须分为三至四段。
4. 正文每段之间必须空出一行（即使用两个换行符 \\n\\n 分隔）。
5. 每一段正文的内容都必须非常充实，每段至少 100 字。
6. 正文结束后，空出一行。
7. 最后两行：另起两行书写落款（学生：XXX \\n 日期：XXXX年XX月XX日）。
8. 仅返回润色后的正文，不要有任何其他文字。`;
   }

  // 构建 System Prompt
  let systemContent = `你是一位资深的小升初教育专家和简历指导老师。
你的任务是撰写或润色学生简历中的 "${section || '简历内容'}" 部分。

请遵循以下核心原则：
1. **真实性**：除非用户明确要求虚构或生成占位内容，否则必须基于原文本中的事实进行处理。
2. **字数控制**：${lengthInstruction}
3. **专业口吻**：语言要专业、自信、真诚，符合 12 岁学生申请名校的口吻。
4. **亮点修辞**：将平凡的经历转化为具有竞争力的描述。
5. **格式规范**：${structureInstruction}`;

  if (instruction) {
    systemContent = `你是一位资深的小升初教育专家和简历指导老师。
用户现在提出了明确的编辑指令，你的首要任务是**完全满足用户的自定义指令**。

当前操作的部分："${section || '简历内容'}"

请遵循以下原则：
1. **指令优先**：严格执行用户的自定义指令 "${instruction}"。
2. **简历适配**：在满足指令的前提下，确保内容依然符合小升初简历的专业、诚恳的风格。
3. **真实性**：除非指令要求生成新内容，否则基于原事实进行编辑。
4. **格式规范**：${structureInstruction}`;
  }

  try {
    console.log('[AI Polish] Sending request to Volcengine...');
    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      {
        model: VOLC_ENDPOINT_ID,
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          {
            role: 'user',
            content: instruction 
              ? `用户指令: ${instruction}\n\n当前内容: ${text || '(无)'}`
              : text
          }
        ],
         temperature: 0.8
       },
      {
        headers: {
          'Authorization': `Bearer ${VOLC_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // Add timeout
      }
    );

    console.log('[AI Polish] Response received from Volcengine');
    const polishedText = response.data.choices[0].message.content.trim();
    res.json({ success: true, text: polishedText });
  } catch (err) {
    console.error('Volcengine AI Polish error:', err.response?.data || err.message);
    const errorMsg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ success: false, message: `AI 编辑失败: ${errorMsg}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
