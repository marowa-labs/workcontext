import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simple text similarity function (TF-IDF-like)
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    // Get current project content
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        workspace_id: true,
      },
    });

    if (!currentProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const currentText = `${currentProject.title} ${currentProject.description || ""}`;

    // Get all projects in same workspace
    const projects = await prisma.project.findMany({
      where: {
        workspace_id: currentProject.workspace_id || workspaceId,
        id: { not: projectId },
      },
      select: {
        id: true,
        title: true,
        description: true,
        updated_at: true,
      },
      take: 20,
    });

    // Get tasks in same workspace
    const effectiveWorkspaceId = currentProject.workspace_id || workspaceId;
    const tasks = effectiveWorkspaceId
      ? await prisma.workspaceTask.findMany({
          where: {
            workspace_id: effectiveWorkspaceId,
            project_id: { not: projectId },
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            due_date: true,
          },
          take: 20,
        })
      : [];

    // Calculate similarity scores
    const scoredProjects = projects.map((p) => {
      const text = `${p.title} ${p.description || ""}`;
      return {
        ...p,
        type: "page" as const,
        subtitle: `Last edited ${new Date(p.updated_at).toLocaleDateString()}`,
        relevanceScore: calculateSimilarity(currentText, text),
      };
    });

    const scoredTasks = tasks.map((t) => {
      const text = `${t.title} ${t.description || ""}`;
      return {
        ...t,
        type: "task" as const,
        subtitle: `${t.status} • ${t.priority} priority`,
        relevanceScore: calculateSimilarity(currentText, text),
      };
    });

    // Combine and sort by relevance
    const allItems = [...scoredProjects, ...scoredTasks]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
      .filter((item) => item.relevanceScore > 0.1); // Minimum threshold

    return NextResponse.json({
      items: allItems.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        relevanceScore: Math.min(0.99, item.relevanceScore * 2), // Boost score for display
      })),
    });
  } catch (error) {
    console.error("Related items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch related items" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
