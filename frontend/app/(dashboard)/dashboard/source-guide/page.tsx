"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StudyDashboard } from "../../../study/StudyDashboard";
import ProjectService from "../../../lib/utils/projectService";
import { useUser } from "../../../lib/utils/useUser";
import { Loader2 } from "lucide-react";

export default function SourceGuidePage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const paramProjectId = searchParams.get("projectId");
  const [projectId, setProjectId] = useState<string | null>(paramProjectId);
  const [projectTitle, setProjectTitle] = useState("Research Guide");
  const [projectsList, setProjectsList] = useState<any[]>([]); // Store all projects
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // If we have a param ID, verify/fetch title
        // Always fetch user projects to populate the dropdown
        const projects = await ProjectService.getUserProjects(user.id);
        const sorted = projects
          ? projects.sort(
              (a: any, b: any) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime(),
            )
          : [];
        setProjectsList(sorted);

        // If we have a param ID, use it
        if (paramProjectId) {
          const current = sorted.find((p: any) => p.id === paramProjectId);
          if (current) {
            setProjectId(current.id);
            setProjectTitle(current.title);
          } else {
            // Fallback if param ID not found in user's projects (or fetch individual failure)
            // Actually safer to trust getProjectById if we wanted, but for dropdown we need list.
            // We'll stick to list for now.
            const project = await ProjectService.getProjectById(paramProjectId);
            setProjectId(project.id);
            setProjectTitle(project.title);
          }
        } else {
          // Default to most recent
          if (sorted.length > 0) {
            setProjectId(sorted[0].id);
            setProjectTitle(sorted[0].title);
          }
        }
      } catch (err) {
        console.error("Failed to load project for guide", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, paramProjectId]);

  if (loading) {
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
          No projects found. Please create a project to use the Research Guide.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <StudyDashboard
        projectId={projectId}
        projectTitle={projectTitle}
        projects={projectsList}
        // sourceCount will be fetched internally by StudyDashboard
      />
    </div>
  );
}
