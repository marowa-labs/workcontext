"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { StudyDashboard } from "../../../../../study/StudyDashboard";
import ProjectService from "../../../../../lib/utils/projectService";
import { useUser } from "../../../../../lib/utils/useUser";
import { Loader2 } from "lucide-react";

export default function TeamSourceGuidePage() {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const workspaceId = params.workspaceId as string;
  const paramProjectId = searchParams.get("projectId");

  const [projectId, setProjectId] = useState<string | null>(paramProjectId);
  const [projectTitle, setProjectTitle] = useState("Research Guide");
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!user?.id || !workspaceId) return;

      try {
        setLoading(true);
        // Fetch projects specific to this workspace
        const projects = await ProjectService.getUserProjectsInWorkspace(
          user.id,
          workspaceId,
        );
        const sorted = projects
          ? projects.sort(
              (a: any, b: any) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime(),
            )
          : [];
        setProjectsList(sorted);

        if (paramProjectId) {
          const current = sorted.find((p: any) => p.id === paramProjectId);
          if (current) {
            setProjectId(current.id);
            setProjectTitle(current.title);
          } else {
            // If project not in this workspace or list, try fetching it
            try {
              const project =
                await ProjectService.getProjectById(paramProjectId);
              if (project.workspace_id === workspaceId) {
                setProjectId(project.id);
                setProjectTitle(project.title);
              } else {
                // Fallback to most recent workspace project if the requested one isn't in this workspace
                if (sorted.length > 0) {
                  setProjectId(sorted[0].id);
                  setProjectTitle(sorted[0].title);
                  router.replace(
                    `/dashboard/workspace/${workspaceId}/source-guide?projectId=${sorted[0].id}`,
                  );
                }
              }
            } catch (err) {
              if (sorted.length > 0) {
                setProjectId(sorted[0].id);
                setProjectTitle(sorted[0].title);
              }
            }
          }
        } else {
          // Default to most recent workspace project
          if (sorted.length > 0) {
            setProjectId(sorted[0].id);
            setProjectTitle(sorted[0].title);
          }
        }
      } catch (err) {
        console.error("Failed to load workspace projects for guide", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, workspaceId, paramProjectId, router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-8 text-center">
        <div>
          <p className="mb-4 text-lg font-medium">
            No projects found in this workspace.
          </p>
          <p className="text-sm">
            Create a project within this workspace to use the Team Research
            Guide.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-8 pb-0 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          Team Source Guide
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Collaborative research synthesis and AI briefs for this workspace.
        </p>
      </div>
      <div className="flex-1 overflow-hidden mt-4">
        <StudyDashboard
          projectId={projectId}
          projectTitle={projectTitle}
          projects={projectsList}
        />
      </div>
    </div>
  );
}
