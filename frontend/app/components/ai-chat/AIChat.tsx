"use client";

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  useCallback,
} from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  X,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  BookOpen,
  FileText,
  Lightbulb,
  PenLine,
  CheckCircle2,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AIService from "../../lib/utils/aiService";
import BillingService from "../../lib/utils/billingService";
import AIModelAccessControl from "../../lib/utils/aiModelAccessControl";
import { ChatModeSelector, type ChatMode } from "../research/ChatModeSelector";
import {
  aiActionService,
  AIActionResult,
  formatActionType,
  getActionIcon,
  isDestructiveAction,
  getConfirmationButtonText,
} from "../../lib/utils/aiActionService";
import { useRouter } from "next/navigation";

// Enhanced interfaces for the new functionality
interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  message_type: "text" | "image" | "file" | "suggestion";
  image_url?: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  project_id?: string;
  created_at: string;
  last_message_at: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  isCurrent: boolean;
}

interface Notification {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  aiMode: boolean;
  searchMode: boolean;
  projectId?: string; // Add projectId prop
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
      full_name?: string;
      first_name?: string;
    };
  }; // Add user prop for personalization
  onSendPrompt?: string; // Add prop for sending prompts
}

export function AIChatPanel({
  isOpen,
  editor,
  projectId,
  user,
  onSendPrompt,
}: AIChatPanelProps) {
  // State for tracking panel width (for responsive text sizing)
  const [panelWidth, setPanelWidth] = useState<number>(320); // Default width
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle external prompt sending
  const lastSentPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (onSendPrompt && onSendPrompt !== lastSentPromptRef.current) {
      // Store the prompt to avoid re-sending
      lastSentPromptRef.current = onSendPrompt;
      // Call appendMessage with the provided prompt
      appendMessage(onSendPrompt);
    }
  }, [onSendPrompt]);

  // Effect to observe panel width changes
  useEffect(() => {
    if (!panelRef.current) return;

    // Create a ResizeObserver to monitor panel width changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        setPanelWidth(width);
      }
    });

    resizeObserver.observe(panelRef.current);

    // Set initial width
    setPanelWidth(panelRef.current.offsetWidth);

    // Cleanup observer on unmount
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate responsive font size based on panel width
  const calculateFontSize = useCallback(() => {
    // Define min and max widths and corresponding font sizes
    const minWidth = 240; // Minimum panel width
    const maxWidth = 600; // Maximum panel width
    const minFontSize = 14; // Minimum font size in pixels
    const maxFontSize = 16; // Maximum font size in pixels
    // Clamp panel width between min and max
    const clampedWidth = Math.min(Math.max(panelWidth, minWidth), maxWidth);
    // Calculate font size using linear interpolation
    const fontSize =
      minFontSize +
      (maxFontSize - minFontSize) *
      ((clampedWidth - minWidth) / (maxWidth - minWidth));
    return fontSize;
  }, [panelWidth]);

  // Calculate responsive line height based on panel width
  const calculateLineHeight = useCallback(() => {
    // Define min and max widths and corresponding line heights
    const minWidth = 240;
    const maxWidth = 600;
    const minLineHeight = 1.4; // Minimum line height
    const maxLineHeight = 1.6; // Maximum line height
    // Clamp panel width between min and max
    const clampedWidth = Math.min(Math.max(panelWidth, minWidth), maxWidth);

    // Calculate line height using linear interpolation
    const lineHeight =
      minLineHeight +
      (maxLineHeight - minLineHeight) *
      ((clampedWidth - minWidth) / (maxWidth - minWidth));

    return lineHeight;
  }, [panelWidth]);

  // Calculate responsive font size for small text based on panel width
  const calculateSmallFontSize = useCallback(() => {
    // Define min and max widths and corresponding font sizes for small text
    const minWidth = 240;
    const maxWidth = 600;
    const minFontSize = 12; // Minimum small font size in pixels
    const maxFontSize = 13; // Maximum small font size in pixels
    // Clamp panel width between min and max
    const clampedWidth = Math.min(Math.max(panelWidth, minWidth), maxWidth);
    // Calculate font size using linear interpolation
    const fontSize =
      minFontSize +
      (maxFontSize - minFontSize) *
      ((clampedWidth - minWidth) / (maxWidth - minWidth));
    return fontSize;
  }, [panelWidth]);

  // Calculate responsive font size for extra small text based on panel width
  const calculateExtraSmallFontSize = useCallback(() => {
    // Define min and max widths and corresponding font sizes for extra small text
    const minWidth = 240;
    const maxWidth = 600;
    const minFontSize = 10; // Minimum extra small font size in pixels
    const maxFontSize = 11; // Maximum extra small font size in pixels
    // Clamp panel width between min and max
    const clampedWidth = Math.min(Math.max(panelWidth, minWidth), maxWidth);
    // Calculate font size using linear interpolation
    const fontSize =
      minFontSize +
      (maxFontSize - minFontSize) *
      ((clampedWidth - minWidth) / (maxWidth - minWidth));
    return fontSize;
  }, [panelWidth]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Enhanced state for AI chat functionality
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState("gpt-4o-mini");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [, setAvailableModels] = useState<AIModel[]>([]);
  const [lockedModels, setLockedModels] = useState<Set<string>>(new Set());
  const [, setUserPlan] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [notifications] = useState<Notification[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  // AI Mode States
  const [aiModeState] = useState<"chat" | "editor">("chat");
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepSearchEnabled, setDeepSearchEnabled] = useState(false);
  const [usageLimits, setUsageLimits] = useState({
    webSearches: { used: 0, limit: 0 },
    deepSearches: { used: 0, limit: 0 },
  });

  // Dropdown states
  const [showAiModeDropdown, setShowAiModeDropdown] = useState(false);
  const [showSearchModeDropdown, setShowSearchModeDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea when input changes
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to correctly calculate scrollHeight
      textareaRef.current.style.height = "auto";
      // Set height to scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const aiModeDropdownRef = useRef<HTMLDivElement>(null);
  const searchModeDropdownRef = useRef<HTMLDivElement>(null);
  const lastInitializedProjectId = useRef<string | null>(null);
  const isInitializing = useRef<boolean>(false);

  // Research Co-Pilot state (stubbed - feature removed in productivity pivot)
  const [chatMode, setChatMode] = useState<ChatMode>("general");
  const [showCitationPanel, setShowCitationPanel] = useState(false);
  const [showPaperPanel, setShowPaperPanel] = useState(false);
  const [showGapPanel, setShowGapPanel] = useState(false);
  const research = { isLoading: false, error: null, data: null };

  // AI Action System State
  const [pendingAction, setPendingAction] = useState<AIActionResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const router = useRouter();

  // Check user plan
  const checkUserPlan = useCallback(async () => {
    try {
      const subscription = await BillingService.getCurrentSubscription();
      const planId = subscription.plan.id;
      setUserPlan(planId);
      // All users have access to AI chat, but with different limits
      setHasAccess(true);
    } catch (err) {
      console.error("Error checking subscription:", err);
      // Even if we can't verify the subscription, we still allow access
      setHasAccess(true);
    }
  }, []);

  // Fetch usage limits for AI features
  const fetchUsageLimits = useCallback(async () => {
    try {
      const usageMetrics = await BillingService.getUsageMetrics();

      // Extract specific AI feature limits
      const webSearchMetric = usageMetrics.find(
        (metric) => metric.name === "AI Web Searches",
      );
      const deepSearchMetric = usageMetrics.find(
        (metric) => metric.name === "AI Deep Searches",
      );

      setUsageLimits({
        webSearches: {
          used: webSearchMetric?.used || 0,
          limit:
            typeof webSearchMetric?.limit === "number"
              ? webSearchMetric.limit
              : 0,
        },
        deepSearches: {
          used: deepSearchMetric?.used || 0,
          limit:
            typeof deepSearchMetric?.limit === "number"
              ? deepSearchMetric.limit
              : 0,
        },
      });
    } catch (err) {
      console.error("Error fetching usage limits:", err);
    }
  }, []);

  const selectSearchMode = (mode: "web" | "deep" | "none") => {
    if (mode === "web") {
      setWebSearchEnabled(true);
      setDeepSearchEnabled(false);
    } else if (mode === "deep") {
      setWebSearchEnabled(false);
      setDeepSearchEnabled(true);
    } else {
      setWebSearchEnabled(false);
      setDeepSearchEnabled(false);
    }
  };

  // Load available models with access control
  const loadAvailableModels = useCallback(async () => {
    try {
      // Get models with access information
      const modelsWithAccess =
        await AIModelAccessControl.getModelsWithAccessInfo();

      // Transform to AIModel format
      const transformedModels = modelsWithAccess.map((model) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        maxTokens: model.maxTokens,
        isCurrent: model.id === currentModel,
      }));

      setAvailableModels(transformedModels);

      // Set locked models
      const locked = new Set<string>(
        modelsWithAccess
          .filter((model) => model.isLocked)
          .map((model) => model.id),
      );
      setLockedModels(locked);

      // Check if current model is locked
      const currentModelLocked = modelsWithAccess.find(
        (m) => m.id === currentModel,
      )?.isLocked;
      if (currentModelLocked) {
        // Switch to first available model
        const firstAvailable = modelsWithAccess.find((m) => !m.isLocked);
        if (firstAvailable) {
          setCurrentModel(firstAvailable.id);
        }
      }
    } catch (error: any) {
      console.error("Error loading available models:", error);
      setError(error.message || "Failed to load available models");
    }
  }, [currentModel]);


  // Refresh usage limits when toggles change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchUsageLimits();
      }, 1000); // Refresh after 1 second to allow for usage updates

      return () => clearTimeout(timer);
    }
  }, [isOpen, webSearchEnabled, deepSearchEnabled, fetchUsageLimits]);

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        aiModeDropdownRef.current &&
        !aiModeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAiModeDropdown(false);
      }
      if (
        searchModeDropdownRef.current &&
        !searchModeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSearchModeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Create a new chat session
  const createSession = useCallback(
    async (title: string = "New Chat") => {
      try {
        // Clear current state before creating new session
        setMessages([]);

        const session = await AIService.createChatSession(
          projectId || "",
          title,
        );
        setSessionId(session.id);
        setSessions((prev) => [session, ...prev]);

        // Add welcome message for new session
        console.log("User data in createSession:", user);
        const userName =
          user?.user_metadata?.name ||
          user?.user_metadata?.full_name ||
          user?.user_metadata?.first_name ||
          user?.email ||
          "there";
        console.log("Determined userName:", userName);
        const welcomeMessage: ChatMessage = {
          id: "welcome-" + Date.now(),
          content: `Hello ${userName}! I'm ScholarForge AIai. How can I help you with your research paper today?`,
          role: "assistant",
          message_type: "text",
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);

        return session;
      } catch (error: any) {
        console.error("Error creating chat session:", error);
        setError(error.message || "Failed to create chat session");
        throw error;
      }
    },
    [hasAccess, projectId, user],
  );

  // Load chat sessions
  const loadSessions = useCallback(async () => {
    try {
      const chatSessions = await AIService.getChatSessions(projectId);
      setSessions(chatSessions);
    } catch (error: any) {
      console.error("Error loading chat sessions:", error);
      setError(error.message || "Failed to load chat sessions");
    }
  }, [hasAccess, projectId]);

  // Load chat messages for the session
  const loadMessages = useCallback(
    async (sessionId: string) => {
      try {
        setIsLoading(true);
        console.log("Refreshing messages for session:", sessionId);
        const chatMessages = await AIService.getChatMessages(sessionId);
        console.log("Retrieved messages:", chatMessages);
        setMessages(chatMessages);

        // If there are no messages, add a welcome message
        console.log("User data in loadMessages:", user);
        if (chatMessages.length === 0) {
          console.log("No messages found, showing welcome message");
          const userName =
            user?.user_metadata?.name ||
            user?.user_metadata?.full_name ||
            user?.user_metadata?.first_name ||
            user?.email ||
            "there";
          console.log("Determined userName:", userName);
          const welcomeMessage: ChatMessage = {
            id: "welcome-" + Date.now(),
            content: `Hello ${userName}! I'm ScholarForge AI. How can I help you with your research paper today?`,
            role: "assistant",
            message_type: "text",
            created_at: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
        } else {
          console.log(`Loaded ${chatMessages.length} messages`);
        }
      } catch (error: any) {
        console.error("Error loading chat messages:", error);
        setError(error.message || "Failed to load chat messages");
      } finally {
        setIsLoading(false);
      }
    },
    [hasAccess, user],
  );

  // Load available models, user plan, and INITIALIZE HISTORY
  useEffect(() => {
    if (isOpen && projectId) {
      // 1. Core initialization for every open
      loadAvailableModels();
      checkUserPlan();
      fetchUsageLimits();

      // 2. History Hydration - ONLY if we haven't already initialized this project in this mount lifecycle
      const initializeHistory = async () => {
        if (isInitializing.current || lastInitializedProjectId.current === projectId) {
          return;
        }

        try {
          isInitializing.current = true;
          console.log("Initializing AI Chat history for project:", projectId);

          const chatSessions = await AIService.getChatSessions(projectId);
          setSessions(chatSessions);

          if (chatSessions && chatSessions.length > 0) {
            // Pick most recent session
            const latestSession = chatSessions[0]; // Assuming backend sorts by desc date
            setSessionId(latestSession.id);
            await loadMessages(latestSession.id);
          } else {
            // No history, show welcome message
            const userName =
              user?.user_metadata?.name ||
              user?.user_metadata?.full_name ||
              user?.user_metadata?.first_name ||
              user?.email ||
              "there";

            const welcomeMessage: ChatMessage = {
              id: "welcome-" + Date.now(),
              content: `Hello ${userName}! I'm ScholarForge AI. How can I help you with your research paper today?`,
              role: "assistant",
              message_type: "text",
              created_at: new Date().toISOString(),
            };
            setMessages([welcomeMessage]);
            setSessionId(null);
          }

          lastInitializedProjectId.current = projectId;
        } catch (err) {
          console.error("Failed to initialize AI Chat history:", err);
        } finally {
          isInitializing.current = false;
        }
      };

      initializeHistory();
    }
  }, [isOpen, projectId, loadAvailableModels, checkUserPlan, fetchUsageLimits, loadMessages, user?.id]);

  // Send a message
  const sendMessage = async () => {
    // Check if user has reached their web search limit
    if (
      webSearchEnabled &&
      usageLimits.webSearches.used >= usageLimits.webSearches.limit &&
      usageLimits.webSearches.limit !== -1
    ) {
      setError(
        "You've reached your web search limit. Please upgrade your plan or wait for your usage to reset.",
      );
      return;
    }

    // Check if user has reached their deep search limit
    if (
      deepSearchEnabled &&
      usageLimits.deepSearches.used >= usageLimits.deepSearches.limit &&
      usageLimits.deepSearches.limit !== -1
    ) {
      setError(
        "You've reached your deep search limit. Please upgrade your plan or wait for your usage to reset.",
      );
      return;
    }

    if ((!inputValue.trim() && !selectedImage) || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create session if it doesn't exist
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await createSession();
        currentSessionId = session.id;
      }

      // Handle image upload if selected
      let imageUrl = null;
      if (selectedImage) {
        try {
          const analysisResult = await AIService.analyzeImage(selectedImage);
          imageUrl = analysisResult.image?.image_url || null;
        } catch (error: any) {
          console.error("Error analyzing image:", error);
          // Continue with the message even if image analysis fails
        }
      }

      // Prepare message data
      const messageData: any = {
        sessionId: currentSessionId,
        content: inputValue,
        messageType: selectedImage ? "image" : "text",
        imageUrl: imageUrl,
        fileUrl: null,
        metadata: {
          webSearchEnabled,
          deepSearchEnabled,
        },
        model: currentModel,
      };

      // Regular chat mode

      // Send message to backend
      const result = await AIService.sendChatMessage(messageData);

      // Handle different AI modes and features
      console.log("Current AI mode:", aiModeState);
      if (aiModeState === "editor") {
        // In editor mode, we need to process the AI response differently
        // We'll check if the response contains content that should be inserted into the editor
        const aiResponse = result.aiMessage.content;
        console.log("Editor mode response:", aiResponse);

        console.log("Raw aiMessage:", result.aiMessage);
        console.log("aiResponse:", aiResponse);

        // Extract content specifically marked for editor insertion
        let contentToInsert = extractEditorContent(aiResponse);
        console.log("contentToInsert before cleaning:", contentToInsert);
        console.log("Extracted content for insertion:", contentToInsert);

        // Remove any remaining markers before inserting
        contentToInsert = contentToInsert
          .replace(/\[INSERT INTO EDITOR\]/g, "")
          .replace(/\[\/INSERT INTO EDITOR\]/g, "")
          .replace(/\[WEB SEARCH\](.*?)\[\/WEB SEARCH\]/g, "")
          .replace(/\[DEEP SEARCH\](.*?)\[\/DEEP SEARCH\]/g, "")
          .replace(/\[IMAGE REQUEST\](.*?)\[\/IMAGE REQUEST\]/g, "");

        console.log("Content to insert after marker removal:", contentToInsert);

        // Clean the content
        const cleanedContent = contentToInsert
          .trim()
          .replace(/^\n+/, "") // Remove leading newlines
          .replace(/\n+$/, ""); // Remove trailing newlines

        console.log("cleanedContent:", cleanedContent);
        console.log("onInsertContent in AIChat:", typeof onInsertContent);

        // Insert content into the editor with proper formatting
        // Using insertContent directly for better control over formatting
        if (onInsertContent) {
          console.log("Cleaned AI content:", cleanedContent);

          // Ensure we don't have empty content that would cause Tiptap warnings
          if (cleanedContent.trim() !== "") {
            // Format content properly for Tiptap insertion
            const formattedContent = formatContentForTiptap(cleanedContent);

            console.log("Formatted content for Tiptap:", formattedContent);

            // Insert the formatted content
            console.log("Attempting to insert content into editor");
            onInsertContent(formattedContent);
            console.log("Content insertion attempt completed");
          } else {
            console.log("Skipping empty content insertion");
          }
        }
      } else {
        // In chat mode, ensure no content is inserted into the editor
        console.log("Chat mode: No content will be inserted into editor");
      }

      // Update messages with both user and AI responses
      setMessages((prev) => [...prev, result.userMessage, result.aiMessage]);

      // Clear input
      setInputValue("");
      removeImage();
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(error.message || "Failed to send message");
      if (error.message === "AI_LIMIT_REACHED") {
        setError(
          "You've reached your AI usage limit. Please upgrade your plan.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    await sendMessage();
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Load session and messages when component mounts or projectId changes
  useEffect(() => {
    if (!isOpen || !projectId) return;

    // Initialize only once when panel opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    let hasInitialized = false;

    const initializeChat = async () => {
      if (hasInitialized) return;
      hasInitialized = true;

      try {
        // Reset state
        setMessages([]);
        setInputValue("");
        removeImage();
        setError(null);

        // Load sessions
        const chatSessions = await AIService.getChatSessions(projectId);
        setSessions(chatSessions);

        if (chatSessions && chatSessions.length > 0) {
          const session = chatSessions[0]; // Use the most recent session
          setSessionId(session.id);
          // Load messages for this session
          const chatMessages = await AIService.getChatMessages(session.id);
          setMessages(chatMessages);

          // Show welcome message if no messages
          if (chatMessages.length === 0) {
            const userName =
              user?.user_metadata?.name ||
              user?.user_metadata?.full_name ||
              user?.email ||
              "there";
            const welcomeMessage: ChatMessage = {
              id: "welcome-" + Date.now(),
              content: `Hello ${userName}! I'm ScholarForge AI. How can I help you with your research paper today?`,
              role: "assistant",
              message_type: "text",
              created_at: new Date().toISOString(),
            };
            setMessages([welcomeMessage]);
          }
        } else {
          // Create a new session if none exists
          const session = await AIService.createChatSession(
            projectId,
            "New Chat",
          );
          setSessionId(session.id);
          setSessions([session]);

          // Add welcome message
          const userName =
            user?.user_metadata?.name ||
            user?.user_metadata?.full_name ||
            user?.email ||
            "there";
          const welcomeMessage: ChatMessage = {
            id: "welcome-" + Date.now(),
            content: `Hello ${userName}! I'm ScholarForge AI. How can I help you with your research paper today?`,
            role: "assistant",
            message_type: "text",
            created_at: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        setError("Failed to initialize chat");
      }
    };

    initializeChat();
  }, [isOpen, projectId, user]);

  // Switch to a different session
  const switchSession = async (session: ChatSession) => {
    try {
      // Clear current messages before loading new session
      setMessages([]);
      setSessionId(session.id);
      await loadMessages(session.id);
      setShowSessions(false);
    } catch (error: any) {
      console.error("Error switching session:", error);
      setError(error.message || "Failed to switch session");
    }
  };

  // Create a new session
  const handleCreateNewSession = async () => {
    try {
      // Use the entered title or a default one
      const title = newSessionTitle.trim() || "New Chat";
      const session = await createSession(title);
      setSessionId(session.id);
      setNewSessionTitle("");
      setShowSessions(false);
    } catch (error: any) {
      console.error("Error creating new session:", error);
      setError(error.message || "Failed to create new session");
    }
  };

  // Delete a session
  const handleDeleteSession = async (sessionIdToDelete: string) => {
    try {
      await AIService.deleteChatSession(sessionIdToDelete);
      setSessions((prev) =>
        prev.filter((session) => session.id !== sessionIdToDelete),
      );
      if (sessionId === sessionIdToDelete) {
        // Clear current session state
        setSessionId(null);
        setMessages([]);

        // If we deleted the current session, switch to the first available session or create a new one
        const remainingSessions = sessions.filter(
          (session) => session.id !== sessionIdToDelete,
        );
        if (remainingSessions.length > 0) {
          const newSession = remainingSessions[0];
          await switchSession(newSession);
        } else {
          await createSession().catch(console.error);
        }
      }
    } catch (error: any) {
      console.error("Error deleting session:", error);
      setError(error.message || "Failed to delete session");
    }
  };

  // Add a helper function to preprocess AI content
  const preprocessContent = (content: string): string => {
    if (!content) return "";

    console.log("Original content:", JSON.stringify(content.substring(0, 200)));

    const processed = content
      // First, decode HTML entities that might wrap the br tags
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      // Convert HTML <br> tags (various forms) to newlines
      .replace(/<br\s*\/?>/gi, "\n")
      // Fix double pipes to single pipes
      .replace(/\|\|/g, "|")
      // Handle table header separator lines - any line with |--- patterns
      .replace(/\n\|[-\s|]+\n/g, (match) => {
        // Count cells by splitting on |
        const cells = match.split("|").filter(c => c.trim().length > 0);
        if (cells.length > 0) {
          // Create proper markdown separator
          return "\n|" + cells.map(() => " --- ").join("|") + "|\n";
        }
        return "\n";
      })
      // Remove AI markers
      .replace(/\[\/?[A-Z\s]+(?:\s+[A-Z\s]+)*\]/g, "");

    console.log("Processed content:", JSON.stringify(processed.substring(0, 200)));
    return processed;
  };

  // Add a helper function to extract content between editor markers
  const extractEditorContent = (content: string): string => {
    // Look for content between [INSERT INTO EDITOR] and [/INSERT INTO EDITOR] markers
    // Using [\s\S] instead of . with /s flag for compatibility with older ES targets
    const markerRegex =
      /\[INSERT INTO EDITOR\]([\s\S]*?)\[\/INSERT INTO EDITOR\]/;
    const match = content.match(markerRegex);

    if (match && match[1]) {
      return match[1].trim();
    }

    // If no markers found, return the entire content (fallback)
    return content.trim();
  };

  // Add a helper function to format content for Tiptap insertion
  const formatContentForTiptap = (content: string): string => {
    console.log("Formatting content for Tiptap:", content);

    // Remove excessive whitespace and normalize
    const normalizedContent = content
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with double newline
      .trim();

    console.log("Normalized content:", normalizedContent);

    // If content is empty, return empty string
    if (normalizedContent === "") {
      return "";
    }

    // Split by paragraphs (double newlines)
    const paragraphs = normalizedContent.split("\n\n");
    console.log("Paragraphs:", paragraphs);

    // Format each paragraph
    const formattedParagraphs = paragraphs
      .map((paragraph) => {
        // Trim and escape HTML entities
        const trimmed = paragraph.trim();
        if (trimmed === "") {
          return "";
        }

        // Escape HTML characters to prevent injection
        const escaped = trimmed
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

        return `<p>${escaped}</p>`;
      })
      .filter((p) => p !== ""); // Remove empty paragraphs

    const result = formattedParagraphs.join("");
    console.log("Formatted result:", result);
    return result;
  };

  // Original functionality preserved
  const getSelectedText = () => {
    if (!editor || !editor.state) return "";
    const { from, to, empty } = editor.state.selection;
    if (empty) return "";
    return editor.state.doc.textBetween(from, to);
  };

  const getDocumentContext = () => {
    if (!editor || !editor.state || !editor.state.doc) return "";
    return editor.state.doc.textContent.slice(0, 500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      message_type: "text",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Replace direct API call with AIService method
      const response = await AIService.processAIRequest(
        "chat",
        inputValue,
        getDocumentContext(),
      );

      let parsedContent = "";
      if (typeof response === "string") {
        parsedContent = response;
      } else if (response && typeof response === "object") {
        parsedContent = response.text || response.content || response.response || response.suggestion || response.result || JSON.stringify(response, null, 2);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          parsedContent ||
          "I apologize, but I couldn't generate a response. Please try again.",
        message_type: "text",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        message_type: "text",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const appendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      message_type: "text",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Use the AI Action Service for intelligent action processing
      await aiActionService.sendMessage(
        content,
        {
          pageContext: "editor", // or derive from router
          currentProjectId: projectId || undefined,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          onConfirmationRequired: (action, confirm, cancel) => {
            setPendingAction(action);
            // Store the confirm/cancel callbacks
            (window as any).__aiActionConfirm = confirm;
            (window as any).__aiActionCancel = cancel;
          },
          onResult: (result) => {
            // Add AI response to messages
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: result.message,
              message_type: "text",
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Add suggested actions as follow-up if available
            if (result.suggestedActions && result.suggestedActions.length > 0) {
              const suggestionMessage: ChatMessage = {
                id: `suggestion-${Date.now()}`,
                role: "assistant",
                content: `\n\n**You can also ask me to:**\n${result.suggestedActions.map(a => `- ${a}`).join('\n')}`,
                message_type: "suggestion",
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, suggestionMessage]);
            }
          },
          onError: (errorMsg) => {
            const errorMessage: ChatMessage = {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: `Sorry, I encountered an error: ${errorMsg}`,
              message_type: "text",
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
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        message_type: "text",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle action confirmation
  const handleConfirmAction = async () => {
    if (!pendingAction?.actionId) return;

    setIsConfirming(true);
    try {
      const confirm = (window as any).__aiActionConfirm;
      if (confirm) {
        await confirm();
      }
      setPendingAction(null);
    } catch (error: any) {
      console.error("Confirm action error:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle action cancellation
  const handleCancelAction = async () => {
    if (!pendingAction?.actionId) return;

    try {
      const cancel = (window as any).__aiActionCancel;
      if (cancel) {
        await cancel();
      }
      setPendingAction(null);
    } catch (error: any) {
      console.error("Cancel action error:", error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickActions = [
    {
      icon: <Wand2 className="h-3.5 w-3.5" />,
      label: "Improve",
      prompt: "Improve the writing quality of this text",
    },
    {
      icon: <PenLine className="h-3.5 w-3.5" />,
      label: "Fix grammar",
      prompt: "Fix all grammar and spelling errors",
    },
    {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: "Summarize",
      prompt: "Summarize this content concisely",
    },
    {
      icon: <BookOpen className="h-3.5 w-3.5" />,
      label: "Citations",
      prompt: "Suggest citations for this section",
    },
    {
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      label: "Expand",
      prompt: "Expand on this topic with more detail",
    },
  ];

  const handleQuickAction = (prompt: string) => {
    const selectedText = getSelectedText();
    const fullPrompt = selectedText
      ? `${prompt}:\n\n"${selectedText}"`
      : prompt;
    appendMessage(fullPrompt);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const insertIntoEditor = (content: string) => {
    if (!editor) {
      console.error("Editor is not available");
      return;
    }

    try {
      // Remove any AI-specific markers
      let cleanContent = content
        .replace(/\[INSERT INTO EDITOR\]/g, "")
        .replace(/\[\/INSERT INTO EDITOR\]/g, "")
        .replace(/\[WEB SEARCH\](.*?)\[\/WEB SEARCH\]/g, "")
        .replace(/\[DEEP SEARCH\](.*?)\[\/DEEP SEARCH\]/g, "")
        .replace(/\[IMAGE REQUEST\](.*?)\[\/IMAGE REQUEST\]/g, "")
        .trim();

      // Simple markdown to HTML conversion
      cleanContent = cleanContent
        // Headers
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        // Bold
        .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.*?)\*/gim, "<em>$1</em>")
        // Line breaks - convert double newlines to paragraphs
        .split("\n\n")
        .map((para) =>
          para.trim() ? `<p>${para.replace(/\n/g, "<br>")}</p>` : "",
        )
        .filter(Boolean)
        .join("");

      // Insert the content at cursor position
      editor.chain().focus().insertContent(cleanContent).run();

      console.log("Content inserted successfully");
    } catch (error) {
      console.error("Error inserting content into editor:", error);
    }
  };

  // Add missing onInsertContent function
  const onInsertContent = (content: string) => {
    if (editor) {
      editor.chain().focus().insertContent(content).run();
    }
  };

  if (!isOpen) return null;

  // Calculate responsive text styles
  const responsiveFontSize = calculateFontSize();
  const responsiveLineHeight = calculateLineHeight();
  const responsiveSmallFontSize = calculateSmallFontSize();
  const responsiveExtraSmallFontSize = calculateExtraSmallFontSize();

  return (
    <div
      ref={panelRef}
      className="h-full w-full flex flex-col bg-white"
      style={{
        // Apply responsive font size and line height to the entire panel
        fontSize: `${responsiveFontSize}px`,
        lineHeight: responsiveLineHeight,
      }}>
      {/* Sessions Modal */}
      {showSessions && (
        <div className="absolute inset-y-4 right-4 bg-white z-10 flex flex-col shadow-lg border border-white rounded-lg w-96 overflow-x-hidden">
          <div
            className="p-4 border-b border-white"
            style={{
              fontSize: "inherit",
              lineHeight: "inherit",
            }}>
            <div className="flex items-center justify-between">
              <h3
                className="font-semibold"
                style={{
                  fontSize: "inherit",
                  lineHeight: "inherit",
                }}>
                Chat Sessions
              </h3>
              <button
                onClick={() => setShowSessions(false)}
                className="p-1 rounded hover:bg-gray-100"
                style={{
                  fontSize: "inherit",
                  lineHeight: "inherit",
                }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto p-4 overflow-x-hidden"
            style={{
              fontSize: "inherit",
              lineHeight: "inherit",
            }}>
            <div className="mb-4">
              <input
                type="text"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="New session title"
                className="w-full px-3 py-2 border border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!hasAccess}
                style={{
                  fontSize: "inherit",
                  lineHeight: "inherit",
                }}
              />
              <button
                onClick={handleCreateNewSession}
                className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
                disabled={!hasAccess}
                style={{
                  fontSize: "inherit",
                  lineHeight: "inherit",
                }}>
                <Plus size={16} className="mr-2" />
                Create New Session
              </button>
            </div>

            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${sessionId === session.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-white hover:bg-gray-50"
                    }`}
                  onClick={() => switchSession(session)}>
                  <div
                    style={{
                      fontSize: "inherit",
                      lineHeight: "inherit",
                    }}>
                    <div
                      className="font-medium"
                      style={{
                        fontSize: "inherit",
                        lineHeight: "inherit",
                      }}>
                      {session.title}
                    </div>
                    <div
                      className="text-xs text-black"
                      style={{
                        fontSize: `${responsiveExtraSmallFontSize}px`,
                        lineHeight: "inherit",
                      }}>
                      {new Date(session.last_message_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="p-1 text-red-500 hover:bg-red-100 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="p-2 bg-red-100 border-b border-red-200 text-red-700 text-sm"
          style={{
            fontSize: "inherit",
            lineHeight: "inherit",
          }}>
          {error}
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div
          className="p-2 border-b border-green-200"
          style={{
            fontSize: "inherit",
            lineHeight: "inherit",
          }}>
          <div className="space-y-1">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-2 bg-green-100 text-green-700 text-sm rounded flex items-center"
                style={{
                  fontSize: "inherit",
                  lineHeight: "inherit",
                }}>
                <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
                <span>{notification.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Action Confirmation Dialog */}
      {pendingAction && (
        <div className="absolute inset-x-4 top-20 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className={`p-4 ${isDestructiveAction(pendingAction.actionType || '') ? 'bg-red-50 border-b border-red-100' : 'bg-blue-50 border-b border-blue-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDestructiveAction(pendingAction.actionType || '') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {isDestructiveAction(pendingAction.actionType || '') ? (
                  <AlertTriangle size={20} />
                ) : (
                  <span className="text-lg">{getActionIcon(pendingAction.actionType || '')}</span>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {isDestructiveAction(pendingAction.actionType || '') ? 'Confirm Action' : 'Confirm Action'}
                </h4>
                <p className="text-sm text-gray-600">
                  {formatActionType(pendingAction.actionType || '')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <p className="text-gray-700 mb-4">{pendingAction.message}</p>

            {pendingAction.data?.intent && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <p className="text-gray-600 font-medium mb-1">Action details:</p>
                <pre className="text-xs text-gray-500 overflow-x-auto">
                  {JSON.stringify(pendingAction.data.intent.parameters, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCancelAction}
                disabled={isConfirming}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {getConfirmationButtonText(pendingAction.actionType || '').cancel}
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isConfirming}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isDestructiveAction(pendingAction.actionType || '')
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isConfirming ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {getConfirmationButtonText(pendingAction.actionType || '').confirm}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col mt-0">
        {/* Research Mode Selector */}
        <div className="p-3 border-b border-border">
          <div className="flex flex-col gap-2">
            <ChatModeSelector mode={chatMode} onChange={setChatMode} />
            {chatMode === "research" && (
              <div className="flex gap-1 flex-wrap justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs bg-blue-500 hover:bg-blue-500 hover:text-white"
                  onClick={() => setShowCitationPanel(!showCitationPanel)}>
                  Cite
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs bg-blue-500 hover:bg-blue-500 hover:text-white"
                  onClick={() => setShowPaperPanel(!showPaperPanel)}>
                  Papers
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs bg-blue-500 hover:bg-blue-500 hover:text-white"
                  onClick={() => setShowGapPanel(!showGapPanel)}>
                  Gaps
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 p-3 border-b border-border">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="default" // Changed to default (solid)
              size="sm"
              className="h-7 text-xs gap-1 bg-blue-600 border border-blue-700 text-white hover:bg-blue-700 hover:border-blue-800 shadow-sm transition-all font-medium"
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isLoading}>
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "flex-row-reverse" : "",
                )}>
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className={
                      message.role === "assistant"
                        ? "bg-green-500 text-white font-bold"
                        : "bg-gray-500 text-white font-bold"
                    }>
                    {message.role === "assistant" ? "AI" : "U"}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-[85%] shadow-sm",
                    message.role === "user"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-black border border-white",
                  )}>
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code: ({ node, ...props }) => (
                            <code
                              className="bg-gray-100 p-1 rounded"
                              style={{
                                fontSize: `${responsiveSmallFontSize * 0.85}px`,
                              }}
                              {...props}
                            />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="font-bold" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="mb-2 last:mb-0" {...props} />
                          ),
                        }}>
                        {preprocessContent(String(message.content || ""))}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {String(message.content || "")}
                    </p>
                  )}

                  {message.role === "assistant" && message.id !== "welcome" && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Copy to clipboard"
                        className="h-6 w-6 bg-red-500 text-red-100 hover:bg-red-600 hover:text-red-200"
                        onClick={() =>
                          copyToClipboard(message.content, message.id)
                        }>
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Insert into editor"
                        className="h-6 w-6 bg-green-500 text-green-100 hover:bg-green-600 hover:text-green-200"
                        onClick={() => insertIntoEditor(message.content)}>
                        <FileText className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Refresh"
                        className="h-6 w-6 bg-yellow-500 text-yellow-100 hover:bg-yellow-600 hover:text-yellow-200"
                        onClick={() => {
                          // Add refresh functionality here
                          console.log(
                            "Refresh button clicked, current sessionId:",
                            sessionId,
                          );
                          if (sessionId) {
                            loadMessages(sessionId);
                          } else {
                            console.log("No sessionId available for refresh");
                            setError(
                              "Unable to refresh: No active chat session",
                            );
                          }
                        }}>
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card text-card-foreground border border-border rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Research Panels */}

        {/* Image preview */}
        {imagePreview && hasAccess && (
          <div className="px-4 py-2 border-t border-border bg-white overflow-x-hidden">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-16 w-16 object-cover rounded border"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-3 bg-white text-black bg-gray-50/50">
          {/* Context Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
                @
              </div>
              Add context
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 shadow-sm group cursor-pointer hover:border-gray-300 transition-colors whitespace-nowrap">
              <FileText size={14} className="text-gray-400" />
              <span className="truncate max-w-[120px]">Current document</span>
              <button
                type="button"
                className="ml-1 hover:text-red-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // potential handle remove context logic here
                }}>
                <X
                  size={12}
                  className="text-gray-400 group-hover:text-inherit"
                />
              </button>
            </div>
          </div>

          {/* Main Input Box */}
          <div className="relative bg-white border border-gray-200 rounded-xl shadow-sm focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
            <textarea
              ref={textareaRef}
              placeholder="Ask AI, use @ to mention specific PDFs or / to access saved prompts"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || !hasAccess}
              className="w-full border-0 bg-transparent py-4 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:ring-0 focus:outline-none outline-none resize-none min-h-[100px] overflow-hidden"
            />

            {/* Image Preview */}
            {imagePreview && hasAccess && (
              <div className="px-4 pb-2">
                <div className="relative inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg pr-8 pl-2 py-1 gap-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-8 w-8 object-cover rounded"
                  />
                  <span className="text-xs text-gray-500 truncate max-w-[100px]">
                    {selectedImage?.name}
                  </span>
                  <button
                    onClick={removeImage}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Toolbar */}
            <div className="flex flex-wrap items-center justify-between px-3 pb-3 pt-1 gap-y-2">
              {/* Left Actions */}
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                  disabled={!hasAccess}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()} // Reuse same ref for attachment generic icon
                  className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <div className="rotate-45">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !hasAccess}
                  className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <ImageIcon size={16} />
                </Button>
              </div>

              {/* Right Actions & Toggles */}
              <div className="flex items-center gap-2">
                {/* Web Search Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    selectSearchMode(webSearchEnabled ? "none" : "web")
                  }
                  className={`flex items-center gap-1.5 px-1 py-1 rounded-full transition-colors ${webSearchEnabled ? "bg-purple-100" : "bg-transparent"}`}>
                  <div
                    className={`w-9 h-5 rounded-full relative transition-colors ${webSearchEnabled ? "bg-purple-500" : "bg-gray-200"}`}>
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${webSearchEnabled ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${webSearchEnabled ? "text-purple-700" : "text-gray-500"}`}>
                    Web
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    selectSearchMode(deepSearchEnabled ? "none" : "deep")
                  } // Mapping library to deep search for now or handled separately
                  className={`flex items-center gap-1.5 px-1 py-1 rounded-full transition-colors ${deepSearchEnabled ? "bg-purple-100" : "bg-transparent"}`}>
                  <div
                    className={`w-9 h-5 rounded-full relative transition-colors ${deepSearchEnabled ? "bg-purple-500" : "bg-gray-200"}`}>
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${deepSearchEnabled ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${deepSearchEnabled ? "text-purple-700" : "text-gray-500"}`}>
                    Library
                  </span>
                </button>

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className={`h-8 w-8 flex items-center justify-center rounded-full transition-all ${inputValue.trim()
                    ? "bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg"
                    : "bg-blue-200 text-white cursor-not-allowed"
                    }`}>
                  <div className="w-4 h-4">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
