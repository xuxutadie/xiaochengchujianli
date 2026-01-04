const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 使用你从 Zeabur 获取的 DATABASE_URL
// 运行方式: DATABASE_URL=你的连接串 node import-codes.js
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('错误: 请先设置环境变量 DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function importCodes() {
  try {
    const codesPath = path.join(__dirname, '../codes.json');
    if (!fs.existsSync(codesPath)) {
      console.error('错误: 找不到 codes.json 文件');
      return;
    }

    const { codes } = JSON.parse(fs.readFileSync(codesPath, 'utf8'));
    console.log(`准备导入 ${codes.length} 个验证码...`);

    // 1. 创建表（如果不存在）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        is_used BOOLEAN DEFAULT false,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 2. 批量插入
    for (const code of codes) {
      try {
        await pool.query(
          'INSERT INTO verification_codes (code) VALUES ($1) ON CONFLICT (code) DO NOTHING',
          [code]
        );
      } catch (err) {
        console.warn(`导入验证码 ${code} 失败:`, err.message);
      }
    }

    console.log('✅ 验证码导入完成！');
  } catch (err) {
    console.error('❌ 导入过程中出错:', err);
  } finally {
    await pool.end();
  }
}

importCodes();
