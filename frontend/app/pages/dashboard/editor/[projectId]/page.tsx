"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { AIChatPanel } from "../../../../components/ai-chat/AIChat";
import { Button } from "../../../../components/ui/button";
import { X, FileText, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "../../../../lib/utils";
import ProjectService from "../../../../lib/utils/projectService";
import { useUser } from "../../../../lib/utils/useUser";
import { useToast } from "../../../../hooks/use-toast";
import { SourcesLibraryPanel } from "../SourcesLibraryPanel";
import AIResearchAssistant from "../../../../components/editor/AIResearchAssistant";
import ResearchInterface from "../../../../research/ResearchInterface";
import {
  MainEditor,
  MainEditorRef,
  SidebarPanel,
} from "../../../../components/editor/main-editor";
import PaperDetailsPanel from "../../../../research/PaperDetailsPanel";
import { ResearchSource } from "../../../../types/research";
import { EditorSidebar } from "../../../../components/editor/EditorSidebar";
import { NewProjectModal } from "../../../../components/dashboard/NewProjectModal"; // Import modal
import { ShareProjectDialog } from "../../../../components/dashboard/ShareProjectDialog";
import { ProjectJoinDialog } from "../../../../components/dashboard/ProjectJoinDialog";
import { StudyDashboard } from "../../../../study/StudyDashboard";
import { CitationAnalysisPanel } from "../../../../components/editor/SidebarRight/CitationAnalysisPanel";
import { LanguageCheckPanel } from "../../../../components/editor/SidebarRight/LanguageCheckPanel";
import { GapAnalysisPanel } from "../../../../components/editor/SidebarLeft/GapAnalysisPanel";
import { VerificationPanel } from "../../../../components/editor/SidebarRight/VerificationPanel";
import { PlagiarismPanel } from "../../../../components/editor/SidebarRight/PlagiarismPanel";
import { CitationsPanel } from "../../../../components/editor/SidebarRight/CitationsPanel";
import { SearchAlertsPanel } from "../../../../components/editor/SidebarLeft/SearchAlertsPanel";
import { LiteraturePanel } from "../../../../components/editor/SidebarLeft/LiteraturePanel";
import { ConceptMapPanel } from "../../../../components/editor/SidebarLeft/ConceptMapPanel";
import { DocumentOutlinePanel } from "../../../../components/editor/SidebarLeft/DocumentOutlinePanel";
import { TeamChat } from "../../../../components/dashboard/team/TeamChat";

// Define panel types
export type LeftPanelType =
  | "documents"
  | "outline"
  | "language"
  | "gap-analysis"
  | "verify"
  | "alerts"
  | "literature"
  | "concept-map"
  | "sources-library"
  | "research-assistant"
  | null;
export type RightPanelType =
  | "citations"
  | "ai-chat"
  | "team-chat"
  | "paper-search"
  | "citation-check"
  | "plagiarism-check"
  | null;

interface Project {
  id: string;
  name?: string;
  title?: string;
  [key: string]: any;
}

export default function EditorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const documentId = params?.projectId as string; // Now directly from [projectId] route
  const { user, loading: userLoading } = useUser();
  const userId = user?.id;
  const userEmail = user?.email || "";
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    documentId || null,
  );
  const [leftPanel, setLeftPanel] = useState<LeftPanelType>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  const [viewMode, setViewMode] = useState<"write" | "study" | "concept-map">(
    "write",
  );

  // Modal State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [isPendingJoin, setIsPendingJoin] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [selectedPaperData, setSelectedPaperData] =
    useState<ResearchSource | null>(null);

  // Resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(350);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // AI Chat Prompt State
  const [aiPrompt, setAiPrompt] = useState<string | undefined>(undefined);

  // Determine mode - Enhanced to support both workspace AND directly shared projects
  // Must be here before any conditional returns (Rules of Hooks)
  const isTeamProject = useMemo(() => {
    if (!project) return false;
    // Workspace project
    if (project.workspace_id) return true;
    // Directly shared project with collaborators
    if (project.collaborators && project.collaborators.length > 0) return true;
    // Link sharing enabled
    if (project.share_settings?.link_sharing_enabled) return true;
    return false;
  }, [project]);

  // Concept Map Handlers
  const handleSearchNode = (term: string) => {
    // Open paper search panel
    setRightPanel("paper-search");
    // Update URL to trigger search in ResearchInterface component if needed
    // Or we could pass a prop to ResearchInterface if we refactor it to accept external query
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("q", term);
    router.push(currentUrl.pathname + currentUrl.search);
  };

  const handleChatNode = (message: string) => {
    setAiPrompt(message);
    setRightPanel("ai-chat");
  };

  // Handle library detail view
  const handleViewLibraryDetail = (source: ResearchSource) => {
    setSelectedPaperData(source);
    setSelectedPaperId(source.id);
    setRightPanel("paper-search");
  };

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft.current) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setLeftPanelWidth(newWidth);
      }
      if (isDraggingRight.current) {
        const newWidth = Math.max(
          240,
          Math.min(800, window.innerWidth - e.clientX),
        );
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
      document.body.style.cursor = "default";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!documentId) {
        setError("No document ID provided");
        setLoading(false);
        return;
      }

      if (!userId) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use direct fetch by ID to ensure we get the full project metadata (including workspace_id)
        // irrespective of whether it's a personal project or a shared team project.
        console.log("Fetching project by ID:", documentId);
        const fetchedProject = await ProjectService.getProjectById(
          documentId,
          userId,
        );

        if (fetchedProject) {
          console.log("Project loaded:", fetchedProject);

          // Check if user needs to join via link (handshake)
          const isCollaborator = fetchedProject.collaborators?.some(
            (c: any) => c.user_id === userId,
          );
          const isOwner = fetchedProject.user_id === userId;
          const linkSharingEnabled =
            fetchedProject.share_settings?.link_sharing_enabled;

          if (!isOwner && !isCollaborator && linkSharingEnabled) {
            // Show handshake dialog for new link access
            setShowJoinDialog(true);
          }

          setProject(fetchedProject);
          setCurrentProjectId(documentId);
        } else {
          console.error("Project not found or access denied");
          setError(
            `Document not found or you don't have permission to view it.`,
          );
        }
      } catch (err: any) {
        console.error("Error fetching project:", err);
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    if (userId && documentId) {
      fetchProject();
    } else if (!userId) {
      setError("User not authenticated");
      setLoading(false);
    }
  }, [documentId, userId]);

  // Fetch user's projects
  const fetchUserProjects = useCallback(async () => {
    if (userId) {
      try {
        const userProjects = await ProjectService.getUserProjects(userId);
        setProjects(userProjects);
      } catch (err) {
        console.error("Error fetching user projects:", err);
        toast({
          title: "Error",
          description: "Failed to load your projects.",
          variant: "destructive",
        });
      }
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  const mainEditorRef = useRef<MainEditorRef>(null);

  const handleInsertContent = (content: string) => {
    if (mainEditorRef.current) {
      mainEditorRef.current.insertContent(content);
    }
  };

  // Switch to a different project
  const switchProject = (projectToSwitch: Project) => {
    setProject(null);
    router.push(`/editor/${projectToSwitch.id}`);
    setCurrentProjectId(projectToSwitch.id);
  };

  // Handle join confirmation from handshake dialog
  const handleJoinConfirm = async () => {
    setIsPendingJoin(true);
    try {
      // The backend auto-join already happened on first fetch
      // We just need to reload the project to get updated collaborator list
      const refreshedProject = await ProjectService.getProjectById(
        documentId,
        userId!,
      );
      setProject(refreshedProject);
      setShowJoinDialog(false);
      toast({
        title: "Joined Successfully",
        description: "You can now collaborate on this project.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to join project",
        variant: "destructive",
      });
    } finally {
      setIsPendingJoin(false);
    }
  };

  const handleJoinCancel = () => {
    router.push("/dashboard");
  };

  const toggleLeftPanel = (panel: LeftPanelType) => {
    setLeftPanel(leftPanel === panel ? null : panel);
  };

  const toggleRightPanel = (panel: RightPanelType) => {
    setRightPanel(rightPanel === panel ? null : panel);
  };

  const handleMainEditorPanelToggle = (panel: SidebarPanel) => {
    const rightPanels: string[] = [
      "citations",
      "ai-chat",
      "paper-search",
      "citation-check",
      "plagiarism-check",
    ];
    const leftPanels: string[] = ["language", "gap-analysis", "verify"];

    if (panel === null) {
      setRightPanel(null);
      return;
    }

    if (rightPanels.includes(panel)) {
      toggleRightPanel(panel as RightPanelType);
    } else if (leftPanels.includes(panel)) {
      toggleLeftPanel(panel as LeftPanelType);
    }
  };

  // Loading states
  if (userLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-400 via-gray-500 to-gray-400 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-white font-medium">Loading your editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You must be logged in to access this page.
          </p>
          <a
            href="/login"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 inline-block">
            Login
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200 max-w-md">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error Loading Document
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              Try Again
            </button>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading document...</p>
        </div>
      </div>
    );
  }

  const personalAllowedPanels: SidebarPanel[] = [
    "ai-chat",
    "citations",
    "paper-search",
    "citation-check",
    "language",
    "gap-analysis",
    "verify",
    "plagiarism-check",
    "writing",
    "my-documents",
    "outline",
    "alerts",
    "literature",
    "concept-map",
    // 'team-chat' explicitly excluded
  ];

  const teamAllowedPanels: SidebarPanel[] = [
    "ai-chat",
    "citations",
    "paper-search",
    "citation-check",
    "language",
    "gap-analysis",
    "verify",
    "plagiarism-check",
    "writing",
    "my-documents",
    "outline",
    "alerts",
    "literature",
    "concept-map",
    "team-chat", // Added for Team Projects
  ];

  const activeAllowedPanels = isTeamProject
    ? teamAllowedPanels
    : personalAllowedPanels;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Primary Sidebar */}
      <EditorSidebar
        allowedPanels={activeAllowedPanels as string[]}
        onNavigate={(id: string) => {
          if (id === "concept-map") {
            setViewMode("concept-map");
            setLeftPanel(null);
            setRightPanel(null);
          } else {
            setViewMode("write");
          }

          if (id === "my-documents") {
            setLeftPanel("documents");
          } else if (id === "outline") {
            setLeftPanel("outline");
          }

          if (id === "writing") {
            setRightPanel("ai-chat");
          }

          if (id === "team-chat") {
            setRightPanel("team-chat");
          }

          if (id === "citations") {
            setRightPanel("citation-check");
          }
          if (id === "language") {
            setLeftPanel("language");
          }
          if (id === "gap-analysis") {
            setLeftPanel("gap-analysis");
          }
          if (id === "verify") {
            setLeftPanel("verify");
          }
          if (id === "alerts") {
            setLeftPanel("alerts");
          }
          if (id === "literature") {
            setLeftPanel("literature");
          }
        }}
      />

      {/* Left Panel */}
      {leftPanel && (
        <div
          className="h-full bg-white border-r border-gray-200 flex flex-col relative"
          style={{ width: `${leftPanelWidth}px` }}>
          {/* Resize Handle */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50"
            onMouseDown={(e) => {
              isDraggingLeft.current = true;
              document.body.style.cursor = "col-resize";
            }}
          />
          {/* Panel Header - Only show for documents/library */}
          {(leftPanel === "documents" || leftPanel === "sources-library") && (
            <div className="flex items-center justify-between px-2 pt-2 border-b border-gray-200 bg-white">
              <div className="flex flex-1">
                <button
                  onClick={() => setLeftPanel("documents")}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors mb-[-1px] text-center justify-center whitespace-nowrap overflow-hidden text-ellipsis",
                    leftPanel === "documents"
                      ? "text-blue-600 border-blue-600 bg-white"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50",
                  )}>
                  Documents
                </button>
                <button
                  onClick={() => setLeftPanel("sources-library")}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors mb-[-1px] text-center justify-center whitespace-nowrap overflow-hidden text-ellipsis",
                    leftPanel === "sources-library"
                      ? "text-blue-600 border-blue-600 bg-white"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50",
                  )}>
                  Sources Library
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-gray-100"
                onClick={() => setLeftPanel(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {leftPanel === "documents" && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
                    My Projects
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsNewProjectModalOpen(true)}
                    title="New Document">
                    <Plus className="h-4 w-4 text-white" />
                  </Button>
                </div>
                <DocumentsPanel
                  projects={projects}
                  currentProjectId={currentProjectId}
                  onSelectProject={switchProject}
                />
              </div>
            )}
            {leftPanel === "sources-library" && (
              <div className="p-0 h-full">
                <SourcesLibraryPanel
                  onViewDetails={handleViewLibraryDetail}
                  onCite={(source) => {
                    // Insert citation into editor
                    if (editorInstance) {
                      // Format citation based on source data
                      const author = source.author || "Unknown";
                      const year = source.year || new Date().getFullYear();
                      const citationText = `(${author}, ${year})`;

                      // Insert at cursor position
                      editorInstance
                        .chain()
                        .focus()
                        .insertContent(citationText)
                        .run();

                      toast({
                        title: "Citation Added",
                        description: `Added citation for ${source.title}`,
                      });
                    } else {
                      toast({
                        title: "Error",
                        description: "Editor not available",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>
            )}
            {leftPanel === "research-assistant" && (
              <AIResearchAssistant
                isOpen={true}
                onClose={() => setLeftPanel(null)}
                isPanel={true}
                projectId={documentId}
                onInsertContent={handleInsertContent}
              />
            )}

            {leftPanel === "language" && (
              <LanguageCheckPanel editor={editorInstance} />
            )}
            {leftPanel === "gap-analysis" && (
              <GapAnalysisPanel
                editor={editorInstance}
                projectId={project?.id}
                documentTitle={project?.title}
              />
            )}
            {leftPanel === "verify" && (
              <VerificationPanel
                editor={editorInstance}
                projectId={project?.id}
                documentTitle={project?.title}
              />
            )}
            {leftPanel === "alerts" && (
              <div className="h-full overflow-x-hidden">
                <SearchAlertsPanel projectId={documentId} />
              </div>
            )}
            {leftPanel === "literature" && (
              <div className="h-full overflow-x-hidden">
                <LiteraturePanel
                  onOpenResearch={(query) => {
                    setRightPanel("paper-search");
                    if (query) {
                      // Update URL parameters safely
                      const currentUrl = new URL(window.location.href);
                      currentUrl.searchParams.set("q", query);
                      router.push(currentUrl.pathname + currentUrl.search);
                    }
                  }}
                  onOpenPaper={(paper) => {
                    handleViewLibraryDetail(paper);
                  }}
                />
              </div>
            )}
            {leftPanel === "outline" && (
              <div className="h-full overflow-x-hidden">
                <DocumentOutlinePanel
                  projectId={documentId}
                  onSyncToEditor={(sections) => {
                    // Convert sections to HTML and insert into editor
                    const generateHTML = (sections: any[]) => {
                      let html = "";
                      sections.forEach((section) => {
                        html += `<h${section.level}>${section.name}</h${section.level}>\n<p></p>\n`;
                        if (section.children && section.children.length > 0) {
                          section.children.forEach((child: any) => {
                            html += `<h${child.level}>${child.name}</h${child.level}>\n<p></p>\n`;
                          });
                        }
                      });
                      return html;
                    };

                    const outlineHTML = generateHTML(sections);
                    handleInsertContent(outlineHTML);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        isCreating={isCreatingProject}
        onConfirm={async (prompt, outlineType) => {
          try {
            setIsCreatingProject(true);

            // Determine initial content based on outline type
            let initialContent = "";
            if (outlineType === "standard") {
              initialContent = `<h1>${prompt || "Untitled Document"}</h1>
<h2>Introduction</h2>
<p>Enter your introduction here...</p>
<h2>Literature Review</h2>
<p>Synthesize existing research...</p>
<h2>Methodology</h2>
<p>Describe your methods...</p>
<h2>Results</h2>
<p>Present your findings...</p>
<h2>Discussion</h2>
<p>Interpret your results...</p>
<h2>Conclusion</h2>
<p>Summarize your findings...</p>`;
            } else if (outlineType === "smart") {
              // Mock smart generation for now - ideally call AIService here
              initialContent = `<h1>${prompt || "Untitled Document"}</h1>
<p><em>AI Generated Outline based on: "${prompt}"</em></p>
<h2>1. Overview</h2>
<p>...</p>
<h2>2. Context</h2>
<p>...</p>
<h2>3. Key Arguments</h2>
<p>...</p>`;
            } else {
              // Empty/No headings
              initialContent = prompt ? `<h1>${prompt}</h1><p></p>` : "";
            }

            // Create project
            const newProject = await ProjectService.createProject({
              userId,
              title: prompt || "Untitled Document",
              content: initialContent,
            });

            // Refresh and switch
            await fetchUserProjects();
            switchProject(newProject);
            setIsNewProjectModalOpen(false);

            toast({
              title: "Project Created",
              description: `Started new document: ${prompt || "Untitled"}`,
            });
          } catch (err: any) {
            console.error("Error creating project:", err);
            toast({
              title: "Error",
              description: "Failed to create project.",
              variant: "destructive",
            });
          } finally {
            setIsCreatingProject(false);
          }
        }}
      />

      {/* Left Panel Toggle Button */}
      {!leftPanel && (
        <button
          onClick={() => toggleLeftPanel("documents")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-md p-1.5 hover:bg-gray-50 shadow-sm"
          title="Show Documents">
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      )}

      {/* Center Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === "write" ? (
          project && documentId && user?.id ? (
            <MainEditor
              project={project}
              documentId={documentId}
              userId={user.id}
              userName={
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email ||
                "User"
              }
              ref={mainEditorRef}
              isCollaborative={isTeamProject}
              onShare={() => setIsShareDialogOpen(true)}
              allowedPanels={activeAllowedPanels}
              onEditorReady={(editor) => setEditorInstance(editor)}
              onOpenResearch={() => setLeftPanel("research-assistant")}
              activeRightPanel={rightPanel}
              onToggleRightPanel={handleMainEditorPanelToggle}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading document...</p>
              </div>
            </div>
          )
        ) : viewMode === "study" ? (
          <StudyDashboard
            projectId={project?.id || ""}
            projectTitle={project?.title || "Untitled Project"}
            sourceCount={12} // Mock for now, hook up to real source count later
          />
        ) : viewMode === "concept-map" ? (
          <ConceptMapPanel
            currentTitle={project?.title || "Research"}
            onSearchNode={handleSearchNode}
            onChatNode={handleChatNode}
          />
        ) : null}
      </div>

      {/* Right Panel Toggle Button */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        {!rightPanel && (
          <button
            onClick={() => toggleRightPanel("ai-chat")}
            className="bg-white border border-gray-200 rounded-l-md p-1.5 hover:bg-gray-50 shadow-sm"
            title="AI Assistant">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        )}

        {/* Scite / Citation Check Toggle */}
        {!rightPanel && (
          <button
            onClick={() => toggleRightPanel("citation-check")}
            className="bg-white border border-gray-200 rounded-l-md p-1.5 hover:bg-gray-50 shadow-sm"
            title="Smart Citation Check">
            <div className="relative">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-white"></div>
            </div>
          </button>
        )}
      </div>

      {/* Right Panel */}
      {rightPanel && (
        <div
          className="h-full bg-white border-l border-gray-200 flex flex-col relative"
          style={{ width: `${rightPanelWidth}px` }}>
          {/* Resize Handle */}
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50"
            onMouseDown={(e) => {
              isDraggingRight.current = true;
              document.body.style.cursor = "col-resize";
            }}
          />
          {/* Panel Header */}
          <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {rightPanel === "citations" && "Citations"}
              {rightPanel === "ai-chat" && "AI Assistant"}
              {rightPanel === "team-chat" && "Team Chat"}
              {rightPanel === "paper-search" &&
                (selectedPaperId ? "Paper Details" : "Paper Discovery")}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-gray-100"
              onClick={() => setRightPanel(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanel === "citations" && (
              <CitationsPanel
                projectId={documentId}
                documentTitle={project?.title || ""}
              />
            )}
            {rightPanel === "citation-check" && (
              <CitationAnalysisPanel
                editor={editorInstance}
                projectId={documentId}
              />
            )}
            {rightPanel === "plagiarism-check" && (
              <PlagiarismPanel
                editor={editorInstance}
                projectId={documentId}
                documentTitle={project?.title || ""}
              />
            )}
            {rightPanel === "ai-chat" && (
              <AIChatPanel
                isOpen={true}
                onClose={() => setRightPanel(null)}
                editor={editorInstance}
                aiMode={true}
                searchMode={false}
                projectId={documentId}
                user={{
                  id: userId!,
                  email: userEmail,
                  user_metadata: {
                    name: user.user_metadata?.name || userEmail,
                  },
                }}
                onSendPrompt={aiPrompt}
              />
            )}
            {rightPanel === "paper-search" && (
              <div className="h-full">
                {selectedPaperId ? (
                  <PaperDetailsPanel
                    paperId={selectedPaperId}
                    paperData={selectedPaperData}
                    isPanel={true}
                    onBack={() => {
                      setSelectedPaperId(null);
                      setSelectedPaperData(null);
                    }}
                  />
                ) : (
                  <ResearchInterface
                    isPanel={true}
                    onSelectPaper={(id) => setSelectedPaperId(id)}
                  />
                )}
              </div>
            )}
            {rightPanel === "team-chat" && (
              <TeamChat
                projectId={documentId}
                title="Project Chat"
                onClose={() => setRightPanel(null)}
              />
            )}
          </div>
        </div>
      )}
      {/* Share Dialog */}
      {project && (
        <ShareProjectDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          project={project}
          onUpdate={(updatedProject) => setProject(updatedProject)}
        />
      )}

      {/* Join Dialog */}
      {project && showJoinDialog && (
        <ProjectJoinDialog
          open={showJoinDialog}
          project={project}
          onConfirm={handleJoinConfirm}
          onCancel={handleJoinCancel}
          isLoading={isPendingJoin}
        />
      )}
    </div>
  );
}

// Documents Panel Component (Left)
const DocumentsPanel = ({
  projects,
  currentProjectId,
  onSelectProject,
}: {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (project: Project) => void;
}) => {
  return (
    <div className="space-y-1">
      {projects.length > 0 ? (
        projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
              currentProjectId === project.id
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-100",
            )}>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{project.title || project.name}</div>
                {project.updated_at && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))
      ) : (
        <p className="text-sm text-gray-500 text-center py-8">
          No documents found
        </p>
      )}
    </div>
  );
};
