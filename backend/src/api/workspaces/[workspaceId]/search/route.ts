import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const searchPattern = `%${query}%`;

    // Search users in workspace
    const users = await prisma.workspaceMember.findMany({
      where: {
        workspace_id: workspaceId,
        user: {
          OR: [
            { full_name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            bio: true,
          },
        },
      },
      take: limit / 4,
    });

    // Search projects (spaces) in workspace
    const projects = await prisma.project.findMany({
      where: {
        workspace_id: workspaceId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
      },
      take: limit / 4,
    });

    // Search tasks in workspace
    const tasks = await prisma.workspaceTask.findMany({
      where: {
        workspace_id: workspaceId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
      },
      take: limit / 4,
    });

    // Format results
    const results = [
      ...users.map((member) => ({
        id: member.user.id,
        type: "user" as const,
        title: member.user.full_name || member.user.email,
        subtitle: member.user.bio || member.user.email,
      })),
      ...projects.map((project) => ({
        id: project.id,
        type: "space" as const,
        title: project.title,
        subtitle: project.description || project.status,
      })),
      ...tasks.map((task) => ({
        id: task.id,
        type: "task" as const,
        title: task.title,
        subtitle: `${task.status} • ${task.priority} priority`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
