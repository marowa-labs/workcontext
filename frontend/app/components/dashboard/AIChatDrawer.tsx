"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Loader2,
  Plus,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  SquarePen,
  Layout,
  PanelRight,
  Maximize2,
  ChevronRight,
  Trash2,
  Edit3,
  MessageSquare,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "../../lib/supabase/client";
import { cn } from "../../lib/utils";
import { useRouter } from "next/navigation";
import apiClient from "../../lib/utils/apiClient";
import AIService from "../../lib/utils/aiService";
import {
  aiActionService,
  AIActionResult,
  formatActionType,
  getActionIcon,
  isDestructiveAction,
  getConfirmationButtonText,
} from "../../lib/utils/aiActionService";

// ── AI Action System Integration ────────────────────────────────────────────
// AIChatDrawer now uses the real AI Action Service for full action execution
// ─────────────────────────────────────────────────────────────────────────────

// ── Page Context Tracking ─────────────────────────────────────────────────────
interface PageContext {
  name: string;
  icon: string;
  route: string;
  description: string;
  section?: string;
  entityId?: string;
  entityName?: string;
}

// Page descriptions for AI context
const pageDescriptions: Record<string, string> = {
  dashboard: "The main dashboard showing quick actions, workspaces overview, popular commands, and getting started guide",
  projects: "Projects list page showing all user's projects with ability to create, open, or manage them",
  editor: "The document editor where users write and edit their academic papers, essays, and research documents",
  tasks: "Task management page showing tasks, to-dos, and assignments for the workspace or project",
  workspace: "Workspace overview page showing projects, team members, and workspace-specific content",
  notes: "Notes page for capturing quick ideas, research notes, and personal memos",
  wiki: "Knowledge base/wiki page for documentation, guides, and shared information",
  team: "Team management page showing members, roles, and collaboration settings",
  settings: "Settings page for configuring preferences, account, and application options",
  guide: "Help and guide page with tutorials, documentation, and how-to instructions",
  search: "Search results page for finding content across workspaces and projects",
};

function getPageContext(): PageContext {
  if (typeof window === "undefined") {
    return {
      name: "Dashboard",
      icon: "🏠",
      route: "/dashboard",
      description: pageDescriptions.dashboard,
      section: "main"
    };
  }

  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // Extract IDs from path
  const pathParts = path.split('/');
  const workspaceId = pathParts.find((_, i) => pathParts[i - 1] === 'workspace');
  const projectId = pathParts.find((_, i) => pathParts[i - 1] === 'editor' || pathParts[i - 1] === 'project');

  // Workspace pages
  if (path.includes("/workspace/")) {
    const workspaceMatch = path.match(/\/workspace\/([^\/]+)/);
    const currentWorkspaceId = workspaceMatch ? workspaceMatch[1] : undefined;

    if (path.includes("/projects")) {
      return {
        name: "Workspace Projects",
        icon: "📁",
        route: path,
        description: `${pageDescriptions.projects} within a specific workspace`,
        section: "workspace",
        entityId: currentWorkspaceId
      };
    }
    if (path.includes("/tasks")) {
      return {
        name: "Workspace Tasks",
        icon: "✓",
        route: path,
        description: pageDescriptions.tasks,
        section: "workspace",
        entityId: currentWorkspaceId
      };
    }
    if (path.includes("/notes")) {
      return {
        name: "Workspace Notes",
        icon: "📝",
        route: path,
        description: pageDescriptions.notes,
        section: "workspace",
        entityId: currentWorkspaceId
      };
    }
    if (path.includes("/wiki")) {
      return {
        name: "Workspace Wiki",
        icon: "📚",
        route: path,
        description: pageDescriptions.wiki,
        section: "workspace",
        entityId: currentWorkspaceId
      };
    }
    if (path.includes("/team")) {
      return {
        name: "Workspace Team",
        icon: "👥",
        route: path,
        description: pageDescriptions.team,
        section: "workspace",
        entityId: currentWorkspaceId
      };
    }
    if (path.includes("/settings")) {
      return {
        name: "Workspace Settings",
        icon: "⚙️",
        route: path,
        description: pageDescriptions.settings,
        section: "workspace",
        entityId: currentWorkspaceId
      };
    }
    return {
      name: "Workspace",
      icon: "🗂️",
      route: path,
      description: pageDescriptions.workspace,
      section: "workspace",
      entityId: currentWorkspaceId
    };
  }

  // Editor/Project pages
  if (path.includes("/editor/")) {
    const projectMatch = path.match(/\/editor\/([^\/]+)/);
    const currentProjectId = projectMatch ? projectMatch[1] : undefined;
    return {
      name: "Document Editor",
      icon: "📝",
      route: path,
      description: pageDescriptions.editor,
      section: "editor",
      entityId: currentProjectId
    };
  }

  // Main pages
  if (path.includes("/guide")) {
    return {
      name: "Guide",
      icon: "📖",
      route: path,
      description: pageDescriptions.guide,
      section: "main"
    };
  }
  if (path.includes("/projects")) {
    return {
      name: "All Projects",
      icon: "📁",
      route: path,
      description: pageDescriptions.projects,
      section: "main"
    };
  }
  if (path.includes("/search")) {
    const query = searchParams.get('q') || '';
    return {
      name: "Search",
      icon: "🔍",
      route: path,
      description: `${pageDescriptions.search}${query ? ` - Current search: "${query}"` : ''}`,
      section: "main"
    };
  }
  if (path.includes("/settings")) {
    return {
      name: "Settings",
      icon: "⚙️",
      route: path,
      description: pageDescriptions.settings,
      section: "main"
    };
  }

  return {
    name: "Dashboard",
    icon: "🏠",
    route: "/dashboard",
    description: pageDescriptions.dashboard,
    section: "main"
  };
}

function PageContextPill() {
  const [context, setContext] = useState<PageContext>(getPageContext());

  useEffect(() => {
    const updateContext = () => setContext(getPageContext());
    updateContext();

    // Listen for route changes
    window.addEventListener("popstate", updateContext);

    // Also check periodically for SPA navigation
    const interval = setInterval(updateContext, 500);

    return () => {
      window.removeEventListener("popstate", updateContext);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="px-4 pt-3 pb-0 flex items-center gap-2">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
        <span>{context.icon}</span>
        <span className="max-w-[120px] truncate">{context.name}</span>
      </div>
      <span className="text-xs text-gray-400">is active</span>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isPanel?: boolean;
  pendingAction?: {
    type: "summarize";
    workspaceId?: string;
    message?: string;
  } | null;
}

// ── Shared inner content (used by both panel and drawer modes) ───────────────
function ChatContent({
  messages,
  loading,
  input,
  setInput,
  sendMessage,
  handleKeyDown,
  textareaRef,
  messagesEndRef,
  internalPendingAction,
  isConfirming,
  onConfirmAction,
  onCancelAction,
}: {
  messages: Message[];
  loading: boolean;
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  internalPendingAction: AIActionResult | null;
  isConfirming: boolean;
  onConfirmAction: () => void;
  onCancelAction: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages - with overflow handling for code blocks */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 min-h-0">
        <style jsx>{`
          .prose pre {
            overflow-x: auto;
            max-width: 100%;
          }
          .prose pre code {
            word-break: break-all;
            white-space: pre-wrap;
          }
          .prose code {
            word-break: break-all;
          }
          .prose p {
            overflow-wrap: break-word;
            word-wrap: break-word;
          }
        `}</style>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            {/* Logo */}
            <div className="mb-8">
              <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto">
                <circle cx="50" cy="50" r="45" fill="#F5F5F5" />
                <ellipse cx="50" cy="55" rx="20" ry="25" fill="#E8E8E8" />
                <circle cx="42" cy="45" r="3" fill="#333" />
                <circle cx="58" cy="45" r="3" fill="#333" />
                <path d="M45 55 Q50 60 55 55" stroke="#333" strokeWidth="2" fill="none" />
                <path d="M35 35 Q25 25 20 40" stroke="#666" strokeWidth="3" fill="none" />
                <path d="M65 35 Q75 25 80 40" stroke="#666" strokeWidth="3" fill="none" />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              What&apos;s our quest today?
            </h2>

            {/* Quick Actions - Showcasing AI Action System capabilities */}
            <div className="w-full max-w-sm space-y-1 overflow-x-hidden">
              {[
                { icon: "🏢", label: "Create a new workspace", prompt: "Create a workspace called My Research" },
                { icon: "📄", label: "Create a new project", prompt: "Create a project called Research Paper" },
                { icon: "✅", label: "Create a task", prompt: "Create a task called Review literature" },
                { icon: "📋", label: "Show my tasks", prompt: "Show all my tasks" },
                { icon: "📁", label: "Show my projects", prompt: "Show all my projects" },
                { icon: "📊", label: "Summarize my document", prompt: "Summarize the current document" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.prompt)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <span className="text-lg">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <circle cx="19" cy="12" r="3" />
                      <circle cx="5" cy="12" r="3" />
                    </svg>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] text-sm leading-relaxed overflow-x-hidden",
                    message.role === "user"
                      ? "bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 break-words"
                      : "text-gray-700 prose prose-sm max-w-none break-words"
                  )}
                >
                  {message.role === "user" ? (
                    <span className="break-words">{message.content}</span>
                  ) : (
                    <div className="break-words overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* BUG FIX #3: loading indicator was duplicated outside the JSX tree.
                It now lives only here, inside the messages list. */}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                </div>
                <div className="text-sm text-gray-500">Thinking...</div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Notion Style */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow">
          {/* AI Action Confirmation Dialog */}
          {internalPendingAction && (
            <div className="mx-4 mt-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className={`p-3 ${isDestructiveAction(internalPendingAction.actionType || '') ? 'bg-red-50 border-b border-red-100' : 'bg-blue-50 border-b border-blue-100'}`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${isDestructiveAction(internalPendingAction.actionType || '') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isDestructiveAction(internalPendingAction.actionType || '') ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <span className="text-base">{getActionIcon(internalPendingAction.actionType || '')}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Confirm Action</h4>
                    <p className="text-xs text-gray-600">{formatActionType(internalPendingAction.actionType || '')}</p>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <p className="text-sm text-gray-700 mb-3 break-words">{internalPendingAction.message}</p>

                <div className="flex gap-2">
                  <button
                    onClick={onCancelAction}
                    disabled={isConfirming}
                    className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {getConfirmationButtonText(internalPendingAction.actionType || '').cancel}
                  </button>
                  <button
                    onClick={onConfirmAction}
                    disabled={isConfirming}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-white text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1 ${isDestructiveAction(internalPendingAction.actionType || '')
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {getConfirmationButtonText(internalPendingAction.actionType || '').confirm}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page Context Pill */}
          <PageContextPill />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Do anything with AI..."
            className="w-full min-h-[60px] px-4 py-3 text-sm text-gray-700 bg-transparent border-0 resize-none focus:outline-none focus:ring-0"
            disabled={loading}
          />

          {/* Bottom toolbar inside input card */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="flex items-center gap-0.5">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 px-2">Auto</span>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent rounded-lg transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9 22,2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AIChatDrawer({
  isOpen,
  onClose,
  isPanel = false,
  pendingAction: externalPendingAction,
}: AIChatDrawerProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; title: string }[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [internalPendingAction, setInternalPendingAction] = useState<AIActionResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [viewMode, setViewMode] = useState<"sidebar" | "fullscreen">("sidebar");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showSessionsDropdown, setShowSessionsDropdown] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const sessionsDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close view dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        viewDropdownRef.current &&
        !viewDropdownRef.current.contains(event.target as Node)
      ) {
        setShowViewDropdown(false);
      }
      if (
        sessionsDropdownRef.current &&
        !sessionsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSessionsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load sessions on mount
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle external pending action (e.g., summarize command from command palette)
  useEffect(() => {
    if (isOpen && externalPendingAction?.type === "summarize") {
      // Auto-send a summary message after a short delay to ensure session is loaded
      const timer = setTimeout(() => {
        const workspaceId = externalPendingAction.workspaceId;
        const summaryMessage = workspaceId
          ? `Please summarize the workspace content for workspace ID: ${workspaceId}. Provide a comprehensive overview of the research, key findings, and main points.`
          : "Please summarize the current workspace content. Provide a comprehensive overview of the research, key findings, and main points.";

        // Add user message
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: "user",
          content: summaryMessage,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Send to AI
        setLoading(true);
        sendAIMessage(summaryMessage);
      }, 500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, externalPendingAction]);

  const sendAIMessage = async (messageContent: string) => {
    try {
      const pageContext = getPageContext();
      const result = await aiActionService.sendMessage(
        messageContent,
        {
          pageContext: pageContext.name,
          pageDescription: pageContext.description,
          pageRoute: pageContext.route,
          pageSection: pageContext.section,
          entityId: pageContext.entityId,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          onConfirmationRequired: (action, confirm, cancel) => {
            setInternalPendingAction(action);
            (window as any).__aiDrawerConfirm = confirm;
            (window as any).__aiDrawerCancel = cancel;
          },
          onResult: (result) => {
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: result.message,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          },
          onError: (error) => {
            const errorMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: `Sorry, I encountered an error: ${error || "Unknown error"}`,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          },
        }
      );
    } catch (error: any) {
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message || "Unknown error"}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await apiClient.get("/api/ai/chat/sessions");
      const loadedSessions = data.sessions || [];
      setSessions(loadedSessions);

      if (!loadedSessions.length) {
        await createNewSession();
      } else {
        // Find the most recent session (first in list since sorted by last_message_at desc)
        const mostRecent = loadedSessions[0];
        setCurrentSession(mostRecent.id);
        await loadMessages(mostRecent.id);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  // Generate a title from the first user message
  const generateChatTitle = (content: string): string => {
    // Remove extra whitespace and truncate to first 50 chars
    const cleaned = content.trim().replace(/\s+/g, ' ');
    if (cleaned.length <= 50) return cleaned;
    return cleaned.substring(0, 50).trim() + '...';
  };

  // Update session title in backend
  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      await apiClient.patch(`/api/ai/chat/session/${sessionId}`, { title });
      // Update local state
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, title } : s
      ));
    } catch (error) {
      console.error("Failed to update session title:", error);
    }
  };

  // Switch to a different session
  const switchSession = async (sessionId: string) => {
    try {
      setCurrentSession(sessionId);
      await loadMessages(sessionId);
      setShowSessionsDropdown(false);
    } catch (error) {
      console.error("Failed to switch session:", error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const data = await apiClient.get(`/api/ai/chat/session/${sessionId}/messages`);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const createNewSession = async () => {
    try {
      const data = await apiClient.post("/api/ai/chat/session", { title: "New Chat" });
      setCurrentSession(data.session.id);
      setMessages([]);
      setSessions((prev) => [data.session, ...prev]);
      setShowSessionsDropdown(false);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  // Delete a chat session
  const deleteSession = async (sessionIdToDelete: string) => {
    try {
      await apiClient.delete(`/api/ai/chat/session/${sessionIdToDelete}`, null);

      // Remove from local state
      const updatedSessions = sessions.filter(s => s.id !== sessionIdToDelete);
      setSessions(updatedSessions);

      // If we deleted the current session, switch to another one or create new
      if (sessionIdToDelete === currentSession) {
        if (updatedSessions.length > 0) {
          const nextSession = updatedSessions[0];
          setCurrentSession(nextSession.id);
          await loadMessages(nextSession.id);
        } else {
          setCurrentSession(null);
          setMessages([]);
          await createNewSession();
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  // Helper to save user message to database
  const saveUserMessage = async (content: string): Promise<Message | null> => {
    if (!currentSession) return null;
    try {
      const response = await apiClient.post("/api/ai/chat/message", {
        sessionId: currentSession,
        content,
        messageType: "text",
      });
      return response.userMessage || null;
    } catch (error) {
      console.error("Failed to save user message:", error);
      return null;
    }
  };

  // Helper to save AI message to database
  const saveAIMessage = async (content: string): Promise<Message | null> => {
    if (!currentSession) return null;
    try {
      // Use a direct API call to save assistant message without triggering AI processing
      const response = await apiClient.post("/api/ai/chat/message/direct", {
        sessionId: currentSession,
        content,
        role: "assistant",
        messageType: "text",
      });
      return response.message || null;
    } catch (error) {
      console.error("Failed to save AI message:", error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !currentSession) return;

    const userMessageContent = input.trim();
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessageContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setInput("");
    setLoading(true);

    try {
      // Auto-generate title if this is the first user message and session has default title
      // Note: messages.length is 0 here because setMessages hasn't updated state yet
      const currentSessionData = sessions.find(s => s.id === currentSession);
      if (currentSessionData && currentSessionData.title === "New Chat" && messages.length === 0) {
        const autoTitle = generateChatTitle(userMessageContent);
        await updateSessionTitle(currentSession, autoTitle);
      }

      // First, try to process as an action using AI Action Service
      const pageContext = getPageContext();

      await aiActionService.sendMessage(
        userMessageContent,
        {
          pageContext: pageContext.name,
          pageDescription: pageContext.description,
          pageRoute: pageContext.route,
          pageSection: pageContext.section,
          entityId: pageContext.entityId,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          onConfirmationRequired: (action, confirm, cancel) => {
            setInternalPendingAction(action);
            (window as any).__aiDrawerConfirm = confirm;
            (window as any).__aiDrawerCancel = cancel;
            // Save the pending action state to chat
            const actionType = action?.actionType || "perform this action";
            const pendingMsg: Message = {
              id: `pending-${Date.now()}`,
              role: "assistant",
              content: `I'll ${actionType.replace(/_/g, ' ')}. Please confirm to proceed.`,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, pendingMsg]);
            setLoading(false);
          },
          onResult: async (result) => {
            // Add AI response to messages
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: result.message,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Save user message to database
            await saveUserMessage(userMessageContent);

            // Save AI response to database
            await saveAIMessage(result.message);

            // Add suggested actions if available
            if (result.suggestedActions && result.suggestedActions.length > 0) {
              const suggestionContent = `**You can also ask me to:**\n${result.suggestedActions.map((a: string) => `- ${a}`).join('\n')}`;
              const suggestionMessage: Message = {
                id: `suggestion-${Date.now()}`,
                role: "assistant",
                content: suggestionContent,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, suggestionMessage]);
              await saveAIMessage(suggestionContent);
            }
            setLoading(false);
          },
          onError: async (errorMsg) => {
            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: `Sorry, I encountered an error: ${errorMsg}`,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);

            // Save user message to database
            await saveUserMessage(userMessageContent);
            // Save error response to database
            await saveAIMessage(`Sorry, I encountered an error: ${errorMsg}`);
            setLoading(false);
          },
          onNavigation: (page, params) => {
            // Handle navigation from AI actions - comprehensive route support
            const workspaceId = params?.workspaceId || pageContext.entityId;

            if (page === "editor" && params?.projectId) {
              router.push(`/editor/${params.projectId}`);
            } else if (page === "dashboard") {
              router.push("/dashboard");
            } else if (page === "workspaces" || page === "workspace_list") {
              router.push("/workspaces");
            } else if (page === "projects") {
              router.push("/projects");
            } else if (page === "tasks") {
              router.push("/tasks");
            } else if (page === "settings" || page === "preferences") {
              router.push("/settings");
            } else if (page === "guide" || page === "help") {
              router.push("/guide");
            } else if (page === "search") {
              router.push(params?.query ? `/search?q=${encodeURIComponent(params.query)}` : "/search");
            }
            // Workspace-specific routes
            else if (page === "workspace" && workspaceId) {
              router.push(`/workspace/${workspaceId}`);
            } else if (page === "workspace_projects" && workspaceId) {
              router.push(`/workspace/${workspaceId}/projects`);
            } else if (page === "workspace_tasks" && workspaceId) {
              router.push(`/workspace/${workspaceId}/tasks`);
            } else if (page === "workspace_notes" && workspaceId) {
              router.push(`/workspace/${workspaceId}/notes`);
            } else if (page === "workspace_wiki" && workspaceId) {
              router.push(`/workspace/${workspaceId}/wiki`);
            } else if (page === "workspace_team" && workspaceId) {
              router.push(`/workspace/${workspaceId}/team`);
            } else if (page === "workspace_settings" && workspaceId) {
              router.push(`/workspace/${workspaceId}/settings`);
            }
            // Navigation with full path
            else if (params?.path) {
              router.push(params.path);
            }
          },
        }
      );
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `I'm sorry, I encountered an error: ${error.message || "Please try again."}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      // Try to save user message even on error
      await saveUserMessage(userMessageContent);
      await saveAIMessage(`I'm sorry, I encountered an error: ${error.message || "Please try again."}`);

      setLoading(false);
    }
  };

  // Handle action confirmation
  const handleConfirmAction = async () => {
    if (!internalPendingAction?.actionId) return;

    setIsConfirming(true);
    try {
      const confirm = (window as any).__aiDrawerConfirm;
      if (confirm) {
        await confirm();
      }
      setInternalPendingAction(null);
    } catch (error) {
      console.error("Confirm action error:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle action cancellation
  const handleCancelAction = async () => {
    if (!internalPendingAction?.actionId) return;

    try {
      const cancel = (window as any).__aiDrawerCancel;
      if (cancel) {
        await cancel();
      }
      setInternalPendingAction(null);
    } catch (error) {
      console.error("Cancel action error:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  const clearChat = () => {
    setMessages([]);
    createNewSession();
  };

  if (!isOpen) return null;

  // ── Shared props passed into ChatContent ──────────────────────────────────
  const sharedProps = {
    messages,
    loading,
    input,
    setInput,
    sendMessage,
    handleKeyDown,
    textareaRef,
    messagesEndRef,
    internalPendingAction,
    isConfirming,
    onConfirmAction: handleConfirmAction,
    onCancelAction: handleCancelAction,
  };

  // ── BUG FIX #2: PanelContent was referenced but never defined.
  //    It is now rendered inline using the shared ChatContent component.
  if (isPanel) {
    return (
      <div className="w-full h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        {/* Panel Header */}
        <div className="h-14 flex-none flex items-center justify-between px-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2" ref={sessionsDropdownRef}>
            {/* Sessions Dropdown Button */}
            <button
              onClick={() => setShowSessionsDropdown(!showSessionsDropdown)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="19" cy="12" r="3" />
                <circle cx="5" cy="12" r="3" />
              </svg>
              <span className="max-w-[150px] truncate">
                {sessions.find(s => s.id === currentSession)?.title || "New AI chat"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showSessionsDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Sessions Dropdown Menu */}
            {showSessionsDropdown && (
              <div className="absolute top-12 left-4 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
                {/* New Chat Option */}
                <button
                  onClick={() => {
                    createNewSession();
                    setShowSessionsDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Start new chat</p>
                    <p className="text-xs text-gray-400">Create a fresh conversation</p>
                  </div>
                </button>

                {/* Previous Sessions */}
                {sessions.length > 0 && (
                  <div className="py-1">
                    <p className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Previous conversations
                    </p>
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${session.id === currentSession ? 'bg-blue-50/50' : ''
                          }`}
                      >
                        <button
                          onClick={() => switchSession(session.id)}
                          className="flex-1 flex items-center gap-3 text-left min-w-0"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${session.id === currentSession ? 'text-blue-700' : 'text-gray-700'
                              }`}>
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Today
                            </p>
                          </div>
                          {session.id === currentSession && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          title="Delete chat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {sessions.length === 0 && (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm text-gray-400">No previous conversations</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Start new chat"
            >
              <SquarePen className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="h-[calc(100%-3.5rem)] overflow-hidden">
          <ChatContent {...sharedProps} />
        </div>
      </div>
    );
  }

  // ── Modal / Drawer mode ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Transparent click-away overlay */}
      <div className="fixed inset-0 bg-transparent" onClick={onClose} />

      {/* BUG FIX #4 & #5: The outer drawer <div> was missing its closing tag,
          and the closing `)` + `}` were misplaced, making them close sendMessage()
          instead of the component's return statement. Both are now correct. */}
      <div className="relative w-[420px] bg-white border-l border-gray-200 shadow-[0_0_40px_rgba(0,0,0,0.08)] flex flex-col h-full animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Header - Fixed height, always visible */}
        <div className="h-14 flex-none flex items-center justify-between px-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2" ref={sessionsDropdownRef}>
            {/* Sessions Dropdown Button */}
            <button
              onClick={() => setShowSessionsDropdown(!showSessionsDropdown)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="19" cy="12" r="3" />
                <circle cx="5" cy="12" r="3" />
              </svg>
              <span className="max-w-[150px] truncate">
                {sessions.find(s => s.id === currentSession)?.title || "New AI chat"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showSessionsDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Sessions Dropdown Menu */}
            {showSessionsDropdown && (
              <div className="absolute top-12 left-4 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
                {/* New Chat Option */}
                <button
                  onClick={() => {
                    createNewSession();
                    setShowSessionsDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Start new chat</p>
                    <p className="text-xs text-gray-400">Create a fresh conversation</p>
                  </div>
                </button>

                {/* Previous Sessions */}
                {sessions.length > 0 && (
                  <div className="py-1">
                    <p className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Previous conversations
                    </p>
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${session.id === currentSession ? 'bg-blue-50/50' : ''
                          }`}
                      >
                        <button
                          onClick={() => switchSession(session.id)}
                          className="flex-1 flex items-center gap-3 text-left min-w-0"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${session.id === currentSession ? 'text-blue-700' : 'text-gray-700'
                              }`}>
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Today
                            </p>
                          </div>
                          {session.id === currentSession && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          title="Delete chat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {sessions.length === 0 && (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm text-gray-400">No previous conversations</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5">
            {/* New Chat Button */}
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Start new chat Ctrl+?+;"
            >
              <SquarePen className="w-4 h-4" />
            </button>

            {/* View Mode Dropdown */}
            <div className="relative" ref={viewDropdownRef}>
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === "sidebar" ? "Sidebar" : "Full screen"}
              >
                {viewMode === "sidebar" ? (
                  <PanelRight className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              {showViewDropdown && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => { setViewMode("sidebar"); setShowViewDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${viewMode === "sidebar" ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                  >
                    <PanelRight className="w-4 h-4" />
                    Sidebar
                    {viewMode === "sidebar" && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                  </button>
                  <button
                    onClick={() => { setViewMode("fullscreen"); setShowViewDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${viewMode === "fullscreen" ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                  >
                    <Layout className="w-4 h-4" />
                    Full screen
                    {viewMode === "fullscreen" && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                  </button>
                </div>
              )}
            </div>

            {/* Hide Chat Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
              title="Hide chat Ctrl+J"
            >
              <ChevronRight className="w-4 h-4" />
              <ChevronRight className="w-4 h-4 -ml-2" />
            </button>
          </div>
        </div>

        {/* Chat body (messages + input) - Scrollable area */}
        <div className="h-[calc(100%-3.5rem)] overflow-hidden">
          <ChatContent {...sharedProps} />
        </div>
      </div>{/* ← BUG FIX #4: closing tag was missing */}
    </div>
  );
  // ↑ BUG FIX #5: return now properly closes here, not inside sendMessage()
}
