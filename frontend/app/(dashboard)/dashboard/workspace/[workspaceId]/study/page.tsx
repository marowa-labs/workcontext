"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { NotebookInterface } from "../../../../../study/NotebookInterface";
import ProjectService from "../../../../../lib/utils/projectService";
import { useUser } from "../../../../../lib/utils/useUser";
import { Loader2 } from "lucide-react";

export default function WorkspaceStudyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const workspaceId = params.workspaceId as string;
  const paramProjectId = searchParams.get("projectId");
  const { user, loading: userLoading } = useUser();

  const [projectId, setProjectId] = useState<string | null>(paramProjectId);
  const [projectTitle, setProjectTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user?.id || !workspaceId) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        const titleParam = searchParams.get("projectTitle");

        if (paramProjectId && titleParam) {
          setProjectId(paramProjectId);
          setProjectTitle(decodeURIComponent(titleParam));
        } else if (paramProjectId) {
          try {
            const project = await ProjectService.getProjectById(
              paramProjectId,
              user.id,
            );
            if (project.workspace_id === workspaceId) {
              setProjectId(project.id);
              setProjectTitle(project.title || "Untitled Project");
            } else {
              // Redirect or fallback if project belongs to another workspace
              router.replace(
                `/dashboard/workspace/${workspaceId}/source-guide`,
              );
            }
          } catch (fetchError) {
            setProjectId(paramProjectId);
            setProjectTitle("Research Guide");
          }
        } else {
          // Fallback to source guide if no projectId provided
          router.replace(`/dashboard/workspace/${workspaceId}/source-guide`);
        }
      } catch (err) {
        console.error("Failed to load project for workspace study", err);
        setProjectTitle("Research Guide");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, userLoading, workspaceId, paramProjectId, searchParams, router]);

  if (loading || userLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>No project selected for Deep Dive.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-hidden">
      <NotebookInterface
        projectTitle={projectTitle}
        projectId={projectId}
        initialMessage={searchParams.get("initialMessage") || undefined}
        onBack={() => router.back()}
      />
    </div>
  );
}
