"use client";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import AIService from "../../lib/utils/aiService";

// Define types for grammar errors
interface GrammarError {
  id: string;
  from: number;
  to: number;
  type: "spelling" | "grammar" | "punctuation" | "clarity" | "tone";
  message: string;
  severity: "low" | "medium" | "high";
  suggestion?: string;
  original?: string;
}

// Cache for storing grammar errors
let grammarErrors: GrammarError[] = [];
let lastCheckedText = "";
let isChecking = false;
let checkTimeout: NodeJS.Timeout | null = null;

// Function to find the position of text in the document
function findTextPosition(
  doc: any,
  searchText: string,
  startFrom: number = 0,
): { from: number; to: number } | null {
  const docText = doc.textContent;
  const index = docText.indexOf(searchText, startFrom);

  if (index === -1) {
    return null;
  }

  return {
    from: index,
    to: index + searchText.length,
  };
}

// Function to check grammar and update errors
async function checkGrammarAndUpdate(
  doc: any,
  onUpdate: (errors: GrammarError[]) => void,
  onError: (error: string) => void,
  debounceTime: number,
) {
  const text = doc.textContent;

  if (isChecking || text === lastCheckedText || text.trim().length === 0) {
    return;
  }

  // Only check if text has changed significantly
  if (Math.abs(text.length - lastCheckedText.length) < 10) {
    return;
  }

  isChecking = true;
  lastCheckedText = text;

  try {
    // For performance, only check a reasonable amount of text
    const textToCheck = text.length > 3000 ? text.substring(0, 3000) : text;

    const suggestions = await AIService.checkLanguage(textToCheck);

    if (suggestions && suggestions.length > 0) {
      let positionOffset = 0;
      const errors: GrammarError[] = [];

      for (const suggestion of suggestions) {
        // Try to find the position of the original text in the document
        // Use context if available for better mapping (though simple search for now)
        const position = findTextPosition(
          doc,
          suggestion.original,
          positionOffset,
        );

        if (position) {
          errors.push({
            id: suggestion.id,
            from: position.from,
            to: position.to,
            type: suggestion.type,
            message: suggestion.reason,
            severity: "medium",
            suggestion: suggestion.suggestion,
            original: suggestion.original,
          });

          // Update offset to avoid finding the same text again
          positionOffset = position.to;
        }
      }

      grammarErrors = errors;
      onUpdate(errors);
    } else {
      grammarErrors = [];
      onUpdate([]);
    }
  } catch (error: any) {
    console.error("Grammar check failed:", error);
    // Only show error to user if it's not an authentication issue
    // Authentication issues are expected when user is not logged in
    if (
      error.message &&
      !error.message.includes("Not authenticated") &&
      !error.message.includes("Authentication required")
    ) {
      // Provide more specific error messages
      let errorMessage = error.message || "Failed to check grammar";
      if (errorMessage.includes("not available")) {
        errorMessage =
          "Grammar checking service is currently unavailable. Please try again later.";
      }
      onError(errorMessage);
    }
  } finally {
    isChecking = false;
  }
}

// Function to create decorations for grammar errors
function createErrorDecorations(errors: GrammarError[]) {
  return errors.map((error) => {
    const className = `grammar-error grammar-error-${error.type} grammar-error-${error.severity}`;

    return Decoration.inline(error.from, error.to, {
      class: className,
      "data-error-id": error.id,
      "data-error-type": error.type,
      "data-error-message": error.message,
      "data-error-suggestion": error.suggestion || "",
      "data-error-original": error.original || "",
    });
  });
}

export const GrammarCheckingExtension = Extension.create({
  name: "grammarChecking",

  addOptions() {
    return {
      debounceTime: 3000, // Check grammar every 3 seconds
      onUpdateErrors: () => {}, // Callback for when errors are updated
      onError: () => {}, // Callback for when errors occur
    };
  },

  addStorage() {
    return {
      errors: [] as GrammarError[],
    };
  },

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: new PluginKey("grammarChecking"),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            // Return existing decorations unless content changed significantly
            if (tr.docChanged) {
              // Only clear decorations if there's significant content change
              const oldText = tr.before.textContent;
              const newText = tr.doc.textContent;
              if (Math.abs(oldText.length - newText.length) > 20) {
                grammarErrors = [];
                return DecorationSet.empty;
              }
            }
            return oldState;
          },
        },
        props: {
          decorations(state) {
            // Create decorations for grammar errors
            if (grammarErrors.length > 0) {
              const decorations = createErrorDecorations(grammarErrors);
              return DecorationSet.create(state.doc, decorations);
            }
            return DecorationSet.empty;
          },
        },
        view() {
          return {
            update: (view) => {
              const { state } = view;

              // Get debounce time with fallback to default
              const debounceTime = (this as any).options?.debounceTime || 3000;

              // Clear any existing timeout
              if (checkTimeout) {
                clearTimeout(checkTimeout);
              }

              // Set new debounce timeout
              checkTimeout = setTimeout(() => {
                // Get callbacks with fallback to no-op functions
                const onUpdateErrors =
                  (this as any).options?.onUpdateErrors || (() => {});
                const onError = (this as any).options?.onError || (() => {});

                checkGrammarAndUpdate(
                  state.doc,
                  (errors) => {
                    // Update storage with errors
                    (editor.storage as any).errors = errors;

                    // Call the onUpdateErrors callback
                    onUpdateErrors(errors);

                    // Trigger a re-render to show decorations
                    editor.view.dispatch(
                      editor.state.tr.setMeta("grammarChecking", true),
                    );
                  },
                  (errorMessage) => {
                    // Call the onError callback
                    onError(errorMessage);
                  },
                  debounceTime,
                );
              }, debounceTime);
            },
          };
        },
      }),
    ];
  },
});

export default GrammarCheckingExtension;
