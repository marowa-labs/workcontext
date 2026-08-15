const { Client } = require("pg");
require("dotenv").config();

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();

  // Check BYOK keys for the Notion connection user
  const cols = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%user%'",
  );
  console.log("=== USER TABLES ===");
  console.log(JSON.stringify(cols.rows, null, 2));

  const user = await c.query(
    "SELECT id, email, byok_enabled, byok_provider, byok_google_key_encrypted IS NOT NULL as has_google, byok_openai_key_encrypted IS NOT NULL as has_openai, byok_openrouter_key_encrypted IS NOT NULL as has_openrouter FROM \"User\" WHERE id = 'f619be46-e22d-4e4e-b7fb-8181099c8cba'",
  );
  console.log("=== USER BYOK STATUS (User table) ===");
  console.log(JSON.stringify(user.rows, null, 2));

  // Check current Notion content state after the sync attempt
  const stats = await c.query(
    "SELECT COUNT(*) as total, COUNT(content_text) as with_text, COUNT(NULLIF(content_text, '')) as with_nonempty FROM external_tool_content WHERE tool_type = 'notion'",
  );
  console.log("=== NOTION CONTENT AFTER SYNC ===");
  console.log(JSON.stringify(stats.rows, null, 2));

  // Sample content_text lengths
  const lens = await c.query(
    "SELECT title, LENGTH(content_text) as len FROM external_tool_content WHERE tool_type = 'notion' AND content_text IS NOT NULL ORDER BY len DESC LIMIT 5",
  );
  console.log("=== NOTION CONTENT WITH TEXT (top 5 by length) ===");
  console.log(JSON.stringify(lens.rows, null, 2));

  // Chunk state
  const chunks = await c.query(
    "SELECT COUNT(*) as total_chunks, COUNT(edc.embedding) as with_embedding, COUNT(DISTINCT edc.dim) as dims FROM external_document_chunks edc JOIN external_tool_content ect ON ect.id = edc.content_id WHERE ect.tool_type = 'notion'",
  );
  console.log("=== NOTION CHUNKS ===");
  console.log(JSON.stringify(chunks.rows, null, 2));

  // Content indexed status
  const indexed = await c.query(
    "SELECT COUNT(*) as total, COUNT(dim) as with_dim, COUNT(indexed_at) as indexed FROM external_tool_content WHERE tool_type = 'notion'",
  );
  console.log("=== NOTION INDEX STATUS ===");
  console.log(JSON.stringify(indexed.rows, null, 2));

  // Sync log status
  const logCols = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'external_tool_sync_logs'",
  );
  console.log("=== SYNC LOG COLUMNS ===");
  console.log(JSON.stringify(logCols.rows, null, 2));

  const logs = await c.query(
    "SELECT status, items_synced, items_indexed, error_message, started_at, completed_at FROM external_tool_sync_logs WHERE connection_id = '4acd29c4-9197-472f-9968-5007c3769439' ORDER BY started_at DESC LIMIT 3",
  );
  console.log("=== RECENT SYNC LOGS ===");
  console.log(JSON.stringify(logs.rows, null, 2));

  // Connection status
  const conn = await c.query(
    "SELECT status, sync_error, last_synced_at FROM external_tool_connections WHERE id = '4acd29c4-9197-472f-9968-5007c3769439'",
  );
  console.log("=== CONNECTION STATUS ===");
  console.log(JSON.stringify(conn.rows, null, 2));

  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
