import fs from "fs";
import path from "path";

// Map of documentation paths to file locations
const docPathMap: Record<string, string> = {
  // Frontend docs (would be in frontend/docs if it existed)
  "how-to-use-plan-styling":
    "../../../frontend/docs/how-to-use-plan-styling.md",
  "ui-ux-style-contrast":
    "../../../frontend/docs/ui-ux-style-contrast-implementation.md",
  "ui-ux-upgrade-styling":
    "../../../frontend/docs/ui-ux-upgrade-styling-readme.md",

  // Backend docs
  "api-documentation": "../../../docs/API_DOCUMENTATION.md",
  "citation-system": "../../../docs/CITATION_SYSTEM.md",
  "citation-system-summary": "../../../docs/CITATION_SYSTEM_SUMMARY.md",
  "realtime-collaboration": "../../../docs/REALTIME_COLLABORATION.md",
  "supabase-secrets": "../../../docs/SUPABASE_SECRETS.md",
  "integration-setup": "../../../docs/integration-setup.md",
  "plagiarism-api-setup": "../../../docs/plagiarism-api-setup.md",
};

// Get documentation content by path
export async function GET(request: any) {
  try {
    const { docPath } = request.params;

    // Check if the requested docPath exists in our map
    if (!docPathMap[docPath]) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Documentation not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Resolve the file path
    const filePath = path.resolve(__dirname, docPathMap[docPath]);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Documentation file not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Read the file content
    const content = fs.readFileSync(filePath, "utf8");

    // Return the content directly as markdown
    return new Response(content, {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
