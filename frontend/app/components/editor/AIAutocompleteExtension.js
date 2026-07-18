"use client";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import AIService from "../../lib/utils/aiService";
import { safeResolvePosition } from "../../lib/utils/editorUtils";

// Cache for usage
let usageCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request queue for rate limiting
let requestQueue = [];
let isProcessingQueue = false;

// Track recent user activity - use a ref-like pattern for module state
const state = {
  lastTriggerTime: 0,
  lastCursorPosition: 0,
  lastTextContext: "",
  lastRequestedParagraph: "",
  sessionStartTime: Date.now(),
};

const TRIGGER_COOLDOWN = 5000; // 5 seconds between triggers (reduced from 10)
const ACTIVE_TYPING_TIMEOUT = 3000; // 3 seconds
const SESSION_TIMEOUT = 6 * 60 * 1000; // 6 minutes

// Get AI usage info with caching
async function getAIUsage() {
  const now = Date.now();

  // Return cached data if still valid
  if (usageCache && now - cacheTimestamp < CACHE_DURATION) {
    return usageCache;
  }

  try {
    const usage = await AIService.getAIUsage();
    usageCache = usage;
    cacheTimestamp = now;
    return usage;
  } catch (error) {
    console.error("Error fetching AI usage:", error);
    return null;
  }
}

// Process the request queue
async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();

    try {
      const suggestion = await AIService.getAutocompleteSuggestion(
        request.textBefore,
        request.context,
        true,
      );

      if (suggestion && request.onSuggestion) {
        request.onSuggestion({
          suggestion,
          position: request.position,
        });
      }
    } catch (error) {
      console.error("AI Autocomplete error:", error);
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  isProcessingQueue = false;
}

// Add request to queue
function addToRequestQueue(request) {
  requestQueue.push(request);
  processRequestQueue();
}

// Function to get the current paragraph content
function getCurrentParagraphContent(state, pos) {
  // Safely resolve position to prevent NaN errors
  const $pos = safeResolvePosition({ state }, pos);
  if (!$pos) return "";

  const paragraphNode = $pos.parent;

  // Check if we're in a paragraph node
  if (paragraphNode.type.name === "paragraph") {
    return paragraphNode.textContent;
  }

  return "";
}

// Check if we should trigger autocomplete
function shouldTriggerAutocomplete(
  textContext,
  cursorPosition,
  editorView,
  editorState,
) {
  const now = Date.now();

  // Check session timeout - reset if needed
  if (now - state.sessionStartTime > SESSION_TIMEOUT) {
    state.sessionStartTime = now;
    state.lastTriggerTime = 0;
    state.lastRequestedParagraph = "";
  }

  // Check cooldown
  if (now - state.lastTriggerTime < TRIGGER_COOLDOWN) {
    return false;
  }

  // Get current paragraph content
  const currentParagraph = getCurrentParagraphContent(
    editorState,
    cursorPosition,
  );

  // Don't trigger if we've already requested for this paragraph
  if (
    currentParagraph === state.lastRequestedParagraph &&
    currentParagraph.length > 10
  ) {
    return false;
  }

  // Don't trigger if text is too short
  if (textContext.trim().length < 10) {
    return false;
  }

  // Check if we're at a logical point to trigger
  if (textContext.length > 0) {
    const lastChar = textContext.slice(-1);

    // Trigger after space or newline (word boundary)
    if ([" ", "\n", "\t"].includes(lastChar)) {
      const trimmed = textContext.trim();
      if (trimmed.length < 10) {
        return false;
      }
    }
    // Trigger after sentence-ending punctuation
    else if ([".", "!", "?"].includes(lastChar)) {
      // Good trigger point
    }
    // Don't trigger in the middle of a word
    else if (/[a-zA-Z]/.test(lastChar)) {
      return false;
    }
  }

  // Update tracking
  state.lastTriggerTime = now;
  state.lastCursorPosition = cursorPosition;
  state.lastTextContext = textContext;
  state.lastRequestedParagraph = currentParagraph;

  return true;
}

export const AIAutocompleteExtension = Extension.create({
  name: "aiAutocomplete",

  addOptions() {
    return {
      debounceTime: 3000, // Increased debounce time to 3 seconds
      minLength: 20, // Increased minimum characters to trigger
      maxLength: 500, // Increased maximum characters to send to AI for better context
      suggestionClass: "ai-autocomplete-suggestion",
      onLimitReached: () => {}, // Callback when limit is reached
      isEnabled: true, // Add isEnabled option to control the extension
    };
  },

  addStorage() {
    return {
      suggestion: null,
      isActive: false,
      position: null,
    };
  },

  addProseMirrorPlugins() {
    const { editor } = this;
    let debounceTimer = null;

    const plugin = new Plugin({
      key: new PluginKey("aiAutocomplete"),
      state: {
        init() {
          return DecorationSet.empty;
        },
        apply(tr, oldState) {
          // Return existing decorations unless content changed
          if (tr.docChanged) {
            return DecorationSet.empty;
          }
          return oldState;
        },
      },
      props: {
        decorations(state) {
          // Create decoration for inline suggestion if active
          if (
            editor.storage.aiAutocomplete.isActive &&
            editor.storage.aiAutocomplete.suggestion
          ) {
            const pos = editor.storage.aiAutocomplete.position;
            if (pos !== null) {
              const decoration = Decoration.widget(
                pos,
                () => {
                  const span = document.createElement("span");
                  span.className = "ai-inline-suggestion";
                  span.textContent = editor.storage.aiAutocomplete.suggestion;
                  return span;
                },
                {
                  side: 1, // Render after the cursor
                },
              );

              return DecorationSet.create(state.doc, [decoration]);
            }
          }
          return plugin.getState(state) || DecorationSet.empty;
        },
        handleKeyDown(view, event) {
          // Handle Tab key to accept suggestion
          if (event.key === "Tab" && editor.storage.aiAutocomplete.isActive) {
            event.preventDefault();

            const { suggestion } = editor.storage.aiAutocomplete;
            if (suggestion) {
              // Insert the suggestion at the current position
              const pos = editor.storage.aiAutocomplete.position;
              editor.chain().focus().insertContentAt(pos, suggestion).run();

              // Clear the suggestion
              editor.storage.aiAutocomplete.suggestion = null;
              editor.storage.aiAutocomplete.isActive = false;
              editor.storage.aiAutocomplete.position = null;
              state.lastRequestedParagraph = "";

              return true;
            }
          }

          // Handle Escape key to dismiss suggestion
          if (
            event.key === "Escape" &&
            editor.storage.aiAutocomplete.isActive
          ) {
            editor.storage.aiAutocomplete.suggestion = null;
            editor.storage.aiAutocomplete.isActive = false;
            editor.storage.aiAutocomplete.position = null;
            state.lastRequestedParagraph = "";
            return true;
          }

          return false;
        },
      },
      view() {
        return {
          update: (view, prevState) => {
            // Check if the extension is enabled
            if (!this.options?.isEnabled) {
              // Clear any existing suggestions if extension is disabled
              if (editor.storage.aiAutocomplete.isActive) {
                editor.storage.aiAutocomplete.suggestion = null;
                editor.storage.aiAutocomplete.isActive = false;
                editor.storage.aiAutocomplete.position = null;
              }
              return;
            }

            // Reset session start time on editor focus or initialization
            if (!prevState || prevState !== view.state) {
              state.sessionStartTime = Date.now();
            }

            // Only trigger on user-initiated transactions
            if (!view.state.docChanged) return;

            // Check if session has timed out before setting timer
            const currentTime = Date.now();
            if (currentTime - state.sessionStartTime > SESSION_TIMEOUT) {
              state.sessionStartTime = currentTime;
              state.lastTriggerTime = 0;
              state.lastRequestedParagraph = "";
              return;
            }

            // Set debounce timer
            setTimeout(async () => {
              try {
                // Double-check session timeout before processing
                if (Date.now() - state.sessionStartTime > SESSION_TIMEOUT) {
                  return;
                }

                const editorState = view.state;
                const { from } = editorState.selection;

                // Get text before cursor position
                const $from = safeResolvePosition({ state: editorState }, from);
                if (!$from) return;

                const textBefore = editorState.doc.textBetween(
                  Math.max(0, from - (this.options?.maxLength || 500)),
                  from,
                  "",
                );

                // Check if we should trigger autocomplete
                if (
                  !shouldTriggerAutocomplete(
                    textBefore,
                    $from.pos,
                    view,
                    editorState,
                  )
                ) {
                  return;
                }

                // Get research context if available
                let context = null;
                if (this.options?.getResearchContext) {
                  try {
                    context = await this.options.getResearchContext();
                  } catch (err) {
                    console.warn("Failed to get research context:", err);
                  }
                }

                // Add request to queue instead of processing directly
                addToRequestQueue({
                  textBefore,
                  context, // Pass context to the queue
                  position: $from.pos,
                  onSuggestion: (result) => {
                    // Update editor storage with suggestion
                    editor.storage.aiAutocomplete.suggestion =
                      result.suggestion;
                    editor.storage.aiAutocomplete.isActive = true;
                    editor.storage.aiAutocomplete.position = result.position;

                    // Trigger a re-render to show the decoration
                    editor.view.dispatch(
                      editor.state.tr.setMeta("aiAutocomplete", true),
                    );
                  },
                  onLimitReached: this.options?.onLimitReached,
                });
              } catch (error) {
                console.error("AI Autocomplete error:", error);
              }
            }, this.options?.debounceTime || 1500); // Reduced to 1.5s for Jenni-like feel
          },
        };
      },
    });

    return [plugin];
  },
});

export default AIAutocompleteExtension;
