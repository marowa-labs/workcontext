// Directly run a sync for any integration via the connector service
// Usage: node scripts/run-sync.js <tool_type> [connectionId]
require("dotenv").config();

const {
  getConnector,
} = require("../src/services/integrations/connectorRegistry");

(async () => {
  const toolType = process.argv[2];
  if (!toolType) {
    console.error("Usage: node scripts/run-sync.js <tool_type> [connectionId]");
    process.exit(1);
  }

  const connector = getConnector(toolType);
  if (!connector) {
    console.error(`Connector not found for tool type: ${toolType}`);
    process.exit(1);
  }

  // If no connectionId given, find the active connection for this tool type
  let connectionId = process.argv[3];
  if (!connectionId) {
    const { PrismaClient } = require("@prisma/client");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    const conn = await prisma.externalToolConnection.findFirst({
      where: { tool_type: toolType, status: "active" },
    });
    if (!conn) {
      console.error(`No active ${toolType} connection found`);
      process.exit(1);
    }
    connectionId = conn.id;
    await prisma.$disconnect();
  }

  console.log(`Syncing ${toolType} connection: ${connectionId}`);
  try {
    const count = await connector.syncContent(connectionId);
    console.log(`Sync complete. Items synced: ${count}`);
  } catch (err) {
    console.error("Sync failed:", err.message);
    process.exit(1);
  }
})();
