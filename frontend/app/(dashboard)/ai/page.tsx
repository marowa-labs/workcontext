"use client";

import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  SquarePen,
  Plus,
  MessageSquare,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../../lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AIActionResult,
  formatActionType,
  getActionIcon,
  isDestructiveAction,
  getConfirmationButtonText,
} from "../../lib/utils/aiActionService";
import apiClient from "../../lib/utils/apiClient";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: string;
  message_count?: number;
  last_message_at?: string;
  created_at?: string;
}

// ── Chat Content Component ────────────────────────────────────────────────────
function ChatContent({
  messages,
  loading,
  input,
  setInput,
  sendMessage,
  handleKeyDown,
  textareaRef,
  messagesEndRef,
  messagesContainerRef,
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
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  pendingAction: AIActionResult | null;
  isConfirming: boolean;
  onConfirmAction: () => void;
  onCancelAction: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6 min-h-0 scrollbar-none"
      >
        <style jsx>{`
          .prose > * {
            max-width: 100%;
          }
          .prose pre,
          .prose pre code {
            overflow-x: auto;
            max-width: 100%;
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .prose code {
            max-width: 100%;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .prose p,
          .prose ul,
          .prose ol {
            overflow-wrap: break-word;
            word-wrap: break-word;
          }
          .prose table {
            display: block;
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
            border-collapse: collapse;
            -webkit-overflow-scrolling: touch;
          }
          .prose table th,
          .prose table td {
            max-width: 18rem;
            overflow-wrap: break-word;
            word-wrap: break-word;
          }
          .prose table th {
            white-space: normal;
          }
          .overflow-wrap-anywhere {
            overflow-wrap: anywhere;
          }
        `}</style>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-10 h-10">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="currentColor"
                    className="text-muted-foreground/20"
                  />
                  <ellipse
                    cx="50"
                    cy="55"
                    rx="20"
                    ry="25"
                    fill="currentColor"
                    className="text-muted-foreground/30"
                  />
                  <circle
                    cx="42"
                    cy="45"
                    r="3"
                    fill="currentColor"
                    className="text-foreground"
                  />
                  <circle
                    cx="58"
                    cy="45"
                    r="3"
                    fill="currentColor"
                    className="text-foreground"
                  />
                  <path
                    d="M45 55 Q50 60 55 55"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-foreground"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-foreground mb-6">
              How can I help you today?
            </h2>

            {/* Quick Actions */}
            <div className="w-full grid grid-cols-2 gap-3">
              {[
                {
                  icon: "🏢",
                  label: "Create workspace",
                  prompt: "Create a workspace called My Research",
                },
                {
                  icon: "📄",
                  label: "Create project",
                  prompt: "Create a project called Research Paper",
                },
                {
                  icon: "✅",
                  label: "Create task",
                  prompt: "Create a task called Review literature",
                },
                {
                  icon: "📊",
                  label: "Summarize document",
                  prompt: "Summarize the current document",
                },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.prompt)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors text-left"
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
                  message.role === "user" ? "flex-row-reverse" : "",
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5 text-muted-foreground"
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
                    "min-w-0",
                    message.role === "user" ? "flex justify-end" : "flex-1",
                  )}
                >
                  <div
                    className={cn(
                      "text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2.5"
                        : "max-w-[95%] text-foreground prose prose-sm max-w-full break-words overflow-hidden prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-headings:text-foreground prose-li:text-foreground prose-a:text-blue-500",
                    )}
                    style={
                      message.role === "user"
                        ? { maxWidth: "85%", width: "fit-content" }
                        : undefined
                    }
                  >
                    {message.role === "user" ? (
                      <span>{message.content}</span>
                    ) : (
                      <div className="break-words overflow-hidden max-w-full">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">Thinking...</div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-background border-t border-border">
        <div className="max-w-3xl mx-auto">
          {/* AI Action Confirmation Dialog */}
          {pendingAction && (
            <div className="mb-4 bg-background rounded-xl shadow-lg border border-border overflow-hidden">
              <div
                className={`p-3 ${isDestructiveAction(pendingAction.actionType || "") ? "bg-red-500/10 border-b border-red-500/20" : "bg-blue-500/10 border-b border-blue-500/20"}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-full ${isDestructiveAction(pendingAction.actionType || "") ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                  >
                    {isDestructiveAction(pendingAction.actionType || "") ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <span className="text-base">
                        {getActionIcon(pendingAction.actionType || "")}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">
                      Confirm Action
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatActionType(pendingAction.actionType || "")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <p className="text-sm text-foreground mb-3 break-words">
                  {pendingAction.message}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={onCancelAction}
                    disabled={isConfirming}
                    className="flex-1 px-3 py-1.5 bg-muted text-foreground text-sm rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
                  >
                    {
                      getConfirmationButtonText(pendingAction.actionType || "")
                        .cancel
                    }
                  </button>
                  <button
                    onClick={onConfirmAction}
                    disabled={isConfirming}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-white text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1 ${
                      isDestructiveAction(pendingAction.actionType || "")
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {
                          getConfirmationButtonText(
                            pendingAction.actionType || "",
                          ).confirm
                        }
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="relative bg-background rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow border border-border">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Do anything with AI..."
              className="w-full min-h-[60px] px-4 py-3 text-sm text-foreground bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
              rows={1}
            />

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Auto</span>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 disabled:opacity-30 disabled:hover:text-muted-foreground disabled:hover:bg-transparent rounded-lg transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22,2 15,22 11,13 2,9 22,2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────────────────
export default function AIPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(() => {
    // Restore from localStorage on initial load
    if (typeof window === "undefined") return null;
    return localStorage.getItem("ai_current_session");
  });

  // Save current session to localStorage whenever it changes
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem("ai_current_session", currentSession);
    }
  }, [currentSession]);

  const [pendingAction, setPendingAction] = useState<AIActionResult | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingSession, setRenamingSession] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter sessions based on search
  const filteredSessions = sessions.filter(
    (session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.lastMessage?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ),
  );

  // Smart auto-scroll: only scroll when user is near the bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll to bottom when messages change, only if near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // Load sessions
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await apiClient.get("/api/ai/chat/sessions");
      const sessions = data.sessions || [];
      setSessions(sessions);

      if (!sessions.length) {
        // No existing sessions — start a fresh one
        await createNewSession();
      } else {
        // Try to restore the previously active session from localStorage
        const savedSessionId = localStorage.getItem("ai_current_session");
        const savedSession = savedSessionId
          ? sessions.find((s: ChatSession) => s.id === savedSessionId)
          : null;

        if (savedSession) {
          // Restore the saved session
          setCurrentSession(savedSession.id);
          await loadMessages(savedSession.id);
        } else {
          // Load the most recent session
          setCurrentSession(sessions[0].id);
          await loadMessages(sessions[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      // If API is unavailable, just create a new session
      await createNewSession();
    }
  };

  const loadMessages = async (sessionId: string) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    try {
      const data = await apiClient.get(
        `/api/ai/chat/session/${sessionId}/messages`,
      );
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    }
  };

  const createNewSession = async () => {
    try {
      const data = await apiClient.post("/api/ai/chat/session", {
        title: "New Chat",
      });
      setCurrentSession(data.session.id);
      setMessages([]);
      setSessions((prev) => [data.session, ...prev]);
    } catch (error) {
      console.error("Failed to create session:", error);
      const newSession = {
        id: `session-${Date.now()}`,
        title: "New chat",
        updatedAt: new Date().toISOString(),
      };
      setCurrentSession(newSession.id);
      setMessages([]);
      setSessions((prev) => [newSession, ...prev]);
    }
  };

  const renameSession = async (sessionId: string, title: string) => {
    try {
      await apiClient.patch(`/api/ai/chat/session/${sessionId}`, { title });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s)),
      );
      setRenamingSession(null);
      setNewTitle("");
    } catch (error) {
      console.error("Failed to rename session:", error);
      // Still update locally for demo
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s)),
      );
      setRenamingSession(null);
      setNewTitle("");
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await apiClient.delete(`/api/ai/chat/session/${sessionId}`, null);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSession === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      // Still delete locally for demo
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSession === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    }
  };

  const startRenaming = (session: ChatSession) => {
    setRenamingSession(session.id);
    setNewTitle(session.title);
  };

  const isSendingRef = useRef(false);

  const sendMessage = async () => {
    if (!input.trim() || loading || isSendingRef.current) return;
    isSendingRef.current = true;

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
      // Use the chat endpoint that saves messages to the database
      if (!currentSession) {
        throw new Error("No active session");
      }

      const response = await apiClient.post(
        `/api/ai/chat/session/${currentSession}/messages`,
        {
          sessionId: currentSession,
          content: userMessage.content,
          messageType: "text",
        },
      );

      if (response.success) {
        // Add assistant message from the saved response
        const assistantMessage: Message = {
          id: response.aiMessage.id,
          role: "assistant",
          content: response.aiMessage.content,
          created_at: response.aiMessage.created_at,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(response.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message || "Unknown error"}. Please try again.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      isSendingRef.current = false;

      // Auto-update session title based on first message
      const currentMsgCount = messages.length + 1; // +1 for the user message just added
      if (currentMsgCount <= 2 && currentSession) {
        const title =
          userMessage.content.length > 40
            ? userMessage.content.substring(0, 40).trim() + "..."
            : userMessage.content;
        // Update title in backend
        apiClient
          .patch(`/api/ai/chat/session/${currentSession}`, { title })
          .then(() => {
            // Update local state
            setSessions((prev) =>
              prev.map((s) => (s.id === currentSession ? { ...s, title } : s)),
            );
          })
          .catch(() => {
            // Silently fail — title update is not critical
          });
      }
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction?.actionId) return;

    setIsConfirming(true);
    try {
      const confirm = (window as any).__aiPageConfirm;
      if (confirm) await confirm();
      setPendingAction(null);
    } catch (error) {
      console.error("Confirm action error:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelAction = async () => {
    if (!pendingAction?.actionId) return;

    try {
      const cancel = (window as any).__aiPageCancel;
      if (cancel) await cancel();
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
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar - Chat History */}
      <div
        className={`${sidebarCollapsed ? "w-14" : "w-72"} border-r border-border flex flex-col bg-muted/30 h-screen shrink-0 transition-all duration-300`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            {sidebarCollapsed ? (
              <Link
                href="/dashboard"
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                title="Home"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-foreground hover:text-foreground"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
                <span className="text-sm font-medium">Home</span>
              </Link>
            )}
            <div className="flex items-center gap-1">
              {!sidebarCollapsed && (
                <button
                  onClick={createNewSession}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  title="New chat"
                >
                  <SquarePen className="w-4 h-4" />
                </button>
              )}
              {/* Collapse/Expand Toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!sidebarCollapsed && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-foreground"
              />
            </div>
          )}
        </div>

        {/* Chat List */}
        {!sidebarCollapsed ? (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
            {filteredSessions.length > 0 && (
              <div className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wide">
                Chat History
              </div>
            )}

            {filteredSessions.length === 0 && (
              <div className="px-3 py-8 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  No chat history yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start a new conversation
                </p>
              </div>
            )}
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                  currentSession === session.id
                    ? "bg-background shadow-sm border border-border"
                    : "hover:bg-muted"
                }`}
                onClick={() => {
                  setCurrentSession(session.id);
                  loadMessages(session.id);
                }}
              >
                <div className="flex-1 flex items-start gap-3 min-w-0">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {renamingSession === session.id ? (
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            renameSession(session.id, newTitle);
                          } else if (e.key === "Escape") {
                            setRenamingSession(null);
                            setNewTitle("");
                          }
                        }}
                        onBlur={() => {
                          if (newTitle.trim()) {
                            renameSession(session.id, newTitle);
                          } else {
                            setRenamingSession(null);
                            setNewTitle("");
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 text-sm bg-background border border-blue-500 rounded outline-none text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 truncate">
                        {session.title}
                      </p>
                    )}
                    {session.lastMessage && renamingSession !== session.id && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {session.lastMessage}
                      </p>
                    )}
                    {session.message_count !== undefined && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {session.message_count} message
                        {session.message_count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
                {/* Action buttons - visible on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRenaming(session);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                    title="Rename"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm("Are you sure you want to delete this chat?")
                      ) {
                        deleteSession(session.id);
                      }
                    }}
                    className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Collapsed sidebar - show minimal quick actions */
          <div className="flex-1 flex flex-col items-center gap-2 p-2">
            <button
              onClick={createNewSession}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="New chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatContent
          messages={messages}
          loading={loading}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          handleKeyDown={handleKeyDown}
          textareaRef={textareaRef}
          messagesEndRef={messagesEndRef}
          messagesContainerRef={messagesContainerRef}
          pendingAction={pendingAction}
          isConfirming={isConfirming}
          onConfirmAction={handleConfirmAction}
          onCancelAction={handleCancelAction}
        />
      </div>
    </div>
  );
}
