/**
 * Role Service
 *
 * Manages workspace roles (CRUD, assignment, default roles).
 * Supports both system roles (owner, admin, editor, viewer) and custom roles.
 */

import { prisma } from "../lib/prisma";
import logger from "../monitoring/logger";
import { PermissionService, DEFAULT_ROLES } from "./permissionService";

// ---------- Types ----------

export interface CreateRoleOptions {
  workspaceId?: string;
  name: string;
  displayName: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleOptions {
  displayName?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  permissions: string[];
  memberCount?: number;
}

// ---------- Service ----------

export class RoleService {
  /**
   * Initialize default roles for a workspace.
   * Called when a workspace is created.
   */
  static async initializeWorkspaceRoles(workspaceId: string): Promise<void> {
    try {
      // Ensure defaults are seeded
      await PermissionService.seedDefaults();

      // Get the owner user for this workspace
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: { where: { role: "owner" }, take: 1 } },
      });

      if (workspace?.members[0]) {
        // Assign owner role to workspace creator
        const ownerRole = await prisma.role.findUnique({ where: { name: "owner" } });
        if (ownerRole) {
          await prisma.workspaceMember.update({
            where: { id: workspace.members[0].id },
            data: { role_id: ownerRole.id },
          });
        }
      }

      logger.info("Workspace roles initialized", { workspaceId });
    } catch (error: any) {
      logger.error("Failed to initialize workspace roles", { workspaceId, error: error.message });
    }
  }

  /**
   * Get all roles for a workspace (system + custom).
   */
  static async getRoles(): Promise<RoleWithPermissions[]> {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { workspaceMembers: true },
        },
      },
      orderBy: [{ is_system: "desc" }, { name: "asc" }],
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.display_name,
      description: role.description,
      isSystem: role.is_system,
      isDefault: role.is_default,
      permissions: role.permissions.map(rp => rp.permission.name),
      memberCount: role._count.workspaceMembers,
    }));
  }

  /**
   * Get a single role by ID.
   */
  static async getRole(roleId: string): Promise<RoleWithPermissions | null> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { workspaceMembers: true },
        },
      },
    });

    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      displayName: role.display_name,
      description: role.description,
      isSystem: role.is_system,
      isDefault: role.is_default,
      permissions: role.permissions.map(rp => rp.permission.name),
      memberCount: role._count.workspaceMembers,
    };
  }

  /**
   * Get a role by name.
   */
  static async getRoleByName(name: string): Promise<RoleWithPermissions | null> {
    const role = await prisma.role.findUnique({
      where: { name },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      displayName: role.display_name,
      description: role.description,
      isSystem: role.is_system,
      isDefault: role.is_default,
      permissions: role.permissions.map(rp => rp.permission.name),
    };
  }

  /**
   * Create a new custom role.
   */
  static async createRole(options: CreateRoleOptions): Promise<RoleWithPermissions> {
    const { name, displayName, description, permissions } = options;

    // Check if role name already exists
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      throw new Error(`Role "${name}" already exists`);
    }

    // Create the role
    const role = await prisma.role.create({
      data: {
        name: name.toLowerCase().replace(/\s+/g, "_"),
        display_name: displayName,
        description,
        is_system: false,
      },
    });

    // Assign permissions if provided
    if (permissions && permissions.length > 0) {
      await PermissionService.grantPermission({
        roleId: role.id,
        permissionName: permissions[0],
      });

      // Grant remaining permissions
      for (const permName of permissions.slice(1)) {
        try {
          await PermissionService.grantPermission({
            roleId: role.id,
            permissionName: permName,
          });
        } catch (err: any) {
          logger.warn("Failed to grant permission", { roleId: role.id, permission: permName, error: err.message });
        }
      }
    }

    logger.info("Custom role created", { roleId: role.id, name: role.name });

    return this.getRole(role.id) as Promise<RoleWithPermissions>;
  }

  /**
   * Update a role.
   */
  static async updateRole(roleId: string, options: UpdateRoleOptions): Promise<RoleWithPermissions> {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new Error("Role not found");

    // System roles can only have their permissions updated, not name/description
    if (role.is_system) {
      if (options.displayName || options.description) {
        throw new Error("Cannot modify system role name or description");
      }
    }

    // Update role metadata
    const updateData: any = {};
    if (options.displayName) updateData.display_name = options.displayName;
    if (options.description !== undefined) updateData.description = options.description;

    if (Object.keys(updateData).length > 0) {
      await prisma.role.update({ where: { id: roleId }, data: updateData });
    }

    // Update permissions if provided
    if (options.permissions !== undefined) {
      // Remove all existing permissions
      await prisma.rolePermission.deleteMany({ where: { role_id: roleId } });

      // Add new permissions
      for (const permName of options.permissions) {
        try {
          await PermissionService.grantPermission({
            roleId,
            permissionName: permName,
          });
        } catch (err: any) {
          logger.warn("Failed to grant permission during role update", { roleId, permission: permName, error: err.message });
        }
      }
    }

    logger.info("Role updated", { roleId, name: role.name });

    return this.getRole(roleId) as Promise<RoleWithPermissions>;
  }

  /**
   * Delete a custom role. System roles cannot be deleted.
   */
  static async deleteRole(roleId: string): Promise<void> {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new Error("Role not found");

    if (role.is_system) {
      throw new Error("Cannot delete system roles");
    }

    // Check if any members have this role
    const memberCount = await prisma.workspaceMember.count({
      where: { role_id: roleId },
    });

    if (memberCount > 0) {
      throw new Error(`Cannot delete role with ${memberCount} assigned members. Reassign them first.`);
    }

    await prisma.role.delete({ where: { id: roleId } });

    logger.info("Custom role deleted", { roleId, name: role.name });
  }

  /**
   * Assign a role to a workspace member.
   */
  static async assignRole(memberId: string, roleId: string): Promise<void> {
    const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!member) throw new Error("Member not found");

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new Error("Role not found");

    // Don't allow changing the owner role
    if (member.role === "owner") {
      throw new Error("Cannot change the owner's role");
    }

    // Don't allow assigning the owner role
    if (role.name === "owner") {
      throw new Error("Cannot assign the owner role to another member");
    }

    await prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        role: role.name, // Keep string role for backward compatibility
        role_id: roleId,
      },
    });

    logger.info("Role assigned to member", { memberId, roleId, roleName: role.name });
  }

  /**
   * Get members with a specific role.
   */
  static async getMembersByRole(roleName: string): Promise<any[]> {
    return prisma.workspaceMember.findMany({
      where: { role: roleName },
      include: {
        user: {
          select: { id: true, email: true, full_name: true },
        },
        roleEntry: true,
      },
    });
  }

  /**
   * Get all roles with their member counts (for settings UI).
   */
  static async getRolesWithCounts(): Promise<RoleWithPermissions[]> {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { workspaceMembers: true },
        },
      },
      orderBy: [{ is_system: "desc" }, { name: "asc" }],
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.display_name,
      description: role.description,
      isSystem: role.is_system,
      isDefault: role.is_default,
      permissions: role.permissions.map(rp => rp.permission.name),
      memberCount: role._count.workspaceMembers,
    }));
  }
}
