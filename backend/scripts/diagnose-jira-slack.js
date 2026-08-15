// Diagnose Jira & Slack: why did they sync 0 items?
const { Client } = require("pg");
require("dotenv").config();

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();

  // Get tokens
  const conns = await c.query(
    `SELECT id, tool_type, access_token, refresh_token, token_type, scope
     FROM external_tool_connections
     WHERE tool_type IN ('jira', 'slack')
     ORDER BY tool_type`,
  );
  for (const conn of conns.rows) {
    console.log(`\n=== ${conn.tool_type.toUpperCase()} CONNECTION ===`);
    console.log(
      JSON.stringify(
        {
          id: conn.id,
          token_type: conn.token_type,
          scope: conn.scope,
          token_prefix: conn.access_token
            ? conn.access_token.slice(0, 20)
            : null,
          token_len: conn.access_token ? conn.access_token.length : 0,
        },
        null,
        2,
      ),
    );

    if (conn.tool_type === "jira") {
      // Test accessible-resources
      try {
        const res = await fetch(
          "https://api.atlassian.com/oauth/token/accessible-resources",
          {
            headers: {
              Authorization: `Bearer ${conn.access_token}`,
              Accept: "application/json",
            },
          },
        );
        const data = await res.json();
        console.log("accessible-resources status:", res.status);
        console.log(
          "accessible-resources:",
          JSON.stringify(data).slice(0, 500),
        );
      } catch (e) {
        console.log("accessible-resources ERROR:", e.message);
      }
    }

    if (conn.tool_type === "slack") {
      // Test conversations.list
      try {
        const res = await fetch(
          "https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=5",
          { headers: { Authorization: `Bearer ${conn.access_token}` } },
        );
        const data = await res.json();
        console.log("conversations.list ok:", data.ok);
        if (!data.ok) console.log("slack error:", data.error);
        else
          console.log(
            "channels:",
            (data.channels || []).map((ch) => `#${ch.name}`).join(", "),
          );
      } catch (e) {
        console.log("conversations.list ERROR:", e.message);
      }
    }
  }

  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
