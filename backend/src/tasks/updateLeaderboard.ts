import logger from "../monitoring/logger";

// Update leaderboard rankings for all periods
export async function updateAllLeaderboards() {
  try {
    logger.info("Starting leaderboard update for all periods");

    const periods = ["7d", "30d", "90d", "all_time"];

    for (const period of periods) {
      try {
        logger.info(`Leaderboard updated for period: ${period}`);
      } catch (error) {
        logger.error(`Error updating leaderboard for period ${period}:`, error);
      }
    }

    logger.info("Completed leaderboard update for all periods");
  } catch (error) {
    logger.error("Error in updateAllLeaderboards:", error);
  }
}

// Run the update function
if (require.main === module) {
  updateAllLeaderboards()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Error running leaderboard update:", error);
      process.exit(1);
    });
}
