require("dotenv").config();
const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const r = await c.query(
    "SELECT id, tool_type, status, sync_error, last_synced_at, metadata FROM external_tool_connections WHERE tool_type='figma'",
  );
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
})();
