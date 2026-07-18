/**
 * Backfill vector embeddings for all existing workspace items.
 *
 * Run with:  npx tsx src/scripts/backfillEmbeddings.ts
 *
 * Safe to run multiple times (upsert is idempotent). Requires GEMINI_API_KEY
 * or OPENAI_API_KEY to be configured.
 */
import { prisma } from "../lib/prisma";
import { ContextEmbeddingService } from "../services/contextEmbeddingService";
import logger from "../monitoring/logger";

async function backfill() {
  let projectCount = 0;
  let taskCount = 0;
  let noteCount = 0;

  // Projects
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      user_id: true,
      workspace_id: true,
      title: true,
      description: true,
      content: true,
    },
  });
  for (const project of projects) {
    await ContextEmbeddingService.upsertForProject(project as any);
    projectCount++;
  }
  logger.info(`Backfilled ${projectCount} projects`);

  // Tasks
  const tasks = await prisma.workspaceTask.findMany({
    select: {
      id: true,
      creator_id: true,
      workspace_id: true,
      title: true,
      description: true,
    },
  });
  for (const task of tasks) {
    await ContextEmbeddingService.upsertForTask(task as any);
    taskCount++;
  }
  logger.info(`Backfilled ${taskCount} tasks`);

  // Notes
  const notes = await prisma.note.findMany({
    select: { id: true, user_id: true, project_id: true, title: true, content: true },
  });
  for (const note of notes) {
    await ContextEmbeddingService.upsertForNote(note as any);
    noteCount++;
  }
  logger.info(`Backfilled ${noteCount} notes`);

  logger.info("Backfill complete", { projectCount, taskCount, noteCount });
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("Backfill failed", { error: err.message });
    process.exit(1);
  });
