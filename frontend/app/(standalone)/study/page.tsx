"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { NotebookInterface } from "../../study/NotebookInterface";
import ProjectService from "../../lib/utils/projectService";
import { useUser } from "../../lib/utils/useUser";
import { Loader2 } from "lucide-react";

export default function StudyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramProjectId = searchParams.get("projectId");
  const { user, loading: userLoading } = useUser();
  const [projectId, setProjectId] = useState<string | null>(paramProjectId);
  const [projectTitle, setProjectTitle] = useState("");
  // Only show loading if we are fetching project or waiting for user
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth is still loading, wait
    if (userLoading) return;

    // If auth loaded but no user, stop loading (will show empty state or could redirect)
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setLoading(true);

        // Get project title from URL param if available
        const titleParam = searchParams.get("projectTitle");

        // If we have both ID and title from URL, use them directly
        if (paramProjectId && titleParam) {
          setProjectId(paramProjectId);
          setProjectTitle(decodeURIComponent(titleParam));
        } else if (paramProjectId) {
          // If we only have ID, try to fetch the project (legacy behavior)
          console.log("Fetching project with ID:", paramProjectId);
          try {
            const project = await ProjectService.getProjectById(
              paramProjectId,
              user.id,
            );
            console.log("Fetched project:", project);
            setProjectId(project.id);
            setProjectTitle(project.title || "Untitled Project");
          } catch (fetchError) {
            console.error(
              "Failed to fetch project, using fallback title:",
              fetchError,
            );
            // If fetch fails, still set the projectId but use a fallback title
            setProjectId(paramProjectId);
            setProjectTitle("Research Guide");
          }
        } else {
          // Otherwise, fetch recent projects and use the first one
          const projects = await ProjectService.getUserProjects(user.id);
          if (projects && projects.length > 0) {
            // Sort by updated_at desc just to be safe
            const sorted = projects.sort(
              (a: any, b: any) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime(),
            );
            setProjectId(sorted[0].id);
            setProjectTitle(sorted[0].title || "Untitled Project");
          }
        }
      } catch (err) {
        console.error("Failed to load project for guide", err);
        // Set a fallback title if fetch fails
        setProjectTitle("Research Guide");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, userLoading, paramProjectId, searchParams]);

  if (loading || userLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>
          No Notebooks found. Please create a Notebook to use the Research
          Guide.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-white overflow-hidden">
      <NotebookInterface
        projectTitle={projectTitle}
        projectId={projectId}
        initialMessage={searchParams.get("initialMessage") || undefined}
        onBack={() => router.back()}
      />
    </div>
  );
}
