import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

export class WorkspaceAnalyticsService {
  /**
   * Aggregates analytics for a specific workspace
   */
  static async getWorkspaceAnalytics(workspaceId: string) {
    try {
      // 1. Get task status distribution
      const statusCounts = await prisma.workspaceTask.groupBy({
        by: ["status"],
        where: { workspace_id: workspaceId },
        _count: { _all: true },
      });

      // 2. Get task priority distribution
      const priorityCounts = await prisma.workspaceTask.groupBy({
        by: ["priority"],
        where: { workspace_id: workspaceId },
        _count: { _all: true },
      });

      // 3. Get member task completion stats
      // Join WorkspaceMember -> User -> TaskAssignee -> WorkspaceTask (if status is done)
      const tasksByMember = await prisma.taskAssignee.findMany({
        where: {
          task: {
            workspace_id: workspaceId,
            status: "done",
          },
        },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
        },
      });

      const memberCompletionMap = new Map<string, number>();
      tasksByMember.forEach((assignment: any) => {
        const name = assignment.user.full_name || assignment.user.email;
        memberCompletionMap.set(name, (memberCompletionMap.get(name) || 0) + 1);
      });

      const memberActivity: { name: string; completed: number }[] = [];
      memberCompletionMap.forEach((count: number, name: string) => {
        memberActivity.push({ name, completed: count });
      });

      // 4. Trend: Completion over last 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      fourteenDaysAgo.setHours(0, 0, 0, 0);

      const completedTasks = await prisma.workspaceTask.findMany({
        where: {
          workspace_id: workspaceId,
          status: "done",
          updated_at: { gte: fourteenDaysAgo },
        },
        select: { updated_at: true },
      });

      const trendMap = new Map<string, number>();
      // Initialize the map with all dates
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        trendMap.set(d.toISOString().split("T")[0], 0);
      }

      completedTasks.forEach((task: { updated_at: Date }) => {
        const dateStr = task.updated_at.toISOString().split("T")[0];
        if (trendMap.has(dateStr)) {
          trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
        }
      });

      const completionTrend = Array.from(trendMap.entries())
        .map(([date, count]: [string, number]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 5. High-level stats
      const totalTasks = await prisma.workspaceTask.count({
        where: { workspace_id: workspaceId },
      });
      const doneStatusCount = statusCounts.find(
        (s: { status: string; _count: { _all: number } }) =>
          s.status === "done",
      );
      const doneTasks = doneStatusCount?._count._all || 0;
      const completionRate =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      return {
        totalTasks,
        doneTasks,
        completionRate,
        statusDistribution: statusCounts.map(
          (s: { status: string; _count: { _all: number } }) => ({
            name: s.status,
            value: s._count._all,
          }),
        ),
        priorityDistribution: priorityCounts.map(
          (p: { priority: string; _count: { _all: number } }) => ({
            status: p.priority,
            count: p._count._all,
          }),
        ),
        memberActivity,
        completionTrend,
      };
    } catch (error) {
      logger.error("Error fetching workspace analytics:", error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific project
   */
  static async getProjectAnalytics(projectId: string) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: {
            include: {
              assignees: { include: { user: true } },
            },
          },
        },
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      const tasks = project.tasks;
      const total = tasks.length;
      const completed = tasks.filter((t: any) => t.status === "done").length;
      const inProgress = tasks.filter(
        (t: any) => t.status === "in-progress",
      ).length;
      const todo = tasks.filter((t: any) => t.status === "todo").length;

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentTasks = tasks.filter(
        (t: any) => new Date(t.updated_at) >= sevenDaysAgo,
      );

      return {
        projectId,
        projectTitle: project.title,
        projectStatus: project.status,
        taskStats: {
          total,
          completed,
          inProgress,
          todo,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
        recentActivity: {
          tasksUpdated: recentTasks.length,
          tasksCompleted: recentTasks.filter((t: any) => t.status === "done")
            .length,
        },
      };
    } catch (error) {
      logger.error(`Error fetching project analytics for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get workspace analytics enhanced with project metrics
   */
  static async getWorkspaceAnalyticsWithProjects(workspaceId: string) {
    try {
      // Get base workspace analytics
      const baseAnalytics = await this.getWorkspaceAnalytics(workspaceId);

      // Get projects in this workspace
      const projects = await prisma.project.findMany({
        where: { workspace_id: workspaceId },
        include: {
          tasks: {
            select: { status: true },
          },
        },
      });

      // Calculate project metrics
      const projectMetrics = projects.map((p: any) => {
        const totalTasks = p.tasks.length;
        const completedTasks = p.tasks.filter(
          (t: any) => t.status === "done",
        ).length;

        return {
          id: p.id,
          title: p.title,
          status: p.status,
          totalTasks,
          completedTasks,
          progress:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
        };
      });

      return {
        ...baseAnalytics,
        projectMetrics,
      };
    } catch (error) {
      logger.error("Error fetching workspace analytics with projects:", error);
      throw error;
    }
  }
}
