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
import ProjectService from "../../lib/utils/projectService";
import { ImageUploadModal } from "./image-upload-modal";
import { KeyboardShortcutsModal } from "./keyboard-shortcuts-modal";
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
import AIAutocompleteExtension from "./AIAutocompleteExtension"; // Add this import
import AIAutocompleteSuggestion from "./AIAutocompleteSuggestion"; // Add this import
import { FloatingAIMenu } from "../ai/floating-ai-menu"; // Import Floating AI Menu
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

// Smart Features - Phase 3 imports
import { MentionExtension } from "../../lib/utils/mentionExtension";
import { useMentions } from "../mentions/useMentions";
import { MentionSuggestionList } from "../mentions/MentionSuggestionList";

const lowlight = createLowlight(common);

// Define the type for sidebar panels (productivity-focused, academic features removed)
export type SidebarPanel =
  | "ai-chat"
  | "language"
  | "team-chat"
  | "writing"
  | "my-documents"
  | "outline"
  | "concept-map"
  | "related"
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
  openSettings: () => void;
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
      allowedPanels = ["ai-chat", "language", "team-chat"],
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

    // Smart Features - Phase 3
    const [workspaceId, setWorkspaceId] = useState<string | undefined>();
    const seededCollaborativeDocRef = useRef(false);
    const seededDocumentIdRef = useRef<string | undefined>(undefined);

    // Update document title when project loads
    useEffect(() => {
      if (project?.title) {
        setDocumentTitle(project?.title);
      }
      // Extract workspace_id from project if available
      if (project?.workspace_id) {
        setWorkspaceId(project.workspace_id);
      }
    }, [project?.title, project?.workspace_id]);

    useEffect(() => {
      if (documentId !== seededDocumentIdRef.current) {
        seededDocumentIdRef.current = documentId;
        seededCollaborativeDocRef.current = false;
      }
    }, [documentId]);

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

    const collaborationFieldName = useMemo(() => {
      if (!isCollaborative || !provider?.document || !isProviderReady) {
        return "default";
      }

      try {
        const ydoc = provider.document;
        const ytypes = ydoc.share;
        if (ytypes?.has("prosemirror")) {
          return "prosemirror";
        }
        if (ytypes?.has("default")) {
          return "default";
        }

        const keys = Array.from(ytypes?.keys?.() ?? []);
        return keys.length > 0 ? keys[0] : "default";
      } catch (error) {
        console.error(
          "[MainEditor] Could not determine collaboration field:",
          error,
        );
        return "default";
      }
    }, [isCollaborative, provider, isProviderReady]);

    const seedCollaborativeDocument = useCallback((): void => {
      const currentEditor = editorRef.current;
      if (
        seededCollaborativeDocRef.current ||
        !currentEditor ||
        !project?.content
      ) {
        return;
      }

      try {
        const editorJson = currentEditor.getJSON();
        const currentContent = editorJson?.content ?? [];
        const isEmptyDocument =
          Array.isArray(currentContent) &&
          currentContent.length === 1 &&
          currentContent[0]?.type === "paragraph" &&
          (!currentContent[0]?.content ||
            currentContent[0]?.content.length === 0);

        if (!isEmptyDocument) {
          seededCollaborativeDocRef.current = true;
          return;
        }

        if (provider?.document) {
          try {
            const sharedType = provider.document.get(collaborationFieldName);
            const snapshot = (
              sharedType as { toJSON?: () => unknown }
            )?.toJSON?.();
            const alreadyHasSharedContent =
              !!snapshot &&
              (Array.isArray(snapshot)
                ? snapshot.length > 0
                : typeof snapshot === "object" &&
                  Object.keys(snapshot).length > 0);

            if (alreadyHasSharedContent) {
              seededCollaborativeDocRef.current = true;
              console.log(
                "[MainEditor] Skipping collaborative seed because shared content already exists",
              );
              return;
            }
          } catch (sharedError) {
            console.warn(
              "[MainEditor] Could not inspect shared content state:",
              sharedError,
            );
          }
        }

        const contentToInsert =
          project.content && project.content.type === "doc"
            ? project.content
            : initialContent;

        if (
          contentToInsert &&
          typeof contentToInsert === "object" &&
          contentToInsert.type === "doc" &&
          Array.isArray(contentToInsert.content) &&
          contentToInsert.content.length > 0
        ) {
          // Replace the editor content atomically to avoid duplicate insertions
          currentEditor
            .chain()
            .clearContent()
            .setContent(contentToInsert)
            .run();
          seededCollaborativeDocRef.current = true;
          console.info(
            "[MainEditor] Seeded collaborative document on first render",
          );
        }
      } catch (seedError) {
        console.error(
          "[MainEditor] Failed to seed collaborative document on first render:",
          seedError,
        );
      }
    }, [collaborationFieldName, initialContent, project?.content, provider]);

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
              const origin = (transaction as any).origin ?? null;
              const steps = (transaction as any).steps?.length ?? 0;
              const docSize = editor.state?.doc?.content?.size ?? null;
              console.debug("[MainEditor] transaction", {
                origin,
                steps,
                docSize,
              });

              // If a transaction results in non-empty doc and we haven't marked seeded, log stack
              try {
                const hasContent = editor.state.doc.content.size > 1;
                if (hasContent && !seededCollaborativeDocRef.current) {
                  console.warn(
                    "[MainEditor] Editor content changed before marking seeded",
                    {
                      origin,
                      stack:
                        new Error().stack
                          ?.split("\n")
                          .slice(0, 5)
                          .join(" | ") ?? null,
                    },
                  );
                }
              } catch (e) {
                // ignore
              }
            } catch (error) {
              console.error("Error processing editor transaction:", error);
            }
          });
        },
        extensions: [
          StarterKit.configure({
            codeBlock: false,
            link: false,
            horizontalRule: false,
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
            isEnabled: true,
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
          } as any),
          GrammarCheckingExtension.configure({
            debounceTime: 30000,
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
          MentionExtension, // Smart @-mentions
          // Real-time Collaboration - NOW ENABLED & ROBUST
          ...(provider && isProviderReady && provider.document
            ? [
                Collaboration.configure({
                  document: provider.document,
                  field: collaborationFieldName,
                  onFirstRender: seedCollaborativeDocument,
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
        content: isCollaborative
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
      [project, provider, isProviderReady, collaborationFieldName], // Re-init if provider readiness or field changes
    );

    // Initialize mentions hook (after editor is declared)
    const {
      isOpen: isMentionOpen,
      query: mentionQuery,
      items: mentionItems,
      selectedIndex: mentionSelectedIndex,
      setSelectedIndex: setMentionSelectedIndex,
      insertMention,
    } = useMentions({ editor, workspaceId });

    // Handle task creation from text extraction
    const handleCreateTaskFromText = useCallback(
      async (taskData: {
        title: string;
        description: string;
        assignee?: string;
        dueDate?: string;
      }) => {
        if (!workspaceId) {
          toast({
            title: "Error",
            description: "No workspace selected",
            variant: "destructive",
          });
          return;
        }

        try {
          const TaskService = (await import("../../lib/utils/taskService"))
            .default;
          await TaskService.createTask({
            workspace_id: workspaceId,
            title: taskData.title,
            description: taskData.description,
            status: "todo",
            priority: "medium",
            due_date: taskData.dueDate,
          });
        } catch (error) {
          console.error("Failed to create task:", error);
          throw error;
        }
      },
      [workspaceId, toast],
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
      };
    }, [editor]);

    // Accept autocomplete suggestion
    const handleAcceptAutocomplete = useCallback(() => {
      if (autocompleteSuggestion && editorRef.current) {
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
      openSettings: () => {
        setShowSettingsModal(true);
      },
    }));

    // Handler for AI actions
    const handleAIAction = useCallback(
      (action: string, text: string) => {
        console.log("AI Action:", action, text);
        toast({
          title: "AI Action",
          description: `${action} applied to selected text`,
        });
      },
      [toast],
    );

    // Handler for restoring document version
    const handleRestoreVersion = useCallback(
      async (versionId: string) => {
        try {
          if (!editor) {
            toast({
              title: "Error",
              description: "Editor is not ready",
              variant: "destructive",
            });
            return;
          }

          // Call the API to restore the version
          const result = await ProjectService.restoreDocumentVersion(
            documentId,
            versionId,
          );

          if (!result || !result.content) {
            toast({
              title: "Error",
              description: "Failed to restore version",
              variant: "destructive",
            });
            return;
          }

          // Update the editor content with the restored version
          const restoredContent = result.content;
          editor.chain().clearContent().setContent(restoredContent).run();

          toast({
            title: "Success",
            description: "Document restored to selected version",
          });
        } catch (error: any) {
          console.error("Error restoring document version:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to restore document version",
            variant: "destructive",
          });
        }
      },
      [editor, documentId, toast],
    );

    // Handler for creating document version
    const handleCreateVersion = useCallback(async () => {
      try {
        if (!editor) {
          toast({
            title: "Error",
            description: "Editor is not ready",
            variant: "destructive",
          });
          return;
        }

        // Get the actual editor content
        let content = {};
        let wordCount = 0;

        if (editor.state && editor.state.doc) {
          content = editor.getJSON();
          if (editor.storage && editor.storage.characterCount) {
            wordCount = editor.storage.characterCount.words
              ? editor.storage.characterCount.words()
              : editor.storage.characterCount.characters();
          }
        }

        // Validate we have actual content
        if (
          !content ||
          (typeof content === "object" && Object.keys(content).length === 0)
        ) {
          toast({
            title: "Warning",
            description:
              "Document is empty. Add some content before creating a version.",
            variant: "destructive",
          });
          return;
        }

        // Create the version via API (force:true ensures it's always created)
        const result = await ProjectService.createDocumentVersion(
          documentId,
          content,
          wordCount,
        );

        if (!result) {
          toast({
            title: "Info",
            description:
              "Version was not created. Try making changes to the document first.",
          });
          return;
        }

        toast({
          title: "Success",
          description: `Document version ${result.version || ""} created successfully`,
        });

        // Refresh the version list if the history modal is open
        if (showHistoryModal) {
          // The DocumentHistory component will reload versions via its own loadVersions
        }
      } catch (error: any) {
        console.error("Error creating document version:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create document version",
          variant: "destructive",
        });
      }
    }, [editor, documentId, toast, showHistoryModal]);

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
        }`}
      >
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

        {/* Smart @-Mentions Suggestion List */}
        {isMentionOpen && (
          <MentionSuggestionList
            items={mentionItems}
            selectedIndex={mentionSelectedIndex}
            onSelect={insertMention}
            query={mentionQuery}
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
                saveStatus={saveStatus}
                onManualSave={handleManualSave}
                isCollaborative={isCollaborative}
                onShare={onShare}
                allowedPanels={allowedPanels}
              />
              <EditorToolbar
                editor={editor}
                onOpenImageModal={() => setShowImageModal(true)}
              />
            </>
          )}

          <div className="flex flex-1 overflow-hidden">
            <div
              className={`flex-1 flex ${isFocusMode ? "" : ""} ${
                themeSettings?.theme === "dark" ? "dark-editor" : "light-editor"
              }`}
            >
              <div
                className={`flex-1 overflow-y-auto ${
                  isFocusMode ? "w-full" : ""
                }`}
              >
                <div
                  className={`mx-auto w-full ${
                    isFocusMode ? "max-w-4xl" : "max-w-4xl"
                  }`}
                >
                  <div className="relative w-full max-w-4xl mx-auto editor-wrapper">
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
