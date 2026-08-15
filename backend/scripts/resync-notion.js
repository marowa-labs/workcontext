// Trigger a re-sync of the Notion connection
const { Client } = require("pg");
require("dotenv").config();

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();

  // Get the Notion connection
  const conns = await c.query(
    "SELECT id, user_id, tool_type, status FROM external_tool_connections WHERE tool_type = 'notion' AND status = 'active'",
  );
  console.log("Active Notion connections:", conns.rows.length);

  if (conns.rows.length === 0) {
    console.log("No active Notion connection found.");
    await c.end();
    return;
  }

  const conn = conns.rows[0];
  console.log(`Connection ID: ${conn.id}`);
  console.log(`User ID: ${conn.user_id}`);

  // Clear existing chunks for this connection so we get a clean re-index
  const delChunks = await c.query(
    "DELETE FROM external_document_chunks WHERE content_id IN (SELECT id FROM external_tool_content WHERE connection_id = $1)",
    [conn.id],
  );
  console.log(`Deleted ${delChunks.rowCount} existing chunks`);

  // Reset dim/indexed_at on content rows so the sync logic treats them as needing re-index
  const reset = await c.query(
    "UPDATE external_tool_content SET dim = NULL, indexed_at = NULL WHERE connection_id = $1",
    [conn.id],
  );
  console.log(
    `Reset ${reset.rowCount} content rows (dim=NULL, indexed_at=NULL)`,
  );

  // Clear the content_hash from metadata so the delta-sync sees the content as changed
  const clearHash = await c.query(
    "UPDATE external_tool_content SET metadata = metadata - 'content_hash' WHERE connection_id = $1 AND metadata ? 'content_hash'",
    [conn.id],
  );
  console.log(`Cleared content_hash from ${clearHash.rowCount} content rows`);

  await c.end();
  console.log(
    "\nNow trigger a sync via: POST /api/integrations/" + conn.id + "/sync",
  );
  console.log("Or run the sync directly via the connector service.");
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
