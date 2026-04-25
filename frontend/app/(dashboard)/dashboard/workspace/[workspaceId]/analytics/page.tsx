"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import WorkspaceAnalytics from "../../../../../components/dashboard/workspace/WorkspaceAnalytics";
import WorkspaceService from "../../../../../lib/utils/workspaceService";

export default function WorkspaceAnalyticsPage() {
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
    <div className="p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center gap-2">
        {isLoading ? (
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        ) : (
          workspaceName
        )}{" "}
        Workspace Analytics
      </h1>

      <div className="w-full">
        <WorkspaceAnalytics workspaceId={workspaceId} />
      </div>
    </div>
  );
}
