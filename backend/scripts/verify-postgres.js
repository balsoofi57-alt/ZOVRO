'use strict';
const { Client } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}
const REQUIRED_TABLES = [
  'meta','users','service_requests','messages','ratings','audit_log',
  'verification_requests','provider_locations','device_sessions','notifications'
];
(async()=>{
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const version = await client.query('select version() as version');
    const tables = await client.query(
      `select table_name from information_schema.tables where table_schema='public' order by table_name`
    );
    const names = new Set(tables.rows.map(r=>r.table_name));
    const missing = REQUIRED_TABLES.filter(t=>!names.has(t));
    const schema = await client.query("select value from meta where key='schemaVersion'");
    const counts = {};
    for (const table of REQUIRED_TABLES.filter(t=>t!=='meta')) {
      const q = await client.query(`select count(*)::int as n from ${table}`);
      counts[table] = q.rows[0].n;
    }
    const result = {
      ok: missing.length === 0 && schema.rows[0]?.value === '5',
      engine: 'postgres',
      server: version.rows[0]?.version || null,
      schemaVersion: schema.rows[0]?.value || null,
      missingTables: missing,
      counts
    };
    console.log(JSON.stringify(result,null,2));
    if (!result.ok) process.exitCode = 2;
  } catch (e) {
    console.error(e.stack || e.message || String(e));
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
})();
