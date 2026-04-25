// Prisma 7+ configuration
import "dotenv/config";
import { defineConfig } from "@prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create the adapter
const directUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:Aud%40cit-y2004@db.emcjywwqlrxdjfxiwnxi.supabase.co:5432/postgres";
const pool = new Pool({ connectionString: directUrl });
const adapter = new PrismaPg(pool);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});

// Export the adapter for use in the Prisma client
export { adapter };
