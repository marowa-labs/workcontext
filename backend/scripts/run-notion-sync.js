// Directly run a Notion sync via the connector service
require("dotenv").config();

const {
  getConnector,
} = require("../src/services/integrations/connectorRegistry");

(async () => {
  const connectionId =
    process.argv[2] || "4acd29c4-9197-472f-9968-5007c3769439";
  console.log(`Syncing connection: ${connectionId}`);

  const connector = getConnector("notion");
  if (!connector) {
    console.error("Notion connector not found");
    process.exit(1);
  }

  try {
    const count = await connector.syncContent(connectionId);
    console.log(`Sync complete. Items synced: ${count}`);
  } catch (err) {
    console.error("Sync failed:", err.message);
    process.exit(1);
  }
})();
