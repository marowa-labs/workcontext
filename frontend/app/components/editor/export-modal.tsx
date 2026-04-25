"use client";

import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Download,
  FileText,
  FileIcon,
  File,
  Loader2,
  Lock,
  Cloud,
} from "lucide-react";
import ExportService from "../../lib/utils/exportService";
import BillingService from "../../lib/utils/billingService";
import { useBilling } from "../../contexts/BillingContext";
// Import project service to fetch project details
import ProjectService from "../../lib/utils/projectService";
import { useToast } from "../../hooks/use-toast";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  documentTitle: string;
  projectId: string;
}

type ExportFormat =
  | "pdf"
  | "docx"
  | "txt"
  | "tex"
  | "rtf"
  | "journal-pdf"
  | "journal-latex";

export function ExportModal({
  isOpen,
  onClose,
  editor,
  documentTitle,
  projectId,
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<"download">("download");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userPlan, setUserPlan] = useState<
    "free" | "onetime" | "student" | "researcher" | "institutional"
  >("free");
  const [loadingPlan, setLoadingPlan] = useState(true);
  // Add state for project template and citation style
  const [projectTemplate, setProjectTemplate] = useState<string | null>(null);
  const [projectCitationStyle, setProjectCitationStyle] = useState<
    string | null
  >(null);
  const [loadingProjectData, setLoadingProjectData] = useState(true);
  const { toast } = useToast();

  const { subscription } = useBilling();

  // Load project template and citation style
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId || !isOpen) return;

      try {
        setLoadingProjectData(true);

        // Try to get template and citation style from editor storage first
        if (editor?.storage) {
          const storage: any = editor.storage;
          if (storage.templateSections || storage.templateColors) {
            setProjectTemplate(
              storage.templateSections ? "custom" : "academic",
            );
          }

          if (storage.citationStyle) {
            setProjectCitationStyle(storage.citationStyle);
          }
        }

        // If not found in editor storage, fetch from backend
        if (!projectTemplate || !projectCitationStyle) {
          try {
            const projectData = await ProjectService.getProjectById(projectId);
            if (projectData) {
              // Set template if available
              if (projectData.template_id && !projectTemplate) {
                setProjectTemplate(projectData.template_id);
              }

              // Set citation style if available
              if (projectData.citation_style && !projectCitationStyle) {
                setProjectCitationStyle(projectData.citation_style);
              }
            }
          } catch (error) {
            console.warn("Could not fetch project data from backend:", error);
            // Continue with defaults if backend fetch fails
          }
        }
      } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        setLoadingProjectData(false);
      }
    };

    loadProjectData();
  }, [projectId, editor, isOpen, projectTemplate, projectCitationStyle]);

  // Determine user's plan and available formats
  useEffect(() => {
    const loadUserPlan = async () => {
      try {
        setLoadingPlan(true);
        // Get plan from billing context if available, otherwise fetch
        if (subscription?.plan?.id) {
          setUserPlan(subscription.plan.id as any);
        } else {
          const sub = await BillingService.getCurrentSubscription();
          setUserPlan((sub?.plan?.id as any) || "free");
        }
      } catch (error) {
        console.error("Error loading user plan:", error);
        setUserPlan("free");
      } finally {
        setLoadingPlan(false);
      }
    };

    if (isOpen) {
      loadUserPlan();
    }
  }, [isOpen, subscription]);

  // Define download formats available for each plan
  const getDownloadFormats = () => {
    const baseFormats = [
      {
        id: "pdf",
        label: "PDF Document",
        icon: <FileText className="h-5 w-5 text-red-500" />,
        ext: ".pdf",
      },
      {
        id: "docx",
        label: "Word Document",
        icon: <FileIcon className="h-5 w-5 text-blue-500" />,
        ext: ".docx",
      },
    ];

    const extendedFormats = [
      ...baseFormats,
      {
        id: "txt",
        label: "Plain Text",
        icon: <FileText className="h-5 w-5 text-black" />,
        ext: ".txt",
      },
      {
        id: "tex",
        label: "LaTeX Document",
        icon: <FileText className="h-5 w-5 text-blue-500" />,
        ext: ".tex",
      },
      {
        id: "rtf",
        label: "Rich Text Format",
        icon: <File className="h-5 w-5 text-purple-500" />,
        ext: ".rtf",
      },
    ];

    const allFormats = [
      ...extendedFormats,
      {
        id: "journal-pdf",
        label: "Journal-Ready PDF",
        icon: <FileText className="h-5 w-5 text-purple-500" />,
        ext: "-journal.pdf",
      },
      {
        id: "journal-latex",
        label: "Journal-Ready LaTeX",
        icon: <FileText className="h-5 w-5 text-green-500" />,
        ext: "-journal.tex",
      },
    ];

    switch (userPlan) {
      case "free":
        return baseFormats;
      case "onetime":
      case "student":
        return extendedFormats;
      case "researcher":
      case "institutional":
        return allFormats;
      default:
        return baseFormats;
    }
  };

  const handleExport = async () => {
    if (!editor) return;

    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is required for export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Handle direct download workflow
      if (activeTab === "download") {
        // Prepare export options for regular formats
        const options = {
          format: format, // Use the selected format directly
          includeHistory: includeHistory,
          includeCitations: true, // Include citations by default
          includeComments: true, // Include comments by default
          citationStyle: projectCitationStyle || "apa", // Default citation style
          template: projectTemplate || "academic", // Default template
          journalTemplate: format.startsWith("journal-") ? "academic" : "", // Apply journal template for journal formats
          isJournalFormat: format.startsWith("journal-"), // Flag to indicate journal format
          documentTitle: documentTitle || "export", // Pass document title for proper filename
        };

        // Use the real ExportService to export the document
        await ExportService.exportProject(projectId, options);
      }

      // Show success message
      toast({
        title: "Export Successful",
        description: `Document exported successfully as ${format}`,
      });
    } catch (error: any) {
      console.error("Export failed:", error);
      // Show error to user
      toast({
        title: "Export Failed",
        description: "Export failed: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  if (loadingPlan || loadingProjectData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-white rounded-lg border border-gray-300">
          <DialogHeader>
            <DialogTitle>Loading Export Options</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-lg border border-gray-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Download Tab */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}>
              {getDownloadFormats().map((f) => (
                <div
                  key={f.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 hover:bg-accent transition-colors">
                  <RadioGroupItem value={f.id} id={f.id} />
                  <Label
                    htmlFor={f.id}
                    className="flex items-center gap-3 flex-1 cursor-pointer">
                    {f.icon}
                    <span>{f.label}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {f.ext}
                    </span>
                  </Label>
                </div>
              ))}

              {/* Show locked formats for lower-tier users */}
              {userPlan === "free" && (
                <>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 bg-cw-light-gray opacity-75">
                    <RadioGroupItem value="tex" id="tex" disabled />
                    <Label
                      htmlFor="tex"
                      className="flex items-center gap-3 flex-1 cursor-not-allowed">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span>Plain Text</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        .txt
                      </span>
                      <Lock className="h-4 w-4 text-black" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 bg-cw-light-gray opacity-75">
                    <RadioGroupItem value="tex" id="tex" disabled />
                    <Label
                      htmlFor="tex"
                      className="flex items-center gap-3 flex-1 cursor-not-allowed">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span>LaTeX Document</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        .tex
                      </span>
                      <Lock className="h-4 w-4 text-black" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 bg-cw-light-gray opacity-75">
                    <RadioGroupItem value="rtf" id="rtf" disabled />
                    <Label
                      htmlFor="rtf"
                      className="flex items-center gap-3 flex-1 cursor-not-allowed"
                      title="Available with One-Time, Student, or higher plan">
                      <File className="h-5 w-5 text-purple-500" />
                      <span>Rich Text Format</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        .rtf
                      </span>
                      <Lock className="h-4 w-4 text-black" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 bg-cw-light-gray opacity-75">
                    <RadioGroupItem
                      value="journal-pdf"
                      id="journal-pdf"
                      disabled
                    />
                    <Label
                      htmlFor="journal-pdf"
                      className="flex items-center gap-3 flex-1 cursor-not-allowed"
                      title="Available with Researcher or Institutional plan">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <span>Journal-Ready PDF</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        -journal.pdf
                      </span>
                      <Lock className="h-4 w-4 text-black" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 bg-cw-light-gray opacity-75">
                    <RadioGroupItem
                      value="journal-latex"
                      id="journal-latex"
                      disabled
                    />
                    <Label
                      htmlFor="journal-latex"
                      className="flex items-center gap-3 flex-1 cursor-not-allowed"
                      title="Available with Researcher or Institutional plan">
                      <FileText className="h-5 w-5 text-green-500" />
                      <span>Journal-Ready LaTeX</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        -journal.tex
                      </span>
                      <Lock className="h-4 w-4 text-black" />
                    </Label>
                  </div>
                </>
              )}

              {(userPlan === "onetime" || userPlan === "student") && (
                <>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 bg-cw-light-gray opacity-75">
                    <RadioGroupItem
                      value="journal-pdf"
                      id="journal-pdf"
                      disabled
                    />
                    <Label
                      htmlFor="journal-pdf"
                      className="flex items-center gap-3 flex-1 cursor-not-allowed"
                      title="Available with Researcher or Institutional plan">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <span>Journal-Ready PDF</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        -journal.pdf
                      </span>
                      <Lock className="h-4 w-4 text-black" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 bg-cw-light-gray opacity-75">
                    <RadioGroupItem
                      value="journal-latex"
                      id="journal-latex"
                      disabled
                    />
                    <Label
                      htmlFor="journal-latex"
                      className="flex items-center gap-3 flex-1 cursor-not-allowed"
                      title="Available with Researcher or Institutional plan">
                      <FileText className="h-5 w-5 text-green-500" />
                      <span>Journal-Ready LaTeX</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        -journal.tex
                      </span>
                      <Lock className="h-4 w-4 text-black" />
                    </Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="history"
                  className="bg-cw-light-gray rounded-lg hover:bg-cw-light-gray/80 transition-colors cursor-pointer"
                  checked={includeHistory}
                  onCheckedChange={(c) => setIncludeHistory(!!c)}
                />
                <Label htmlFor="history" className="text-sm cursor-pointer">
                  Include version history
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-white text-black bg-gray-500 hover:bg-white rounded-lg transition-colors"
            onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
