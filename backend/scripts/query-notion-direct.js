// Query Notion API directly to find "ColabWize — Tackle Later"
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

(async () => {
  // Get the Notion connection token
  const conn = await p.$queryRawUnsafe(
    `SELECT id, access_token, metadata FROM external_tool_connections WHERE tool_type = 'notion' AND status = 'active' LIMIT 1`,
  );
  if (!conn.length) {
    console.error("No active Notion connection");
    process.exit(1);
  }
  const token = conn[0].access_token;
  console.log("Connection:", conn[0].id);

  // Search Notion for ColabWize
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: "ColabWize",
      page_size: 20,
    }),
  });
  const data = await res.json();
  if (data.object === "error") {
    console.error("Notion search error:", data.message);
    process.exit(1);
  }
  console.log(
    `Search 'ColabWize' returned ${data.results?.length || 0} results`,
  );
  for (const r of data.results || []) {
    const title = extractTitle(r);
    console.log(`- [${r.object}] ${title} (${r.id})`);
  }

  // Also list all pages (no query = all accessible)
  const res2 = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100 }),
  });
  const data2 = await res2.json();
  console.log(`\nAll search returned ${data2.results?.length || 0} results`);
  for (const r of data2.results || []) {
    const title = extractTitle(r);
    console.log(`- [${r.object}] ${title} (${r.id})`);
  }

  await p.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

function extractTitle(r) {
  try {
    if (r.object === "database") {
      // Database objects have property definitions, not values
      const titleProp = r.properties?.title || r.properties?.Name;
      if (titleProp?.title?.[0]?.plain_text)
        return titleProp.title[0].plain_text;
      return "(database)";
    }
    const t =
      r.properties?.title?.title?.map((t) => t.plain_text).join("") ||
      r.properties?.Name?.title?.map((t) => t.plain_text).join("") ||
      r.object;
    return t;
  } catch {
    return "(unknown)";
  }
}
