import { Router } from "express";
import {
  GET,
  GET_BY_ID,
  POST,
  POST_AI_EDIT,
  POST_RESTORE_VERSION,
  PUT,
  DELETE,
  GET_AI_EDIT_HISTORY,
  GET_CITATIONS,
  GET_DOCUMENT_VERSIONS,
  GET_SETTINGS,
  PUT_SETTINGS,
  POST_RESET_SETTINGS,
  POST_IMPORT,
  GET_SHARE_SETTINGS,
  POST_SHARE_SETTINGS,
} from "./route";

import { authenticateExpressRequest } from "../../middleware/auth";
import { ProjectServiceEnhanced } from "../../services/projectServiceEnhanced";

// Import prisma for database access
import { prisma } from "../../lib/prisma";

// Add the missing import for the version route
import { POST_VERSION } from "../editor/version-route";
import logger from "../../monitoring/logger";

const router: Router = Router();

// Public routes (no authentication required)
// Get a specific project by ID via shared link token
router.get("/:id/invite/:token", async (req, res) => {
  try {
    const { id: projectId, token } = req.params;

    // Validate the token against the CollaborationInvite table
    const invite = await prisma.collaborationInvite.findUnique({
      where: {
        token: token,
        project_id: projectId,
      },
      include: {
        project: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
            collaborators: {
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
            citations: {
              orderBy: {
                created_at: "desc",
              },
            },
            comments: {
              orderBy: {
                created_at: "desc",
              },
            },
            document_versions: {
              orderBy: {
                created_at: "desc",
              },
              take: 5,
            },
            plagiarism_reports: {
              orderBy: {
                created_at: "desc",
              },
              take: 5,
            },
            ai_chat_sessions: {
              orderBy: {
                created_at: "desc",
              },
              take: 5,
            },
            ai_generated_images: {
              orderBy: {
                created_at: "desc",
              },
              take: 5,
            },
          },
        },
      },
    });

    // Check if invite exists
    if (!invite) {
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }

    // Check if invite is still valid
    if (invite.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Invitation has already been used" });
    }

    if (invite.expires_at < new Date()) {
      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Transform the project data
    const transformedProject = {
      ...invite.project,
      progress: await ProjectServiceEnhanced.calculateProjectProgress(
        invite.project,
      ),
      lastActivity: invite.project.updated_at,
    };

    // Return project data with permission level
    return res.status(200).json({
      project: transformedProject,
      permission: invite.permission,
    });
  } catch (error: any) {
    console.error("Error accessing shared project:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Protected routes (authentication required)
router.use(authenticateExpressRequest);

// Get share settings for a project
router.get("/:id/share-settings", async (req, res) => {
  const { id: projectId } = req.params;

  // Mock request object to match the expected format
  const mockRequest = {
    user: (req as any).user,
  };

  try {
    const response = await GET_SHARE_SETTINGS(mockRequest as any, projectId);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Update share settings for a project
router.post("/:id/share-settings", async (req, res) => {
  const { id: projectId } = req.params;

  // Mock request object to match the expected format
  const mockRequest = {
    json: async () => req.body,
    user: (req as any).user,
  };

  try {
    const response = await POST_SHARE_SETTINGS(mockRequest as any, projectId);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Get all projects for a user
router.get("/", async (req, res) => {
  // Construct a full URL for the get handler
  const fullUrl = `http://${req.headers.host}${req.url}`;

  // Mock request object to match the expected format
  const mockRequest = {
    url: fullUrl,
    user: (req as any).user,
  };

  try {
    const response = await GET(mockRequest as any);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Check project permission - MUST BE BEFORE /:id route
router.get("/:id/permission", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        error: "User not authenticated",
        message: "Valid authentication required to check project permission",
      });
    }

    const projectId = req.params.id;

    console.log("Checking permission for:", { userId, projectId });

    // Check if user is the owner of the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user_id: userId,
      },
    });

    if (project) {
      // User is the owner
      console.log("User is owner of project:", projectId);
      return res.status(200).json({ permission: "owner" });
    }

    // Check if user is a collaborator
    const collaborator = await prisma.CollaboratorPresence.findFirst({
      where: {
        project_id: projectId,
        user_id: userId,
      },
    });

    if (collaborator) {
      // User is a collaborator, return their permission level
      console.log(
        "User is collaborator with permission:",
        collaborator.permission,
      );
      return res.status(200).json({ permission: collaborator.permission });
    }

    // User doesn't have access to this project
    console.log("User has no access to project:", projectId);
    return res.status(404).json({
      error: "Project not found or access denied",
      message: "Project not found or you don't have permission to access it",
    });
  } catch (error: any) {
    console.error("Error checking project permission:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message || "Failed to check project permission",
    });
  }
});

// Get a specific project by ID - MOVED AFTER SPECIFIC ROUTES
router.get("/:id", async (req, res) => {
  // Construct a full URL for the get handler to allow access to query params
  const host = req.headers.host || "localhost:3001";
  const originalUrl = req.originalUrl || req.url;
  const fullUrl = `http://${host}${originalUrl}`;

  console.log("=== GET_BY_ID ROUTER DEBUG ===");
  console.log("Original URL:", req.originalUrl);
  console.log("Req URL:", req.url);
  console.log("Constructed Full URL:", fullUrl);
  console.log("Params:", req.params);
  console.log(
    "User in mockRequest:",
    (req as any).user ? "Present" : "Missing",
  );

  // Mock request object to match the expected format
  const mockRequest = {
    user: (req as any).user,
    url: fullUrl,
    params: {
      id: req.params.id,
    },
  };

  try {
    const response = await GET_BY_ID(mockRequest as any, req.params.id);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Create a new project
router.post("/", authenticateExpressRequest, async (req, res) => {
  // Check if user is authenticated
  if (!(req as any).user || !(req as any).user.id) {
    return res.status(401).json({
      error: "User not authenticated",
      message: "Valid authentication required to create a project",
    });
  }

  // Mock request object to match the expected format
  const mockRequest = {
    json: async () => req.body,
    user: (req as any).user,
  };

  try {
    const response = await POST(mockRequest as any);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
});

// Update a project
router.put("/", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    json: async () => req.body,
    user: (req as any).user,
  };

  try {
    const response = await PUT(mockRequest as any);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Update a project by ID (for compatibility with frontend)
router.put("/:id", async (req, res) => {
  // Merge the URL parameter ID with the request body
  const requestBody = {
    ...req.body,
    id: req.params.id, // Ensure the project ID is included in the body
  };

  // Mock request object to match the expected format
  const mockRequest = {
    json: async () => requestBody,
    user: (req as any).user,
  };

  try {
    const response = await PUT(mockRequest as any);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Delete a project
router.delete("/", async (req, res) => {
  // Construct a full URL for the delete handler
  const fullUrl = `http://${req.headers.host}${req.url}`;

  // Mock request object to match the expected format
  const mockRequest = {
    url: fullUrl,
    user: (req as any).user,
  };

  try {
    const response = await DELETE(mockRequest as any);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Error in DELETE route handler:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
});

// Delete a project by ID (for compatibility with frontend)
router.delete("/:id", async (req, res) => {
  const { id: projectId } = req.params;

  // Construct a full URL with the project ID as a query parameter
  const fullUrl = `http://${req.headers.host}${req.baseUrl}?id=${projectId}`;

  // Mock request object to match the expected format
  const mockRequest = {
    url: fullUrl,
    user: (req as any).user,
  };

  try {
    const response = await DELETE(mockRequest as any);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Error in DELETE by ID route handler:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
});

// Apply AI edit to project content
router.post("/:id/ai-edit", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    json: async () => req.body,
    user: (req as any).user,
    params: {
      id: req.params.id,
    },
  };

  try {
    const response = await POST_AI_EDIT(mockRequest as any, req.params.id);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Get AI edit history for project
router.get("/:id/ai-edit-history", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    user: (req as any).user,
    params: {
      id: req.params.id,
    },
  };

  try {
    const response = await GET_AI_EDIT_HISTORY(
      mockRequest as any,
      req.params.id,
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Get project citations
router.get("/:id/citations", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    user: (req as any).user,
    params: {
      id: req.params.id,
    },
  };

  try {
    const response = await GET_CITATIONS(mockRequest as any, req.params.id);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Get project document versions
router.get("/:id/document-versions", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    user: (req as any).user,
    params: {
      id: req.params.id,
    },
  };

  try {
    const response = await GET_DOCUMENT_VERSIONS(
      mockRequest as any,
      req.params.id,
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Restore document version
router.post("/:id/restore-version", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    json: async () => req.body,
    user: (req as any).user,
    params: {
      id: req.params.id,
    },
  };

  try {
    const response = await POST_RESTORE_VERSION(
      mockRequest as any,
      req.params.id,
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Get user project settings
router.get("/settings", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    user: (req as any).user,
  };

  try {
    const response = await GET_SETTINGS(mockRequest as any);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Update user project settings
router.put("/settings", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    json: async () => req.body,
    user: (req as any).user,
  };

  try {
    const response = await PUT_SETTINGS(mockRequest as any);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Reset user project settings to defaults
router.post("/settings/reset", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    user: (req as any).user,
  };

  try {
    const response = await POST_RESET_SETTINGS(mockRequest as any);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Create document version
router.post("/:id/create-version", async (req, res) => {
  // Mock request object to match the expected format
  const requestBody = {
    ...req.body,
    projectId: (req as any).params.id,
  };

  const mockRequest = {
    json: async () => requestBody,
    user: (req as any).user,
    params: {
      id: (req as any).params.id,
    },
  };

  try {
    const response = await POST_VERSION(mockRequest as any);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Get version schedules for a project
router.get("/:id/version-schedules", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const projectId = req.params.id;

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { user_id: userId },
          { collaborators: { some: { user_id: userId } } },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    // Get version schedules for this project
    const schedules = await prisma.versionSchedule.findMany({
      where: {
        project_id: projectId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      schedules: schedules.map((schedule: any) => ({
        id: schedule.id,
        project_id: schedule.project_id,
        frequency: schedule.frequency,
        next_run: schedule.next_run,
        enabled: schedule.enabled,
        created_at: schedule.created_at,
      })),
    });
  } catch (error: any) {
    logger.error("Error fetching version schedules:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Create version schedule
router.post("/:id/version-schedules", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const projectId = req.params.id;
    const { frequency } = req.body;

    // Validate frequency
    const validFrequencies = ["30min", "hourly", "daily", "weekly", "monthly"];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid frequency. Must be one of: 30min, hourly, daily, weekly, monthly",
      });
    }

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user_id: userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    // Calculate next run time based on frequency
    let nextRunTime = new Date();
    switch (frequency) {
      case "30min":
        nextRunTime.setMinutes(nextRunTime.getMinutes() + 30);
        break;
      case "hourly":
        nextRunTime.setHours(nextRunTime.getHours() + 1);
        break;
      case "daily":
        nextRunTime.setDate(nextRunTime.getDate() + 1);
        break;
      case "weekly":
        nextRunTime.setDate(nextRunTime.getDate() + 7);
        break;
      case "monthly":
        nextRunTime.setMonth(nextRunTime.getMonth() + 1);
        break;
    }

    // Create the version schedule
    const schedule = await prisma.versionSchedule.create({
      data: {
        project_id: projectId,
        frequency: frequency,
        next_run: nextRunTime,
        enabled: true,
      },
    });

    return res.status(200).json({
      success: true,
      schedule: {
        id: schedule.id,
        project_id: schedule.project_id,
        frequency: schedule.frequency,
        next_run: schedule.next_run,
        enabled: schedule.enabled,
        created_at: schedule.created_at,
      },
    });
  } catch (error: any) {
    logger.error("Error creating version schedule:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Update version schedule
router.put("/:id/version-schedules/:scheduleId", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const projectId = req.params.id;
    const scheduleId = req.params.scheduleId;
    const { enabled, frequency } = req.body;

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { user_id: userId },
          { collaborators: { some: { user_id: userId } } },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    // Validate inputs
    if (frequency) {
      const validFrequencies = [
        "30min",
        "hourly",
        "daily",
        "weekly",
        "monthly",
      ];
      if (!validFrequencies.includes(frequency)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid frequency. Must be one of: 30min, hourly, daily, weekly, monthly",
        });
      }
    }

    // Verify user owns the schedule and it belongs to the specified project
    const schedule = await prisma.versionSchedule.findFirst({
      where: {
        id: scheduleId,
        project_id: projectId,
        project: {
          user_id: userId,
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or access denied",
      });
    }

    // Update the schedule
    const updatedSchedule = await prisma.versionSchedule.update({
      where: {
        id: scheduleId,
      },
      data: {
        enabled: enabled !== undefined ? enabled : undefined,
        frequency: frequency !== undefined ? frequency : undefined,
        // If frequency is updated, recalculate next run time
        ...(frequency !== undefined && {
          next_run: (() => {
            let nextRunTime = new Date();
            switch (frequency) {
              case "30min":
                nextRunTime.setMinutes(nextRunTime.getMinutes() + 30);
                break;
              case "hourly":
                nextRunTime.setHours(nextRunTime.getHours() + 1);
                break;
              case "daily":
                nextRunTime.setDate(nextRunTime.getDate() + 1);
                break;
              case "weekly":
                nextRunTime.setDate(nextRunTime.getDate() + 7);
                break;
              case "monthly":
                nextRunTime.setMonth(nextRunTime.getMonth() + 1);
                break;
            }
            return nextRunTime;
          })(),
        }),
      },
    });

    return res.status(200).json({
      success: true,
      schedule: {
        id: updatedSchedule.id,
        project_id: updatedSchedule.project_id,
        frequency: updatedSchedule.frequency,
        next_run: updatedSchedule.next_run,
        enabled: updatedSchedule.enabled,
        created_at: updatedSchedule.created_at,
        updated_at: updatedSchedule.updated_at,
      },
    });
  } catch (error: any) {
    logger.error("Error updating version schedule:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Delete version schedule
router.delete("/:id/version-schedules/:scheduleId", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const projectId = req.params.id;
    const scheduleId = req.params.scheduleId;

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { user_id: userId },
          { collaborators: { some: { user_id: userId } } },
        ],
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    // Verify user owns the schedule and it belongs to the specified project
    const schedule = await prisma.versionSchedule.findFirst({
      where: {
        id: scheduleId,
        project_id: projectId,
        project: {
          user_id: userId,
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or access denied",
      });
    }

    // Delete the schedule
    await prisma.versionSchedule.delete({
      where: {
        id: scheduleId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting version schedule:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Import a project - New route for document imports
router.post("/import", async (req, res) => {
  // Mock request object to match the expected format
  const mockRequest = {
    json: async () => req.body,
    user: (req as any).user,
  };

  try {
    const response = await POST_IMPORT(mockRequest as any);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
});

// Simple text similarity function for related items
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Get related items for a project
router.get("/:id/related", async (req, res) => {
  try {
    const projectId = req.params.id;
    const workspaceId = req.query.workspaceId as string;
    const limit = parseInt(req.query.limit as string || "5", 10);
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get current project content
    const currentProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { user_id: userId },
          { collaborators: { some: { user_id: userId } } }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        workspace_id: true,
      },
    });

    if (!currentProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    const currentText = `${currentProject.title} ${currentProject.description || ""}`;

    // Get all projects in same workspace
    const effectiveWorkspaceId = currentProject.workspace_id || workspaceId;
    const projects = effectiveWorkspaceId
      ? await prisma.project.findMany({
          where: {
            workspace_id: effectiveWorkspaceId,
            id: { not: projectId },
            OR: [
              { user_id: userId },
              { collaborators: { some: { user_id: userId } } }
            ]
          },
          select: {
            id: true,
            title: true,
            description: true,
            updated_at: true,
          },
          take: 20,
        })
      : [];

    // Get tasks in same workspace
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
    const scoredProjects = projects.map((p: any) => {
      const text = `${p.title} ${p.description || ""}`;
      return {
        id: p.id,
        type: "page" as const,
        title: p.title,
        subtitle: `Last edited ${new Date(p.updated_at).toLocaleDateString()}`,
        relevanceScore: calculateSimilarity(currentText, text),
      };
    });

    const scoredTasks = tasks.map((t: any) => {
      const text = `${t.title} ${t.description || ""}`;
      return {
        id: t.id,
        type: "task" as const,
        title: t.title,
        subtitle: `${t.status} • ${t.priority} priority`,
        relevanceScore: calculateSimilarity(currentText, text),
      };
    });

    // Combine and sort by relevance
    const allItems = [...scoredProjects, ...scoredTasks]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
      .filter((item) => item.relevanceScore > 0.1) // Minimum threshold
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        relevanceScore: Math.min(0.99, item.relevanceScore * 2), // Boost score for display
      }));

    return res.json({ items: allItems });
  } catch (error: any) {
    console.error("Related items error:", error);
    return res.status(500).json({ error: "Failed to fetch related items" });
  }
});

export default router;
