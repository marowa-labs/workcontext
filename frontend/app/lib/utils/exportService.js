import { supabase } from "../supabase/client";

// API base URL - adjust this to match your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

console.log("API_BASE_URL from env:", process.env.NEXT_PUBLIC_API_URL);
console.log("API_BASE_URL final value:", API_BASE_URL);

console.log("API_BASE_URL:", API_BASE_URL); // Debug logging

class ExportService {
  // Get authentication token with enhanced error handling
  static async getAuthToken() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        return null;
      }

      if (!session) {
        console.log("No active session");
        return null;
      }

      // Check if token is about to expire (within 5 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at - currentTime < 300) {
        console.log("Token expiring soon, attempting to refresh...");
        // Try to refresh the session
        const { data: refreshedData, error: refreshError } =
          await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("Token refresh failed:", refreshError);
          return null;
        }
        return refreshedData.session?.access_token;
      }

      return session.access_token;
    } catch (error) {
      console.error("Exception in getAuthToken:", error);
      return null;
    }
  }

  // Export to Google Drive
  static async exportToGoogleDrive(projectId, options = {}) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append("projectId", projectId);
      params.append("format", options.format || "pdf");
      params.append(
        "includeCitations",
        options.includeCitations ? "true" : "false"
      );
      params.append(
        "includeComments",
        options.includeComments ? "true" : "false"
      );
      params.append("citationStyle", options.citationStyle || "apa");
      params.append("template", options.template || "academic");
      params.append("journalTemplate", options.journalTemplate || "");

      const fullUrl = `${API_BASE_URL}/api/projects/export/google-drive?${params.toString()}`;

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to export to Google Drive";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        // Show success message to user
        alert(`File successfully exported to Google Drive: ${data.message}`);
        // Optionally open the file in Google Drive
        if (data.url) {
          window.open(data.url, "_blank");
        }
        return { success: true };
      } else {
        throw new Error(data.message || "Failed to export to Google Drive");
      }
    } catch (error) {
      console.error("Google Drive export error:", error);
      throw error;
    }
  }

  // Export to OneDrive
  static async exportToOneDrive(projectId, options = {}) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append("projectId", projectId);
      params.append("format", options.format || "pdf");
      params.append(
        "includeCitations",
        options.includeCitations ? "true" : "false"
      );
      params.append(
        "includeComments",
        options.includeComments ? "true" : "false"
      );
      params.append("citationStyle", options.citationStyle || "apa");
      params.append("template", options.template || "academic");
      params.append("journalTemplate", options.journalTemplate || "");

      const fullUrl = `${API_BASE_URL}/api/projects/export/onedrive?${params.toString()}`;

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to export to OneDrive";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        // Show success message to user
        alert(`File successfully exported to OneDrive: ${data.message}`);
        // Optionally open the file in OneDrive
        if (data.url) {
          window.open(data.url, "_blank");
        }
        return { success: true };
      } else {
        throw new Error(data.message || "Failed to export to OneDrive");
      }
    } catch (error) {
      console.error("OneDrive export error:", error);
      throw error;
    }
  }

  // Export project
  static async exportProject(projectId, options = {}) {
    // Handle cloud storage exports with specific methods
    const format = options.format || "pdf";

    if (format === "google-drive") {
      return await this.exportToGoogleDrive(projectId, options);
    }

    if (format === "onedrive") {
      return await this.exportToOneDrive(projectId, options);
    }

    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Log the incoming parameters for debugging
      console.log("ExportService.exportProject called with:", {
        projectId,
        options,
        format: options.format,
        typeofFormat: typeof options.format,
      });

      // Build query parameters with proper encoding (using the same approach as exportProjectBlob)
      const params = new URLSearchParams();
      params.append("projectId", projectId);

      // Log before appending format
      console.log("Before appending format:", {
        format: options.format,
        formatExists: "format" in options,
        formatValue: options.format,
      });

      // Ensure format is correctly appended - this was the issue
      // Fixed: Properly extract format from options object
      params.append("format", format);

      // Log the format that will be sent
      console.log("Sending format parameter:", format);

      params.append(
        "includeCitations",
        options.includeCitations ? "true" : "false"
      );
      params.append(
        "includeComments",
        options.includeComments ? "true" : "false"
      );
      params.append("citationStyle", options.citationStyle || "apa");
      params.append("template", options.template || "academic");
      params.append("journalTemplate", options.journalTemplate || "");
      // Add document title if provided
      if (options.documentTitle) {
        params.append("documentTitle", options.documentTitle);
      }

      // Log the constructed parameters
      const paramEntries = [...params.entries()];
      console.log("Constructed URLSearchParams:", paramEntries);

      // Check if format parameter is in the params
      const hasFormat = paramEntries.some(([key, value]) => key === "format");
      console.log("Format parameter in params:", hasFormat);

      if (!hasFormat) {
        console.log(
          "WARNING: Format parameter is missing from URLSearchParams!"
        );
      }

      // Log each parameter individually
      paramEntries.forEach(([key, value], index) => {
        console.log(`Parameter ${index}: ${key} = ${value}`);
      });

      // Construct the full URL properly
      const baseUrl = `${API_BASE_URL}/api/projects/export`;
      const fullUrl = `${baseUrl}?${params.toString()}`;

      // Log the actual params string
      const paramsString = params.toString();
      console.log("Actual params string:", paramsString);

      console.log("ExportProject URL construction:", {
        API_BASE_URL,
        baseUrl,
        params: params.toString(),
        fullUrl,
      });

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: [...response.headers.entries()],
      });

      if (!response.ok) {
        let errorMessage = "Failed to export project";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      console.log("Content-Disposition header:", contentDisposition);

      // More robust filename extraction
      let filename = `${options.documentTitle || "export"}.${options.format || "pdf"}`; // Better default based on requested format and document title
      if (contentDisposition) {
        console.log("Attempting to parse Content-Disposition header");
        // Try different regex patterns to extract filename
        const patterns = [
          /filename\*=UTF-8''([^;]+)/, // RFC 5987 encoded filename
          /filename="([^"]+)"/, // Quoted filename
          /filename=([^;\s]+)/, // Unquoted filename
        ];

        for (const pattern of patterns) {
          const match = contentDisposition.match(pattern);
          if (match && match[1]) {
            filename = decodeURIComponent(match[1]);
            console.log(
              "Extracted filename using pattern:",
              pattern,
              "filename:",
              filename
            );
            break;
          }
        }

        // If all patterns fail, try to extract any filename-like string
        if (
          filename ===
          `${options.documentTitle || "export"}.${options.format || "pdf"}`
        ) {
          const simpleMatch = contentDisposition.match(
            /filename[^;]*=["']?([^"';]+)["']?/
          );
          if (simpleMatch && simpleMatch[1]) {
            filename = simpleMatch[1];
            console.log("Extracted filename using fallback pattern:", filename);
          }
        }
      } else {
        console.log("No Content-Disposition header found");
      }

      console.log("Final extracted filename:", filename);

      // Get the blob data
      const blob = await response.blob();

      // Special handling for Overleaf export
      if (format === "overleaf") {
        // For Overleaf export, we need to check if we received JSON with redirect information
        // or a direct LaTeX file

        // First, check the content type from the response
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          // We received JSON with redirect information
          const text = await blob.text();
          const overleafData = JSON.parse(text);

          if (overleafData.overleafUrl) {
            // Redirect user to Overleaf
            window.open(overleafData.overleafUrl, "_blank");
            return { success: true, filename: overleafData.title };
          }
        } else {
          // We received the LaTeX file directly
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Show instructions to user
          alert(
            "Your LaTeX file has been downloaded. Please go to Overleaf.com and upload this file to create a new project."
          );

          return { success: true, filename };
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error("Error exporting project:", error);
      throw error;
    }
  }

  // Export project and return blob (for preview or other uses)
  static async exportProjectBlob(projectId, options = {}) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Validate inputs
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      console.log("Export service called with:", { projectId, options });

      // Build query parameters with proper encoding
      const params = new URLSearchParams();
      params.append("projectId", projectId);
      params.append("format", options.format || "pdf");
      params.append(
        "includeCitations",
        options.includeCitations ? "true" : "false"
      );
      params.append(
        "includeComments",
        options.includeComments ? "true" : "false"
      );
      params.append("citationStyle", options.citationStyle || "apa");
      params.append("template", options.template || "academic");
      params.append("journalTemplate", options.journalTemplate || "");
      // Add document title if provided
      if (options.documentTitle) {
        params.append("documentTitle", options.documentTitle);
      }

      // Log the individual parameters
      console.log("URLSearchParams entries:", [...params.entries()]);

      // Construct the full URL properly
      const baseUrl = `${API_BASE_URL}/api/projects/export`;
      const fullUrl = `${baseUrl}?${params.toString()}`;

      // More detailed URL construction debugging
      console.log("Detailed URL construction:");
      console.log("  API_BASE_URL:", API_BASE_URL);
      console.log("  Base URL parts:", {
        origin:
          typeof window !== "undefined"
            ? window.location.origin
            : "server-side",
        baseUrl: baseUrl,
      });
      console.log("  Full URL before validation:", fullUrl);

      // Validate URL step by step
      try {
        console.log("Validating base URL...");
        const baseUrlObj = new URL(baseUrl);
        console.log("Base URL is valid:", baseUrlObj.toString());

        console.log("Validating full URL...");
        const urlObj = new URL(fullUrl);
        console.log("Full URL is valid:", urlObj.toString());
        console.log("Full URL components:", {
          href: urlObj.href,
          origin: urlObj.origin,
          pathname: urlObj.pathname,
          search: urlObj.search,
          searchParams: Object.fromEntries(urlObj.searchParams),
        });
      } catch (urlError) {
        console.error("Invalid URL constructed:", fullUrl, urlError);
        throw new Error(`Invalid URL constructed for export: ${fullUrl}`);
      }

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = `Export failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error("Export API error:", {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          url: fullUrl,
        });
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error("Error exporting project blob:", error);
      throw error;
    }
  }

  // Get export options
  static getExportOptions() {
    return {
      formats: [
        { value: "pdf", label: "PDF", description: "Print-ready document" },
        {
          value: "docx",
          label: "Microsoft Word",
          description: "Editable Word document",
        },
        {
          value: "txt",
          label: "Plain Text",
          description: "Simple text format",
        },
        {
          value: "latex",
          label: "LaTeX",
          description: "Scientific document format",
        },
        {
          value: "rtf",
          label: "Rich Text",
          description: "Formatted text with styling",
        },
        { value: "xlsx", label: "Excel", description: "Spreadsheet with data" },
        { value: "csv", label: "CSV", description: "Comma-separated values" },
        { value: "png", label: "Image", description: "Export as PNG image" },
        {
          value: "google-drive",
          label: "Google Drive",
          description: "Export to Google Drive",
        },
        {
          value: "onedrive",
          label: "OneDrive",
          description: "Export to Microsoft OneDrive",
        },
      ],
      citationStyles: [
        {
          value: "apa",
          label: "APA",
          description: "American Psychological Association",
        },
        {
          value: "mla",
          label: "MLA",
          description: "Modern Language Association",
        },
        {
          value: "chicago",
          label: "Chicago",
          description: "Chicago Manual of Style",
        },
      ],
      journalTemplates: [
        { value: "ieee", label: "IEEE", description: "IEEE journal format" },
        {
          value: "nature",
          label: "Nature",
          description: "Nature journal format",
        },
        {
          value: "science",
          label: "Science",
          description: "Science journal format",
        },
        {
          value: "apa-journal",
          label: "APA Journal",
          description: "APA journal format",
        },
      ],
      formattingOptions: [
        {
          value: "academic",
          label: "Academic Style",
          description: "Optimized for academic submissions",
        },
        {
          value: "publication",
          label: "Publication Ready",
          description: "Formatted for journal submissions",
        },
        {
          value: "presentation",
          label: "Presentation",
          description: "Optimized for slides or visuals",
        },
        {
          value: "custom",
          label: "Custom",
          description: "Apply your own formatting preferences",
        },
      ],
    };
  }
}

export default ExportService;
