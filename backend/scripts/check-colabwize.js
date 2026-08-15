// Search for ColabWize content in the DB
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

(async () => {
  // Search external_tool_content for ColabWize
  const colab = await p.$queryRawUnsafe(
    `SELECT id, title, content_type, LENGTH(content_text)::int as text_len, dim, indexed_at
     FROM external_tool_content
     WHERE title ILIKE '%colab%' OR content_text ILIKE '%colab%'
     ORDER BY title`,
  );
  console.log("=== COLABWIZE MATCHES ===");
  console.log(JSON.stringify(colab, null, 2));

  // List all Notion titles
  const titles = await p.$queryRawUnsafe(
    `SELECT title, content_type, LENGTH(content_text)::int as text_len, dim
     FROM external_tool_content
     WHERE tool_type = 'notion'
     ORDER BY title`,
  );
  console.log("\n=== ALL NOTION TITLES ===");
  console.log(JSON.stringify(titles, null, 2));

  await p.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
