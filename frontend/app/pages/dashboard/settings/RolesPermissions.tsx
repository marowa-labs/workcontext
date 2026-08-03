"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  Users,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Search,
  AlertTriangle,
  Save,
} from "lucide-react";

interface Permission {
  name: string;
  displayName: string;
  description: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  permissions: string[];
  memberCount?: number;
}

const resourceLabels: Record<string, string> = {
  workspace: "Workspace",
  project: "Project",
  task: "Task",
  member: "Members",
  ai: "AI",
  integration: "Integrations",
  template: "Templates",
  notification: "Notifications",
  memory: "Memory",
  billing: "Billing",
};

const resourceColors: Record<string, string> = {
  workspace: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  project: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  task: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  member: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  ai: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  integration: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  template: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  notification: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  memory: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  billing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", displayName: "", description: "" });
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/roles", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data.roles);
      setPermissions(data.permissions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.displayName) return;
    try {
      setSaving(true);
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create role");
      }
      setShowCreateModal(false);
      setNewRole({ name: "", displayName: "", description: "" });
      await fetchRoles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role? Members with this role will need to be reassigned.")) return;
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete role");
      }
      await fetchRoles();
      if (selectedRole?.id === roleId) setSelectedRole(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: editPermissions }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }
      setEditingRole(null);
      await fetchRoles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleResource = (resource: string) => {
    setExpandedResources((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) next.delete(resource);
      else next.add(resource);
      return next;
    });
  };

  const togglePermission = (permName: string) => {
    setEditPermissions((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const toggleAllInResource = (resource: string, perms: Permission[]) => {
    const permNames = perms.map((p) => p.name);
    const allSelected = permNames.every((n) => editPermissions.includes(n));
    if (allSelected) {
      setEditPermissions((prev) => prev.filter((p) => !permNames.includes(p)));
    } else {
      setEditPermissions((prev) => [...new Set([...prev, ...permNames])]);
    }
  };

  // Group permissions by resource
  const permissionsByResource = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  // Filter by search
  const filteredRoles = roles.filter(
    (r) =>
      r.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Roles &amp; Permissions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage workspace roles and control what each role can access.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Create Role
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        />
      </div>

      <div className="flex gap-6">
        {/* Roles list */}
        <div className="w-80 flex-shrink-0 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading roles...</div>
          ) : (
            filteredRoles.map((role) => (
              <div
                key={role.id}
                onClick={() => {
                  setSelectedRole(role);
                  setEditingRole(null);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRole?.id === role.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {role.isSystem ? (
                      <Lock size={14} className="text-gray-400" />
                    ) : (
                      <Unlock size={14} className="text-green-500" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">{role.displayName}</span>
                  </div>
                  {role.memberCount !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {role.memberCount}
                    </span>
                  )}
                </div>
                {role.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{role.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2 ml-6">
                  {role.permissions.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      {p.split(".")[1]}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="text-xs text-gray-400">+{role.permissions.length - 3}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Role detail / editor */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {selectedRole ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRole.displayName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedRole.isSystem ? "System Role" : "Custom Role"} · {selectedRole.memberCount || 0}{" "}
                    members
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingRole?.id === selectedRole.id ? (
                    <>
                      <button
                        onClick={() => setEditingRole(null)}
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePermissions}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save size={14} />
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingRole(selectedRole);
                        setEditPermissions([...selectedRole.permissions]);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit size={14} />
                      Edit Permissions
                    </button>
                  )}
                  {!selectedRole.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(selectedRole.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Permissions by resource */}
              <div className="space-y-3">
                {Object.entries(permissionsByResource).map(([resource, perms]) => {
                  const expanded = expandedResources.has(resource);
                  const selectedCount = perms.filter((p) =>
                    editPermissions.includes(p.name)
                  ).length;
                  const allSelected = perms.every((p) => editPermissions.includes(p.name));
                  const isEditing = editingRole?.id === selectedRole.id;

                  return (
                    <div
                      key={resource}
                      className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div
                        onClick={() => toggleResource(resource)}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-750 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              resourceColors[resource] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {resourceLabels[resource] || resource}
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {perms.length} permissions
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {selectedCount}/{perms.length}
                          </span>
                          {isEditing && (
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                toggleAllInResource(resource, perms);
                              }}
                              className={`text-xs px-2 py-0.5 rounded ${
                                allSelected
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {allSelected ? "All" : "None"}
                            </button>
                          )}
                        </div>
                      </div>

                      {expanded && (
                        <div className="p-3 space-y-1">
                          {perms.map((perm) => {
                            const isChecked = editPermissions.includes(perm.name);
                            return (
                              <div
                                key={perm.name}
                                onClick={() => isEditing && togglePermission(perm.name)}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                                  isEditing ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {isEditing ? (
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                                        isChecked
                                          ? "bg-blue-600 border-blue-600"
                                          : "border-gray-300 dark:border-gray-600"
                                      }`}
                                    >
                                      {isChecked && <Check size={10} className="text-white" />}
                                    </div>
                                  ) : (
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        isChecked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                                      }`}
                                    />
                                  )}
                                  <div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {perm.displayName}
                                    </span>
                                    {perm.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{perm.description}</p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">{perm.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Shield size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a role to view details</p>
              <p className="text-sm mt-1">Choose a role from the left panel to manage its permissions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Custom Role</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name (internal)
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewRole({ ...newRole, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })
                  }
                  placeholder="e.g., reviewer"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newRole.displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewRole({ ...newRole, displayName: e.target.value })
                  }
                  placeholder="e.g., Reviewer"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewRole({ ...newRole, description: e.target.value })
                  }
                  placeholder="What can this role do?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name || !newRole.displayName || saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
