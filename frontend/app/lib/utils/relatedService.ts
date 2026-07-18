// Client service for the unified "Related Items" endpoint.
// Surfaces semantically related workspace items (projects, tasks) for a project.

export interface RelatedItem {
  id: string;
  type: "project" | "task" | "note";
  title: string;
  subtitle?: string;
  relevanceScore: number;
}

export async function getRelatedItems(
  projectId: string,
  workspaceId?: string | null,
  limit = 8,
): Promise<RelatedItem[]> {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  params.set("limit", String(limit));

  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/related?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error("Failed to load related items");
  }
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}
