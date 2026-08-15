// Comprehensive check of ALL integrations: connections, content, chunks, embeddings
const { Client } = require("pg");
require("dotenv").config();

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();

  // 1. All connections
  const conns = await c.query(
    `SELECT tool_type, status, COUNT(*)::int as cnt,
            COUNT(*) FILTER (WHERE last_synced_at IS NOT NULL)::int as synced,
            MAX(last_synced_at) as last_sync
     FROM external_tool_connections
     GROUP BY tool_type, status
     ORDER BY tool_type`,
  );
  console.log("=== CONNECTIONS ===");
  console.log(JSON.stringify(conns.rows, null, 2));

  // 2. Content per tool type
  const content = await c.query(
    `SELECT tool_type,
            COUNT(*)::int as total,
            COUNT(content_text)::int as with_text,
            COUNT(NULLIF(content_text, ''))::int as with_nonempty,
            COUNT(dim)::int as with_dim,
            COUNT(indexed_at)::int as indexed
     FROM external_tool_content
     GROUP BY tool_type
     ORDER BY tool_type`,
  );
  console.log("\n=== CONTENT PER TOOL TYPE ===");
  console.log(JSON.stringify(content.rows, null, 2));

  // 3. Chunks per tool type
  const chunks = await c.query(
    `SELECT ect.tool_type,
            COUNT(edc.id)::int as total_chunks,
            COUNT(edc.embedding)::int as with_embedding,
            COUNT(DISTINCT edc.dim)::int as distinct_dims
     FROM external_document_chunks edc
     JOIN external_tool_content ect ON ect.id = edc.content_id
     GROUP BY ect.tool_type
     ORDER BY ect.tool_type`,
  );
  console.log("\n=== CHUNKS PER TOOL TYPE ===");
  console.log(JSON.stringify(chunks.rows, null, 2));

  // 4. Recent sync logs per tool type
  const logs = await c.query(
    `SELECT ect.tool_type, esl.status, esl.items_synced, esl.items_indexed,
            esl.error_message, esl.started_at, esl.completed_at
     FROM external_tool_sync_logs esl
     JOIN external_tool_connections ect ON ect.id = esl.connection_id
     WHERE esl.started_at >= NOW() - INTERVAL '7 days'
     ORDER BY esl.started_at DESC
     LIMIT 30`,
  );
  console.log("\n=== RECENT SYNC LOGS (7 days) ===");
  console.log(JSON.stringify(logs.rows, null, 2));

  // 5. Content with text but NO embedding (potential problem)
  const missing = await c.query(
    `SELECT tool_type, title, LENGTH(content_text)::int as text_len
     FROM external_tool_content
     WHERE content_text IS NOT NULL AND NULLIF(content_text, '') IS NOT NULL
       AND dim IS NULL
     ORDER BY tool_type, text_len DESC
     LIMIT 20`,
  );
  console.log(
    "\n=== CONTENT WITH TEXT BUT NO EMBEDDING (potential problem) ===",
  );
  console.log(JSON.stringify(missing.rows, null, 2));

  // 6. Context embeddings (internal workspace items)
  const ctx = await c.query(
    `SELECT entity_type, COUNT(*)::int as total, COUNT(embedding)::int as with_emb,
            COUNT(DISTINCT dim)::int as distinct_dims
     FROM context_embeddings
     GROUP BY entity_type
     ORDER BY entity_type`,
  );
  console.log("\n=== CONTEXT EMBEDDINGS (internal) ===");
  console.log(JSON.stringify(ctx.rows, null, 2));

  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
