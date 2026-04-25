"use client";

import React, { useState } from "react";
import { Layout, Settings, Plus } from "lucide-react";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";
import { StudioGrid } from "./StudioGrid";
import { StudioNoteView } from "./StudioNoteView";
import { StudioMindMapView } from "./StudioMindMapView";
import { StudioFlashcardView } from "./StudioFlashcardView";
import { StudioQuizView } from "./StudioQuizView";
import { StudioDataTableView } from "./StudioDataTableView";
import { StudioInfographicView } from "./StudioInfographicView";
import { SlideDeckView } from "./SlideDeckView";
import { StudioAudioPlayer } from "./StudioAudioPlayer";
import { StudioItem, AudioPlayerState } from "./types";
import {
  FileText,
  Sparkles,
  Network,
  Hash,
  HelpCircle,
  Table,
  Layout as LayoutIcon,
  BarChart3,
  Presentation,
} from "lucide-react";

// Helper to format JSON content to Markdown
const formatContent = (type: string, data: any) => {
  if (!data) return "";
  if (typeof data === "string") return data;

  if (type === "flashcards") {
    return ((data as any[]) || [])
      .map(
        (card: any, i: number) =>
          `### Card ${i + 1}\n**Front:** ${card.front}\n\n**Back:** ${card.back}\n---`,
      )
      .join("\n");
  }
  if (type === "quiz") {
    return ((data as any[]) || [])
      .map(
        (q: any, i: number) =>
          `### Question ${i + 1}\n${q.question}\n\n${(q.options || []).map((o: string, idx: number) => `* [ ] ${o}`).join("\n")}\n\n<details><summary>Reveal Answer</summary>\nAnswer: ${q.options?.[q.correctAnswer]} \n\n${q.explanation}\n</details>`,
      )
      .join("\n\n");
  }
  if (type === "reports") {
    const report = data as any;
    return (
      `# ${report.title || "Executive Summary"}\n\n` +
      (report.sections || [])
        .map((s: any) => `## ${s.heading}\n${s.content}`)
        .join("\n\n")
    );
  }
  if (type === "data_table") {
    const table = data as any;
    const headers = (table.columns || []).join(" | ");
    const separator = (table.columns || []).map(() => "---").join(" | ");
    const rows = (table.rows || []).map((r: any[]) => r.join(" | ")).join("\n");
    return `| ${headers} |\n| ${separator} |\n${rows}`;
  }
  return JSON.stringify(data, null, 2);
};
import { AudioSettingsModal } from "./AudioSettingsModal";
import { ResearchService } from "../../../lib/utils/researchService";
import { NoteService } from "../../../lib/utils/noteService";

interface StudioSidebarProps {
  width: number;
  isCollapsed: boolean;
  onCollapse: () => void;
  projectId: string | null;
  projectTitle?: string;
  onAiQuery?: (query: string) => void;
  onAddNote?: () => void;
}

export function StudioSidebar({
  width,
  isCollapsed,
  onCollapse,
  projectId,
  projectTitle = "Research",
  onAiQuery,
  onAddNote,
}: StudioSidebarProps) {
  // Studio State
  const [activeStudioItem, setActiveStudioItem] = useState<StudioItem | null>(
    null,
  );
  const [showSettings, setShowSettings] = useState(false);
  const [audioSettings, setAudioSettings] = useState<
    { tone: string; length: string } | undefined
  >(undefined);
  const [audioPlayerState, setAudioPlayerState] = useState<AudioPlayerState>({
    isOpen: false,
    isPlaying: false,
    progress: 0,
    title: "",
    audioUrl: "",
  });

  const [savedNotes, setSavedNotes] = useState<StudioItem[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [isNoteFullscreen, setIsNoteFullscreen] = useState(false);

  // Polling for Audio Status
  React.useEffect(() => {
    // Enhanced validation: check for null, undefined, and empty strings
    if (
      !projectId ||
      typeof projectId !== "string" ||
      projectId.trim() === ""
    ) {
      console.warn("StudioSidebar: Invalid projectId, skipping fetch");
      return;
    }

    let pollInterval: NodeJS.Timeout;

    const fetchStudioItems = async () => {
      try {
        setIsLoadingNotes(true);
        const items: StudioItem[] = [];

        // 1. Get Research Guide (Lit Review)
        try {
          // Check if analysis exists (we use getResearchGuide as a proxy)
          const guide = await ResearchService.getResearchGuide(projectId);
          if (guide && guide.summary) {
            // Format rich markdown content
            let content = guide.summary + "\n\n### Key Research Topics\n";
            if (guide.topics && Array.isArray(guide.topics)) {
              content += guide.topics.map((t: string) => `• ${t}`).join("\n");
            }
            content += "\n\n### Future Research Questions\n";
            if (guide.questions && Array.isArray(guide.questions)) {
              content += guide.questions
                .map((q: string) => `• ${q}`)
                .join("\n");
            }

            items.push({
              id: "guide-1",
              type: "note",
              title: "Research Guide & Literature Review",
              time: "Just now",
              icon: FileText,
              sourceCount: guide.sourcesUsed || 0,
              content: content,
            });

            if (guide.reports)
              items.push({
                id: "report-1",
                type: "report" as any,
                title: "Executive Report",
                time: "Ready",
                icon: LayoutIcon,
                badge: "Beta",
                content: formatContent("reports", guide.reports),
              });
            if (guide.flashcards)
              items.push({
                id: "flash-1",
                type: "flashcards",
                title: "Study Flashcards",
                time: "Ready",
                icon: Hash,
                content: formatContent("flashcards", guide.flashcards),
              });
            if (guide.quiz)
              items.push({
                id: "quiz-1",
                type: "quiz",
                title: "Practice Quiz",
                time: "Ready",
                icon: HelpCircle,
                content: formatContent("quiz", guide.quiz),
              });
            if (guide.data_table)
              items.push({
                id: "table-1",
                type: "data_table",
                title: "Research Data Table",
                time: "Ready",
                icon: Table,
                badge: "Beta",
                content: formatContent("data_table", guide.data_table),
              });
          }
        } catch (e) {
          // No guide yet
        }

        // 2. Get Concept Map
        try {
          const mapData = await ResearchService.getConceptMap("", projectId);
          if (mapData && mapData.data) {
            items.push({
              id: "map-1",
              type: "mind_map",
              title: mapData.data.label || "Concept Map",
              time: "Ready",
              icon: Network,
              content: mapData.data, // This contains the full tree
            });
          }
        } catch (e) {
          // No map yet
        }

        // 3. Get Audio Status
        try {
          const audioStatus = await ResearchService.getAudioStatus(projectId);
          if (
            audioStatus.status === "processing" ||
            audioStatus.status === "pending"
          ) {
            items.push({
              id: "audio-generating",
              type: "audio",
              title: "Generating Audio Overview...",
              time: "Processing",
              icon: Sparkles,
              badge: "New",
              content: "AI is generating your podcast...",
            });
            // Start Polling if not already polling
            if (!pollInterval) {
              pollInterval = setInterval(fetchStudioItems, 5000); // Poll every 5s
            }
          } else if (audioStatus.status === "completed") {
            items.push({
              id: "audio-1",
              type: "audio",
              title: audioStatus.title || "Audio Overview",
              time: "Ready",
              icon: Sparkles,
              badge: "Interactive",
              audioUrl: audioStatus.audioUrl,
            });
            // Stop polling if completed
            if (pollInterval) clearInterval(pollInterval);
          } else if (audioStatus.status === "failed") {
            items.push({
              id: "audio-failed",
              type: "audio",
              title: "Audio Generation Failed",
              time: "Error",
              icon: Sparkles,
              content: "Click to retry",
            });
          }
        } catch (e) {
          // No audio yet
        }

        // 4. Fetch Saved Notes (Sync with NotebookPanel)
        try {
          const notes = await NoteService.getNotes(projectId);

          const getIcon = (cat: string) => {
            switch (cat) {
              case "audio":
                return Sparkles;
              case "lit_review":
                return FileText;
              case "mind_map":
                return Network;
              case "report":
                return LayoutIcon;
              case "flashcards":
                return Hash;
              case "quiz":
                return HelpCircle;
              case "data_table":
                return Table;
              case "infographic":
                return BarChart3;
              case "slide_deck":
                return Presentation;
              default:
                return FileText;
            }
          };

          const mappedNotes: StudioItem[] = notes.map((n) => ({
            id: n.id,
            type: n.category === "manual" ? "note" : (n.category as any),
            title: n.title,
            time: new Date(n.updated_at).toLocaleDateString(),
            icon: getIcon(n.category),
            content: n.content,
            audioUrl: (n.metadata as any)?.audioUrl,
            badge: n.category === "manual" ? "Manual" : "Saved",
          }));

          // Deduplication: Avoid showing virtual items if Note exists?
          // For now, we append. User wants to see "Saved to note" items.
          items.push(...mappedNotes);
        } catch (e) {
          console.error("Failed to fetch notes", e);
        }

        setSavedNotes(items);
      } catch (error) {
        console.error("Failed to fetch studio items", error);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    fetchStudioItems();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [projectId]);

  const handleDeleteNote = async (id: string) => {
    // Prevent deletion of virtual/generated notes that don't exist in database
    const virtualNoteIds = ["guide-1", "report-1", "audio-1"];
    if (virtualNoteIds.includes(id)) {
      alert(
        "This is a generated note and cannot be deleted. It will be updated when you regenerate your research guide.",
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await NoteService.deleteNote(id);
      setSavedNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e: any) {
      console.error("Failed to delete note", e);

      // If note not found (404), remove it from UI anyway since it doesn't exist
      if (e.response?.status === 404) {
        setSavedNotes((prev) => prev.filter((n) => n.id !== id));
        alert("Note was already deleted. Refreshing list...");
      } else {
        alert("Failed to delete note");
      }
    }
  };

  const handleRenameNote = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Rename note", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    try {
      await NoteService.updateNote(id, { title: newTitle });
      setSavedNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, title: newTitle } : n)),
      );
    } catch (e) {
      console.error("Failed to rename", e);
      alert("Failed to rename note");
    }
  };

  const handleDownloadNote = (item: StudioItem) => {
    const blob = new Blob([item.content || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStudioItemClick = (item: StudioItem) => {
    // Prevent opening processing items
    if (
      item.id.includes("generating") ||
      item.time === "Processing" ||
      item.time === "Error"
    )
      return;

    if (item.type === "audio") {
      if (item.audioUrl) {
        setAudioPlayerState({
          isOpen: true,
          isPlaying: true,
          progress: 0,
          title: item.title,
          audioUrl: item.audioUrl,
        });
      }
    } else {
      setActiveStudioItem(item);
    }
  };

  const handleGenerateAudio = async (settings: {
    tone: string;
    length: string;
  }) => {
    if (
      !projectId ||
      typeof projectId !== "string" ||
      projectId.trim() === ""
    ) {
      console.error("Invalid projectId in handleGenerateAudio");
      return;
    }
    setAudioSettings(settings); // Close modal
    setShowSettings(false);

    // Optimistic Update
    setSavedNotes((prev) => [
      {
        id: "audio-generating",
        type: "audio",
        title: "Generating Audio Overview...",
        time: "Just started",
        icon: Sparkles,
        badge: "New",
        content: "AI is generating your podcast...",
      },
      ...prev.filter((i) => i.id !== "audio-1" && i.id !== "audio-failed"),
    ]);

    try {
      await ResearchService.generateAudioOverview(projectId, settings);
      // Polling in useEffect will pick it up
    } catch (e) {
      console.error("Generation failed", e);
      // Revert or show error? Polling will fix it.
    }
  };

  const handleLitReviewClick = async () => {
    if (
      !projectId ||
      typeof projectId !== "string" ||
      projectId.trim() === ""
    ) {
      console.error("Invalid projectId in handleLitReviewClick");
      return;
    }
    // Check if already exists
    const existing = savedNotes.find((n) => n.id === "guide-1");

    // If exists and is valid (not empty state), open it.
    // If it says "No sources found", we re-try in case user added sources.
    if (existing && !existing.content?.includes("No sources found")) {
      setActiveStudioItem(existing);
      return;
    }

    // Generate
    try {
      setIsLoadingNotes(true);
      setLoadingActions((prev) => new Set([...prev, "lit_review"]));

      // Add temporary item
      setSavedNotes((prev) => [
        {
          id: "guide-generating",
          type: "note",
          title: "Generating Lit Review...",
          time: "Processing",
          icon: FileText,
          content: "Analyzing your papers and chat history...",
        },
        ...prev,
      ]);

      // Force re-fetch or generate
      const guide = await ResearchService.getResearchGuide(projectId);
      let content = guide.summary + "\n\n### Key Research Topics\n";
      if (guide.topics)
        content += guide.topics.map((t: string) => `• ${t}`).join("\n");
      content += "\n\n### Future Research Questions\n";
      if (guide.questions)
        content += guide.questions.map((q: string) => `• ${q}`).join("\n");

      const newItem: StudioItem = {
        id: "guide-1",
        type: "note",
        title: "Research Guide & Literature Review",
        time: "Just now",
        icon: FileText,
        sourceCount: guide.sourcesUsed || 0,
        content: content,
      };

      setSavedNotes((prev) => [
        newItem,
        ...prev.filter((n) => n.id !== "guide-generating"),
      ]);
    } catch (e) {
      console.error("Lit Review Generation Failed", e);
      setSavedNotes((prev) => prev.filter((n) => n.id !== "guide-generating"));
      // Show error toast ideally
    } finally {
      setIsLoadingNotes(false);
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete("lit_review");
        return newSet;
      });
    }
  };

  const handleMindMapClick = async () => {
    if (
      !projectId ||
      typeof projectId !== "string" ||
      projectId.trim() === ""
    ) {
      console.error("Invalid projectId in handleMindMapClick");
      return;
    }

    // Set loading state
    setLoadingActions((prev) => new Set([...prev, "mind_map"]));

    // Optimistic Update
    setSavedNotes((prev) => [
      {
        id: "map-generating",
        type: "mind_map",
        title: "Generating Mind Map...",
        time: "Processing",
        icon: Network,
        content: "Visualizing research concepts...",
      },
      ...prev,
    ]);

    try {
      const query = projectTitle || "Research Topic";
      const mapData = await ResearchService.getConceptMap(query, projectId);

      const newItem: StudioItem = {
        id: `map-${Date.now()}`,
        type: "mind_map",
        title: `Mind Map: ${query}`,
        time: "Just now",
        icon: Network,
        content: JSON.stringify(mapData),
      };

      setSavedNotes((prev) => [
        newItem,
        ...prev.filter((n) => n.id !== "map-generating"),
      ]);
      // Do not auto open
    } catch (e) {
      console.error("Mind Map Generation Failed", e);
      setSavedNotes((prev) => prev.filter((n) => n.id !== "map-generating"));
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete("mind_map");
        return newSet;
      });
    }
  };

  /* GENERIC HANDLER for Beta Features */
  const handleGenericStudioItem = async (
    type: string,
    title: string,
    icon: any,
  ) => {
    if (
      !projectId ||
      typeof projectId !== "string" ||
      projectId.trim() === ""
    ) {
      console.error("Invalid projectId in handleGenericStudioItem");
      return;
    }
    const id = `${type}-generating`;

    // Check exist
    const exist = savedNotes.find(
      (n) => n.type === type && !n.id.includes("generating"),
    );
    if (exist) {
      setActiveStudioItem(exist);
      return;
    }

    // Set loading state for action card
    setLoadingActions((prev) => new Set([...prev, type]));

    setSavedNotes((prev) => [
      {
        id,
        type: type as any,
        title: `Generating ${title}...`,
        time: "Processing",
        icon,
        content: "Generating content with AI...",
      },
      ...prev,
    ]);

    try {
      const res = await ResearchService.generateStudioItem(projectId, type);
      if (res && res.data) {
        const newItem: StudioItem = {
          id: `${type}-${Date.now()}`,
          type: type as any,
          title,
          time: "Just now",
          icon,
          content: formatContent(type, res.data),
        };
        setSavedNotes((prev) => [newItem, ...prev.filter((n) => n.id !== id)]);
      }
    } catch (e) {
      console.error(`Failed to generate ${type}`, e);
      setSavedNotes((prev) => prev.filter((n) => n.id !== id));
    } finally {
      // Remove loading state for action card
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(type);
        return newSet;
      });
    }
  };

  return (
    <aside
      style={{ width: isCollapsed ? 0 : width }}
      className={cn(
        "border-l border-gray-100 bg-white flex flex-col shrink-0 transition-[width] duration-300 ease-in-out relative group",
        isCollapsed && "border-l-0 overflow-hidden",
      )}>
      {!activeStudioItem && (
        <div className="p-4 border-b border-gray-100 flex items-center justify-between min-w-[240px]">
          <h2 className="font-semibold text-[10px] uppercase tracking-[0.15em] text-gray-400">
            Studio
          </h2>
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="h-6 w-6 text-gray-400 hover:text-indigo-600 transition-colors">
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapse}
              className="h-6 w-6 text-gray-400 hover:text-indigo-600 transition-colors">
              <Layout className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {activeStudioItem ? (
        activeStudioItem.type === "mind_map" ? (
          <div
            className={
              isNoteFullscreen
                ? "fixed inset-0 z-50 bg-white w-screen h-screen"
                : "h-full"
            }>
            <StudioMindMapView
              item={activeStudioItem}
              onBack={() => {
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                else setActiveStudioItem(null);
              }}
              onNodeClick={(label) => {
                if (onAiQuery) {
                  onAiQuery(
                    `Discuss what these sources say about "${label}", in the larger context of "${projectTitle}".`,
                  );
                }
              }}
              onToggleFullscreen={() => setIsNoteFullscreen(!isNoteFullscreen)}
              isFullscreen={isNoteFullscreen}
              onDelete={(id) => {
                setSavedNotes((prev) => prev.filter((n) => n.id !== id));
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                setActiveStudioItem(null);
              }}
            />
          </div>
        ) : activeStudioItem.type === "flashcards" ? (
          <div
            className={
              isNoteFullscreen
                ? "fixed inset-0 z-50 bg-white w-screen h-screen"
                : "h-full"
            }>
            <StudioFlashcardView
              item={activeStudioItem}
              onBack={() => {
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                else setActiveStudioItem(null);
              }}
              onToggleFullscreen={() => setIsNoteFullscreen(!isNoteFullscreen)}
              isFullscreen={isNoteFullscreen}
              onDelete={(id) => {
                setSavedNotes((prev) => prev.filter((n) => n.id !== id));
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                setActiveStudioItem(null);
              }}
            />
          </div>
        ) : activeStudioItem.type === "quiz" ? (
          <div
            className={
              isNoteFullscreen
                ? "fixed inset-0 z-50 bg-white w-screen h-screen"
                : "h-full"
            }>
            <StudioQuizView
              item={activeStudioItem}
              onBack={() => {
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                else setActiveStudioItem(null);
              }}
              onToggleFullscreen={() => setIsNoteFullscreen(!isNoteFullscreen)}
              isFullscreen={isNoteFullscreen}
              onDelete={(id) => {
                setSavedNotes((prev) => prev.filter((n) => n.id !== id));
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                setActiveStudioItem(null);
              }}
            />
          </div>
        ) : activeStudioItem.type === "data_table" ? (
          <div
            className={
              isNoteFullscreen
                ? "fixed inset-0 z-50 bg-white w-screen h-screen"
                : "h-full"
            }>
            <StudioDataTableView
              item={activeStudioItem}
              onBack={() => {
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                else setActiveStudioItem(null);
              }}
              onToggleFullscreen={() => setIsNoteFullscreen(!isNoteFullscreen)}
              isFullscreen={isNoteFullscreen}
              onDelete={(id) => {
                setSavedNotes((prev) => prev.filter((n) => n.id !== id));
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                setActiveStudioItem(null);
              }}
            />
          </div>
        ) : activeStudioItem.type === "infographic" ? (
          <div
            className={
              isNoteFullscreen
                ? "fixed inset-0 z-50 bg-white w-screen h-screen"
                : "h-full"
            }>
            <StudioInfographicView
              content={activeStudioItem.content || ""}
              item={activeStudioItem}
              onBack={() => {
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                else setActiveStudioItem(null);
              }}
              onToggleFullscreen={() => setIsNoteFullscreen(!isNoteFullscreen)}
              isFullscreen={isNoteFullscreen}
              onDelete={(id) => {
                setSavedNotes((prev) => prev.filter((n) => n.id !== id));
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                setActiveStudioItem(null);
              }}
              metadata={{
                createdAt: new Date(),
                sources: [],
                sections: [
                  "Statistical Boxes",
                  "Timeline",
                  "Methodology Chart",
                  "Key Takeaways",
                ],
              }}
            />
          </div>
        ) : activeStudioItem.type === "slide_deck" ? (
          <div
            className={
              isNoteFullscreen
                ? "fixed inset-0 z-50 bg-white w-screen h-screen"
                : "h-full"
            }>
            <SlideDeckView
              slides={
                Array.isArray(activeStudioItem.content)
                  ? activeStudioItem.content
                  : []
              }
              item={activeStudioItem}
              onBack={() => {
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                else setActiveStudioItem(null);
              }}
              onToggleFullscreen={() => setIsNoteFullscreen(!isNoteFullscreen)}
              isFullscreen={isNoteFullscreen}
              onDelete={(id) => {
                setSavedNotes((prev) => prev.filter((n) => n.id !== id));
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                setActiveStudioItem(null);
              }}
              metadata={{
                totalSlides: Array.isArray(activeStudioItem.content)
                  ? activeStudioItem.content.length
                  : 0,
                estimatedDuration: "8 min",
                sources: [],
              }}
            />
          </div>
        ) : (
          <div
            className={
              isNoteFullscreen
                ? "fixed inset-0 z-50 bg-white w-screen h-screen"
                : "h-full"
            }>
            <StudioNoteView
              item={activeStudioItem}
              onBack={() => {
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                else setActiveStudioItem(null);
              }}
              onDelete={(id) => {
                setSavedNotes((prev) => prev.filter((n) => n.id !== id));
                if (isNoteFullscreen) setIsNoteFullscreen(false);
                setActiveStudioItem(null);
              }}
              onToggleFullscreen={() => setIsNoteFullscreen(!isNoteFullscreen)}
              isFullscreen={isNoteFullscreen}
            />
          </div>
        )
      ) : (
        <React.Fragment>
          <StudioGrid
            notes={savedNotes}
            loadingActions={loadingActions}
            onItemClick={handleStudioItemClick}
            onActionClick={(action) => {
              if (action === "audio_overview") {
                setShowSettings(true);
              }
              if (action === "lit_review") {
                handleLitReviewClick();
              }
              if (action === "mind_map") {
                handleMindMapClick();
              }
              if (action === "reports")
                handleGenericStudioItem(
                  "reports",
                  "Executive Report",
                  LayoutIcon,
                );
              if (action === "flashcards")
                handleGenericStudioItem("flashcards", "Study Flashcards", Hash);
              if (action === "quiz")
                handleGenericStudioItem("quiz", "Practice Quiz", HelpCircle);
              if (action === "data_table")
                handleGenericStudioItem(
                  "data_table",
                  "Research Data Table",
                  Table,
                );
              if (action === "infographic")
                handleGenericStudioItem(
                  "infographic",
                  "Research Infographic",
                  BarChart3,
                );
              if (action === "slide_deck")
                handleGenericStudioItem(
                  "slide_deck",
                  "Slide Deck Presentation",
                  Presentation,
                );
            }}
            onDeleteNote={handleDeleteNote}
            onRenameNote={handleRenameNote}
            onDownloadNote={handleDownloadNote}
          />
        </React.Fragment>
      )}

      {/* Audio Settings Modal */}
      {showSettings && (
        <AudioSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          loading={false}
          onGenerate={handleGenerateAudio}
        />
      )}

      {/* Add Note Button or Audio Player (Only in Grid) */}
      {!activeStudioItem && (
        <div className="p-4 border-t border-gray-50 bg-white pb-safe">
          {audioPlayerState.isOpen ? (
            <StudioAudioPlayer
              state={audioPlayerState}
              onClose={() =>
                setAudioPlayerState((prev) => ({
                  ...prev,
                  isOpen: false,
                  isPlaying: false,
                }))
              }
              onTogglePlay={() =>
                setAudioPlayerState((prev) => ({
                  ...prev,
                  isPlaying: !prev.isPlaying,
                }))
              }
            />
          ) : (
            <Button
              onClick={onAddNote}
              className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-full h-11 gap-2 font-semibold shadow-sm transition-all hover:shadow-md">
              <Plus className="w-5 h-5" /> Add note
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
