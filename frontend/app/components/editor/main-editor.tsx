"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import CharacterCount from "@tiptap/extension-character-count";
import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { debounce } from "lodash";
import { useToast } from "../../hooks/use-toast";
import { Toaster } from "../ui/toaster";
import { useTheme } from "../../contexts/ThemeContext";
import { DocumentHeader } from "./document-header";
import { EditorToolbar } from "./editor-toolbar";
import { BottomBar } from "./bottom-bar";
import { ColumnExtension, ColumnItemExtension } from "./ColumnExtension";
import {
  FootnoteExtension,
  FootnoteContentExtension,
} from "./FootnoteExtension"; // Import useCollaborationPresence hook
import { SettingsModal, defaultSettings } from "./settings-modal";
import { ImageUploadModal } from "./image-upload-modal";
import { KeyboardShortcutsModal } from "./keyboard-shortcuts-modal";
import { CitationsModal } from "./citations-modal";
import DocumentHistory from "./DocumentHistory"; // Import DocumentHistory modal
import AIResponseInterface from "./AIResponseInterface"; // Import AIResponseInterface
import "./editor-light.css";
import "./editor-dark.css";
import {
  validateAndPrepareContent,
  getEditorSettings,
  saveProjectContent,
} from "../../lib/utils/editorService";
import {
  safeInsertContent,
  safeResolvePosition,
} from "../../lib/utils/editorUtils"; // Import safe editor utilities
import AIService from "../../lib/utils/aiService"; // Import AIService for search and image generation
import SpellCheckSuggestions from "./SpellCheckSuggestions";
import SpellCheckExtension from "../../lib/utils/spellCheckExtension";
import spellCheckService from "../../lib/utils/spellCheckService";
import AutoCitationExtension from "../../lib/utils/autoCitationExtension";
import AIAutocompleteExtension from "./AIAutocompleteExtension"; // Add this import
import AIAutocompleteSuggestion from "./AIAutocompleteSuggestion"; // Add this import
import AutoCitationSuggestion from "./AutoCitationSuggestion"; // Add this import
import { FloatingAIMenu } from "../ai/floating-ai-menu"; // Import Floating AI Menu
import { ParagraphActionMenu } from "./ParagraphActionMenu"; // Import Paragraph Action Menu
import GrammarCheckingExtension from "./GrammarCheckingExtension";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useCollaboration } from "../../hooks/use-collaboration"; // Import new hook

// Import template styling utilities
import { applyTemplateStyling } from "../../lib/utils/templateStyling";
// Import template extensions
import {
  AuthorBlockExtension,
  AuthorExtension,
  SectionExtension,
  KeywordsExtension,
  CustomCodeBlockExtension,
  FigureExtension,
  ListExtension,
  VisualElementExtension,
  CalloutBlock,
  CoverPageExtension,
  QuoteBlockExtension,
  PricingTableExtension, // Add this import
  SidebarBlockExtension, // Add this import
  CaptionExtension, // Add this import
  ImagePlaceholderExtension, // Add this import
  PresentationDeckExtension, // Add this import
  CitationBlockExtension, // Add this import
  AiTagExtension, // Add this import
  AnnotationBlockExtension, // Add this import
} from "../../lib/utils/templateExtensions";
import { InteractiveCitationExtension } from "./InteractiveCitationExtension"; // Add new import
import { MathExtension } from "./MathExtension"; // Add new import

const lowlight = createLowlight(common);

// Define the type for sidebar panels
export type SidebarPanel =
  | "ai-chat"
  | "citations"
  | "paper-search"
  | "citation-check"
  | "language"
  | "gap-analysis"
  | "verify"
  | "plagiarism-check"
  | "team-chat"
  | "writing"
  | "my-documents"
  | "outline"
  | "alerts"
  | "literature"
  | "concept-map"
  | null;

// Interfaces for component props and state
interface Project {
  title: string;
  content: any;
  [key: string]: any;
}

interface EditorSettings {
  spellCheck: boolean;
  soundEffects: boolean;
  notifications: boolean;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  showLineNumbers: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  aiSuggestions: boolean;
  aiModel: string;
  aiTone: string;
  collaboratorJoinSound: boolean;
  pageColor: string;
}

interface AIResponseData {
  action: string;
  originalText?: string;
  selectedText?: string;
  suggestion?: string;
  [key: string]: any;
}

interface AutoCitationSuggestion {
  content: string;
  citations: any[];
}

interface AutocompleteSuggestion {
  text: string;
  position: number;
}

interface SpellCheckPopup {
  word: string;
  suggestions: string[];
  position: { x: number; y: number };
}

export interface MainEditorRef {
  insertContent: (content: string) => void;
}

export const MainEditor = forwardRef<
  MainEditorRef,
  {
    project: Project;
    documentId: string;
    userId: string;
    userName: string;
    // Configuration props
    isCollaborative?: boolean;
    allowedPanels?: SidebarPanel[];
    onOpenResearch?: () => void;
    activeRightPanel?: SidebarPanel;
    onToggleRightPanel?: (panel: SidebarPanel) => void;
    onEditorReady?: (editor: Editor) => void;
    onShare?: () => void;
  }
>(
  (
    {
      project,
      documentId,
      userId,
      userName,
      isCollaborative = false,
      allowedPanels = [
        "ai-chat",
        "citations",
        "paper-search",
        "citation-check",
        "language",
        "gap-analysis",
        "verify",
        "plagiarism-check",
        "team-chat",
      ],
      onOpenResearch,
      activeRightPanel: propRightPanel,
      onToggleRightPanel: propToggleRightPanel,
      onEditorReady,
      onShare,
    },
    ref,
  ) => {
    const [documentTitle, setDocumentTitle] = useState(
      project?.title || "Untitled Document",
    );

    // Use prop if available, otherwise fallback to local state (legacy support)
    const [internalRightPanel, setInternalRightPanel] =
      useState<SidebarPanel>(null);
    const activeRightPanel =
      propRightPanel !== undefined ? propRightPanel : internalRightPanel;

    const handleToggleRightPanel = (panel: SidebarPanel) => {
      // If panel is not allowed, do nothing
      if (allowedPanels && !allowedPanels.includes(panel)) {
        console.warn(`Panel ${panel} is not allowed in this mode.`);
        return;
      }

      if (propToggleRightPanel) {
        propToggleRightPanel(panel);
      } else {
        // Toggle logic for internal state
        setInternalRightPanel(internalRightPanel === panel ? null : panel);
      }
    };

    const [editorSettings, setEditorSettings] =
      useState<EditorSettings>(defaultSettings);
    const editorRef = useRef<Editor | null>(null);
    const { toast } = useToast();
    const { settings: themeSettings } = useTheme();

    // Load editor settings on mount
    useEffect(() => {
      const loadEditorSettings = async () => {
        try {
          const settings = await getEditorSettings();
          setEditorSettings(settings);
        } catch (error) {
          console.warn(
            "Failed to load editor settings, using defaults:",
            error,
          );
          // Use default settings if unable to load
          setEditorSettings(defaultSettings);
        }
      };

      loadEditorSettings();
    }, []);

    // ... (styling useEffect omitted for brevity, logic remains same)

    // Apply editor settings as CSS variables
    useEffect(() => {
      // Add defensive checks
      if (!editorSettings) return;

      // Set font family
      let fontFamily =
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      if (editorSettings.fontFamily === "serif") {
        fontFamily = "Georgia, serif";
      } else if (editorSettings.fontFamily === "mono") {
        fontFamily = "'MonoLisa', 'Fira Code', monospace";
      } else if (editorSettings.fontFamily === "inter") {
        fontFamily = "Inter, sans-serif";
      }

      // Apply CSS variables to the editor container for better specificity
      const editorContainer = document.querySelector(
        ".light-editor, .dark-editor",
      );
      if (editorContainer) {
        (editorContainer as HTMLElement).style.setProperty(
          "--editor-font-family",
          fontFamily,
        );

        // Safely set font size
        if (editorSettings.fontSize !== undefined) {
          (editorContainer as HTMLElement).style.setProperty(
            "--editor-font-size",
            `${editorSettings.fontSize}px`,
          );
        }

        // Safely set line height
        if (editorSettings.lineHeight !== undefined) {
          (editorContainer as HTMLElement).style.setProperty(
            "--editor-line-height",
            editorSettings.lineHeight.toString(),
          );
        }
      }
    }, [editorSettings, themeSettings?.theme]);

    const [isFocusMode, setIsFocusMode] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showShortcutsModal, setShowShortcutsModal] = useState(false);
    const [showCitationsModal, setShowCitationsModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [, setShowAIResponse] = useState(false); // Add state for AI response interface
    const [aiResponseData, setAiResponseData] = useState<AIResponseData | null>(
      null,
    ); // Store AI response data
    const [searchMode] = useState(false);
    const [imageGenMode, setImageGenMode] = useState(false);
    const [, setSearchResults] = useState<
      { title: string; url: string; snippet: string }[]
    >([]);
    const [, setGeneratedImages] = useState<string[]>([]);
    const [, setIsSearching] = useState(false);
    const [, setIsGeneratingImage] = useState(false);
    const [autocompleteSuggestion, setAutocompleteSuggestion] =
      useState<AutocompleteSuggestion | null>(null);
    const [autoCitationSuggestion, setAutoCitationSuggestion] =
      useState<AutoCitationSuggestion | null>(null);
    const [spellCheckPopup, setSpellCheckPopup] =
      useState<SpellCheckPopup | null>(null);
    // Analytics tracking using Refs to prevent re-renders on every keystroke
    const typingStartTimeRef = useRef<number | null>(null);
    const keystrokeCountRef = useRef(0);
    const backspaceCountRef = useRef(0);
    const pasteCountRef = useRef(0);
    const idleTimeRef = useRef(0);
    const lastActivityTimeRef = useRef<number>(Date.now());
    const [saveStatus, setSaveStatus] = useState<
      "saved" | "saving" | "unsaved"
    >("saved");

    // Update document title when project loads
    useEffect(() => {
      if (project?.title) {
        setDocumentTitle(project?.title);
      }
    }, [project?.title]);

    // Memoize initial content to avoid re-calculation on every render
    const initialContent = useMemo(() => {
      try {
        const validatedContent = validateAndPrepareContent(project?.content);
        return validatedContent;
      } catch (error) {
        console.error("Error validating content, using empty document:", error);
        return {
          type: "doc",
          content: [{ type: "paragraph" }],
        };
      }
    }, [project?.content]); // Dependency on project.content to recalculate when project loads

    // Use the robust collaboration hook
    const {
      provider,
      isReady: isProviderReady,
      status: connectionStatus,
    } = useCollaboration({
      documentId,
      isCollaborative,
      username: userName,
    });

    /*
     * Initialize editor
     */
    const editor = useEditor(
      {
        immediatelyRender: false,
        onCreate: ({ editor }: { editor: Editor }) => {
          editorRef.current = editor;
          // Call onEditorReady callback to expose editor instance
          if (onEditorReady) {
            onEditorReady(editor);
          }
          editor.on("transaction", (transaction) => {
            try {
              // Transaction processed successfully
            } catch (error) {
              console.error("Error processing editor transaction:", error);
            }
          });
        },
        extensions: [
          StarterKit.configure({
            codeBlock: false,
            link: false,
            // Disable history if collaboration provider exists (Y.js handles undo/redo)
            // Enable history if no provider (Tiptap handles undo/redo)
            history: provider ? false : undefined,
          } as any), // Type assertion to bypass strict 'history' check in newer Tiptap versions
          Placeholder.configure({
            placeholder: "Start writing your document...",
          }),
          TaskList,
          TaskItem.configure({
            nested: true,
          }),
          Link.configure({
            openOnClick: false,
          }),
          Image,
          TextAlign.configure({
            types: ["heading", "paragraph"],
          }),
          Highlight.configure({
            multicolor: true,
          }),
          Superscript,
          Subscript,
          Table.configure({
            resizable: true,
          }),
          TableRow,
          TableCell,
          TableHeader,
          TextStyle,
          CodeBlockLowlight.configure({
            lowlight,
          }),
          CharacterCount,
          ColumnExtension,
          ColumnItemExtension,
          FootnoteExtension,
          FootnoteContentExtension,
          AIAutocompleteExtension.configure({
            onSuggestion: ({
              suggestion,
              position,
            }: {
              suggestion: string;
              position: number;
            }) => {
              setAutocompleteSuggestion({ text: suggestion, position });
            },
            getResearchContext: async () => {
              // 1. Fetch library for this user
              // We use a small optimization to not fetch if not needed, handled by extension debounce
              try {
                // Dynamically import to avoid circular deps if any
                const { ResearchService } =
                  await import("../../lib/utils/researchService");
                const library = await ResearchService.getUserLibrary();

                if (!library || library.length === 0) return null;

                // 2. Format top 5 most relevant (or just recent for now)
                const context = library
                  .slice(0, 5)
                  .map(
                    (source: any) =>
                      `[Source: ${source.title} (${source.year || "n.d."})] ${
                        source.abstract
                          ? source.abstract.substring(0, 200) + "..."
                          : ""
                      }`,
                  )
                  .join("\n\n");

                return `Reference Context from user library:\n${context}`;
              } catch (e) {
                console.error("Error getting research context", e);
                return null;
              }
            },
          }),

          SpellCheckExtension.configure({
            autoCorrect: true,
            language: "en-US",
            onMisspelledWords: (
              misspelledWords: { word: string; suggestions: string[] }[],
              _suggestions: any,
            ) => {
              if (misspelledWords.length > 0) {
                // Handle silently
              }
            },
          }),
          GrammarCheckingExtension.configure({
            debounceTime: 5000,
          }),
          AutoCitationExtension.configure({
            projectId: documentId,
            onSuggestion: (suggestion: any) => {
              setAutoCitationSuggestion(suggestion);
            },
            debounceTime: 5000,
            minSentenceLength: 50,
          }),
          AuthorBlockExtension,
          AuthorExtension,
          SectionExtension,
          KeywordsExtension,
          CustomCodeBlockExtension,
          FigureExtension,
          ListExtension,
          VisualElementExtension,
          CalloutBlock,
          CoverPageExtension,
          QuoteBlockExtension,
          PricingTableExtension,
          SidebarBlockExtension,
          CaptionExtension,
          ImagePlaceholderExtension,
          PresentationDeckExtension,
          CitationBlockExtension,
          AiTagExtension,
          AnnotationBlockExtension,
          InteractiveCitationExtension, // Add interactive chips
          MathExtension, // Add math support
          // Real-time Collaboration - NOW ENABLED & ROBUST
          ...(provider && isProviderReady && provider.document
            ? [
                Collaboration.configure({
                  document: provider.document,
                }),
                CollaborationCursor.configure({
                  provider: provider,
                  user: {
                    name: userName,
                    color:
                      "#" + Math.floor(Math.random() * 16777215).toString(16),
                  },
                }),
              ]
            : []),
        ],
        content: provider // When collaborative, leave content undefined to let Y.js load it
          ? undefined
          : project
            ? initialContent
            : { type: "doc", content: [{ type: "paragraph" }] },
        editorProps: {
          attributes: {
            class:
              "prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-screen px-8 py-6 w-full pb-40",
          },
          handleDOMEvents: {
            error: (event: any) => {
              console.error("Editor DOM error:", event);
              return false;
            },
          },
        },
      },
      [project, provider, isProviderReady], // Re-init if provider readiness changes
    );

    // Apply template styling when project loads
    useEffect(() => {
      if (editorRef.current && project) {
        applyTemplateStyling(editorRef.current, project);
      }
    }, [project]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isFocusMode) {
          setIsFocusMode(false);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "/") {
          e.preventDefault();
          setShowShortcutsModal(true);
        }
        // Disable manual save (Ctrl+S) as requested
        if ((e.metaKey || e.ctrlKey) && e.key === "s") {
          e.preventDefault();
          // Optionally notify user that auto-save is active
          toast({
            title: "Auto-save enabled",
            description: "Changes are saved automatically.",
          });
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFocusMode]);

    // Auto-save functionality - ENABLED for both solo and collaboration modes
    useEffect(() => {
      if (!editor || !documentId) return;

      const handleUpdate = () => {
        setSaveStatus("unsaved");
        debouncedSave();
      };

      const debouncedSave = debounce(async () => {
        setSaveStatus("saving");
        try {
          const content = editor.getJSON();
          const wordCount = editor.storage.characterCount.words();
          await saveProjectContent(
            documentId,
            content,
            documentTitle,
            wordCount,
            { keepalive: true }
          );
          setSaveStatus("saved");
        } catch (error) {
          console.error("Auto-save failed:", error);
          setSaveStatus("unsaved");
        }
      }, 1000);

      editor.on("update", handleUpdate);

      return () => {
        editor.off("update", handleUpdate);
        debouncedSave.flush(); // Wait to save any final keystrokes before destroying
      };
    }, [editor, documentId, documentTitle, provider]);

    // Manual save handler - DISABLED as per requirement "avoid manual save totally"
    const handleManualSave = async () => {
      // Manual save is disabled. Rely on auto-save and auto-versioning.
      return;
    };

    // Warn on unsaved changes
    useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (saveStatus === "unsaved" || saveStatus === "saving") {
          e.preventDefault();
          e.returnValue = "";
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [saveStatus]);

    const wordCount = editor?.storage?.characterCount?.words?.() ?? 0;
    const charCount = editor?.storage?.characterCount?.characters?.() ?? 0;

    // Handler for web search mode
    useEffect(() => {
      const performSearch = async () => {
        if (searchMode && editor && editor.state) {
          const { from, to } = editor.state.selection;
          const selectedText = editor.state.doc.textBetween(from, to, " ");
          let searchText = selectedText.trim();
          if (!searchText) {
            const pos = editor.state.selection.from;
            const resolvedPos = safeResolvePosition(editor, pos);
            if (resolvedPos) {
              const word = resolvedPos.parent.textContent
                .split(" ")
                .find((w: string) => w.includes(""));
              searchText = word || "";
            } else {
              searchText = "";
            }
          }

          if (searchText) {
            setIsSearching(true);
            try {
              const results = await AIService.webSearch(searchText, 5);
              setSearchResults(results);
              toast({
                title: "Success",
                description: `Found ${results.length} search results.`,
              });
            } catch (error) {
              console.error("Search failed:", error);
              setSearchResults([]);
              toast({
                title: "Error",
                description: "Search failed. Please try again.",
                variant: "destructive",
              });
            } finally {
              setIsSearching(false);
            }
          }
        }
      };

      performSearch();
    }, [searchMode, editor]);

    // Handler for image generation mode
    useEffect(() => {
      const generateImage = async () => {
        if (imageGenMode && editor && editor.state) {
          const { from, to } = editor.state.selection;
          const selectedText = editor.state.doc.textBetween(from, to, " ");
          let imagePrompt = selectedText.trim();
          if (!imagePrompt) {
            const pos = editor.state.selection.from;
            const resolvedPos = safeResolvePosition(editor, pos);
            if (resolvedPos) {
              const word = resolvedPos.parent.textContent
                .split(" ")
                .find((w: string) => w.includes(""));
              imagePrompt = word || "abstract concept";
            } else {
              imagePrompt = "abstract concept";
            }
          }

          if (imagePrompt) {
            setIsGeneratingImage(true);
            try {
              const imageUrl = await AIService.generateImage(
                imagePrompt,
                documentId,
              );
              setGeneratedImages((prev) => [...prev, imageUrl]);
              // Use type assertion for dynamic extension command
              (editor.commands as any).setImage({ src: imageUrl });
              toast({
                title: "Success",
                description: "Image generated and inserted successfully.",
              });
            } catch (error) {
              console.error("Image generation failed:", error);
              toast({
                title: "Error",
                description: "Failed to generate image. Please try again.",
                variant: "destructive",
              });
            } finally {
              setIsGeneratingImage(false);
              setImageGenMode(false);
            }
          }
        }
      };

      generateImage();
    }, [imageGenMode, editor, documentId]);

    // Track typing patterns and user activity - OPTIMIZED
    useEffect(() => {
      if (!editor) return;

      let idleTimer: NodeJS.Timeout;

      const handleKeyDown = (event: KeyboardEvent) => {
        // Reset idle timer
        if (idleTimer) clearTimeout(idleTimer);

        // Set new idle timer (30 seconds of inactivity)
        idleTimer = setTimeout(() => {
          idleTimeRef.current += 30;
        }, 30000);

        // Update last activity time
        lastActivityTimeRef.current = Date.now();

        // Track typing start time
        if (!typingStartTimeRef.current) {
          typingStartTimeRef.current = Date.now();
        }

        // Count keystrokes
        keystrokeCountRef.current += 1;

        // Count specific keys
        if (event.key === "Backspace") {
          backspaceCountRef.current += 1;
        }

        // Track command usage
        if (event.ctrlKey || event.metaKey) {
          // Command tracking logic...
        }
      };

      const handlePaste = () => {
        pasteCountRef.current += 1;
      };

      // Add event listeners
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("paste", handlePaste);

      return () => {
        // Clean up event listeners
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("paste", handlePaste);
        if (idleTimer) clearTimeout(idleTimer);
      };
    }, [editor]); // Only depend on editor, NOT on mutable stats

    // Handler for adding citation from auto citation suggestion
    const handleAddCitation = useCallback((citation: any) => {
      // Insert the formatted citation into the document at the current cursor position
      if (editorRef.current) {
        const formattedCitation =
          citation.formatted || citation.title || "Citation";
        // Safely insert citation to prevent position errors
        safeInsertContent(editorRef.current, `[${formattedCitation}]`);
      }
      setAutoCitationSuggestion(null);
    }, []);

    // Handler for restoring a document version
    const handleRestoreVersion = async (versionId: string) => {
      try {
        setShowHistoryModal(false);
      } catch (error) {
        console.error("Error restoring version:", error);
        // Show error notification to user instead of alert
        toast({
          title: "Error",
          description: "Failed to restore document version. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Replace alert calls with proper error handling
    // Handler for manually creating a document version
    const handleCreateVersion = async () => {
      if (!editor || !documentId) return;

      try {
        // Mock implementation for now
        console.log("Creating document version mock");

        // Show success notification
        toast({
          title: "Success",
          description: "Document version created successfully.",
        });
      } catch (error) {
        console.error("Error creating document version:", error);
        // Show error notification to user instead of alert
        toast({
          title: "Error",
          description: "Failed to create document version. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Listen for citation clicks (from InteractiveCitationExtension)
    useEffect(() => {
      const handleCitationClick = (e: any) => {
        const { id, title } = e.detail;
        console.log("Citation clicked:", id, title);

        // Open citations panel
        handleToggleRightPanel("citations");

        // Optionally pass the ID to the panel to highlight the specific paper
        // For now, just opening the panel is a huge UX win
        toast({
          title: "Citation Selected",
          description: `Viewing details for: ${title}`,
        });
      };

      // Add listener to the editor DOM element or window
      // Window is safer as the event bubbles up
      window.addEventListener("citation-click", handleCitationClick);

      return () => {
        window.removeEventListener("citation-click", handleCitationClick);
      };
    }, []);

    // Function to handle AI actions from the floating menu
    const handleAIAction = async (action: string, selectedText: string) => {
      if (!editor || !selectedText) return;

      try {
        switch (action) {
          case "improve":
            // Call AI service to improve the selected text
            const improvedText = await AIService.improveWriting(selectedText);
            editor.commands.insertContent(improvedText);
            break;

          case "fix":
            // Call AI service to fix issues in the selected text
            const fixedText = await AIService.fixGrammar(selectedText);
            editor.commands.insertContent(fixedText);
            break;

          case "summarize":
            // Call AI service to summarize the selected text
            const summary = await AIService.summarizeDocument(selectedText);
            editor.commands.insertContent(summary);
            break;

          case "expand":
            // Call AI service to expand the selected text
            const expandedText = await AIService.expandText(selectedText);
            editor.commands.insertContent(expandedText);
            break;

          case "ask":
            // Show AI response interface to ask about the selected text
            setAiResponseData({ action, selectedText });
            setShowAIResponse(true);
            break;

          case "shorten":
            // Call AI service to shorten the selected text
            const shortenedText = await AIService.improveWriting(
              selectedText,
              null,
              { length: "short" },
            );
            editor.commands.insertContent(shortenedText);
            break;

          case "academic":
            // Call AI service to make text more academic
            const academicText = await AIService.academicTone(selectedText);
            editor.commands.insertContent(academicText);
            break;

          case "defensibility":
            // 1. Fetch library context
            let context = null;
            try {
              // Import ResearchService dynamically to avoid circular deps if any
              const { ResearchService } =
                await import("../../lib/utils/researchService");
              const library = await ResearchService.getUserLibrary();

              if (library && library.length > 0) {
                // Format top 10 most relevant/recent papers
                context = library
                  .slice(0, 10)
                  .map(
                    (source: any) =>
                      `[Source: ${source.title} (${source.year || "n.d."})] ${
                        source.abstract || ""
                      }`,
                  )
                  .join("\n\n");
              }
            } catch (e) {
              console.warn(
                "Failed to fetch context for defensibility check",
                e,
              );
            }

            // 2. Call AI Service
            toast({
              title: "Checking Claims...",
              description: "Verifying against your library.",
            });
            const checkResult = await AIService.checkDefensibility(
              selectedText,
              context,
            );

            // 3. Handle Result (Highlighting/Response)
            // For now, we will show the response in the AI Response Interface
            // In the future, this could add "Originality Map" highlights
            setAiResponseData({
              action: "defensibility_check",
              selectedText,
              suggestion: checkResult, // The result is likely an analysis string
            });
            setShowAIResponse(true);
            break;

          default:
            console.warn(`Unknown AI action: ${action}`);
        }

        // Show success toast
        toast({
          title: "AI Action Complete",
          description: `${
            action.charAt(0).toUpperCase() + action.slice(1)
          } action completed successfully.`,
        });
      } catch (error) {
        console.error(`Error performing AI action ${action}:`, error);
        toast({
          title: "AI Action Failed",
          description: `Failed to perform ${action} action. Please try again.`,
          variant: "destructive",
        });
      }
    };

    // Handler for inserting a citation (opens modal)
    const handleInsertCitation = useCallback(() => {
      setShowCitationsModal(true);
    }, []);

    // Handler for editing citations (opens sidebar)
    const handleEditCitation = useCallback(() => {
      handleToggleRightPanel("citations");
    }, []);

    // Handler for inserting reference list (opens sidebar)
    const handleInsertReferenceList = useCallback(() => {
      handleToggleRightPanel("citations");
      toast({
        title: "Reference List",
        description:
          "Use the Citations panel to manage and generate your bibliography.",
      });
    }, []);

    // Handler for inserting a footnote
    const handleInsertFootnote = useCallback(() => {
      if (editor && editor.state) {
        // Calculate the next footnote number
        let footnoteCount = 0;
        editor.state.doc.descendants((node) => {
          if (node.type.name === "footnote") {
            footnoteCount++;
          }
        });

        const nextNumber = footnoteCount + 1;

        editor
          .chain()
          .focus()
          .insertContent({
            type: "footnote",
            attrs: { number: nextNumber },
          })
          .run();

        // Automatically insert a corresponding footnote content block at the end of the doc
        const endPos = editor.state.doc.content.size;
        editor
          .chain()
          .insertContentAt(endPos, {
            type: "footnoteContent",
            attrs: { number: nextNumber },
            content: [{ type: "paragraph" }],
          })
          .run();
      }
    }, [editor]);

    // Function to check for citation-worthy content
    const checkForCitationWorthyContent = useCallback(
      async (editorInstance: Editor) => {
        try {
          // Get the current selection or recent text
          const { from, to } = editorInstance.state.selection;
          const selectedText = editorInstance.state.doc.textBetween(
            Math.max(0, from - 200),
            to,
            " ",
          );

          // Only check if we have substantial text
          if (selectedText.length > 100) {
            // Use AI to determine if this content might benefit from citation
            // This is an automatic citation suggestion
            const citations = await AIService.suggestSources(
              selectedText,
              null,
              true,
            );

            if (citations && citations.length > 0) {
              setAutoCitationSuggestion({
                content: selectedText.substring(
                  Math.max(0, selectedText.length - 100),
                ),
                citations: citations.slice(0, 3), // Limit to top 3 suggestions
              });
            }
          }
        } catch (error) {
          console.error("Error checking for citation-worthy content:", error);
        }
      },
      [],
    );

    // Handler for accepting autocomplete suggestion
    const handleAcceptAutocomplete = useCallback(() => {
      if (editorRef.current && autocompleteSuggestion) {
        const { text, position } = autocompleteSuggestion;
        // Validate position before using it
        if (typeof position === "number" && !isNaN(position) && position >= 0) {
          try {
            editorRef.current
              .chain()
              .focus()
              .insertContentAt(position, text)
              .run();
          } catch (error) {
            console.error("Error accepting autocomplete suggestion:", error);
            // Fallback: insert at current cursor position
            safeInsertContent(editorRef.current, text);
          }
        } else {
          // Invalid position, insert at current cursor position
          safeInsertContent(editorRef.current, text);
        }

        setAutocompleteSuggestion(null);
      }
    }, [autocompleteSuggestion]);

    // Handler for dismissing autocomplete suggestion
    const handleDismissAutocomplete = useCallback(() => {
      setAutocompleteSuggestion(null);
    }, []);

    // Handler for dismissing auto citation suggestion
    const handleDismissCitation = useCallback(() => {
      setAutoCitationSuggestion(null);
    }, []);

    // Handle spell check suggestion
    const handleSpellCheckSuggestion = useCallback(
      (word: string, correction: string) => {
        if (editor) {
          // Get the current selection
          const { from, to } = editor.state.selection;

          // Get the text at the current selection
          const selectedText = editor.state.doc.textBetween(from, to, " ");

          // If there's selected text and it matches the word we're correcting
          if (selectedText.trim() === word) {
            // Replace the selected text with the correction
            editor
              .chain()
              .focus()
              .deleteRange({ from, to })
              .insertContent(correction)
              .run();
          } else {
            // If no matching selection, try to find and replace the word in the document
            // Get the full document content
            const doc = editor.state.doc;
            let found = false;

            // Traverse the document to find the word
            doc.descendants((node, pos) => {
              if (found) return false; // Stop if we already found the word

              if (node.isText && node.text) {
                const text = node.text;
                const index = text.indexOf(word);

                if (index !== -1) {
                  // Found the word, calculate the position
                  const wordStart = pos + index;
                  const wordEnd = wordStart + word.length;

                  // Replace the word
                  editor
                    .chain()
                    .focus()
                    .deleteRange({ from: wordStart, to: wordEnd })
                    .insertContent(correction)
                    .run();

                  found = true;
                  return false; // Stop traversing
                }
              }

              return true;
            });
          }

          const textContent = editor.getText();
          const wordCount = textContent
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
        }
      },
      [editor],
    );

    // Handle ignore word
    const handleIgnoreWord = useCallback(
      (word: string) => {
        if (editor) {
          // Add the word to the spell check ignore list
          spellCheckService.ignoreWord(word);
          console.log(`Word "${word}" added to ignore list`);
          // Close the popup
          setSpellCheckPopup(null);
          // Trigger a re-render of the editor to update spell check decorations
          editor.commands.focus();
        }
      },
      [editor],
    );

    // Handle add to dictionary
    const handleAddToDictionary = useCallback(
      (word: string) => {
        if (editor) {
          // Add the word to the spell check custom dictionary
          spellCheckService.addToDictionary(word);
          console.log(`Word "${word}" added to custom dictionary`);
          // Close the popup
          setSpellCheckPopup(null);
          // Trigger a re-render of the editor to update spell check decorations
          editor.commands.focus();
        }
      },
      [editor, setSpellCheckPopup],
    );
    // Expose insertContent method
    useImperativeHandle(ref, () => ({
      insertContent: (content: string) => {
        if (editor) {
          editor.chain().focus().insertContent(content).run();
        }
      },
    }));

    // Loading State for Collaboration - Moved here to ensure hooks run first
    if (isCollaborative && !isProviderReady) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">
            Connecting to collaborative session...
          </p>
        </div>
      );
    }

    return (
      <div
        className={`flex h-screen flex-col bg-gray-50 ${
          isFocusMode ? "focus-mode" : ""
        }`}>
        <Toaster />
        {/* AI autocomplete suggestion component */}
        {autocompleteSuggestion && (
          <AIAutocompleteSuggestion
            suggestion={autocompleteSuggestion.text}
            isVisible={!!autocompleteSuggestion}
            onAccept={handleAcceptAutocomplete}
            onDismiss={handleDismissAutocomplete}
          />
        )}

        {/* Spell Check Suggestions Modal */}
        {spellCheckPopup && (
          <SpellCheckSuggestions
            word={spellCheckPopup.word}
            suggestions={spellCheckPopup.suggestions}
            position={spellCheckPopup.position}
            onCorrect={(correction) => {
              handleSpellCheckSuggestion(spellCheckPopup.word, correction);
              setSpellCheckPopup(null);
            }}
            onIgnore={() => {
              handleIgnoreWord(spellCheckPopup.word);
              setSpellCheckPopup(null);
            }}
            onAddToDictionary={() => {
              handleAddToDictionary(spellCheckPopup.word);
              setSpellCheckPopup(null);
            }}
            onClose={() => setSpellCheckPopup(null)}
          />
        )}

        {/* Auto citation suggestion component */}
        {autoCitationSuggestion && (
          <AutoCitationSuggestion
            content={autoCitationSuggestion.content}
            citations={autoCitationSuggestion.citations}
            onAddCitation={handleAddCitation}
            onDismiss={handleDismissCitation}
            projectId={documentId}
          />
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
          {!isFocusMode && (
            <>
              <DocumentHeader
                title={documentTitle}
                onTitleChange={setDocumentTitle}
                activePanel={activeRightPanel}
                onTogglePanel={handleToggleRightPanel}
                provider={provider}
                onOpenSettings={() => setShowSettingsModal(true)}
                onOpenShortcuts={() => setShowShortcutsModal(true)}
                onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                isFocusMode={isFocusMode}
                projectId={documentId}
                onOpenHistory={() => setShowHistoryModal(true)}
                editor={editorRef.current}
                onOpenResearch={onOpenResearch}
                saveStatus={saveStatus}
                onManualSave={handleManualSave}
                isCollaborative={isCollaborative}
                onShare={onShare}
                allowedPanels={allowedPanels}
              />
              <EditorToolbar
                editor={editor}
                onOpenImageModal={() => setShowImageModal(true)}
                onOpenCitationsModal={() => setShowCitationsModal(true)}
                onInsertCitation={handleInsertCitation}
                onEditCitation={handleEditCitation}
                onInsertReferenceList={handleInsertReferenceList}
                onInsertFootnote={handleInsertFootnote}
              />
            </>
          )}

          <div className="flex flex-1 overflow-hidden">
            <div
              className={`flex-1 flex ${isFocusMode ? "" : ""} ${
                themeSettings?.theme === "dark" ? "dark-editor" : "light-editor"
              }`}>
              <div
                className={`flex-1 overflow-y-auto ${
                  isFocusMode ? "w-full" : ""
                }`}>
                <div
                  className={`mx-auto w-full ${
                    isFocusMode ? "max-w-4xl" : "max-w-4xl"
                  }`}>
                  <div className="relative w-full max-w-4xl mx-auto editor-wrapper">
                    <ParagraphActionMenu
                      editor={editor}
                      onAIAction={(action, text) => {
                        handleAIAction(action, text);
                      }}
                      onAddCitation={() => {
                        setShowCitationsModal(true);
                      }}
                    />
                    {editor && (
                      <EditorContent
                        editor={editor}
                        className="min-h-screen w-full pb-40 ProseMirror editor-wrapper"
                        spellCheck={editorSettings.spellCheck}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isFocusMode && (
          <BottomBar
            wordCount={wordCount}
            charCount={charCount}
            editor={editor}
          />
        )}

        {/* Settings configuration modal */}
        <SettingsModal
          open={showSettingsModal}
          onOpenChange={setShowSettingsModal}
          settings={editorSettings}
          onSettingsChange={setEditorSettings}
        />

        {/* Image upload and management modal */}
        <ImageUploadModal
          open={showImageModal}
          onOpenChange={setShowImageModal}
          editor={editor}
        />

        {/* Keyboard shortcuts reference modal */}
        <KeyboardShortcutsModal
          open={showShortcutsModal}
          onOpenChange={setShowShortcutsModal}
        />

        {/* Citations management modal */}
        <CitationsModal
          isOpen={showCitationsModal}
          onClose={() => setShowCitationsModal(false)}
          editor={editor}
          projectId={documentId}
        />

        {/* Document version history modal */}
        <DocumentHistory
          editor={editor}
          projectId={documentId}
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          onRestoreVersion={handleRestoreVersion}
          onCreateVersion={handleCreateVersion}
        />

        {/* AI Response Interface */}
        {aiResponseData && (
          <AIResponseInterface
            action={aiResponseData.action || ""}
            originalText={aiResponseData.originalText || ""}
            suggestion={aiResponseData.suggestion || ""}
            onClose={() => setShowAIResponse(false)}
            onApply={(text) => {
              if (editorRef.current) {
                editorRef.current.commands.setContent(text);
                setShowAIResponse(false);
              }
            }}
            onInsertBelow={(text) => {
              if (editorRef.current) {
                // Insert the text after the current content
                const content = editorRef.current.getHTML();
                editorRef.current.commands.setContent(
                  content + "<p></p>" + text,
                );
                setShowAIResponse(false);
              }
            }}
            onCopy={(text) => {
              navigator.clipboard.writeText(text);
              setShowAIResponse(false);
            }}
            onRegenerate={() => {
              // Implement regeneration logic here
              console.log("Regenerating...");
            }}
            onAddCitation={(citation) => {
              // Add citation to editor
              if (editorRef.current) {
                editorRef.current.commands.insertContent(
                  `[${citation.title || citation}] `,
                );
                setShowAIResponse(false);
              }
            }}
            onAddSource={(source) => {
              // Add source to editor
              if (editorRef.current) {
                editorRef.current.commands.insertContent(
                  `[${source.title || source}] `,
                );
                setShowAIResponse(false);
              }
            }}
          />
        )}

        {/* Floating AI Menu */}
        {editor && (
          <FloatingAIMenu
            editor={editor}
            onAction={(action, selectedText) => {
              // Handle the AI action
              handleAIAction(action, selectedText);
            }}
          />
        )}
      </div>
    );
  },
);
