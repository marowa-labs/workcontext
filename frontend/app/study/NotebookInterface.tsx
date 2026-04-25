"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Layout,
  Send,
  Save,
  Copy,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  FileText,
  Library,
  Network,
  Hash,
  HelpCircle,
  Table,
  BookOpen,
  Settings,
  BarChart3,
  Presentation,
  X,
  Trash2,
  Clock,
  Loader2,
  MessageSquare,
  MoreVertical,
  Pencil,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ResearchService } from "../lib/utils/researchService";
import { StudioSidebar } from "../components/study/studio/StudioSidebar";
import { AddSourcesModal } from "../components/study/AddSourcesModal";
import { Button } from "../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { cn } from "../lib/utils";
import { useRouter } from "next/navigation";
import { NoteService } from "../lib/utils/noteService";
import { AddNoteModal } from "../components/study/AddNoteModal";
import { useUser } from "../lib/utils/useUser";

interface NotebookInterfaceProps {
  projectTitle: string;
  projectId: string;
  initialMessage?: string;
  onBack: () => void;
}

export function NotebookInterface({
  projectTitle,
  projectId,
  initialMessage,
  onBack,
}: NotebookInterfaceProps) {
  const router = useRouter();
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(),
  );
  const [model, setModel] = useState("gemini-3.1-flash-lite-preview"); // Default model
  // Layout State & Resize Handlers (Keep existing)
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(350);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatHistoryList, setChatHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAddSourcesModal, setShowAddSourcesModal] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<
    "sources" | "chat" | "studio"
  >("chat");
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [hoveredSourceId, setHoveredSourceId] = useState<string | null>(null);
  const [chatSummary, setChatSummary] = useState<any | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const { user } = useUser();
  const userId = user?.id || "";

  // Resize Handlers

  // Resize Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      if (isResizing === "left") {
        const newWidth = Math.max(160, Math.min(480, e.clientX));
        setLeftWidth(newWidth);
        if (newWidth < 180) setIsLeftCollapsed(true);
        else if (isLeftCollapsed) setIsLeftCollapsed(false);
      } else if (isResizing === "right") {
        const newWidth = Math.max(
          200,
          Math.min(600, window.innerWidth - e.clientX),
        );
        setRightWidth(newWidth);
        if (newWidth < 220) setIsRightCollapsed(true);
        else if (isRightCollapsed) setIsRightCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, isLeftCollapsed, isRightCollapsed]);

  // Load history when popover opens
  useEffect(() => {
    if (historyOpen && projectId) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const sessions = await ResearchService.getChatSessions(projectId);
          setChatHistoryList(sessions);
        } catch (e) {
          console.error("Failed to load history", e);
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [historyOpen, projectId]);

  const handleLoadSession = async (sid: string) => {
    try {
      setChatLoading(true);
      const data = await ResearchService.getChatSession(sid);
      if (data && data.session) {
        setSessionId(data.session.id);
        setChatMessages(
          data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
        );
        setHistoryOpen(false);
      }
    } catch (e) {
      console.error("Failed to load session", e);
      alert("Failed to load chat session");
    } finally {
      setChatLoading(false);
    }
  };

  const [chatMessages, setChatMessages] = useState<any[]>([]);

  useEffect(() => {
    if (projectId) {
      fetchSources();
      fetchSession(projectId);
    }
  }, [projectId]);

  const hasSentInitialRef = React.useRef(false);

  // Auto-send initial message
  useEffect(() => {
    if (
      initialMessage &&
      !hasSentInitialRef.current &&
      !loading &&
      sources.length > 0
    ) {
      handleSendMessage(initialMessage);
      hasSentInitialRef.current = true;
    }
  }, [initialMessage, loading, sources]);

  const fetchSession = async (pid: string) => {
    try {
      const history = await ResearchService.getChatHistory(pid);
      if (history && history.session) {
        setSessionId(history.session.id);
        if (history.messages) {
          setChatMessages(
            history.messages.map((m: any) => ({
              role: m.role,
              content: m.content,
              createdAt: m.createdAt,
            })),
          );
        }
      }
    } catch (e) {
      console.error("Failed to load chat session", e);
    }
  };

  const fetchSources = async () => {
    try {
      let data;
      if (projectId) {
        // Fetch sources for this project from ProjectSource table
        data = await ResearchService.getProjectSources(projectId);
      } else {
        // Fallback to user's global library
        data = await ResearchService.getUserLibrary();
      }

      console.log("Fetched sources:", data);
      setSources(data || []);
      // Initially select all if any
      if (data && data.length > 0) {
        setSelectedSources(new Set(data.map((s: any) => s.id)));
      }
    } catch (error) {
      console.error("Failed to fetch sources", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate AI summary and suggested questions for selected sources
  const generateChatSummary = async () => {
    if (selectedSources.size === 0 || chatMessages.length > 0) return;

    setGeneratingSummary(true);
    try {
      const selectedSourceIds = Array.from(selectedSources);

      // Use the dedicated summarize endpoint that doesn't save to chat history
      const summaryData = await ResearchService.generateSourcesSummary(
        selectedSourceIds,
        projectId,
        model,
      );

      console.log("Raw summary data:", summaryData);

      // Clean the data to ensure no raw prompts or JSON appear in UI
      const cleanText = (text: string): string => {
        if (!text || typeof text !== 'string') return '';

        // Remove the prompt if AI echoed it back
        const promptPattern = /Based on the following sources[\s\S]*?Format your response[\s\S]*?fields\./i;
        let cleaned = text.replace(promptPattern, '');

        // Remove JSON wrapper if present
        cleaned = cleaned.replace(/\{\s*"summary"\s*:\s*"/g, '');
        cleaned = cleaned.replace(/"\s*,\s*"questions"\s*:\s*\[[\s\S]*\]\s*\}/g, '');
        cleaned = cleaned.replace(/^\s*\{|\}\s*$/g, '');

        // Remove escaped characters
        cleaned = cleaned.replace(/\\n/g, ' ');
        cleaned = cleaned.replace(/\\"/g, '"');
        cleaned = cleaned.replace(/\\/g, '');

        return cleaned.trim();
      };

      const cleanQuestion = (q: string): string => {
        if (!q || typeof q !== 'string') return '';
        return q.replace(/["\[\]{}\\]/g, '').replace(/^\s*\d+\.\s*/, '').trim();
      };

      const cleanedSummary = cleanText(summaryData.summary);
      const cleanedQuestions = (summaryData.questions || [])
        .map(cleanQuestion)
        .filter(q => q && !q.includes('Based on the following'));

      console.log("Cleaned summary:", cleanedSummary);
      console.log("Cleaned questions:", cleanedQuestions);

      setChatSummary({
        summary: cleanedSummary,
        questions: cleanedQuestions,
      });
    } catch (error) {
      console.error("Failed to generate chat summary:", error);
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Auto-generate summary when sources are selected and chat is empty
  useEffect(() => {
    if (selectedSources.size > 0 && chatMessages.length === 0 && !generatingSummary && !chatSummary) {
      generateChatSummary();
    }
  }, [selectedSources, chatMessages.length]);

  // Clear summary when chat messages change (new chat started)
  useEffect(() => {
    if (chatMessages.length > 0) {
      setChatSummary(null);
    }
  }, [chatMessages.length]);

  const handleSendMessage = async (overrideContent?: string) => {
    const contentToSend = overrideContent || chatInput;
    if (!contentToSend.trim() || chatLoading) return;

    const userMsg = { role: "user", content: contentToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!overrideContent) setChatInput(""); // Only clear input if typed
    setChatLoading(true);

    try {
      const selectedIds = Array.from(selectedSources);
      if (selectedIds.length === 0) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Please select at least one source to chat with.",
          },
        ]);
        setChatLoading(false);
        return;
      }

      // Prepare history for API (exclude current message as it is sent in query)
      const history = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await ResearchService.chatWithPapers(
        userMsg.content,
        selectedIds,
        history,
        projectId,
        sessionId,
        model,
      );

      // Handle response - update session if new
      if (res.sessionId && !sessionId) {
        setSessionId(res.sessionId);
      }

      const assistantMsg = {
        role: "assistant",
        content: typeof res === "string" ? res : res.data,
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error while processing your request.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleSource = (id: string) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedSources(newSelected);
  };

  const handleRemoveSource = async (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this source?")) return;
    try {
      await ResearchService.deleteSource(sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      setSelectedSources((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sourceId);
        return newSet;
      });
    } catch (error) {
      console.error("Failed to remove source:", error);
      alert("Failed to remove source");
    }
  };

  const handleRenameSource = async (source: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTitle = prompt("Rename source", source.title);
    if (!newTitle || newTitle === source.title) return;
    try {
      await ResearchService.updateSource(source.id, { title: newTitle });
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, title: newTitle } : s))
      );
    } catch (error) {
      console.error("Failed to rename source:", error);
      alert("Failed to rename source");
    }
  };

  const handleSaveToNote = async (content: string) => {
    if (!userId) {
      alert("User not authenticated. Please wait...");
      return;
    }
    try {
      await NoteService.createNote({
        userId: userId || "", // Fallback
        projectId: projectId,
        category: "manual",
        title: `AI Response - ${new Date().toLocaleTimeString()}`,
        content: content,
        tags: ["ai-chat", "saved-response"],
      });
      alert("Saved to notes!");
    } catch (e) {
      console.error("Failed to save AI response", e);
      alert("Failed to save note");
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB] text-gray-900 border-t border-gray-100 overflow-hidden">
      {/* Mobile Tab Navigation - Show only on mobile */}
      <div className="md:hidden border-b border-gray-200 bg-white">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setMobileActiveTab("sources")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              mobileActiveTab === "sources" ? "text-gray-900" : "text-gray-500",
            )}>
            Sources
            {mobileActiveTab === "sources" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
          <button
            onClick={() => setMobileActiveTab("chat")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              mobileActiveTab === "chat" ? "text-gray-900" : "text-gray-500",
            )}>
            Chat
            {mobileActiveTab === "chat" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
          <button
            onClick={() => setMobileActiveTab("studio")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              mobileActiveTab === "studio" ? "text-gray-900" : "text-gray-500",
            )}>
            Studio
            {mobileActiveTab === "studio" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop 3-column layout - Hidden on mobile */}
      <div
        className="hidden md:flex flex-1 overflow-hidden relative"
        style={{
          marginLeft: isLeftCollapsed ? "48px" : "0",
          marginRight: isRightCollapsed ? "48px" : "0",
          transition: "margin 300ms ease-in-out",
        }}>
        {/* Left Icon Bar (when collapsed) */}
        {isLeftCollapsed && (
          <div className="fixed left-0 top-0 bottom-0 z-20 w-12 bg-[#F3F4F6] border-r border-gray-200 flex flex-col items-center py-3 gap-2">
            {/* Library Icon */}
            <button
              onClick={() => setIsLeftCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-all text-gray-600 hover:text-indigo-600"
              title="Library">
              <Library className="w-5 h-5" />
            </button>

            {/* Add Source Icon */}
            <button
              onClick={() => setShowAddSourcesModal(true)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-all text-gray-400 hover:text-indigo-600"
              title="Add Sources">
              <Plus className="w-5 h-5" />
            </button>

            {/* Source Items */}
            <div className="flex-1 flex flex-col items-center gap-1 pt-2 border-t border-gray-300 w-full px-1.5 overflow-y-auto">
              {sources.slice(0, 8).map((source, idx) => (
                <button
                  key={source.id}
                  onClick={() => setIsLeftCollapsed(false)}
                  className="group relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-white transition-all"
                  title={source.title}>
                  <div className="w-6 h-6 bg-red-50 rounded flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-red-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Left Column: Sources */}
        {!isLeftCollapsed && (
          <aside
            style={{ width: leftWidth }}
            className="border-r border-gray-100 bg-white flex flex-col shrink-0 transition-[width] duration-300 ease-in-out relative group">
            <div className="p-4 border-b border-gray-100 flex flex-col gap-4 min-w-[200px]">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="h-8 w-8 text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2 overflow-hidden">
                  <h1 className="text-sm font-bold truncate text-gray-800">
                    {projectTitle}
                  </h1>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[10px] uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2">
                  Sources
                  <span className="bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded-full border border-gray-100">
                    {sources.length}
                  </span>
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLeftCollapsed(true)}
                  className="h-6 w-6 text-gray-400 hover:text-indigo-600 transition-colors">
                  <Layout className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-w-[200px]">
              {/* Add Sources Button */}
              <Button
                variant="outline"
                className="w-full border-dashed border-2 hover:border-gray-500 bg-white text-gray-500 hover:text-gray-700 h-10 gap-2 font-medium"
                onClick={() => setShowAddSourcesModal(true)}>
                <Plus className="w-4 h-4" />
                Add sources
              </Button>

              {/* Source List */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Select all sources
                  <input
                    type="checkbox"
                    checked={
                      selectedSources.size === sources.length &&
                      sources.length > 0
                    }
                    className="rounded text-indigo-600 border-gray-200"
                    onChange={() => {
                      if (selectedSources.size === sources.length)
                        setSelectedSources(new Set());
                      else
                        setSelectedSources(new Set(sources.map((s) => s.id)));
                    }}
                  />
                </div>

                {loading ? (
                  <div className="py-8 space-y-2 opacity-30">
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                ) : (
                  sources.map((source, idx) => (
                    <div key={source.id}>
                      {/* Source Item Header */}
                      <div
                        className={cn(
                          "group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border border-transparent z-10",
                          selectedSource?.id === source.id
                            ? "bg-indigo-50 border-indigo-100 sticky top-0 shadow-sm"
                            : selectedSources.has(source.id)
                              ? "bg-white border-gray-100 shadow-sm"
                              : "hover:bg-gray-50",
                        )}
                        onMouseEnter={() => setHoveredSourceId(source.id)}
                        onMouseLeave={() => setHoveredSourceId(null)}
                        onClick={() => setSelectedSource(selectedSource?.id === source.id ? null : source)}>
                        <div className="p-2 bg-red-50 rounded-lg text-red-500 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-medium text-gray-700 truncate flex-1">
                          {source.title}
                        </p>

                        {/* 3-dots menu on hover */}
                        <div className={cn(
                          "flex items-center gap-1 transition-opacity",
                          hoveredSourceId === source.id ? "opacity-100" : "opacity-0"
                        )}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSource(source.id);
                            }}
                            className={cn(
                              "p-1.5 rounded-md transition-colors",
                              selectedSources.has(source.id)
                                ? "text-indigo-600 bg-indigo-50"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            )}>
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center",
                              selectedSources.has(source.id) ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                            )}>
                              {selectedSources.has(source.id) && <span className="text-white text-xs">✓</span>}
                            </div>
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={(e) => handleRenameSource(source, e)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleRemoveSource(source.id, e)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Expanded Source Details */}
                      {selectedSource?.id === source.id && (
                        <div className="mt-2 mx-1 mb-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                          {/* AI Summary */}
                          <div className="p-4 border-b border-gray-50">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-4 h-4 text-indigo-600" />
                              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">AI Summary</h4>
                            </div>
                            <div className="bg-indigo-50/50 rounded-lg p-3">
                              {selectedSource.content ? (
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {selectedSource.content}
                                </p>
                              ) : selectedSource.metadata?.snippet ? (
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {selectedSource.metadata.snippet}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  No summary available.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Source Info */}
                          <div className="p-4 space-y-3">
                            {selectedSource.url && (
                              <div className="flex items-start gap-3">
                                <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 mb-0.5">URL</p>
                                  <a
                                    href={selectedSource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:underline truncate block"
                                    onClick={(e) => e.stopPropagation()}>
                                    {selectedSource.url}
                                  </a>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Type</p>
                                <p className="text-sm text-gray-700 capitalize">{selectedSource.type || "Unknown"}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Added</p>
                                <p className="text-sm text-gray-700">
                                  {selectedSource.created_at
                                    ? new Date(selectedSource.created_at).toLocaleDateString()
                                    : "Unknown"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameSource(selectedSource, e);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                              <Pencil className="w-3.5 h-3.5" />
                              Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Remove this source?")) {
                                  handleRemoveSource(selectedSource.id, e);
                                  setSelectedSource(null);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSource(null);
                              }}
                              className="ml-auto px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Left Resize Handle */}
        {!isLeftCollapsed && (
          <div
            onMouseDown={() => setIsResizing("left")}
            className="w-1.5 hover:w-2 bg-transparent hover:bg-indigo-100 cursor-col-resize transition-all shrink-0 z-30 group">
            <div className="h-full w-px bg-gray-50 group-hover:bg-indigo-200 mx-auto" />
          </div>
        )}

        {/* Middle Column: Chat */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 shrink-0 bg-white z-10">
            <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Clear current chat?")) {
                    setChatMessages([]);
                  }
                }}
                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Clear Chat">
                <Trash2 className="w-4 h-4" />
              </Button>

              <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Conversation History">
                    <Clock className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 bg-white">
                  <div className="flex flex-col max-h-[400px]">
                    <div className="p-3 border-b border-gray-100 font-semibold text-sm text-gray-700">
                      Chat History
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {loadingHistory ? (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Loading...
                        </div>
                      ) : chatHistoryList.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">
                          No past conversations
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {chatHistoryList.map((session) => (
                            <button
                              key={session.id}
                              onClick={() => handleLoadSession(session.id)}
                              className="text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0 group">
                              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 group-hover:text-indigo-500" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                  {session.title || "Untitled Chat"}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  {new Date(
                                    session.created_at,
                                  ).toLocaleString()}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setChatMessages([]);
                  setSessionId(null);
                }}
                className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="New Chat">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {/* Chat Messages - Scrollable area above input */}
          <div className="flex-1 overflow-y-auto min-w-0 pb-[140px]">
            <div className="max-w-3xl mx-auto py-12 px-8 space-y-10 overflow-x-hidden">

              {/* AI Summary Card - Shows when chat is empty and sources are selected */}
              {chatMessages.length === 0 && selectedSources.size > 0 && (
                <div className="mb-8">
                  {generatingSummary ? (
                    <div className="flex items-center gap-3 text-gray-400 py-8">
                      <Sparkles className="w-5 h-5 animate-pulse text-indigo-400" />
                      <span className="text-sm">Analyzing sources...</span>
                    </div>
                  ) : chatSummary ? (
                    <div className="space-y-6">
                      {/* Topic Header */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                          <Sparkles className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-1">
                            {projectTitle}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {selectedSources.size} sources
                          </p>
                        </div>
                      </div>

                      {/* Summary Paragraph */}
                      <div className="prose prose-sm max-w-none">
                        <p className="text-[15px] leading-relaxed text-gray-700">
                          {chatSummary.summary}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveToNote(chatSummary.summary)}
                          className="h-9 rounded-full bg-gray-50 hover:bg-gray-100 border-gray-100 text-xs text-gray-600 hover:text-gray-700 font-medium gap-2">
                          <Save className="w-3.5 h-3.5" /> Save to note
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-gray-400 hover:text-gray-600">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-gray-400 hover:text-gray-600">
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-gray-400 hover:text-gray-600">
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Suggested Questions */}
                      {chatSummary.questions && chatSummary.questions.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Suggested questions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {chatSummary.questions.map((question: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(question)}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-full border border-gray-200 hover:border-indigo-200 transition-all">
                                {question}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Chat Messages */}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "group relative transition-all",
                    msg.role === "user" ? "flex justify-end mb-4" : "mb-8",
                  )}>
                  <div
                    className={cn(
                      "relative max-w-2xl min-w-0",
                      msg.role === "user"
                        ? "bg-[#EEF2FF] rounded-[24px] px-6 py-4 shadow-sm"
                        : "space-y-4",
                    )}>
                    <div
                      className={cn(
                        "text-[15px] leading-relaxed whitespace-pre-wrap",
                        msg.role === "user" ? "text-gray-700" : "text-gray-800",
                      )}>
                      {renderMessageWithCitations(msg.content)}
                    </div>

                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveToNote(msg.content)}
                          className="h-8 rounded-full bg-gray-50 hover:bg-gray-100 border-gray-100 text-xs text-gray-600 hover:text-gray-700 font-medium gap-2">
                          <Save className="w-3.5 h-3.5" /> Save to note
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600">
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600">
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {chatLoading && (
                <div className="mb-8 pl-4">
                  <div className="flex items-center gap-2 text-gray-400 bg-gray-50 px-4 py-3 rounded-2xl w-fit">
                    <Sparkles className="w-4 h-4 animate-pulse text-indigo-400" />
                    <span className="text-sm font-medium animate-pulse">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Input Area - Fixed at bottom of viewport */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50" style={{ marginLeft: isLeftCollapsed ? '48px' : `${leftWidth}px`, marginRight: isRightCollapsed ? '48px' : `${rightWidth}px` }}>
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute inset-0 bg-indigo-50 border border-indigo-100 rounded-3xl -m-1 group-focus-within:ring-4 group-focus-within:ring-indigo-50/50 transition-all pointer-events-none"></div>
              <div className="relative bg-white border border-gray-200 rounded-3xl p-4 shadow-sm flex flex-col gap-2 transition-all focus-within:border-indigo-300">
                <textarea
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Start typing..."
                  className="w-full min-h-[44px] max-h-60 bg-transparent resize-none outline-none text-[15px] py-1"
                  rows={1}
                />
                <div className="flex items-center justify-between w-full pt-1 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">
                    {selectedSources.size} sources
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="h-6 w-[140px] text-[10px] uppercase font-bold tracking-wider border-0 bg-gray-50 text-gray-500 hover:text-indigo-600 focus:ring-0">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl">
                        <SelectItem value="gemini-3.1-flash-lite-preview">
                          Gemini 3.1 Flash Lite
                        </SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">
                          Claude 3.5 Sonnet
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full transition-all duration-300 shadow-sm",
                        chatInput.trim()
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white translate-x-0"
                          : "bg-gray-100 text-gray-400 translate-x-2 opacity-0 pointer-events-none",
                      )}
                      onClick={() => handleSendMessage()}
                      disabled={chatLoading || !chatInput.trim()}>
                      {chatLoading ? (
                        <Sparkles className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 ml-0.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-2">
                NotebookLM can be inaccurate; please double-check its responses.
              </p>
            </div>
          </div>
        </main>

        {/* Right Resize Handle */}
        {!isRightCollapsed && (
          <div
            onMouseDown={() => setIsResizing("right")}
            className="w-1.5 hover:w-2 bg-transparent hover:bg-indigo-100 cursor-col-resize transition-all shrink-0 z-30 group">
            <div className="h-full w-px bg-gray-50 group-hover:bg-indigo-200 mx-auto" />
          </div>
        )}

        {/* Right Icon Bar (when collapsed) */}
        {isRightCollapsed && (
          <div className="fixed right-0 top-0 bottom-0 z-20 w-12 bg-[#F3F4F6] border-l border-gray-200 flex flex-col items-center py-3 gap-2">
            {/* Studio/Home Icon */}
            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-all text-gray-600 hover:text-indigo-600"
              title="Studio">
              <Layout className="w-5 h-5" />
            </button>

            <div className="w-8 h-px bg-gray-300 my-1" />

            {/* Studio Action Icons */}
            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-indigo-50 transition-all"
              title="Audio Overview">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
            </button>

            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-blue-50 transition-all"
              title="Lit Review">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
            </button>

            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-all"
              title="Mind Map">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <Network className="w-4 h-4 text-gray-600" />
              </div>
            </button>

            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-amber-50 transition-all"
              title="Reports">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
            </button>

            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-rose-50 transition-all"
              title="Flashcards">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <Hash className="w-4 h-4 text-rose-600" />
              </div>
            </button>

            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-blue-50 transition-all"
              title="Quiz">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-blue-600" />
              </div>
            </button>

            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-indigo-50 transition-all"
              title="Data Table">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Table className="w-4 h-4 text-indigo-600" />
              </div>
            </button>

            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-purple-50 transition-all"
              title="Infographic">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
            </button>

            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-teal-50 transition-all"
              title="Slide Deck">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <Presentation className="w-4 h-4 text-teal-600" />
              </div>
            </button>

            <div className="flex-1" />

            {/* Settings at bottom */}
            <button
              onClick={() => setIsRightCollapsed(false)}
              className="group relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-all text-gray-400 hover:text-gray-600"
              title="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Right Column: Studio */}
        <StudioSidebar
          width={rightWidth}
          isCollapsed={isRightCollapsed}
          onCollapse={() => setIsRightCollapsed(true)}
          projectId={projectId}
          projectTitle={projectTitle}
          onAiQuery={(query) => handleSendMessage(query)}
          onAddNote={() => setShowNoteModal(true)}
        />
      </div>

      {/* Mobile Tab Content - Show only on mobile */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        {/* Sources Tab Content */}
        {mobileActiveTab === "sources" && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Sources
              </h2>
              <Button
                size="sm"
                onClick={() => setShowAddSourcesModal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Add Sources
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                sources.map((source) => (
                  <div
                    key={source.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-2",
                      selectedSources.has(source.id)
                        ? "bg-white border-gray-100 shadow-sm"
                        : "hover:bg-gray-50",
                    )}
                    onClick={() => toggleSource(source.id)}>
                    <div className="p-2 bg-red-50 rounded-lg text-red-500 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium text-gray-700 truncate flex-1">
                      {source.title}
                    </p>
                    <input
                      type="checkbox"
                      checked={selectedSources.has(source.id)}
                      className="rounded text-indigo-600 border-gray-200"
                      readOnly
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Tab Content */}
        {mobileActiveTab === "chat" && (
          <main className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Clear current chat?")) {
                    setChatMessages([]);
                  }
                }}
                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <MessageSquare className="w-12 h-12" />
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "group relative transition-all",
                      msg.role === "user" ? "flex justify-end mb-4" : "mb-8",
                    )}>
                    <div
                      className={cn(
                        "relative max-w-2xl",
                        msg.role === "user"
                          ? "bg-[#EEF2FF] rounded-[24px] px-6 py-4 shadow-sm"
                          : "space-y-4",
                      )}>
                      <div
                        className={cn(
                          "text-[15px] leading-relaxed whitespace-pre-wrap",
                          msg.role === "user"
                            ? "text-gray-700"
                            : "text-gray-800",
                        )}>
                        {renderMessageWithCitations(msg.content)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-white p-4">
              <div className="flex flex-col gap-3 bg-gray-50 rounded-2xl p-4">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Start typing..."
                  className="w-full min-h-[60px] bg-transparent resize-none outline-none text-[15px]"
                  rows={1}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">
                    {selectedSources.size} sources
                  </span>
                  <Button
                    size="sm"
                    className="h-8 rounded-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleSendMessage()}
                    disabled={chatLoading || !chatInput.trim()}>
                    {chatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Studio Tab Content */}
        {mobileActiveTab === "studio" && (
          <div className="flex-1 overflow-y-auto bg-white">
            <StudioSidebar
              width={window.innerWidth}
              isCollapsed={false}
              onCollapse={() => { }}
              projectId={projectId}
              projectTitle={projectTitle}
              onAiQuery={(query) => handleSendMessage(query)}
              onAddNote={() => setShowNoteModal(true)}
            />
          </div>
        )}
      </div>

      {/* Note Creation Modal */}
      <AddNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        userId={userId}
        projectId={projectId}
      />

      {/* Add Sources Modal */}
      <AddSourcesModal
        isOpen={showAddSourcesModal}
        onClose={() => setShowAddSourcesModal(false)}
        projectId={projectId}
        userId={userId}
        onSourcesAdded={fetchSources}
      />
    </div>
  );
}

// Helper to render message content with citation bubbles and bold text
function renderMessageWithCitations(content: string) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-tight [&_*]:!m-0 [&_li_p]:!inline [&_li_>_p]:!inline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="pl-1 leading-normal" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-lg font-bold text-gray-900" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-base font-bold text-gray-800" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-sm font-bold text-gray-800" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="leading-relaxed" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-indigo-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          code: ({ node, ...props }) => {
            const { inline, children, ...rest } = props as any;
            const isInline = inline || !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono text-gray-800"
                  {...rest}>
                  {children}
                </code>
              );
            }
            return (
              <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                <code
                  className="text-sm font-mono text-gray-100 block"
                  {...rest}>
                  {children}
                </code>
              </div>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table
                className="w-full border-collapse text-sm text-gray-700"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50 border-b border-gray-200" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-2 text-left font-semibold text-gray-900 whitespace-nowrap"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 border-b border-gray-100" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-indigo-200 pl-4 py-1 bg-indigo-50/30 rounded-r text-gray-700 italic"
              {...props}
            />
          ),
        }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
