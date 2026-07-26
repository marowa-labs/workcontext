import { Router } from "express";
import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";

const router = Router();

type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGED"
  | "EMAIL_CHANGED"
  | "DATA_EXPORT"
  | "ACCOUNT_DELETION_REQUEST"
  | "SESSION_ENDED";

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: string;
  ip_address: string;
  device_info: string;
  location: string | null;
  details: string | null;
}

// GET /api/security-log - Get aggregated security log for the current user
router.get("/", async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const typeFilter = req.query.type as string | undefined;

    const [loginHistory, auditLogs] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: limit + offset,
      }),
      prisma.auditLog.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: limit + offset,
      }),
    ]);

    const events: SecurityEvent[] = [];

    for (const login of loginHistory) {
      if (typeFilter && typeFilter !== login.status) continue;
      events.push({
        id: `login-${login.id}`,
        type: login.status === "success" ? "LOGIN_SUCCESS" : "LOGIN_FAILED",
        timestamp: login.created_at.toISOString(),
        ip_address: login.ip_address,
        device_info: login.device_info,
        location: login.location || null,
        details: login.error_code
          ? `Failed: ${login.error_code}`
          : "Successful login",
      });
    }

    for (const audit of auditLogs) {
      const mappedType = auditActionToEventType(audit.action);
      if (!mappedType) continue;
      if (typeFilter && typeFilter !== audit.action.toLowerCase()) continue;

      let details: string | null = null;
      if (audit.payload && typeof audit.payload === "object") {
        const p = audit.payload as Record<string, unknown>;
        if (p.old_email && p.new_email) {
          details = `Changed from ${p.old_email} to ${p.new_email}`;
        }
      }

      events.push({
        id: `audit-${audit.id}`,
        type: mappedType,
        timestamp: audit.created_at.toISOString(),
        ip_address: audit.ip_address || "Unknown",
        device_info: audit.device_info || "Unknown",
        location: null,
        details: details || formatAuditAction(audit.action),
      });
    }

    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const paginated = events.slice(offset, offset + limit);
    const total = events.length;

    res.json({ events: paginated, total });
  } catch (error: any) {
    logger.error("Error fetching security log:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

function auditActionToEventType(action: string): SecurityEventType | null {
  switch (action) {
    case "PASSWORD_CHANGED":
      return "PASSWORD_CHANGED";
    case "EMAIL_CHANGED":
      return "EMAIL_CHANGED";
    case "DATA_EXPORT":
      return "DATA_EXPORT";
    case "ACCOUNT_DELETION_REQUEST":
      return "ACCOUNT_DELETION_REQUEST";
    case "SESSION_ENDED":
      return "SESSION_ENDED";
    default:
      return null;
  }
}

function formatAuditAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default router;
