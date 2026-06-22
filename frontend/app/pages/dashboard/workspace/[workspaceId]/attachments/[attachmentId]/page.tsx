"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  FileImage,
  File,
  Loader2,
  Highlighter,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  Lightbulb,
  MessageSquare,
  Pin,
  Eraser,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "../../../../../../lib/supabase/client";
import { cn } from "../../../../../../lib/utils";
import dynamic from "next/dynamic";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Dynamically import the PDF viewer sub-component to avoid pdfjs-dist canvas build error
// @ts-ignore - dynamic import in bracket-route folder, TS can't resolve but works at runtime
const PDFViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => null,
});

interface Attachment {
  id: string;
  task_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  task?: { id: string; title: string; status: string };
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  created_at: string;
}

interface AIChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
}

const FALLBACK_QUESTIONS = [
  "What are the main topics in this document?",
  "Summarize the key findings",
  "Extract important data points",
  "What conclusions can be drawn?",
  "Explain technical terms used",
];

const ANNOTATION_COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function AttachmentAnnotationPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const attachmentId = params.attachmentId as string;

  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  // Text selection popup state
  const [selectedText, setSelectedText] = useState("");
  const [selectionPopup, setSelectionPopup] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  // Ref to capture selected text at the moment user clicks "Pin Comment"
  // (avoids losing the text if selection is cleared before save)
  const capturedTextRef = useRef<string>("");

  // Pinned comments state
  const [pinnedComments, setPinnedComments] = useState<
    Array<{
      id: string;
      text: string;
      comment: string;
      x: number;
      y: number;
      created_at: string;
    }>
  >([]);
  const [pinnedCommentsLoaded, setPinnedCommentsLoaded] = useState(false);

  // Fetch pinned comments from API on mount
  useEffect(() => {
    if (!attachmentId) return;

    const fetchComments = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) return;

        const res = await fetch(`/api/ai/pinned-comments/${attachmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.comments) {
            setPinnedComments(data.comments);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch pinned comments", err);
      } finally {
        setPinnedCommentsLoaded(true);
      }
    };

    fetchComments();
  }, [attachmentId]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [pendingPinPosition, setPendingPinPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const selectionPopupRef = useRef<HTMLDivElement>(null);

  const [activeColor, setActiveColor] = useState(ANNOTATION_COLORS[0]);
  const [activeTool, setActiveTool] = useState<
    "highlight" | "draw" | "pdf-highlight" | "eraser" | null
  >(null);

  // PDF highlight state
  const [pdfHighlights, setPdfHighlights] = useState<
    Array<{
      id: string;
      text: string;
      color: string;
      pageNumber: number;
      // Bounding box relative to the page element
      rects: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    }>
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(`pdf_highlights_${attachmentId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save PDF highlights to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        `pdf_highlights_${attachmentId}`,
        JSON.stringify(pdfHighlights),
      );
    } catch {
      // ignore
    }
  }, [pdfHighlights, attachmentId]);
  // PDF text selection tracking for highlighting
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  const [zoom, setZoom] = useState(100);
  // PDF viewer state (lifted from PDFViewer sub-component)
  const [pdfScale, setPdfScale] = useState(1.2);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // AI Assistant state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiMessages, setAIMessages] = useState<AIChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your PDF Research Assistant. I can read and analyze the full text of this document, and I'm aware of your highlights and annotations. Ask me anything about the document — summarize sections, explain concepts, extract key data, or answer specific questions!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [aiInput, setAIInput] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] =
    useState<string[]>(FALLBACK_QUESTIONS);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  // File type flags (declared early so they're available in useEffect hooks below)
  const isImage = attachment
    ? attachment.file_type.startsWith("image/")
    : false;
  const isPDF = attachment ? attachment.file_type.includes("pdf") : false;

  // Auto-resize textarea height as user types
  const adjustTextareaHeight = () => {
    const textarea = aiInputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [aiInput]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // Fetch AI-generated suggested questions when panel opens
  useEffect(() => {
    if (!showAIPanel || !attachment?.file_url) return;
    // Only fetch if we still have fallback questions (not yet fetched)
    if (suggestedQuestions !== FALLBACK_QUESTIONS) return;

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) return;

        const res = await fetch("/api/ai/pdf-chat/suggest-questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileUrl: attachment.file_url,
            fileName: attachment.name || "document.pdf",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.questions?.length > 0) {
            setSuggestedQuestions(data.questions);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch suggested questions", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [showAIPanel, attachment?.file_url]);

  // ── Text selection popup logic ──────────────────────────────────────────

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionPopup({ visible: false, x: 0, y: 0 });
      setSelectedText("");
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2) return;

    // Verify the selection is inside our container
    const container = containerRef.current;
    if (container && !container.contains(selection.anchorNode)) {
      setSelectionPopup({ visible: false, x: 0, y: 0 });
      setSelectedText("");
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Only show for PDF text selections (not image annotations)
    if (!isPDF) {
      setSelectionPopup({ visible: false, x: 0, y: 0 });
      setSelectedText("");
      return;
    }

    setSelectedText(text);
    setSelectionPopup({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  // Listen for text selection on mouseup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseUp = () => {
      // Small delay to let the selection settle
      setTimeout(handleTextSelection, 10);
    };

    container.addEventListener("mouseup", onMouseUp);
    document.addEventListener("selectionchange", handleTextSelection);

    return () => {
      container.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("selectionchange", handleTextSelection);
    };
  }, [isPDF]);

  // ── PDF Highlight creation on text selection ───────────────────────────

  const handlePdfHighlight = () => {
    if (activeTool !== "pdf-highlight") return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text || text.length < 2) return;

    const range = selection.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer))
      return;

    // Find which page element contains this selection
    const pageEl = range.commonAncestorContainer?.parentElement?.closest(
      "[data-page-number]",
    ) as HTMLElement | null;
    const pageNumber = pageEl
      ? parseInt(pageEl.dataset.pageNumber || "1", 10)
      : 1;

    // Get bounding rectangles relative to the page element
    const pageRect = pageEl?.getBoundingClientRect();
    const rangeRects = Array.from(range.getClientRects());
    const rects = rangeRects.map((r) => ({
      x: r.left - (pageRect?.left || 0),
      y: r.top - (pageRect?.top || 0),
      width: r.width,
      height: r.height,
    }));

    if (rects.length === 0) return;

    // Create the highlight
    const newHighlight = {
      id: Date.now().toString(),
      text,
      color: activeColor,
      pageNumber,
      rects,
    };

    setPdfHighlights((prev) => [...prev, newHighlight]);
    selection.removeAllRanges();
  };

  // Listen for text selection to auto-create PDF highlights
  useEffect(() => {
    if (!isPDF || activeTool !== "pdf-highlight") return;

    const container = containerRef.current;
    if (!container) return;

    const onMouseUp = () => {
      setTimeout(() => {
        handlePdfHighlight();
      }, 50);
    };

    container.addEventListener("mouseup", onMouseUp);
    return () => container.removeEventListener("mouseup", onMouseUp);
  }, [isPDF, activeTool, activeColor]);

  // Eraser: click on highlight to remove it
  const handleEraserClick = (e: React.MouseEvent) => {
    if (activeTool !== "eraser") return;

    // Find if we clicked on a highlight overlay
    const target = e.target as HTMLElement;
    const highlightEl = target.closest("[data-highlight-id]");
    if (highlightEl) {
      const highlightId = highlightEl.getAttribute("data-highlight-id");
      if (highlightId) {
        setPdfHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      }
    }
  };

  // Hide popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectionPopupRef.current &&
        !selectionPopupRef.current.contains(e.target as Node)
      ) {
        setSelectionPopup({ visible: false, x: 0, y: 0 });
        setSelectedText("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // "Ask AI" from selection — opens panel and sends selected text
  const handleAskAIFromSelection = () => {
    if (!selectedText) return;
    setShowAIPanel(true);
    setShowSuggestedQuestions(false);
    const prompt = `Regarding this excerpt from the document: "${selectedText}"\n\n`;
    setAIInput(prompt);
    setSelectionPopup({ visible: false, x: 0, y: 0 });

    // Focus textarea after state updates
    setTimeout(() => {
      aiInputRef.current?.focus();
    }, 100);
  };

  // "Pin Comment" — show inline comment input near selection
  const handlePinComment = () => {
    if (!selectedText) return;
    // Capture the selected text in a ref so it survives selection loss
    capturedTextRef.current = selectedText;
    setPendingPinPosition({
      x: selectionPopup.x,
      y: selectionPopup.y + 40,
    });
    setShowCommentInput(true);
    setSelectionPopup({ visible: false, x: 0, y: 0 });
  };

  // Save pinned comment to database
  const handleSaveComment = async () => {
    if (!commentText.trim() || !pendingPinPosition || !attachmentId) return;

    // Use captured text from ref (set when user clicked "Pin Comment")
    const textToSave = capturedTextRef.current || selectedText;
    if (!textToSave || !textToSave.trim()) {
      console.warn("No selected text for pinned comment");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const payload = {
        attachmentId,
        selectedText: textToSave.trim(),
        comment: commentText.trim(),
        positionX: pendingPinPosition.x,
        positionY: pendingPinPosition.y,
      };

      const res = await fetch("/api/ai/pinned-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn("Failed to save pinned comment:", res.status, errorData);
        return;
      }

      const data = await res.json();
      if (data.success && data.comment) {
        setPinnedComments((prev) => [...prev, data.comment]);
      }
    } catch (err) {
      console.warn("Failed to save pinned comment", err);
    }

    setCommentText("");
    setShowCommentInput(false);
    setPendingPinPosition(null);
    setSelectedText("");
    capturedTextRef.current = "";
  };

  // Cancel pinned comment
  const handleCancelComment = () => {
    setCommentText("");
    setShowCommentInput(false);
    setPendingPinPosition(null);
    setSelectedText("");
    capturedTextRef.current = "";
  };

  // Handle sending AI message
  const handleSendAIMessage = async () => {
    if (!aiInput.trim() || !attachment) return;

    const userMessage: AIChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: aiInput,
      timestamp: new Date().toISOString(),
    };

    setAIMessages((prev) => [...prev, userMessage]);
    const currentInput = aiInput;
    setAIInput("");
    setShowSuggestedQuestions(false);
    setIsAILoading(true);

    try {
      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      // Build conversation history for context (last 10 messages)
      const conversationHistory = aiMessages.slice(-10).map((msg) => ({
        role: msg.type === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      // Call the PDF chat API
      const res = await fetch("/api/ai/pdf-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileUrl: attachment.file_url,
          fileName: attachment.name,
          message: currentInput,
          annotations: annotations.map((a) => ({
            text: a.text,
            color: a.color,
          })),
          conversationHistory,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "AI request failed");
      }

      const data = await res.json();

      const assistantMessage: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          data.response ||
          "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setAIMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("AI chat error:", error);
      const errorMessage: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setAIMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAILoading(false);
    }
  };

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    setAIInput(question);
  };

  // Load attachment
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(
          `/api/workspaces/${workspaceId}/attachments?limit=100`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("Failed to load attachment");
        const data = await res.json();
        const found = data.attachments.find(
          (a: Attachment) => a.id === attachmentId,
        );
        if (!found) throw new Error("Attachment not found");
        setAttachment(found);

        // Try to load saved annotations from localStorage
        const savedAnnotations = localStorage.getItem(
          `annotations_${attachmentId}`,
        );
        if (savedAnnotations) {
          setAnnotations(JSON.parse(savedAnnotations));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [workspaceId, attachmentId]);

  // Draw annotations on canvas
  useEffect(() => {
    if (!attachment || !canvasRef.current) return;
    if (!attachment.file_type.startsWith("image/")) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Redraw annotations
      annotations.forEach((ann) => {
        ctx.fillStyle = ann.color + "44";
        ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
        if (ann.text) {
          ctx.fillStyle = ann.color;
          ctx.font = "12px sans-serif";
          ctx.fillText(ann.text, ann.x + 4, ann.y - 4);
        }
      });
    };
    img.src = attachment.file_url;
  }, [attachment, annotations]);

  // Save annotations
  const saveAnnotations = () => {
    localStorage.setItem(
      `annotations_${attachmentId}`,
      JSON.stringify(annotations),
    );
    alert("Annotations saved!");
  };

  // Add annotation
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = (canvasRef.current?.width || 1) / rect.width;
    const scaleY = (canvasRef.current?.height || 1) / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setIsDrawing(true);
    setDrawStart({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = (canvasRef.current?.width || 1) / rect.width;
    const scaleY = (canvasRef.current?.height || 1) / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    // Preview drawing (redraw with current rect)
    const ctx = canvasRef.current.getContext("2d");
    if (ctx && imgRef.current) {
      ctx.drawImage(imgRef.current, 0, 0);
      annotations.forEach((ann) => {
        ctx.fillStyle = ann.color + "44";
        ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
      });
      ctx.fillStyle = activeColor + "44";
      ctx.fillRect(drawStart.x, drawStart.y, x - drawStart.x, y - drawStart.y);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    setIsDrawing(false);
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = (canvasRef.current?.width || 1) / rect.width;
    const scaleY = (canvasRef.current?.height || 1) / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const width = x - drawStart.x;
    const height = y - drawStart.y;
    if (Math.abs(width) < 5 || Math.abs(height) < 5) return;

    const text =
      activeTool === "highlight"
        ? prompt("Add a note to this annotation:") || ""
        : "";
    setAnnotations((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        x: drawStart.x,
        y: drawStart.y,
        width,
        height,
        text,
        color: activeColor,
        created_at: new Date().toISOString(),
      },
    ]);
    setDrawStart(null);
  };

  // Clear all annotations
  const clearAnnotations = () => {
    if (confirm("Remove all annotations?")) {
      setAnnotations([]);
      localStorage.removeItem(`annotations_${attachmentId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !attachment) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background text-muted-foreground">
        <File className="w-12 h-12 mb-3 text-gray-300" />
        <p>{error || "Attachment not found"}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-background border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <h2 className="font-semibold text-foreground truncate max-w-md">
            {attachment.name}
          </h2>
          <span className="text-xs text-muted-foreground">
            {formatSize(attachment.file_size)}
          </span>
          {attachment.task && (
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
              {attachment.task.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* PDF Highlight & Eraser tools (always visible for PDFs) */}
          {isPDF && (
            <>
              <button
                onClick={() => {
                  setActiveTool(
                    activeTool === "pdf-highlight" ? null : "pdf-highlight",
                  );
                }}
                className={cn(
                  "p-2 rounded-lg text-sm transition-colors",
                  activeTool === "pdf-highlight"
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "text-muted-foreground hover:bg-muted",
                )}
                title="Highlight text in PDF"
              >
                <Highlighter className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setActiveTool(activeTool === "eraser" ? null : "eraser");
                }}
                className={cn(
                  "p-2 rounded-lg text-sm transition-colors",
                  activeTool === "eraser"
                    ? "bg-red-500/10 text-red-500"
                    : "text-muted-foreground hover:bg-muted",
                )}
                title="Erase highlights"
              >
                <Eraser className="w-4 h-4" />
              </button>

              {/* Color picker for PDF highlight */}
              {activeTool === "pdf-highlight" && (
                <div className="flex items-center gap-1 px-2">
                  {ANNOTATION_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        activeColor === c
                          ? "border-gray-800 scale-110"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}

              {pdfHighlights.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all highlights?")) {
                      setPdfHighlights([]);
                    }
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                  title="Clear all highlights"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="h-5 w-px bg-gray-200" />
            </>
          )}

          {isImage && (
            <>
              {/* Image Annotation tools */}
              <button
                onClick={() => {
                  setActiveTool(
                    activeTool === "highlight" ? null : "highlight",
                  );
                  setActiveColor(ANNOTATION_COLORS[0]);
                }}
                className={cn(
                  "p-2 rounded-lg text-sm transition-colors",
                  activeTool === "highlight"
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "text-muted-foreground hover:bg-muted",
                )}
                title="Highlighter"
              >
                <Highlighter className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setActiveTool(activeTool === "draw" ? null : "draw");
                  setActiveColor("#FF6B6B");
                }}
                className={cn(
                  "p-2 rounded-lg text-sm transition-colors",
                  activeTool === "draw"
                    ? "bg-red-500/10 text-red-500"
                    : "text-muted-foreground hover:bg-muted",
                )}
                title="Draw annotation"
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* Color picker */}
              {activeTool && (
                <div className="flex items-center gap-1 px-2">
                  {ANNOTATION_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        activeColor === c
                          ? "border-gray-800 scale-110"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}

              <div className="h-5 w-px bg-border" />
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground w-10 text-center">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.max(25, z - 25))}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="h-5 w-px bg-border" />

              <button
                onClick={saveAnnotations}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={clearAnnotations}
                className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* PDF Zoom & Page Controls */}
          {isPDF && pdfNumPages > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg">
              <button
                onClick={() => setPdfScale((s) => Math.max(0.5, s - 0.2))}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-muted-foreground w-10 text-center font-medium">
                {Math.round(pdfScale * 100)}%
              </span>
              <button
                onClick={() => setPdfScale((s) => Math.min(3, s + 0.2))}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {pdfNumPages} page{pdfNumPages > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* AI Assistant Button */}
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm",
              showAIPanel
                ? "bg-purple-500/10 text-purple-500"
                : "text-muted-foreground hover:bg-muted",
            )}
            title="AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
            Ask AI
          </button>

          <a
            href={attachment.file_url}
            download={attachment.name}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-sm rounded-lg hover:bg-foreground/80"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Document viewer */}
        <div
          ref={containerRef}
          className={cn(
            "flex-1 overflow-auto flex min-h-0",
            isPDF ? "bg-black" : "items-center justify-center p-4",
          )}
        >
          {isImage ? (
            <div className="flex items-center justify-center w-full h-full">
              <div
                className="relative"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center",
                }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className={cn(
                    "max-w-full max-h-[80vh] rounded-lg shadow-lg",
                    activeTool && "cursor-crosshair",
                  )}
                />
                {activeTool && (
                  <div className="absolute top-2 left-2 bg-background/90 text-xs px-2 py-1 rounded shadow text-foreground">
                    {activeTool === "highlight"
                      ? "Click & drag to highlight"
                      : "Click & drag to draw annotation"}
                  </div>
                )}
              </div>
            </div>
          ) : isPDF ? (
            <PDFViewer
              fileUrl={attachment.file_url}
              fileName={attachment.name}
              scale={pdfScale}
              onScaleChange={setPdfScale}
              onPageCount={setPdfNumPages}
              highlights={pdfHighlights}
              onEraserClick={handleEraserClick}
              isEraserActive={activeTool === "eraser"}
            />
          ) : (
            <div className="text-center">
              <File className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                {attachment.name}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {formatSize(attachment.file_size)}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Preview not available for this file type
              </p>
              <a
                href={attachment.file_url}
                download={attachment.name}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          )}
        </div>

        {/* AI Assistant Panel */}
        {showAIPanel && (
          <div className="w-96 border-l border-border bg-background flex flex-col min-h-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  PDF AI Assistant
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Document + Annotations Context
                </p>
              </div>
              <button
                onClick={() => setShowAIPanel(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.type === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs rounded-lg px-3 py-2 text-sm",
                      msg.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900",
                    )}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        msg.type === "user" ? "text-blue-100" : "text-gray-500",
                      )}
                    >
                      {format(new Date(msg.timestamp), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}

              {isAILoading && (
                <div className="flex gap-2 justify-start">
                  <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {showSuggestedQuestions && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  <Lightbulb className="w-3 h-3 inline mr-1" />
                  Suggested
                  {isLoadingSuggestions && (
                    <span className="ml-1 text-purple-500 animate-pulse">
                      generating...
                    </span>
                  )}
                </p>
                <div className="space-y-1.5">
                  {suggestedQuestions.slice(0, 5).map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(question)}
                      disabled={isLoadingSuggestions}
                      className="w-full text-left text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={aiInputRef}
                  value={aiInput}
                  onChange={(e) => setAIInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAIMessage();
                    }
                  }}
                  placeholder="Ask about this document..."
                  rows={1}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none overflow-y-auto"
                  style={{ minHeight: "40px", maxHeight: "150px" }}
                />
                <button
                  onClick={handleSendAIMessage}
                  disabled={!aiInput.trim() || isAILoading}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Annotations list */}
      {annotations.length > 0 && (
        <div className="border-t border-gray-200 bg-white px-6 py-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Annotations ({annotations.length})
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {annotations.map((ann) => (
              <div
                key={ann.id}
                className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-2 min-w-[160px]"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ann.color }}
                  />
                  <span className="text-[10px] text-gray-500">
                    {format(new Date(ann.created_at), "HH:mm")}
                  </span>
                  <button
                    onClick={() =>
                      setAnnotations((prev) =>
                        prev.filter((a) => a.id !== ann.id),
                      )
                    }
                    className="ml-auto p-0.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {ann.text && (
                  <p className="text-xs text-gray-700">{ann.text}</p>
                )}
                {!ann.text && (
                  <p className="text-xs text-gray-400 italic">No note</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Text Selection Floating Popup ─────────────────────────────────── */}
      {selectionPopup.visible && selectedText && (
        <div
          ref={selectionPopupRef}
          className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            left: `${Math.min(selectionPopup.x, window.innerWidth - 220)}px`,
            top: `${Math.max(selectionPopup.y - 50, 10)}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex items-center gap-1 bg-white rounded-xl shadow-xl border border-gray-200 p-1.5">
            <button
              onClick={handleAskAIFromSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              title="Ask AI about this selection"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={handlePinComment}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              title="Pin a comment on this selection"
            >
              <Pin className="w-3.5 h-3.5" />
              Pin Comment
            </button>
          </div>
          {/* Arrow pointing down */}
          <div className="flex justify-center -mt-px">
            <div className="w-2.5 h-2.5 bg-white border-r border-b border-gray-200 rotate-45" />
          </div>
        </div>
      )}

      {/* ── Pinned Comment Input Popup ─────────────────────────────────────── */}
      {showCommentInput && pendingPinPosition && (
        <div
          className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            left: `${Math.min(pendingPinPosition.x, window.innerWidth - 280)}px`,
            top: `${Math.max(pendingPinPosition.y, 10)}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-64">
            {selectedText && (
              <div className="mb-2 px-2 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-[10px] text-yellow-700 font-medium mb-0.5">
                  Selected text:
                </p>
                <p className="text-xs text-yellow-800 line-clamp-2 italic">
                  &ldquo;{selectedText}&rdquo;
                </p>
              </div>
            )}
            <textarea
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveComment();
                }
                if (e.key === "Escape") {
                  handleCancelComment();
                }
              }}
              placeholder="Write your comment..."
              rows={2}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-1.5 mt-2">
              <button
                onClick={handleCancelComment}
                className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveComment}
                disabled={!commentText.trim()}
                className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Save Pin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pinned Comments Display ────────────────────────────────────────── */}
      {pinnedComments.map((pin) => (
        <div
          key={pin.id}
          className="fixed z-40 animate-in fade-in duration-300"
          style={{
            left: `${Math.min(pin.x, window.innerWidth - 220)}px`,
            top: `${Math.max(pin.y, 10)}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-2.5 w-52">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Pin className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] text-gray-400">
                {format(new Date(pin.created_at), "HH:mm")}
              </span>
              <button
                onClick={async () => {
                  // Optimistically remove from UI
                  setPinnedComments((prev) =>
                    prev.filter((p) => p.id !== pin.id),
                  );
                  // Delete from database
                  try {
                    const { data: sessionData } =
                      await supabase.auth.getSession();
                    const token = sessionData?.session?.access_token;
                    if (!token) return;
                    await fetch(`/api/ai/pinned-comments/${pin.id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                  } catch (err) {
                    console.warn("Failed to delete pinned comment", err);
                  }
                }}
                className="ml-auto p-0.5 text-gray-400 hover:text-red-500 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="px-2 py-1 bg-yellow-50 border border-yellow-100 rounded mb-1.5">
              <p className="text-[10px] text-yellow-700 line-clamp-1 italic">
                &ldquo;{pin.text}&rdquo;
              </p>
            </div>
            <p className="text-xs text-gray-700">{pin.comment}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
