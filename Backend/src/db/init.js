const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const runSchema = async () => {
  try {
    console.log('🔄 Reading schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    console.log('⚡ Initializing Neon Database Schema...');
    await pool.query(schemaSql);
    
    console.log('✅ Database schema initialized successfully!');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
  } finally {
    await pool.end();
  }
};

runSchema();
