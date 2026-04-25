// Prisma 7+ configuration
import "dotenv/config";
import { defineConfig } from "@prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create the adapter
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!directUrl) {
  throw new Error(
    "DIRECT_URL or DATABASE_URL environment variable is required but not set. " +
    "Please configure your database connection string in the environment variables."
  );
}

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
