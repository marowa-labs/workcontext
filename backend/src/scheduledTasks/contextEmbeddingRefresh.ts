import { prisma } from "../lib/prisma";
import { ContextEmbeddingService } from "../services/contextEmbeddingService";
import logger from "../monitoring/logger";

/**
 * Self-healing refresh: (re)embed any workspace item that is missing an
 * embedding row. This catches content edits that flow through paths other
 * than ProjectService/WorkspaceTaskService (e.g. the collaborative editor
 * writing document bodies directly).
 *
 * Cheap: only processes items without an embedding row, in bounded batches.
 */
export async function refreshMissingEmbeddings(batchSize = 200) {
  try {
    const missingProjects: { id: string }[] = await prisma.$queryRawUnsafe(
      `SELECT p.id FROM project p
       LEFT JOIN context_embeddings ce ON ce.entity_type = 'project' AND ce.entity_id = p.id
       WHERE ce.id IS NULL LIMIT $1`,
      batchSize,
    );
    for (const { id } of missingProjects) {
      const project = await prisma.project.findUnique({ where: { id } });
      if (project) await ContextEmbeddingService.upsertForProject(project as any);
    }

    const missingTasks: { id: string }[] = await prisma.$queryRawUnsafe(
      `SELECT t.id FROM workspace_task t
       LEFT JOIN context_embeddings ce ON ce.entity_type = 'task' AND ce.entity_id = t.id
       WHERE ce.id IS NULL LIMIT $1`,
      batchSize,
    );
    for (const { id } of missingTasks) {
      const task = await prisma.workspaceTask.findUnique({ where: { id } });
      if (task) await ContextEmbeddingService.upsertForTask(task as any);
    }

    if (missingProjects.length || missingTasks.length) {
      logger.info("Context embedding refresh complete", {
        projects: missingProjects.length,
        tasks: missingTasks.length,
      });
    }
  } catch (error: any) {
    logger.error("Context embedding refresh failed", { error: error.message });
  }
}
