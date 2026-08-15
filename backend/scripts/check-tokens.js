// Check token expiry state for all connections
const { Client } = require("pg");
require("dotenv").config();

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();
  const conns = await c.query(
    `SELECT tool_type, status, expires_at, refresh_token IS NOT NULL as has_refresh,
            access_token IS NOT NULL as has_access, last_synced_at
     FROM external_tool_connections
     ORDER BY tool_type`,
  );
  console.log(JSON.stringify(conns.rows, null, 2));
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
