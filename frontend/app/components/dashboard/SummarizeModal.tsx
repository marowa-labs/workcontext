"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Loader2,
  FileText,
  CheckSquare,
  Folder,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase/client";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { toast } from "../../hooks/use-toast";

interface Workspace {
  id: string;
  name: string;
}

interface SummarizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
}

export function SummarizeModal({ isOpen, onClose, workspaceId }: SummarizeModalProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>(workspaceId || "");
  const [loading, setLoading] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Load workspaces
  useEffect(() => {
    if (!isOpen) return;

    const fetchWorkspaces = async () => {
      setLoadingWorkspaces(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch("/api/workspaces", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.ok) {
          const data = await response.json();
          const workspaceList = data.workspaces || data || [];
          setWorkspaces(workspaceList);

          // Auto-select first workspace if none selected
          if (workspaceList.length > 0 && !selectedWorkspace) {
            setSelectedWorkspace(workspaceList[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    fetchWorkspaces();
  }, [isOpen, selectedWorkspace]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSummary("");
      setCopied(false);
    }
  }, [isOpen]);

  const generateSummary = async () => {
    if (!selectedWorkspace) {
      toast({
        title: "No workspace selected",
        description: "Please select a workspace to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSummary("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Fetch workspace data
      const [workspaceRes, tasksRes, projectsRes] = await Promise.all([
        fetch(`/api/workspaces/${selectedWorkspace}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`/api/workspaces/${selectedWorkspace}/tasks`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`/api/workspaces/${selectedWorkspace}/projects`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      const workspaceData = workspaceRes.ok ? await workspaceRes.json() : null;
      const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] };
      const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] };

      // Prepare content for AI summarization
      const workspace = workspaceData?.workspace || workspaceData;
      const tasks = tasksData.tasks || [];
      const projects = projectsData.projects || [];

      const content = `
Workspace: ${workspace?.name || "Unknown"}
Description: ${workspace?.description || "No description"}

Projects (${projects.length}):
${projects.map((p: any) => `- ${p.title}: ${p.description || "No description"} (Status: ${p.status || "unknown"})`).join("\n")}

Tasks (${tasks.length}):
${tasks.slice(0, 20).map((t: any) => `- ${t.title} (Status: ${t.status}, Priority: ${t.priority})`).join("\n")}
${tasks.length > 20 ? `\n... and ${tasks.length - 20} more tasks` : ""}

Summary statistics:
- Total projects: ${projects.length}
- Total tasks: ${tasks.length}
- Tasks by status: ${Object.entries(
        tasks.reduce((acc: any, t: any) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {})
      ).map(([status, count]) => `${status}: ${count}`).join(", ")}
- High priority tasks: ${tasks.filter((t: any) => t.priority === "high").length}
`;

      // Call AI summarize API
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          content,
          summaryType: "workspace_analysis",
          model: "gemini-2.5-flash",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary || data.result || "No summary generated");
      } else {
        // Fallback: Generate a simple summary without AI
        const simpleSummary = generateSimpleSummary(workspace, projects, tasks);
        setSummary(simpleSummary);
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSimpleSummary = (workspace: any, projects: any[], tasks: any[]) => {
    const pendingTasks = tasks.filter((t) => t.status === "todo" || t.status === "in-progress");
    const highPriorityTasks = tasks.filter((t) => t.priority === "high");
    const completedTasks = tasks.filter((t) => t.status === "done");

    return `# ${workspace?.name || "Workspace"} Summary

## Overview
This workspace contains **${projects.length} projects** and **${tasks.length} tasks**.

## Project Status
${projects.length > 0
        ? projects.map((p) => `- **${p.title}**: ${p.status || "In progress"}`).join("\n")
        : "No projects yet."
      }

## Task Summary
- **${pendingTasks.length}** tasks pending
- **${highPriorityTasks.length}** high priority tasks
- **${completedTasks.length}** tasks completed

## Recommendations
${highPriorityTasks.length > 0
        ? `⚠️ Focus on ${highPriorityTasks.length} high priority tasks first.`
        : "✅ No urgent high priority tasks."
      }

${pendingTasks.length > 10
        ? `📊 You have ${pendingTasks.length} pending tasks. Consider prioritizing or delegating.`
        : "📊 Task load looks manageable."
      }
`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard",
    });
  };

  const selectedWorkspaceName = workspaces.find(
    (w) => w.id === selectedWorkspace
  )?.name;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                AI Workspace Summary
              </h2>
              <p className="text-xs text-muted-foreground">
                Get AI-powered insights about your workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Workspace Selector */}
          {!workspaceId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Workspace</label>
              <select
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                disabled={loading || loadingWorkspaces}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">
                  {loadingWorkspaces ? "Loading workspaces..." : "Choose a workspace"}
                </option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Generate Button */}
          {!summary && !loading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="p-4 bg-amber-500/10 rounded-full">
                <Sparkles className="w-10 h-10 text-amber-500" />
              </div>
              <p className="text-center text-muted-foreground max-w-sm">
                AI will analyze your workspace projects, tasks, and progress to generate a comprehensive summary with insights and recommendations.
              </p>
              <Button
                onClick={generateSummary}
                disabled={!selectedWorkspace || loadingWorkspaces}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Summary
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-muted-foreground">Analyzing workspace data...</p>
            </div>
          )}

          {/* Summary Result */}
          {summary && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">
                  Summary for {selectedWorkspaceName}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSummary}
                    className="h-8"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap">{summary}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/50 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Powered by AI • Analysis based on current workspace data
          </p>
          {summary && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
