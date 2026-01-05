
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
  const { text, section } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'AI 服务未配置 API Key' });
  }

  if (!text) {
    return res.status(400).json({ success: false, message: '请输入需要润色的内容' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      角色: 你是一位资深的小升初教育专家和文案大师。
      任务: 润色学生简历中 "${section || '简历内容'}" 部分的内容。
      目标: 语言要专业、自信、真诚，同时符合12岁学生的口吻。突出亮点，优化表达。
      限制: 仅返回润色后的文本，不要包含任何解释或引导语。语言为简体中文。
      原文: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const polishedText = response.text().trim();
    
    res.json({ success: true, text: polishedText });
  } catch (err) {
    console.error('AI Polish error:', err);
    res.status(500).json({ success: false, message: 'AI 润色失败，请重试' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
