/**
 * RBAC Middleware
 *
 * Express middleware for checking permissions and roles.
 * Works alongside the existing hybridAuth middleware.
 */

import { Request, Response, NextFunction } from "express";
import { PermissionService } from "../services/permissionService";
import logger from "../monitoring/logger";

/**
 * Middleware that checks if the authenticated user has a specific permission.
 */
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const workspaceId = req.headers["x-workspace-id"] as string | undefined;

      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      if (!workspaceId) {
        // No workspace context — skip RBAC (allow for user-level endpoints)
        next();
        return;
      }

      const result = await PermissionService.checkPermission(userId, workspaceId, `${resource}.${action}`);

      if (!result.allowed) {
        logger.warn("Permission denied", {
          userId,
          workspaceId,
          resource,
          action,
          path: req.path,
          method: req.method,
        });

        res.status(403).json({
          error: "Insufficient permissions",
          required: `${resource}.${action}`,
          message: `You need the ${action} permission for ${resource} to perform this action.`,
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error("RBAC middleware error", { error: error.message });
      // Fail open for middleware errors (existing behavior preserved)
      next();
    }
  };
}

/**
 * Middleware that checks if the user has one of the specified roles.
 */
export function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const workspaceId = req.headers["x-workspace-id"] as string | undefined;

      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      if (!workspaceId) {
        next();
        return;
      }

      // Check role by getting user permissions and comparing against role-based permission sets
      const userPermissions = await PermissionService.getUserPermissions(userId, workspaceId);

      // Owner has all permissions — always passes
      if (userPermissions.length > 0) {
        // If user has workspace.manage_settings permission, they are admin or above
        const hasManageSettings = userPermissions.includes("workspace.manage_settings");
        const hasCreate = userPermissions.includes("project.create");
        const hasDelete = userPermissions.includes("project.delete");

        // Role detection from permissions
        const userRole = hasManageSettings && hasDelete ? "admin"
          : hasCreate ? "editor"
          : "viewer";

        if (roles.includes(userRole) || roles.includes("owner")) {
          next();
          return;
        }
      }

      // Check workspaceMember.role string field as fallback
      const { prisma } = await import("../lib/prisma");
      const membership = await prisma.workspaceMember.findUnique({
        where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
        select: { role: true },
      });

      if (membership && roles.includes(membership.role)) {
        next();
        return;
      }

      res.status(403).json({
        error: "Insufficient role",
        required: roles,
        message: `One of the following roles is required: ${roles.join(", ")}`,
      });
    } catch (error: any) {
      logger.error("RBAC role check error", { error: error.message });
      next();
    }
  };
}

/**
 * Middleware that checks if the user is the owner of a resource.
 */
export function requireOwnership(getOwnerId: (req: Request) => string | Promise<string | null>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const ownerId = await getOwnerId(req);

      if (ownerId && ownerId !== userId) {
        // Check if user is an admin (admins can access any resource)
        const workspaceId = req.headers["x-workspace-id"] as string | undefined;
        if (workspaceId) {
          const result = await PermissionService.checkPermission(userId, workspaceId, "workspace.manage_settings");
          if (result.allowed) {
            next();
            return;
          }
        }

        res.status(403).json({
          error: "Not the owner of this resource",
          message: "You can only modify resources you own.",
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error("Ownership check error", { error: error.message });
      next();
    }
  };
}

/**
 * Convenience wrappers for common role checks.
 */
export const requireAdmin = () => requireRole(["owner", "admin"]);
export const requireEditorOrAbove = () => requireRole(["owner", "admin", "editor"]);
export const requireOwner = () => requireRole(["owner"]);

/**
 * Pre-built permission checks for common endpoints.
 */
export const Permissions = {
  requireProjectCreate: () => requirePermission("project", "create"),
  requireProjectRead: () => requirePermission("project", "read"),
  requireProjectUpdate: () => requirePermission("project", "update"),
  requireProjectDelete: () => requirePermission("project", "delete"),
  requireProjectShare: () => requirePermission("project", "share"),
  requireProjectExport: () => requirePermission("project", "export"),
  requireProjectComment: () => requirePermission("project", "comment"),
  requireWorkspaceManage: () => requirePermission("workspace", "manage_settings"),
  requireWorkspaceInvite: () => requirePermission("workspace", "invite_members"),
  requireWorkspaceRemoveMember: () => requirePermission("workspace", "remove_members"),
  requireAIAccess: () => requirePermission("ai", "access"),
  requireAIExport: () => requirePermission("ai", "export"),
  requireIntegrationManage: () => requirePermission("integration", "manage"),
  requireIntegrationSync: () => requirePermission("integration", "sync"),
  requireMemoryCreate: () => requirePermission("memory", "create"),
  requireMemoryEdit: () => requirePermission("memory", "edit"),
  requireMemoryDelete: () => requirePermission("memory", "delete"),
  requireAdmin: () => requireRole(["owner", "admin"]),
  requireEditorOrAbove: () => requireRole(["owner", "admin", "editor"]),
  requireOwner: () => requireRole(["owner"]),
} as const;
