const { Client } = require("pg");
require("dotenv").config();
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  const cols = await c.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_name = 'external_tool_connections'
     ORDER BY ordinal_position`,
  );
  for (const r of cols.rows) console.log(`${r.table_name}.${r.column_name}`);
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
