"use client";

import { useState, useEffect, JSX } from "react";
import { useParams, useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import {
  Settings,
  Save,
  Trash2,
  AlertTriangle,
  Users,
  Crown,
  Shield,
  Eye,
  Check,
  Loader2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import WorkspaceService, {
  Workspace,
  WorkspaceMember,
} from "../../../../lib/utils/workspaceService";
import { useUser } from "../../../../lib/utils/useUser";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVAILABLE_ICONS = [
  "Hash", "Briefcase", "Code", "Database", "Cpu", "Layers", "Globe", "Shield",
  "Zap", "Users", "Target", "Rocket", "FlaskConical", "Library", "Terminal", "Activity",
];

const ROLE_META: Record<
  string,
  { label: string; icon: JSX.Element; color: string }
> = {
  admin: {
    label: "Admin",
    icon: <Shield className="w-3 h-3" />,
    color: "bg-violet-100 text-violet-700",
  },
  editor: {
    label: "Editor",
    icon: <ChevronRight className="w-3 h-3" />,
    color: "bg-blue-100 text-blue-700",
  },
  viewer: {
    label: "Viewer",
    icon: <Eye className="w-3 h-3" />,
    color: "bg-slate-100 text-slate-600",
  },
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
  danger = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`bg-card border rounded-2xl overflow-hidden ${
        danger ? "border-red-200" : "border-border"
      }`}>
      <div
        className={`px-6 py-4 border-b ${
          danger ? "border-red-100 bg-red-50/30" : "border-border bg-muted/20"
        }`}>
        <h2
          className={`text-sm font-bold uppercase tracking-widest ${
            danger ? "text-red-600" : "text-muted-foreground"
          }`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmText,
  confirmPlaceholder,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText: string;
  confirmPlaceholder: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">
            Type{" "}
            <span className="font-mono font-semibold text-foreground">
              {confirmText}
            </span>{" "}
            to confirm
          </p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={confirmPlaceholder}
            className="w-full h-9 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-red-500/40"
            autoFocus
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 h-9 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={input !== confirmText}
            className={`flex-1 h-9 text-sm font-bold rounded-lg transition-colors ${
              danger
                ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
                : "bg-foreground text-background hover:opacity-90 disabled:opacity-40"
            }`}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { user } = useUser();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // General form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Hash");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Danger zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isDangerous, setIsDangerous] = useState(false);

  const isOwner = workspace?.owner_id === user?.id;

  useEffect(() => {
    if (!workspaceId) return;
    setIsLoading(true);
    WorkspaceService.getWorkspace(workspaceId)
      .then((ws) => {
        setWorkspace(ws);
        setName(ws.name);
        setDescription(ws.description ?? "");
        setIcon(ws.icon ?? "Hash");
        setMembers(ws.members ?? []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await WorkspaceService.updateWorkspace(workspaceId, {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
      });
      setWorkspace(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message ?? "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDangerous(true);
    try {
      await WorkspaceService.deleteWorkspace(workspaceId);
      router.push("/dashboard");
    } catch (err: any) {
      alert(err?.message ?? "Failed to delete workspace.");
    } finally {
      setIsDangerous(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Workspace not found.
      </div>
    );
  }

  const hasChanges =
    name !== workspace.name ||
    description !== (workspace.description ?? "") ||
    icon !== (workspace.icon ?? "Hash");

  return (
    <div className="p-8 bg-background min-h-screen w-full mx-auto flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
            Settings
          </h1>
          <p className="text-xs text-muted-foreground">{workspace.name}</p>
        </div>
      </div>

      {/* ── General ── */}
      <Section
        title="General"
        subtitle="Update workspace name, icon and description">
        {/* Icon picker */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Icon
          </label>
          <div className="relative inline-block">
            <button
              onClick={() => setShowIconPicker((v) => !v)}
              className="w-16 h-16 text-3xl rounded-2xl border-2 border-border hover:border-primary/40 bg-muted/40 hover:bg-muted transition-all flex items-center justify-center">
              {icon && (LucideIcons as any)[icon] ? (
                (() => {
                  const IconNode = (LucideIcons as any)[icon];
                  return <IconNode className="w-8 h-8 text-foreground" />;
                })()
              ) : (
                <span className="text-xl">{icon || "Hash"}</span>
              )}
            </button>
            {showIconPicker && (
              <div className="absolute top-full left-0 mt-2 z-20 bg-background border border-border rounded-2xl shadow-xl p-3 w-[260px]">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                  {AVAILABLE_ICONS.map((iconName) => {
                    const IconNode = (LucideIcons as any)[iconName];
                    return (
                      <button
                        key={iconName}
                        onClick={() => {
                          setIcon(iconName);
                          setShowIconPicker(false);
                        }}
                        title={iconName}
                        className={`w-9 h-9 rounded-lg hover:bg-muted transition-colors flex items-center justify-center ${
                          iconName === icon ? "bg-primary/10 ring-2 ring-primary/30 text-primary" : "text-muted-foreground"
                        }`}>
                        {IconNode && <IconNode className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Workspace Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="My Workspace"
            className="w-full h-10 px-3 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
          />
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="What is this workspace for?"
            className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed"
          />
          <p className="text-[11px] text-muted-foreground/60 text-right mt-0.5">
            {description.length}/500
          </p>
        </div>

        {saveError && <p className="text-xs text-red-600 mb-3">{saveError}</p>}

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || !name.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving…" : saveSuccess ? "Saved!" : "Save changes"}
        </button>
      </Section>

      {/* ── Members ── */}
      <Section
        title="Members"
        subtitle={`${members.length} member${members.length !== 1 ? "s" : ""}`}>
        <div className="space-y-2">
          {members.map((m) => {
            const u = m.user;
            const initials = u.full_name
              ? u.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : u.email[0].toUpperCase();
            const roleMeta = ROLE_META[m.role] ?? ROLE_META.viewer;
            const isThisOwner = workspace.owner_id === u.id;

            return (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {u.full_name ?? u.email}
                    {u.id === user?.id && (
                      <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </p>
                </div>

                {/* Role badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isThisOwner && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      <Crown className="w-3 h-3" />
                      Owner
                    </span>
                  )}
                  <span
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleMeta.color}`}>
                    {roleMeta.icon}
                    {roleMeta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {members.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Users className="w-4 h-4" />
            No members yet.
          </div>
        )}
      </Section>

      {/* ── Danger Zone ── */}
      <Section title="⚠ Danger Zone" danger>
        <div className="space-y-4">
          {/* Leave workspace (non-owners) */}
          {!isOwner && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-200 bg-red-50/20">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Leave Workspace
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You'll lose access to all projects and tasks in this
                  workspace.
                </p>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border border-red-300 text-red-600 hover:bg-red-100 transition-colors flex-shrink-0">
                <LogOut className="w-3.5 h-3.5" />
                Leave
              </button>
            </div>
          )}

          {/* Delete workspace (owner only) */}
          {isOwner && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-200 bg-red-50/20">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Delete Workspace
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently removes this workspace, all projects, tasks, and
                  data. This action <strong>cannot be undone</strong>.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* ── Delete Confirm Modal ── */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete Workspace"
          message={`This will permanently delete "${workspace.name}" and all of its projects, tasks, and data. This cannot be undone.`}
          confirmText={workspace.name}
          confirmPlaceholder="Type the workspace name to confirm"
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* ── Leave Confirm Modal ── */}
      {showLeaveModal && (
        <ConfirmModal
          title="Leave Workspace"
          message={`Are you sure you want to leave "${workspace.name}"? You'll lose access immediately.`}
          confirmText="leave"
          confirmPlaceholder='Type "leave" to confirm'
          danger
          onConfirm={() => {
            // Leave is handled via removing own membership —
            // for now navigate away (API endpoint can be added later)
            router.push("/dashboard");
          }}
          onCancel={() => setShowLeaveModal(false)}
        />
      )}
    </div>
  );
}
