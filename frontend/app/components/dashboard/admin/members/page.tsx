"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Search,
  MoreVertical,
  Shield,
  Trash2,
  Mail,
  Check,
  X,
  Loader2,
  Plus,
} from "lucide-react";
import workspaceService, {
  WorkspaceMember,
} from "../../../../lib/utils/workspaceService";
import { apiClient } from "../../../../lib/utils/apiClient";

// ─── Invite Modal ─────────────────────────────────────────────────────────────

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (
    email: string,
    role: "admin" | "editor" | "viewer",
  ) => Promise<void>;
  isLoading: boolean;
}

function InviteModal({
  isOpen,
  onClose,
  onInvite,
  isLoading,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md border border-border p-6 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight">Invite Member</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Invite a new member to collaborate in this workspace.
        </p>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["viewer", "editor", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${
                    role === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border text-foreground"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {role === "admin" && "Can manage settings, members, and billing."}
              {role === "editor" && "Can create and edit projects/tasks."}
              {role === "viewer" && "Read-only access to content."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onInvite(email, role)}
            disabled={!email || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null); // To check if self
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // userId being updated

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const list = await workspaceService.getWorkspaceMembers(workspaceId);
      setMembers(list);
      // Rough way to get current user ID context - ideally from auth context, but
      // we can infer it or fetch simplistic user info (omitted for brevity here, assume we fetch user or check against list)
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMembers();
    // Fetch current user for "Leave" vs "Remove" logic - simplified:
    apiClient
      .get("/api/auth/me")
      .then((u) => setCurrentUser(u.user))
      .catch(() => {});
  }, [fetchMembers]);

  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "editor" | "viewer",
  ) => {
    try {
      setIsUpdating(userId);
      await workspaceService.updateMemberRole(workspaceId, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m)),
      );
    } catch (err) {
      alert("Failed to update role. Ensure you have permissions.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this member? They will lose access immediately.",
      )
    )
      return;
    try {
      setIsUpdating(userId);
      await workspaceService.removeMember(workspaceId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      alert("Failed to remove member.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleInvite = async (
    email: string,
    role: "admin" | "editor" | "viewer",
  ) => {
    try {
      setIsInviting(true);
      await workspaceService.inviteMember(workspaceId, email, role);
      setInviteModalOpen(false);
      alert(`Invitation sent to ${email}`);
      // Ideally refresh pending invites, but we don't display them here yet.
      // For now, let's just refresh list in case they were auto-added (unlikely for strict invites)
    } catch (err) {
      alert("Failed to send invite.");
    } finally {
      setIsInviting(false);
    }
  };

  const filtered = members.filter(
    (m) =>
      m.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user?.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-8 bg-background min-h-screen w-full flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Members
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage access and roles
            </p>
          </div>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
        />
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-muted-foreground w-[40%]">
                User
              </th>
              <th className="px-6 py-4 font-semibold text-muted-foreground w-[20%]">
                Role
              </th>
              <th className="px-6 py-4 font-semibold text-muted-foreground w-[20%]">
                Joined
              </th>
              <th className="px-6 py-4 font-semibold text-muted-foreground w-[20%] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading
                    members...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-muted-foreground">
                  No members found.
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-bold shadow-sm">
                        {member.user?.full_name?.[0] ||
                          member.user?.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {member.user?.full_name || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative inline-block group/role">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(
                            member.user_id,
                            e.target.value as any,
                          )
                        }
                        disabled={
                          isUpdating === member.user_id ||
                          currentUser?.id === member.user_id
                        }
                        className={`appearance-none bg-transparent font-medium py-1 pl-2 pr-8 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-muted transition-colors
                          ${member.role === "admin" ? "text-violet-600" : member.role === "editor" ? "text-blue-600" : "text-slate-600"}`}>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {isUpdating === member.user_id && (
                        <Loader2 className="absolute right-2 top-1.5 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                      )}
                      {/* Chevron usually here but basic select handles it. Custom dropdown would be better but keeping simple for MVP */}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {currentUser?.id !== member.user_id && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={isUpdating === member.user_id}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Remove member">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInvite}
        isLoading={isInviting}
      />
    </div>
  );
}
