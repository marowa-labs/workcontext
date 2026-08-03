/**
 * Permission Service
 *
 * Handles permission checking, granting, and revoking for the RBAC system.
 * Permissions follow the format: "resource.action" (e.g., "project.create", "ai.use")
 */

import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";

// ---------- Types ----------

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  role?: string;
  permissions?: string[];
}

export interface GrantPermissionOptions {
  roleId: string;
  permissionId?: string;
  permissionName?: string;
}

export interface RevokePermissionOptions {
  roleId: string;
  permissionId?: string;
  permissionName?: string;
}

// ---------- Default Permissions ----------

export const DEFAULT_PERMISSIONS = [
  // Workspace
  { name: "workspace.read", resource: "workspace", action: "read", description: "View workspace", category: "Workspace" },
  { name: "workspace.update", resource: "workspace", action: "update", description: "Update workspace settings", category: "Workspace" },
  { name: "workspace.delete", resource: "workspace", action: "delete", description: "Delete workspace", category: "Workspace" },
  { name: "workspace.manage_members", resource: "workspace", action: "manage_members", description: "Invite/remove members", category: "Workspace" },

  // Projects
  { name: "project.create", resource: "project", action: "create", description: "Create projects", category: "Projects" },
  { name: "project.read", resource: "project", action: "read", description: "View projects", category: "Projects" },
  { name: "project.update", resource: "project", action: "update", description: "Edit projects", category: "Projects" },
  { name: "project.delete", resource: "project", action: "delete", description: "Delete projects", category: "Projects" },
  { name: "project.share", resource: "project", action: "share", description: "Share projects", category: "Projects" },
  { name: "project.export", resource: "project", action: "export", description: "Export projects", category: "Projects" },

  // Tasks
  { name: "task.create", resource: "task", action: "create", description: "Create tasks", category: "Tasks" },
  { name: "task.read", resource: "task", action: "read", description: "View tasks", category: "Tasks" },
  { name: "task.update", resource: "task", action: "update", description: "Edit tasks", category: "Tasks" },
  { name: "task.delete", resource: "task", action: "delete", description: "Delete tasks", category: "Tasks" },

  // AI
  { name: "ai.use", resource: "ai", action: "use", description: "Use AI features", category: "AI" },
  { name: "ai.chat", resource: "ai", action: "chat", description: "AI chat conversations", category: "AI" },
  { name: "ai.synthesize", resource: "ai", action: "synthesize", description: "Cross-tool synthesis", category: "AI" },
  { name: "ai.configure", resource: "ai", action: "configure", description: "Configure AI settings", category: "AI" },

  // Integrations
  { name: "integration.connect", resource: "integration", action: "connect", description: "Connect external tools", category: "Integrations" },
  { name: "integration.read", resource: "integration", action: "read", description: "View connected tools", category: "Integrations" },
  { name: "integration.sync", resource: "integration", action: "sync", description: "Sync external data", category: "Integrations" },
  { name: "integration.disconnect", resource: "integration", action: "disconnect", description: "Disconnect tools", category: "Integrations" },

  // Settings
  { name: "settings.read", resource: "settings", action: "read", description: "View settings", category: "Settings" },
  { name: "settings.update", resource: "settings", action: "update", description: "Update settings", category: "Settings" },

  // Templates
  { name: "template.create", resource: "template", action: "create", description: "Create templates", category: "Templates" },
  { name: "template.read", resource: "template", action: "read", description: "View templates", category: "Templates" },
  { name: "template.update", resource: "template", action: "update", description: "Edit templates", category: "Templates" },
  { name: "template.delete", resource: "template", action: "delete", description: "Delete templates", category: "Templates" },

  // Memory (Decisions, Activity, Summaries)
  { name: "memory.read", resource: "memory", action: "read", description: "View memory layer", category: "Memory" },
  { name: "memory.create", resource: "memory", action: "create", description: "Create decisions/summaries", category: "Memory" },
  { name: "memory.update", resource: "memory", action: "update", description: "Update decisions/summaries", category: "Memory" },
  { name: "memory.delete", resource: "memory", action: "delete", description: "Delete decisions/summaries", category: "Memory" },

  // Roles & Permissions (admin only)
  { name: "role.read", resource: "role", action: "read", description: "View roles", category: "Roles" },
  { name: "role.create", resource: "role", action: "create", description: "Create custom roles", category: "Roles" },
  { name: "role.update", resource: "role", action: "update", description: "Edit roles", category: "Roles" },
  { name: "role.delete", resource: "role", action: "delete", description: "Delete custom roles", category: "Roles" },
  { name: "role.assign", resource: "role", action: "assign", description: "Assign roles to members", category: "Roles" },
] as const;

// ---------- Default Roles ----------

export interface DefaultRoleConfig {
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
}

export const DEFAULT_ROLES: DefaultRoleConfig[] = [
  {
    name: "owner",
    display_name: "Owner",
    description: "Full access to all workspace features and settings",
    permissions: DEFAULT_PERMISSIONS.map(p => p.name), // All permissions
  },
  {
    name: "admin",
    display_name: "Admin",
    description: "Manage members, projects, and settings (except billing/deletion)",
    permissions: [
      "workspace.read", "workspace.update", "workspace.manage_members",
      "project.create", "project.read", "project.update", "project.delete", "project.share", "project.export",
      "task.create", "task.read", "task.update", "task.delete",
      "ai.use", "ai.chat", "ai.synthesize", "ai.configure",
      "integration.connect", "integration.read", "integration.sync", "integration.disconnect",
      "settings.read", "settings.update",
      "template.create", "template.read", "template.update", "template.delete",
      "memory.read", "memory.create", "memory.update", "memory.delete",
      "role.read", "role.create", "role.update", "role.assign",
    ],
  },
  {
    name: "editor",
    display_name: "Editor",
    description: "Create and edit content, use AI features",
    permissions: [
      "workspace.read",
      "project.create", "project.read", "project.update", "project.export",
      "task.create", "task.read", "task.update",
      "ai.use", "ai.chat", "ai.synthesize",
      "integration.read", "integration.sync",
      "settings.read",
      "template.read",
      "memory.read", "memory.create", "memory.update",
    ],
  },
  {
    name: "viewer",
    display_name: "Viewer",
    description: "Read-only access to workspace content",
    permissions: [
      "workspace.read",
      "project.read",
      "task.read",
      "ai.use", "ai.chat",
      "integration.read",
      "settings.read",
      "template.read",
      "memory.read",
    ],
  },
];

// ---------- Service ----------

export class PermissionService {
  /**
   * Seed default permissions and roles into the database.
   * Safe to call multiple times (idempotent).
   */
  static async seedDefaults(): Promise<void> {
    try {
      // Upsert permissions
      for (const perm of DEFAULT_PERMISSIONS) {
        await prisma.permission.upsert({
          where: { name: perm.name },
          update: {},
          create: {
            name: perm.name,
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
            category: perm.category,
          },
        });
      }

      // Upsert roles and assign permissions
      for (const roleConfig of DEFAULT_ROLES) {
        const role = await prisma.role.upsert({
          where: { name: roleConfig.name },
          update: { display_name: roleConfig.display_name, description: roleConfig.description },
          create: {
            name: roleConfig.name,
            display_name: roleConfig.display_name,
            description: roleConfig.description,
            is_system: true,
          },
        });

        // Get all permissions for this role
        const permissions = await prisma.permission.findMany({
          where: { name: { in: roleConfig.permissions } },
        });

        // Upsert role-permission mappings
        for (const perm of permissions) {
          await prisma.rolePermission.upsert({
            where: { role_id_permission_id: { role_id: role.id, permission_id: perm.id } },
            update: {},
            create: { role_id: role.id, permission_id: perm.id },
          });
        }
      }

      logger.info("RBAC defaults seeded successfully");
    } catch (error: any) {
      logger.error("Failed to seed RBAC defaults", { error: error.message });
    }
  }

  /**
   * Check if a user has a specific permission in a workspace.
   */
  static async checkPermission(
    userId: string,
    workspaceId: string,
    permissionName: string
  ): Promise<PermissionCheckResult> {
    try {
      // Get the workspace member
      const member = await prisma.workspaceMember.findUnique({
        where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
        include: {
          roleEntry: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      if (!member) {
        return { allowed: false, reason: "Not a member of this workspace" };
      }

      // Check the string role first (backward compatibility)
      if (member.role === "owner") {
        return { allowed: true, role: "owner" };
      }

      // Check granular permissions via Role table
      if (member.roleEntry) {
        const hasPermission = member.roleEntry.permissions.some(
          rp => rp.permission.name === permissionName
        );

        if (hasPermission) {
          return {
            allowed: true,
            role: member.roleEntry.name,
            permissions: member.roleEntry.permissions.map(rp => rp.permission.name),
          };
        }
      }

      // Fallback: check string role for backward compatibility
      const rolePermissions = this.getLegacyRolePermissions(member.role);
      if (rolePermissions.includes(permissionName)) {
        return { allowed: true, role: member.role };
      }

      return { allowed: false, reason: `Missing permission: ${permissionName}`, role: member.role };
    } catch (error: any) {
      logger.error("Permission check failed", { userId, workspaceId, permissionName, error: error.message });
      return { allowed: false, reason: "Permission check failed" };
    }
  }

  /**
   * Check if a user has ANY of the specified permissions.
   */
  static async checkAnyPermission(
    userId: string,
    workspaceId: string,
    permissionNames: string[]
  ): Promise<PermissionCheckResult> {
    for (const perm of permissionNames) {
      const result = await this.checkPermission(userId, workspaceId, perm);
      if (result.allowed) return result;
    }
    return { allowed: false, reason: `Missing any of: ${permissionNames.join(", ")}` };
  }

  /**
   * Check if a user has ALL of the specified permissions.
   */
  static async checkAllPermissions(
    userId: string,
    workspaceId: string,
    permissionNames: string[]
  ): Promise<PermissionCheckResult> {
    const results = await Promise.all(
      permissionNames.map(perm => this.checkPermission(userId, workspaceId, perm))
    );

    const missing = results.filter(r => !r.allowed);
    if (missing.length === 0) {
      return { allowed: true, permissions: permissionNames };
    }

    return {
      allowed: false,
      reason: `Missing permissions: ${missing.map(m => m.reason).join("; ")}`,
    };
  }

  /**
   * Get all permissions for a user in a workspace.
   */
  static async getUserPermissions(
    userId: string,
    workspaceId: string
  ): Promise<string[]> {
    try {
      const member = await prisma.workspaceMember.findUnique({
        where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
        include: {
          roleEntry: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      if (!member) return [];

      // Owner has all permissions
      if (member.role === "owner") {
        return DEFAULT_PERMISSIONS.map(p => p.name);
      }

      // Get from Role table
      if (member.roleEntry) {
        return member.roleEntry.permissions.map(rp => rp.permission.name);
      }

      // Fallback to legacy role permissions
      return this.getLegacyRolePermissions(member.role);
    } catch (error: any) {
      logger.error("Failed to get user permissions", { userId, workspaceId, error: error.message });
      return [];
    }
  }

  /**
   * Grant a permission to a role.
   */
  static async grantPermission(options: GrantPermissionOptions): Promise<void> {
    const { roleId, permissionId, permissionName } = options;

    let permId = permissionId;
    if (!permId && permissionName) {
      const perm = await prisma.permission.findUnique({ where: { name: permissionName } });
      if (!perm) throw new Error(`Permission not found: ${permissionName}`);
      permId = perm.id;
    }

    if (!permId) throw new Error("Either permissionId or permissionName is required");

    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: roleId, permission_id: permId } },
      update: {},
      create: { role_id: roleId, permission_id: permId },
    });
  }

  /**
   * Revoke a permission from a role.
   */
  static async revokePermission(options: RevokePermissionOptions): Promise<void> {
    const { roleId, permissionId, permissionName } = options;

    let permId = permissionId;
    if (!permId && permissionName) {
      const perm = await prisma.permission.findUnique({ where: { name: permissionName } });
      if (!perm) throw new Error(`Permission not found: ${permissionName}`);
      permId = perm.id;
    }

    if (!permId) throw new Error("Either permissionId or permissionName is required");

    await prisma.rolePermission.deleteMany({
      where: { role_id: roleId, permission_id: permId },
    });
  }

  /**
   * Get all permissions (optionally filtered by resource or category).
   */
  static async listPermissions(filters?: {
    resource?: string;
    category?: string;
  }): Promise<any[]> {
    const where: any = {};
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.category) where.category = filters.category;

    return prisma.permission.findMany({ where, orderBy: [{ resource: "asc" }, { action: "asc" }] });
  }

  /**
   * Get all permissions for a role.
   */
  static async getRolePermissions(roleId: string): Promise<string[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role_id: roleId },
      include: { permission: true },
    });
    return rolePermissions.map(rp => rp.permission.name);
  }

  /**
   * Legacy role permission mapping (for backward compatibility).
   */
  private static getLegacyRolePermissions(role: string): string[] {
    const roleConfig = DEFAULT_ROLES.find(r => r.name === role);
    return roleConfig?.permissions || [];
  }
}
