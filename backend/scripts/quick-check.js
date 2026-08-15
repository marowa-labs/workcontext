// Quick check: latest sync log entries + chunk counts
const { Client } = require("pg");
require("dotenv").config();

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();
  const logs = await c.query(
    `SELECT conn.tool_type, l.status, l.items_synced, l.items_indexed, l.error_message,
            l.started_at, l.completed_at
     FROM external_tool_sync_logs l
     JOIN external_tool_connections conn ON conn.id = l.connection_id
     ORDER BY l.started_at DESC
     LIMIT 12`,
  );
  console.log("=== LATEST SYNC LOGS ===");
  for (const l of logs.rows) {
    console.log(
      `${l.tool_type.padEnd(8)} ${l.status.padEnd(10)} synced=${l.items_synced} indexed=${l.items_indexed} ${l.error_message || ""} @ ${l.started_at}`,
    );
  }

  const chunks = await c.query(
    `SELECT c.tool_type, COUNT(DISTINCT ch.id) AS chunks, COUNT(DISTINCT ch.id) FILTER (WHERE ch.embedding IS NOT NULL) AS embedded
     FROM external_document_chunks ch
     JOIN external_tool_content c ON c.id = ch.content_id
     GROUP BY c.tool_type`,
  );
  console.log("\n=== CHUNKS BY TOOL ===");
  for (const r of chunks.rows) {
    console.log(
      `${r.tool_type.padEnd(8)} chunks=${r.chunks} embedded=${r.embedded}`,
    );
  }

  const content = await c.query(
    `SELECT tool_type, COUNT(*) AS total,
            COUNT(*) FILTER (WHERE content_text IS NOT NULL AND content_text != '') AS with_text,
            COUNT(*) FILTER (WHERE indexed_at IS NOT NULL) AS indexed
     FROM external_tool_content
     GROUP BY tool_type`,
  );
  console.log("\n=== CONTENT BY TOOL ===");
  for (const r of content.rows) {
    console.log(
      `${r.tool_type.padEnd(8)} total=${r.total} with_text=${r.with_text} indexed=${r.indexed}`,
    );
  }
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
