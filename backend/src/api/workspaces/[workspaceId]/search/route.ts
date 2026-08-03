import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SearchAggregator } from "../../../../services/integrations/searchAggregator";

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

    // Search external tool content (Slack, Notion, Jira, GitHub, Figma)
    let integrationResults: any[] = [];
    try {
      // Get the user ID from the workspace membership to pass to SearchAggregator
      const firstMember = users.length > 0 ? null : null; // users already fetched above
      // We need userId from the request - extract from auth header
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        // Decode JWT to get userId (simple base64 decode of payload)
        try {
          const token = authHeader.split(" ")[1];
          const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
          const userId = payload.sub || payload.user_id || payload.id;
          if (userId) {
            const externalItems = await SearchAggregator.search({
              userId,
              query,
              workspaceId,
              k: Math.ceil(limit / 4),
              threshold: 0.2,
            });
            integrationResults = externalItems.map((item) => ({
              id: item.id,
              type: "integration" as const,
              title: item.title || `(${item.source_label})`,
              subtitle: [item.source_label, item.channel_or_project, item.author_name ? `by ${item.author_name}` : null]
                .filter(Boolean).join(" \u2022 "),
              source: item.source,
              sourceLabel: item.source_label,
              contentUrl: item.content_url,
              contentType: item.content_type,
            }));
          }
        } catch {
          // JWT decode failed, skip external search
        }
      }
    } catch (err: any) {
      // External search is optional, don't fail the whole request
      console.warn("External tool search failed:", err.message);
    }

    // Format results
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
        subtitle: `${task.status} \u2022 ${task.priority} priority`,
      })),
      ...integrationResults,
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
