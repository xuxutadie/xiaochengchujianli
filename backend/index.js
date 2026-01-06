
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.get('origin')}`);
  next();
});
app.use(express.json());

// Initialize Volcengine (Ark)
const VOLC_API_KEY = process.env.VOLC_API_KEY;
const VOLC_ENDPOINT_ID = process.env.VOLC_ENDPOINT_ID;

console.log('AI Configuration:', {
  hasApiKey: !!VOLC_API_KEY,
  hasEndpointId: !!VOLC_ENDPOINT_ID
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Health check DB error:', err);
    res.json({ status: 'ok', db: 'disconnected', error: err.message, timestamp: new Date().toISOString() });
  }
});

// PostgreSQL connection
// Prioritize Zeabur's internal connection string which is more reliable for private networking
const dbConnectionString = process.env.POSTGRES_CONNECTION_STRING || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbConnectionString) {
  console.error('CRITICAL: No database connection string found in environment variables!');
}

// Determine SSL configuration
// logic:
// 1. If we are using Zeabur's internal variable (POSTGRES_CONNECTION_STRING), we MUST disable SSL.
// 2. If connecting to localhost, disable SSL.
// 3. Otherwise (external public DB), enable SSL.
const isZeaburInternal = !!process.env.POSTGRES_CONNECTION_STRING;
const isLocal = dbConnectionString && (dbConnectionString.includes('localhost') || dbConnectionString.includes('127.0.0.1'));
const useSsl = !(isZeaburInternal || isLocal);

console.log(`Database Config: SSL=${useSsl ? 'Enabled' : 'Disabled'} (Reason: ZeaburInternal=${isZeaburInternal}, Local=${isLocal})`);

const pool = new Pool({
  connectionString: dbConnectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

// Test connection and initialize table
const initDb = async () => {
  console.log('正在尝试连接数据库...');
  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        is_used BOOLEAN DEFAULT false,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    client.release();
    console.log('✅ 数据库表初始化完成');
  } catch (err) {
    console.error('❌ 数据库连接或初始化失败:', err.message);
    console.error('请检查 DATABASE_URL 或 POSTGRES_URL 环境变量是否配置正确');
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
    const result = await pool.query(
      'SELECT * FROM verification_codes WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '验证码不存在' });
    }

    const codeData = result.rows[0];

    if (codeData.is_used) {
      return res.status(400).json({ success: false, message: '该验证码已被使用' });
    }

    // Mark as used
    await pool.query(
      'UPDATE verification_codes SET is_used = true, used_at = NOW() WHERE code = $1',
      [code]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// Admin endpoint to get stats
app.post('/api/admin/stats', async (req, res) => {
  const { adminKey } = req.body;
  const configuredKey = (process.env.ADMIN_KEY || '').trim();
  const providedKey = (adminKey || '').trim();

  console.log(`[Admin] Login attempt:
    - Provided: ${providedKey ? providedKey.substring(0, 2) + '***' : 'none'}
    - Configured: ${configuredKey ? 'YES (' + configuredKey.substring(0, 2) + '***)' : 'NO'}
    - Match: ${providedKey === configuredKey}
  `);
  
  if (!configuredKey) {
    console.error('[Admin] ADMIN_KEY environment variable is NOT SET!');
    return res.status(500).json({ success: false, message: '服务器未配置管理员密钥' });
  }

  if (providedKey !== configuredKey) {
    return res.status(403).json({ success: false, message: '密钥不正确' });
  }

  try {
    const totalRes = await pool.query('SELECT COUNT(*) FROM verification_codes');
    const usedRes = await pool.query('SELECT COUNT(*) FROM verification_codes WHERE is_used = true');
    // Default latest 50 for dashboard overview
    const codesRes = await pool.query('SELECT * FROM verification_codes ORDER BY created_at DESC LIMIT 50');

    res.json({
      success: true,
      stats: {
        total: parseInt(totalRes.rows[0].count),
        used: parseInt(usedRes.rows[0].count),
        unused: parseInt(totalRes.rows[0].count) - parseInt(usedRes.rows[0].count)
      },
      codes: codesRes.rows
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    res.status(500).json({ success: false, message: '获取数据失败: ' + err.message });
  }
});

// Admin endpoint: List codes with pagination & filter
app.post('/api/admin/codes', async (req, res) => {
  const { adminKey, page = 1, limit = 20, search = '', status = 'all' } = req.body;
  const configuredKey = (process.env.ADMIN_KEY || '').trim();
  const providedKey = (adminKey || '').trim();
  
  if (!configuredKey || providedKey !== configuredKey) {
    return res.status(403).json({ success: false, message: '无权操作' });
  }

  try {
    const offset = (page - 1) * limit;
    let queryText = 'SELECT * FROM verification_codes WHERE 1=1';
    let countQueryText = 'SELECT COUNT(*) FROM verification_codes WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND code ILIKE $${paramIndex}`;
      countQueryText += ` AND code ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status === 'used') {
      queryText += ' AND is_used = true';
      countQueryText += ' AND is_used = true';
    } else if (status === 'unused') {
      queryText += ' AND is_used = false';
      countQueryText += ' AND is_used = false';
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const totalRes = await pool.query(countQueryText, params);
    const codesRes = await pool.query(queryText, [...params, limit, offset]);

    res.json({
      success: true,
      total: parseInt(totalRes.rows[0].count),
      page,
      limit,
      codes: codesRes.rows
    });
  } catch (err) {
    console.error('List codes error:', err);
    res.status(500).json({ success: false, message: '获取列表失败' });
  }
});

// Admin endpoint: Generate random codes
app.post('/api/admin/generate', async (req, res) => {
  const { adminKey, count = 10, prefix = '' } = req.body;
  const configuredKey = (process.env.ADMIN_KEY || '').trim();
  
  if (!configuredKey || (adminKey || '').trim() !== configuredKey) {
    return res.status(403).json({ success: false, message: '无权操作' });
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0 to avoid confusion
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  try {
    const newCodes = [];
    const targetCount = Math.min(Math.max(parseInt(count), 1), 500); // Limit 1-500

    for (let i = 0; i < targetCount; i++) {
      const code = prefix + generateCode();
      await pool.query(
        'INSERT INTO verification_codes (code) VALUES ($1) ON CONFLICT DO NOTHING',
        [code]
      );
      newCodes.push(code);
    }

    res.json({ success: true, message: `成功生成 ${newCodes.length} 个验证码`, count: newCodes.length });
  } catch (err) {
    console.error('Generate codes error:', err);
    res.status(500).json({ success: false, message: '生成失败' });
  }
});

// Admin endpoint: Delete code
app.post('/api/admin/delete', async (req, res) => {
  const { adminKey, id, type } = req.body; // type: 'single' | 'used'
  const configuredKey = (process.env.ADMIN_KEY || '').trim();
  
  if (!configuredKey || (adminKey || '').trim() !== configuredKey) {
    return res.status(403).json({ success: false, message: '无权操作' });
  }

  try {
    if (type === 'used') {
      const result = await pool.query('DELETE FROM verification_codes WHERE is_used = true');
      res.json({ success: true, message: `已清理 ${result.rowCount} 个已使用验证码` });
    } else if (id) {
      await pool.query('DELETE FROM verification_codes WHERE id = $1', [id]);
      res.json({ success: true, message: '删除成功' });
    } else {
      res.status(400).json({ success: false, message: '参数错误' });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// Admin endpoint to add codes (For initial setup)
app.post('/api/admin/add-codes', async (req, res) => {
  const { codes, adminKey } = req.body;
  const configuredKey = (process.env.ADMIN_KEY || '').trim();
  const providedKey = (adminKey || '').trim();
  
  if (!configuredKey || providedKey !== configuredKey) {
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
        timeout: 60000 // 增加到 60 秒
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
