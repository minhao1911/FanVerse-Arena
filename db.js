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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_pulls (
      team_id TEXT PRIMARY KEY,
      pull_count BIGINT NOT NULL DEFAULT 0
    )
  `);

  await pool.query(`
    INSERT INTO team_pulls (team_id, pull_count) VALUES ('A', 0) ON CONFLICT (team_id) DO NOTHING;
    INSERT INTO team_pulls (team_id, pull_count) VALUES ('B', 0) ON CONFLICT (team_id) DO NOTHING;
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

async function getTeamPulls() {
  const res = await pool.query('SELECT team_id, pull_count FROM team_pulls ORDER BY team_id');
  const counts = { A: 0, B: 0 };
  for (const row of res.rows) {
    counts[row.team_id] = Number(row.pull_count);
  }
  return counts;
}

async function flushTeamPullDeltas(deltas) {
  if (deltas.A > 0) {
    await pool.query(
      'UPDATE team_pulls SET pull_count = pull_count + $1 WHERE team_id = $2',
      [deltas.A, 'A']
    );
  }
  if (deltas.B > 0) {
    await pool.query(
      'UPDATE team_pulls SET pull_count = pull_count + $1 WHERE team_id = $2',
      [deltas.B, 'B']
    );
  }
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

module.exports = { pool, initDb, getTugScore, saveTugScore, getTeamPulls, flushTeamPullDeltas, upsertUser, getUser };
