const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      country TEXT,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS global_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      tug_score INTEGER NOT NULL DEFAULT 50,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    INSERT INTO global_state (id, tug_score)
    VALUES (1, 50)
    ON CONFLICT (id) DO NOTHING
  `);

  console.log('[DB] Tables ready');
}

async function getTugScore() {
  const res = await pool.query('SELECT tug_score FROM global_state WHERE id = 1');
  return res.rows[0]?.tug_score ?? 50;
}

async function saveTugScore(score) {
  await pool.query(
    'UPDATE global_state SET tug_score = $1, updated_at = NOW() WHERE id = 1',
    [score]
  );
}

async function upsertUser({ id, username, country, level, xp }) {
  await pool.query(
    `INSERT INTO users (id, username, country, level, xp)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE
       SET username = EXCLUDED.username,
           country  = EXCLUDED.country,
           level    = EXCLUDED.level,
           xp       = EXCLUDED.xp`,
    [id, username, country ?? null, level ?? 1, xp ?? 0]
  );
}

async function getUser(id) {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0] ?? null;
}

module.exports = { pool, initDb, getTugScore, saveTugScore, upsertUser, getUser };
