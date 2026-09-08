'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sqlitePath = process.env.ZOVRO_SQLITE_PATH || path.join(__dirname, '..', 'data', 'zovro.sqlite');
if (!fs.existsSync(sqlitePath)) {
  console.error(`SQLite database not found: ${sqlitePath}`);
  process.exit(1);
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const pg = new Client({ connectionString: DATABASE_URL, ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false } });

const tables = [
  ['users', ['id', 'data']],
  ['service_requests', ['id', 'customer_id', 'provider_id', 'status', 'created_at', 'data']],
  ['messages', ['id', 'request_id', 'user_id', 'created_at', 'data']],
  ['ratings', ['id', 'request_id', 'provider_id', 'customer_id', 'created_at', 'data']],
  ['audit_log', ['id', 'user_id', 'created_at', 'data']],
  ['verification_requests', ['id', 'provider_id', 'status', 'created_at', 'data']],
  ['provider_locations', ['provider_id', 'updated_at', 'data']],
  ['device_sessions', ['id', 'user_id', 'data']],
  ['notifications', ['id', 'user_id', 'created_at', 'data']]
];

function rows(table) {
  return sqlite.prepare(`SELECT * FROM ${table}`).all();
}

async function insertRows(table, columns, data) {
  if (!data.length) return 0;
  let count = 0;
  for (const row of data) {
    const values = columns.map(c => c === 'data' ? JSON.parse(row[c]) : row[c]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');
    const updates = columns.filter(c => c !== columns[0]).map(c => `${c}=EXCLUDED.${c}`).join(',');
    await pg.query(
      `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders}) ON CONFLICT (${columns[0]}) DO UPDATE SET ${updates}`,
      values
    );
    count++;
  }
  return count;
}

(async () => {
  try {
    await pg.connect();
    const schema = fs.readFileSync(path.join(__dirname, '..', 'postgres-schema.sql'), 'utf8');
    await pg.query(schema);

    await pg.query('BEGIN');
    const summary = {};
    for (const [table, columns] of tables) {
      const data = rows(table);
      summary[table] = await insertRows(table, columns, data);
    }
    await pg.query("INSERT INTO meta(key,value) VALUES('schemaVersion','5') ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value");
    await pg.query('COMMIT');

    console.log(JSON.stringify({ ok: true, migrated: summary }, null, 2));
  } catch (err) {
    try { await pg.query('ROLLBACK'); } catch {}
    console.error(err.stack || err.message || String(err));
    process.exitCode = 1;
  } finally {
    try { sqlite.close(); } catch {}
    try { await pg.end(); } catch {}
  }
})();
