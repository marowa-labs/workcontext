"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { KanbanBoard } from "../../../../../components/dashboard/KanbanBoard";
import WorkspaceService from "../../../../../lib/utils/workspaceService";

export default function WorkspaceKanbanPage() {
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
    <div className="p-8 min-h-screen bg-background">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center gap-2">
        {isLoading ? (
          <div className="h-8 w-32 bg-slate-100 animate-pulse rounded" />
        ) : (
          workspaceName
        )}{" "}
        Workspace Kanban
      </h1>
      <div className="h-[calc(100vh-200px)]">
        <KanbanBoard workspaceId={workspaceId} />
      </div>
    </div>
  );
}
