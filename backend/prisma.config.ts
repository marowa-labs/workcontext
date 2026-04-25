// Prisma 7+ configuration
import "dotenv/config";
import { defineConfig } from "@prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create the adapter
// Use DATABASE_URL directly for migrations since DIRECT_URL is having connection issues
const directUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:Aud%40cit-y2004@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
console.log("Using database URL:", directUrl); // Debug output
// Configure pool with connection limits to prevent MaxClientsInSessionMode error
const pool = new Pool({
  connectionString: directUrl,
  max: 10, // Limit concurrent connections
  min: 2, // Maintain minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Periodically remove idle connections
  allowExitOnIdle: true,
});
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
