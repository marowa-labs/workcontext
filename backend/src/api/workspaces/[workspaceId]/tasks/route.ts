import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "done", "archived"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z.string().datetime().optional(),
  assignee_ids: z.array(z.string()).optional(),
});

// GET /api/workspaces/[workspaceId]/tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const tasks = await prisma.workspaceTask.findMany({
      where: {
        workspace_id: workspaceId,
        ...(status ? { status } : {}),
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
        subtasks: true,
        labels: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/tasks
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const body = await request.json();

    const validatedData = createTaskSchema.parse(body);

    // Get user from auth context (simplified - should use proper auth middleware)
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const task = await prisma.workspaceTask.create({
      data: {
        workspace_id: workspaceId,
        creator_id: userId,
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        due_date: validatedData.due_date,
        // Add assignees if provided
        ...(validatedData.assignee_ids?.length
          ? {
              assignees: {
                create: validatedData.assignee_ids.map((userId) => ({
                  user_id: userId,
                })),
              },
            }
          : {}),
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
