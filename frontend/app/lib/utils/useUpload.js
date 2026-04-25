import * as React from "react";
import { supabase } from "../supabase/client";

function useUpload() {
  const [loading, setLoading] = React.useState(false);

  const searchUnsplashImages = React.useCallback(async (query, page = 1) => {
    try {
      // Use Unsplash API for real image search
      // This requires Unsplash Access Key in environment variables
      const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
      const UNSPLASH_API_URL = process.env.NEXT_PUBLIC_UNSPLASH_API_URL;

      if (!UNSPLASH_ACCESS_KEY || !UNSPLASH_API_URL) {
        console.warn("Unsplash API key or API URL not found");
        // Throw an error instead of returning mock data
        throw new Error(
          "Unsplash API not configured. Image search is unavailable."
        );
      }

      // Make request to Unsplash API
      const perPage = 20;
      const response = await fetch(
        `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(
          query
        )}&page=${page}&per_page=${perPage}&client_id=${UNSPLASH_ACCESS_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform Unsplash response to our format
      const results = data.results
        ? data.results.map((item) => ({
            id: item.id,
            url: item.urls.regular,
            thumb: item.urls.small,
            alt: item.alt_description || item.description || "Unsplash image",
            author: item.user?.name || "Unknown",
          }))
        : [];

      return {
        results,
        total: data.total || 0,
        page: page,
        pages: data.total_pages || 1,
      };
    } catch (error) {
      console.error("Error searching images:", error);
      // Propagate the error instead of falling back to mock data
      throw new Error(`Image search failed: ${error.message}`);
    }
  }, []);

  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      let response;
      if ("file" in input && input.file) {
        console.log("Uploading file:", input.file.name);
        // For file uploads, use the collaboration chat upload endpoint
        // which properly handles multipart form data
        const formData = new FormData();
        formData.append("file", input.file);

        // Get the authentication token from Supabase Auth
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        console.log("Auth token present:", !!token);

        // Create headers object
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        console.log(
          "Making request to /api/collaboration/upload with headers:",
          headers
        );

        // For multipart form data, we don't set Content-Type header
        // as the browser will set it correctly with the boundary
        response = await fetch("/api/collaboration/upload", {
          method: "POST",
          headers: headers,
          body: formData,
        });
        console.log("Upload response status:", response.status);
        console.log("Upload response headers:", [
          ...response.headers.entries(),
        ]);
      } else if ("url" in input) {
        console.log("Uploading from URL:", input.url);
        // Track the image download for analytics/compliance
        if (input.source) {
          try {
            // Get the authentication token from Supabase Auth
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Call our backend endpoint to track the image download
            await fetch("/api/collaboration/image-download", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : undefined,
              },
              body: JSON.stringify({
                imageUrl: input.url,
                source: input.source,
              }),
            });
          } catch (trackError) {
            console.warn("Failed to track image download:", trackError);
          }
        }

        // Get the authentication token from Supabase Auth
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        response = await fetch("/api/collaboration/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          body: JSON.stringify({ url: input.url }),
        });
      } else if ("base64" in input) {
        console.log("Uploading from base64 data");
        // Get the authentication token from Supabase Auth
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        response = await fetch("/api/collaboration/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          body: JSON.stringify({ base64: input.base64 }),
        });
      } else {
        throw new Error("Invalid input for upload function");
      }

      console.log("Response ok:", response.ok);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Upload failed with status:",
          response.status,
          "Response text:",
          errorText
        );
        if (response.status === 413) {
          throw new Error("Upload failed: File too large.");
        }
        throw new Error(
          `Upload failed with status ${response.status}: ${errorText}`
        );
      }
      const data = await response.json();
      console.log("Upload response data:", data);

      // For file uploads, the collaboration endpoint returns fileUrl
      // For other uploads, it returns url
      const url = data.fileUrl || data.url;
      console.log("Extracted URL:", url);

      return { url: url, mimeType: data.mimeType || null };
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading, searchUnsplashImages }];
}

export { useUpload };
export default useUpload;
