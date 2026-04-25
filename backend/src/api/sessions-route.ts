import { Router, Request, Response } from "express";
import { SessionService } from "../services/sessionService";
import { authenticateExpressRequest } from "../middleware/auth";

const router: Router = Router();

// Get all active sessions for the authenticated user
router.get(
  "/",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      // User ID will be attached by the authentication middleware in main-server.ts
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const sessions = await SessionService.getUserSessions(userId);
      return res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to fetch sessions" });
    }
  },
);

// Get current session for the authenticated user
router.get(
  "/current",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      // User ID will be attached by the authentication middleware in main-server.ts
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const session = await SessionService.getCurrentSession(userId);
      return res.json(session);
    } catch (error: any) {
      console.error("Error fetching current session:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to fetch current session" });
    }
  },
);

// End a specific session
router.delete(
  "/:sessionId",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params as { sessionId: string };
      // User ID will be attached by the authentication middleware in main-server.ts
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify the session belongs to the user
      const session = await SessionService.getCurrentSession(userId);
      if (!session || session.id !== sessionId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await SessionService.endSession(sessionId);
      return res.json({ message: "Session ended successfully" });
    } catch (error: any) {
      console.error("Error ending session:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to end session" });
    }
  },
);

// Get login history for the authenticated user
router.get(
  "/login-history",
  authenticateExpressRequest,
  async (req: Request, res: Response) => {
    try {
      // User ID will be attached by the authentication middleware in main-server.ts
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const loginHistory = await SessionService.getLoginHistory(userId);
      return res.json(loginHistory);
    } catch (error: any) {
      console.error("Error fetching login history:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to fetch login history" });
    }
  },
);

export default router;
