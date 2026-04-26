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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "../../lib/supabase/client";
import { cn } from "../../lib/utils";
import { useRouter } from "next/navigation";
import apiClient from "../../lib/utils/apiClient";
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
}

function getPageContext(): PageContext {
  if (typeof window === "undefined") {
    return { name: "Dashboard", icon: "🏠", route: "/dashboard" };
  }

  const path = window.location.pathname;

  // Workspace pages
  if (path.includes("/workspace/")) {
    if (path.includes("/projects")) return { name: "Projects", icon: "📁", route: path };
    if (path.includes("/tasks")) return { name: "Tasks", icon: "✓", route: path };
    if (path.includes("/notes")) return { name: "Notes", icon: "📝", route: path };
    if (path.includes("/wiki")) return { name: "Wiki", icon: "📚", route: path };
    if (path.includes("/team")) return { name: "Team", icon: "👥", route: path };
    if (path.includes("/settings")) return { name: "Settings", icon: "⚙️", route: path };
    return { name: "Workspace", icon: "🗂️", route: path };
  }

  // Editor/Project pages
  if (path.includes("/editor/")) return { name: "Editor", icon: "📝", route: path };

  // Main pages
  if (path.includes("/guide")) return { name: "Guide", icon: "📖", route: path };
  if (path.includes("/projects")) return { name: "Projects", icon: "📁", route: path };
  if (path.includes("/search")) return { name: "Search", icon: "🔍", route: path };
  if (path.includes("/settings")) return { name: "Settings", icon: "⚙️", route: path };

  return { name: "Dashboard", icon: "🏠", route: "/dashboard" };
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
  pendingAction,
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
  pendingAction: AIActionResult | null;
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
          {pendingAction && (
            <div className="mx-4 mt-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className={`p-3 ${isDestructiveAction(pendingAction.actionType || '') ? 'bg-red-50 border-b border-red-100' : 'bg-blue-50 border-b border-blue-100'}`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${isDestructiveAction(pendingAction.actionType || '') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isDestructiveAction(pendingAction.actionType || '') ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <span className="text-base">{getActionIcon(pendingAction.actionType || '')}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Confirm Action</h4>
                    <p className="text-xs text-gray-600">{formatActionType(pendingAction.actionType || '')}</p>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <p className="text-sm text-gray-700 mb-3 break-words">{pendingAction.message}</p>

                <div className="flex gap-2">
                  <button
                    onClick={onCancelAction}
                    disabled={isConfirming}
                    className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {getConfirmationButtonText(pendingAction.actionType || '').cancel}
                  </button>
                  <button
                    onClick={onConfirmAction}
                    disabled={isConfirming}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-white text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1 ${isDestructiveAction(pendingAction.actionType || '')
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
                        {getConfirmationButtonText(pendingAction.actionType || '').confirm}
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
}: AIChatDrawerProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; title: string }[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<AIActionResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [viewMode, setViewMode] = useState<"sidebar" | "fullscreen">("sidebar");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
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

  const loadSessions = async () => {
    try {
      const data = await apiClient.get("/api/ai/chat/sessions");
      setSessions(data.sessions || []);

      if (!data.sessions?.length) {
        createNewSession();
      } else {
        setCurrentSession(data.sessions[0].id);
        loadMessages(data.sessions[0].id);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
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
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Get current page context
      const pageContext = getPageContext();

      // Use AI Action Service for intelligent action processing
      await aiActionService.sendMessage(
        userMessage.content,
        {
          pageContext: pageContext.name,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          onConfirmationRequired: (action, confirm, cancel) => {
            setPendingAction(action);
            // Store callbacks in window for access from handlers
            (window as any).__aiDrawerConfirm = confirm;
            (window as any).__aiDrawerCancel = cancel;
          },
          onResult: (result) => {
            // Add AI response to messages
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: result.message,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Add suggested actions if available
            if (result.suggestedActions && result.suggestedActions.length > 0) {
              const suggestionContent = `\n\n**You can also ask me to:**\n${result.suggestedActions.map((a: string) => `- ${a}`).join('\n')}`;
              const suggestionMessage: Message = {
                id: `suggestion-${Date.now()}`,
                role: "assistant",
                content: suggestionContent,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, suggestionMessage]);
            }
          },
          onError: (errorMsg) => {
            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: `Sorry, I encountered an error: ${errorMsg}`,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          },
          onNavigation: (page, params) => {
            // Handle navigation from AI actions
            if (page === "editor" && params?.projectId) {
              router.push(`/editor/${params.projectId}`);
            } else if (page === "dashboard") {
              router.push("/dashboard");
            } else if (page === "workspaces") {
              router.push("/workspaces");
            } else if (page === "projects") {
              router.push("/projects");
            } else if (page === "tasks") {
              router.push("/tasks");
            }
          },
        }
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle action confirmation
  const handleConfirmAction = async () => {
    if (!pendingAction?.actionId) return;

    setIsConfirming(true);
    try {
      const confirm = (window as any).__aiDrawerConfirm;
      if (confirm) {
        await confirm();
      }
      setPendingAction(null);
    } catch (error) {
      console.error("Confirm action error:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle action cancellation
  const handleCancelAction = async () => {
    if (!pendingAction?.actionId) return;

    try {
      const cancel = (window as any).__aiDrawerCancel;
      if (cancel) {
        await cancel();
      }
      setPendingAction(null);
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
    pendingAction,
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (sessions.length > 0) {
                  const currentIdx = sessions.findIndex(
                    (s) => s.id === currentSession
                  );
                  const nextIdx = (currentIdx + 1) % sessions.length;
                  const nextId = sessions[nextIdx].id;
                  setCurrentSession(nextId);
                  loadMessages(nextId);
                }
              }}
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
              <span>New AI chat</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (sessions.length > 0) {
                  const currentIdx = sessions.findIndex(
                    (s) => s.id === currentSession
                  );
                  const nextIdx = (currentIdx + 1) % sessions.length;
                  const nextId = sessions[nextIdx].id;
                  setCurrentSession(nextId);
                  loadMessages(nextId);
                }
              }}
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
              <span>New AI chat</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
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
