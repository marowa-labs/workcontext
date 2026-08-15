// Quick check of chunk embedding progress
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

(async () => {
  const chunks = await p.$queryRawUnsafe(
    "SELECT COUNT(*)::int as cnt, COUNT(embedding)::int as with_emb, COUNT(*) FILTER (WHERE dim IS NOT NULL)::int as with_dim FROM external_document_chunks",
  );
  const content = await p.$queryRawUnsafe(
    "SELECT COUNT(*)::int as cnt, COUNT(*) FILTER (WHERE dim IS NOT NULL)::int as indexed FROM external_tool_content",
  );
  console.log(JSON.stringify({ chunks: chunks[0], content: content[0] }));
  await p.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
