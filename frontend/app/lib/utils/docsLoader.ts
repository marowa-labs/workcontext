// Utility functions for loading documentation content

// Function to load documentation content from markdown files
export const loadDocContent = async (docPath: string): Promise<string> => {
  try {
    // Fetch documentation content from the backend API
    const response = await fetch(`/api/docs/${docPath}`);

    if (!response.ok) {
      throw new Error(`Failed to load documentation: ${response.statusText}`);
    }

    // Get the content type from the response headers
    const contentType = response.headers.get("content-type");

    // If it's a direct markdown response, read it as text
    if (contentType && contentType.includes("text/markdown")) {
      return await response.text();
    }

    // Otherwise, parse the JSON response
    const data = await response.json();

    // If it's an error response
    if (!data.success) {
      throw new Error(data.message || "Failed to load documentation");
    }

    // Fallback to returning the raw data as string
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error loading documentation content:", error);
    return "# Error Loading Documentation\n\nFailed to load documentation content.";
  }
};

// Map of documentation paths to file locations
export const docPathMap: Record<string, string> = {
  // Frontend docs
  "how-to-use-plan-styling": "/frontend/docs/how-to-use-plan-styling.md",
  "ui-ux-style-contrast":
    "/frontend/docs/ui-ux-style-contrast-implementation.md",
  "ui-ux-upgrade-styling": "/frontend/docs/ui-ux-upgrade-styling-readme.md",

  // Backend docs
  "api-documentation": "/backend/docs/API_DOCUMENTATION.md",
  "citation-system": "/backend/docs/CITATION_SYSTEM.md",
  "citation-system-summary": "/backend/docs/CITATION_SYSTEM_SUMMARY.md",
  "realtime-collaboration": "/backend/docs/REALTIME_COLLABORATION.md",
  "supabase-secrets": "/backend/docs/SUPABASE_SECRETS.md",
  "integration-setup": "/backend/docs/integration-setup.md",
  "plagiarism-api-setup": "/backend/docs/plagiarism-api-setup.md",
};
