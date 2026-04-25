"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TeamChat } from "../../../../../components/dashboard/team/TeamChat";
import WorkspaceService from "../../../../../lib/utils/workspaceService";
import { Loader2 } from "lucide-react";

export default function WorkspaceChatPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) return;
      try {
        const data = await WorkspaceService.getWorkspace(workspaceId);
        if (data) {
          setWorkspaceName(data.name);
        }
      } catch (error) {
        console.error("Failed to fetch workspace name", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspace();
  }, [workspaceId]);

  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center gap-2">
        {isLoading ? (
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        ) : (
          workspaceName
        )}{" "}
        Workspace Chat
      </h1>
      <div className="flex-1 min-h-[600px] border rounded-xl overflow-hidden bg-card border-border shadow-sm mt-4">
        <TeamChat
          workspaceId={workspaceId}
          title={`${workspaceName || "Workspace"} Chat`}
        />
      </div>
    </div>
  );
}
