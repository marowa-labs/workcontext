import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { ContextEmbeddingService } from "../../../../services/contextEmbeddingService";
import logger from "../../../../monitoring/logger";

/**
 * Related Items endpoint.
 *
 * Returns semantically related workspace items (projects, tasks) for a given
 * project, using pgvector cosine similarity over the unified context-embedding
 * layer — replacing the previous naive Jaccard word-overlap heuristic.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        workspace_id: true,
        user_id: true,
        updated_at: true,
      },
    });

    if (!currentProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const queryText = `${currentProject.title} ${currentProject.description || ""}`;

    const related = await ContextEmbeddingService.similaritySearch({
      workspaceId: workspaceId || currentProject.workspace_id,
      ownerId: currentProject.user_id,
      entityTypes: ["project", "task"],
      query: queryText,
      k: limit + 5,
      threshold: 0.1,
    });

    // Exclude the current project and format for the UI.
    const items = related
      .filter(
        (r: any) => !(r.entity_type === "project" && r.entity_id === projectId),
      )
      .slice(0, limit)
      .map((r: any) => ({
        id: r.entity_id,
        type: r.entity_type,
        title: r.title || "(untitled)",
        subtitle: r.entity_type === "task" ? "Related task" : "Related project",
        relevanceScore: Math.round(r.similarity * 100) / 100,
      }));

    return NextResponse.json({ items });
  } catch (error: any) {
    logger.error("Related items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch related items" },
      { status: 500 },
    );
  }
}
