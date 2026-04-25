import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./use-toast";

export interface PublicationExportOptions {
  format?: "pdf" | "docx";
  citationStyle?: "apa" | "mla" | "chicago";
  includeCoverPage?: boolean;
  coverPageStyle?: "apa" | "mla";
  includeTOC?: boolean;
  performStructuralAudit?: boolean;
  minWordCount?: number;
  metadata?: {
    author?: string;
    institution?: string;
    course?: string;
    instructor?: string;
    runningHead?: string;
  };
}

export interface PublicationExportResult {
  success: boolean;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  auditResults?: {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  };
  error?: string;
}

export interface DocumentAuditResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  wordCount: number;
  headingCount: number;
  hasTitle: boolean;
  hasBibliography: boolean;
}

export function usePublicationExport() {
  const { getAccessToken } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  const exportPublication = async (
    projectId: string,
    options: PublicationExportOptions = {}
  ): Promise<PublicationExportResult> => {
    setIsExporting(true);

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/publication/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            format: options.format || "docx",
            citationStyle: options.citationStyle || "apa",
            includeCoverPage: options.includeCoverPage !== false,
            coverPageStyle: options.coverPageStyle || "apa",
            includeTOC: options.includeTOC !== false,
            performStructuralAudit: options.performStructuralAudit !== false,
            minWordCount: options.minWordCount || 0,
            metadata: options.metadata || {},
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Handle the response (could be a download or JSON response)
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      let filename = "document.docx"; // default filename

      if (disposition && disposition.indexOf("attachment") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        filename,
        mimeType: response.headers.get("Content-Type") || undefined,
        fileSize: blob.size,
      };
    } catch (error: any) {
      console.error("Error exporting publication:", error);
      toast({
        title: "❌ Export Failed",
        description: "Failed to export document. Please try again.",
        variant: "destructive",
      });
      return {
        success: false,
        error: error.message || "Export failed",
      };
    } finally {
      setIsExporting(false);
    }
  };

  const auditDocument = async (
    projectId: string,
    minWordCount: number = 0
  ): Promise<DocumentAuditResult | null> => {
    setIsAuditing(true);

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/publication/audit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ projectId, minWordCount }),
        }
      );

      if (!response.ok) {
        throw new Error("Audit failed");
      }

      const data = await response.json();
      // The backend returns audit results in a different structure
      return {
        isValid: data.audit?.isValid || false,
        issues: data.audit?.issues || [],
        warnings: data.audit?.warnings || [],
        wordCount: data.audit?.stats?.wordCount || 0,
        headingCount: data.audit?.stats?.headingCount || 0,
        hasTitle: data.audit?.stats?.hasTitle || false,
        hasBibliography: false, // This field is not provided by the backend
      };
    } catch (error: any) {
      console.error("Error auditing document:", error);
      toast({
        title: "❌ Audit Failed",
        description: "Failed to audit document. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAuditing(false);
    }
  };

  return {
    exportPublication,
    auditDocument,
    isExporting,
    isAuditing,
  };
}
