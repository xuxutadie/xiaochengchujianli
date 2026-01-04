
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
