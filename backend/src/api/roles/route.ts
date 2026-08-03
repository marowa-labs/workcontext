/**
 * Roles & Permissions API Routes
 *
 * Endpoints for managing workspace roles and permissions.
 */

import { Router, Request, Response } from "express";
import { authenticateExpressRequest } from "../../middleware/auth";
import { requireAdmin, requireEditorOrAbove } from "../../middleware/rbac";
import { RoleService } from "../../services/roleService";
import { PermissionService } from "../../services/permissionService";
import logger from "../../monitoring/logger";

const router = Router();

// ============================================================
// ROLES
// ============================================================

/**
 * GET /api/roles
 * List all roles with permissions and member counts.
 */
router.get("/", authenticateExpressRequest, requireEditorOrAbove(), async (req: Request, res: Response) => {
  try {
    const roles = await RoleService.getRolesWithCounts();
    const permissions = await PermissionService.listPermissions();

    res.json({
      roles,
      permissions: permissions.map((p: any) => ({
        name: p.name,
        displayName: p.display_name,
        description: p.description,
        resource: p.resource,
        action: p.action,
      })),
    });
  } catch (error: any) {
    logger.error("Failed to list roles", { error: error.message });
    res.status(500).json({ error: "Failed to list roles" });
  }
});

/**
 * GET /api/roles/:id
 * Get a single role by ID.
 */
router.get("/:id", authenticateExpressRequest, requireEditorOrAbove(), async (req: Request, res: Response) => {
  try {
    const roleId = req.params.id as string;
    const role = await RoleService.getRole(roleId);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    res.json(role);
  } catch (error: any) {
    logger.error("Failed to get role", { error: error.message });
    res.status(500).json({ error: "Failed to get role" });
  }
});

/**
 * POST /api/roles
 * Create a new custom role.
 */
router.post("/", authenticateExpressRequest, requireAdmin(), async (req: Request, res: Response) => {
  try {
    const { name, displayName, description, permissions } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: "Name and displayName are required" });
    }

    const role = await RoleService.createRole({ name, displayName, description, permissions });
    res.status(201).json(role);
  } catch (error: any) {
    logger.error("Failed to create role", { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/roles/:id
 * Update a role.
 */
router.put("/:id", authenticateExpressRequest, requireAdmin(), async (req: Request, res: Response) => {
  try {
    const roleId = req.params.id as string;
    const { displayName, description, permissions } = req.body;
    const role = await RoleService.updateRole(roleId, { displayName, description, permissions });
    res.json(role);
  } catch (error: any) {
    logger.error("Failed to update role", { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/roles/:id
 * Delete a custom role (system roles cannot be deleted).
 */
router.delete("/:id", authenticateExpressRequest, requireAdmin(), async (req: Request, res: Response) => {
  try {
    const roleId = req.params.id as string;
    await RoleService.deleteRole(roleId);
    res.json({ success: true });
  } catch (error: any) {
    logger.error("Failed to delete role", { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/roles/:id/assign/:memberId
 * Assign a role to a workspace member.
 */
router.post("/:id/assign/:memberId", authenticateExpressRequest, requireAdmin(), async (req: Request, res: Response) => {
  try {
    const roleId = req.params.id as string;
    const memberId = req.params.memberId as string;
    await RoleService.assignRole(memberId, roleId);
    res.json({ success: true });
  } catch (error: any) {
    logger.error("Failed to assign role", { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/roles/:id/members
 * Get members with a specific role.
 */
router.get("/:id/members", authenticateExpressRequest, requireEditorOrAbove(), async (req: Request, res: Response) => {
  try {
    const roleId = req.params.id as string;
    const role = await RoleService.getRole(roleId);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    const members = await RoleService.getMembersByRole(role.name);
    res.json(members);
  } catch (error: any) {
    logger.error("Failed to get role members", { error: error.message });
    res.status(500).json({ error: "Failed to get role members" });
  }
});

// ============================================================
// PERMISSIONS
// ============================================================

/**
 * GET /api/roles/permissions/all
 * List all available permissions.
 */
router.get("/permissions/all", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const permissions = await PermissionService.listPermissions();
    res.json(permissions);
  } catch (error: any) {
    logger.error("Failed to list permissions", { error: error.message });
    res.status(500).json({ error: "Failed to list permissions" });
  }
});

/**
 * GET /api/roles/permissions/my
 * Get current user's effective permissions.
 */
router.get("/permissions/my", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const workspaceId = req.headers["x-workspace-id"] as string;

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID required" });
    }

    const permissions = await PermissionService.getUserPermissions(userId, workspaceId);
    res.json({ permissions, workspaceId });
  } catch (error: any) {
    logger.error("Failed to get user permissions", { error: error.message });
    res.status(500).json({ error: "Failed to get user permissions" });
  }
});

export default router;
