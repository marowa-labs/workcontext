"use client";

import { useEffect, useState } from "react";
import useAuth from "../../../lib/utils/useAuth";
import { apiClient } from "../../../lib/utils/apiClient";
import { ActivityFeed } from "../team/ActivityFeed";
import { MemberList } from "../team/MemberList";
import { InviteMemberModal } from "../workspace/InviteMemberModal";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Plus, Users, Zap, FolderOpen, Loader2 } from "lucide-react";
import WorkspaceService from "../../../lib/utils/workspaceService";
import { usePresence } from "../../../lib/hooks/usePresence";
import { toast } from "../../../hooks/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>({
    recentTasks: [],
    recentProjects: [],
  });
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] =
    useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [newWorkspaceIcon, setNewWorkspaceIcon] = useState("💼");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const { activeUsers } = usePresence(
    workspace?.id ? `workspace-${workspace.id}` : "",
  );

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast({
        title: "Required",
        description: "Workspace name is required",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingWorkspace(true);
    try {
      await WorkspaceService.createWorkspace({
        name: newWorkspaceName,
        description: newWorkspaceDesc,
        icon: newWorkspaceIcon,
      });
      toast({ title: "Success", description: "Workspace created!" });

      // Reload data
      const workspaces = await WorkspaceService.getWorkspaces();
      if (workspaces && workspaces.length > 0) {
        const currentWs = workspaces[0];
        setWorkspace(currentWs);
        const metricsData = await apiClient.get(
          `/api/workspaces/${currentWs.id}/metrics`,
        );
        setMetrics(metricsData);
      }

      setShowCreateWorkspaceModal(false);
      // Reset form
      setNewWorkspaceName("");
      setNewWorkspaceDesc("");
      setNewWorkspaceIcon("💼");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // 1. Get User's Workspace (assuming single workspace for now)
        const workspaces = await WorkspaceService.getWorkspaces();
        if (workspaces && workspaces.length > 0) {
          const currentWs = workspaces[0];
          setWorkspace(currentWs);

          // 2. Get Metrics using our new endpoint
          const metricsData = await apiClient.get(
            `/api/workspaces/${currentWs.id}/metrics`,
          );
          setMetrics(metricsData);
        }
      } catch (error) {
        console.error("Failed to load team dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-20">
        <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          No Team Workspace Found
        </h2>
        <p className="text-muted-foreground mb-8">
          Create a workspace to start collaborating with your team.
        </p>
        <Button
          onClick={() => setShowCreateWorkspaceModal(true)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
          Create Workspace
        </Button>

        {/* Create Workspace Modal */}
        <Dialog
          open={showCreateWorkspaceModal}
          onOpenChange={setShowCreateWorkspaceModal}>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription>
                Create a new collaborative space for your team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Engineering Team"
                  className="bg-background border-border"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md border bg-muted text-xl">
                    {newWorkspaceIcon}
                  </div>
                  <Input
                    id="icon"
                    className="max-w-[100px] bg-background border-border"
                    placeholder="💼"
                    maxLength={2}
                    value={newWorkspaceIcon}
                    onChange={(e) => setNewWorkspaceIcon(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">
                    Type an emoji
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this workspace for?"
                  className="bg-background border-border"
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="bg-muted hover:bg-muted/80 border-border"
                onClick={() => setShowCreateWorkspaceModal(false)}
                disabled={isCreatingWorkspace}>
                Cancel
              </Button>
              <Button
                className="bg-teal-500 border-teal-200 hover:bg-teal-600"
                onClick={handleCreateWorkspace}
                disabled={isCreatingWorkspace}>
                {isCreatingWorkspace && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Workspace
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Combine tasks and projects into a single "activities" stream for the feed
  const combinedActivities = [
    ...(metrics.recentTasks?.map((t: any) => ({
      ...t,
      type: "task",
      // Map creator to user for ActivityFeed component compatibility
      user: t.creator || { full_name: "Unknown User", email: "" },
    })) || []),
    ...(metrics.recentProjects?.map((p: any) => ({
      ...p,
      type: "project",
      content: p.title,
      // Projects already have user data from the backend
      user: p.user || { full_name: "Unknown User", email: "" },
    })) || []),
  ].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  // Extract online user IDs from presence
  const onlineUserIds = activeUsers.map((u) => u.user.id);

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {workspace.name} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.user_metadata?.full_name?.split(" ")[0]}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowInviteModal(true)}
            className="cursor-pointer border-primary text-primary hover:bg-primary/10">
            <Users className="mr-2 h-4 w-4" /> Invite Member
          </Button>
          <Button className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Projects
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {workspace._count?.projects || 0}
              </h3>
            </div>
            <div className="bg-blue-100/20 p-2 rounded-lg">
              <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Team Members
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {workspace.members?.length || 1}
              </h3>
            </div>
            <div className="bg-purple-100/20 p-2 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Recent Updates
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {combinedActivities.length}
              </h3>
            </div>
            <div className="bg-amber-100/20 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content: Activity Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">
              Team Activity
            </h3>
            <ActivityFeed activities={combinedActivities} />
          </div>
        </div>

        {/* Right Sidebar: Members & Online Status */}
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground text-sm">
                Team Members
              </h3>
              <span className="text-xs text-muted-foreground">
                {workspace.members?.length} total
              </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-1">
              <MemberList
                members={workspace.members}
                onlineUserIds={onlineUserIds}
              />
            </div>

            <Button
              variant="ghost"
              className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground font-normal">
              View all members
            </Button>
          </div>

          {/* Quick Links / Projects could go here */}
        </div>
      </div>

      {/* Invite Member Modal */}
      {workspace && (
        <InviteMemberModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          workspaceId={workspace.id}
        />
      )}
    </div>
  );
}
