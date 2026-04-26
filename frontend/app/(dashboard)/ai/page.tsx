"use client";

import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  SquarePen,
  Plus,
  MoreHorizontal,
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
  aiActionService,
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
      {/* Messages */}
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
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-10 h-10">
                  <circle cx="50" cy="50" r="45" fill="#F5F5F5" />
                  <ellipse cx="50" cy="55" rx="20" ry="25" fill="#E8E8E8" />
                  <circle cx="42" cy="45" r="3" fill="#333" />
                  <circle cx="58" cy="45" r="3" fill="#333" />
                  <path d="M45 55 Q50 60 55 55" stroke="#333" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-gray-800 mb-6">
              How can I help you today?
            </h2>

            {/* Quick Actions */}
            <div className="w-full grid grid-cols-2 gap-3">
              {[
                { icon: "🏢", label: "Create workspace", prompt: "Create a workspace called My Research" },
                { icon: "📄", label: "Create project", prompt: "Create a project called Research Paper" },
                { icon: "✅", label: "Create task", prompt: "Create a task called Review literature" },
                { icon: "📊", label: "Summarize document", prompt: "Summarize the current document" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.prompt)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
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

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          {/* AI Action Confirmation Dialog */}
          {pendingAction && (
            <div className="mb-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
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

          <div className="relative bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Do anything with AI..."
              className="w-full min-h-[60px] px-4 py-3 text-sm text-gray-700 bg-transparent border-0 resize-none focus:outline-none focus:ring-0"
              rows={1}
            />

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Auto</span>
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
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<AIActionResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingSession, setRenamingSession] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter sessions based on search
  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.lastMessage?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        createNewSession();
      } else {
        setCurrentSession(sessions[0].id);
        loadMessages(sessions[0].id);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      // Create mock sessions for demo
      setSessions([
        { id: "1", title: "Help with dashboard charts", lastMessage: "Here's how to create charts...", updatedAt: new Date().toISOString() },
        { id: "2", title: "Create Notion dashboard instructions", lastMessage: "Let me help you set up...", updatedAt: new Date().toISOString() },
      ]);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const data = await apiClient.get(`/api/ai/chat/session/${sessionId}/messages`);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
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
      const newSession = {
        id: `session-${Date.now()}`,
        title: "New chat",
        updatedAt: new Date().toISOString()
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
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      );
      setRenamingSession(null);
      setNewTitle("");
    } catch (error) {
      console.error("Failed to rename session:", error);
      // Still update locally for demo
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
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
      await aiActionService.sendMessage(
        userMessage.content,
        {
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          onConfirmationRequired: (action, confirm, cancel) => {
            setPendingAction(action);
            (window as any).__aiPageConfirm = confirm;
            (window as any).__aiPageCancel = cancel;
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
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Sidebar - Chat History */}
      <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50/50 h-screen shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              <span className="text-sm font-medium">Home</span>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={createNewSession}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                title="New chat"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          <div className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wide">
            Older
          </div>

          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${currentSession === session.id
                ? "bg-white shadow-sm border border-gray-200"
                : "hover:bg-gray-100"
                }`}
            >
              <button
                onClick={() => {
                  setCurrentSession(session.id);
                  loadMessages(session.id);
                }}
                className="flex-1 flex items-start gap-3 min-w-0"
              >
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
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
                      className="w-full px-2 py-1 text-sm bg-white border border-blue-500 rounded outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-sm text-gray-700 truncate">{session.title}</p>
                  )}
                  {session.lastMessage && renamingSession !== session.id && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{session.lastMessage}</p>
                  )}
                </div>
              </button>
              {/* Action buttons - visible on hover */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRenaming(session);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                  title="Rename"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this chat?")) {
                      deleteSession(session.id);
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
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
          pendingAction={pendingAction}
          isConfirming={isConfirming}
          onConfirmAction={handleConfirmAction}
          onCancelAction={handleCancelAction}
        />
      </div>
    </div>
  );
}
