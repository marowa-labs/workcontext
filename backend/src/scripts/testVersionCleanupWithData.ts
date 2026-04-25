import { prisma } from "../lib/prisma";
import VersionCleanupService from "../services/versionCleanupService";
import logger from "../monitoring/logger";

/**
 * Test script to manually trigger version cleanup with test data
 * This creates test users with different subscription plans and document versions
 * to verify the cleanup functionality works correctly
 */

async function setupTestData() {
  logger.info("Setting up test data");

  // Create test users with different subscription plans
  const testUsers = [
    { id: "test-free-user", email: "free@test.com", plan: "free" },
    { id: "test-onetime-user", email: "onetime@test.com", plan: "onetime" },
    { id: "test-student-user", email: "student@test.com", plan: "student" },
    {
      id: "test-researcher-user",
      email: "researcher@test.com",
      plan: "researcher",
    },
  ];

  // Create users and subscriptions
  for (const user of testUsers) {
    // Create user
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        full_name: `Test ${user.plan} user`,
        storage_limit: 100,
        storage_used: 0,
      },
    });

    // Create subscription
    await prisma.subscription.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        plan: user.plan,
        status: "active",
      },
    });

    // Create a test project
    const project = await prisma.project.upsert({
      where: { id: `test-project-${user.id}` },
      update: {},
      create: {
        id: `test-project-${user.id}`,
        user_id: user.id,
        title: `Test project for ${user.plan} user`,
        type: "document",
        citation_style: "apa", // Add the required field
      },
    });

    // Create document versions with different dates
    const now = new Date();

    // Create versions at different intervals
    for (let i = 0; i < 10; i++) {
      const versionDate = new Date(now);
      versionDate.setDate(now.getDate() - i * 5); // Every 5 days

      await prisma.documentVersion.create({
        data: {
          id: `test-version-${user.id}-${i}`,
          project_id: project.id,
          user_id: user.id,
          content: { content: `Test content for version ${i}` },
          version: i + 1,
          word_count: 100,
          created_at: versionDate,
        },
      });
    }

    logger.info(
      `Created test data for ${user.plan} user with 10 document versions`
    );
  }

  logger.info("Test data setup complete");
}

async function testVersionCleanup() {
  try {
    logger.info("Starting version cleanup test with test data");

    // Setup test data
    await setupTestData();

    // Run cleanup for each user type
    const testUsers = [
      "test-free-user",
      "test-onetime-user",
      "test-student-user",
      "test-researcher-user",
    ];

    const versionCleanupService = VersionCleanupService.getInstance();

    for (const userId of testUsers) {
      logger.info(`Testing version cleanup for user: ${userId}`);
      const result = await versionCleanupService.cleanupUserVersions(userId);
      logger.info(`Cleanup result for user ${userId}:`, result);
    }

    // Test cleanup for all users
    logger.info("Testing version cleanup for all users");
    await versionCleanupService.cleanupAllUsersVersions();
    logger.info("Completed cleanup for all users");

    // Verify results
    logger.info("Verifying cleanup results");
    for (const userId of testUsers) {
      const remainingVersions = await prisma.documentVersion.count({
        where: {
          user_id: userId,
        },
      });
      logger.info(
        `User ${userId} has ${remainingVersions} document versions remaining`
      );
    }
  } catch (error) {
    logger.error("Error during version cleanup test:", error);
    process.exit(1);
  }

  process.exit(0);
}

testVersionCleanup();
