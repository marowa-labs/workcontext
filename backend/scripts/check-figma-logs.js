require("dotenv").config();
const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const r = await c.query(
    `SELECT sl.id, sl.status, sl.items_synced, sl.items_indexed, sl.error_message, sl.started_at, sl.completed_at
     FROM external_tool_sync_logs sl
     JOIN external_tool_connections ec ON ec.id = sl.connection_id
     WHERE ec.tool_type = 'figma'
     ORDER BY sl.started_at DESC LIMIT 5`,
  );
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
})();
