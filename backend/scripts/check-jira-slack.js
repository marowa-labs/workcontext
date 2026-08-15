// Deep dive: Jira & Slack sync history + Figma/GitHub embedding status
const { Client } = require("pg");
require("dotenv").config();

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();

  // Full sync log history for ALL connections
  const logs = await c.query(
    `SELECT ect.tool_type, esl.status, esl.items_synced, esl.items_indexed,
            esl.error_message, esl.started_at, esl.completed_at
     FROM external_tool_sync_logs esl
     JOIN external_tool_connections ect ON ect.id = esl.connection_id
     ORDER BY esl.started_at DESC
     LIMIT 40`,
  );
  console.log("=== ALL SYNC LOGS (latest 40) ===");
  console.log(JSON.stringify(logs.rows, null, 2));

  // Jira & Slack connection details
  const conns = await c.query(
    `SELECT id, tool_type, status, last_synced_at, sync_error, metadata
     FROM external_tool_connections
     WHERE tool_type IN ('jira', 'slack', 'figma', 'github')
     ORDER BY tool_type`,
  );
  console.log("\n=== CONNECTION DETAILS (jira/slack/figma/github) ===");
  for (const row of conns.rows) {
    let meta = null;
    try {
      meta = row.metadata ? JSON.parse(row.metadata) : null;
    } catch {
      meta = row.metadata;
    }
    console.log(
      JSON.stringify(
        {
          id: row.id,
          tool_type: row.tool_type,
          status: row.status,
          last_synced_at: row.last_synced_at,
          sync_error: row.sync_error,
          metadata: meta,
        },
        null,
        2,
      ),
    );
  }

  // Figma content sample
  const figma = await c.query(
    `SELECT id, title, content_type, LENGTH(content_text)::int as text_len, dim, indexed_at
     FROM external_tool_content WHERE tool_type = 'figma'`,
  );
  console.log("\n=== FIGMA CONTENT ===");
  console.log(JSON.stringify(figma.rows, null, 2));

  // GitHub content sample (top 5)
  const github = await c.query(
    `SELECT title, content_type, LENGTH(content_text)::int as text_len, dim
     FROM external_tool_content WHERE tool_type = 'github'
     ORDER BY text_len DESC NULLS LAST LIMIT 5`,
  );
  console.log("\n=== GITHUB CONTENT (top 5 by length) ===");
  console.log(JSON.stringify(github.rows, null, 2));

  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
