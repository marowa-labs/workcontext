"use client";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import AIService from "../../lib/utils/aiService";
import BillingService from "../../lib/utils/billingService";
import { safeResolvePosition } from "../../lib/utils/editorUtils"; // Import safe editor utilities

// Cache for subscription data and usage
let subscriptionCache = null;
let usageCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request queue for rate limiting
let requestQueue = [];
let isProcessingQueue = false;

// Track recent user activity to avoid excessive requests
let lastTriggerTime = 0;
let lastCursorPosition = 0;
let lastTextContext = "";
let isActiveTyping = false;
let lastRequestedParagraph = ""; // Track the last paragraph we requested for
const TRIGGER_COOLDOWN = 10000; // Increase cooldown to 10 seconds between triggers
const ACTIVE_TYPING_TIMEOUT = 10000; // Consider typing active for 10 seconds after last keystroke

// Track editor session time to block AI after 6 minutes
let sessionStartTime = Date.now();
const SESSION_TIMEOUT = 6 * 60 * 1000; // 6 minutes in milliseconds

// Get user's subscription info with caching
async function getUserSubscription() {
  const now = Date.now();

  // Return cached data if still valid
  if (subscriptionCache && now - cacheTimestamp < CACHE_DURATION) {
    return subscriptionCache;
  }

  try {
    const subscription = await BillingService.getCurrentSubscription();
    subscriptionCache = subscription;
    cacheTimestamp = now;
    return subscription;
  } catch (error) {
    console.error("Error fetching subscription info:", error);
    return null;
  }
}

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

// Check if user can make an autocomplete request based on their subscription
async function canMakeAutocompleteRequest() {
  try {
    const subscription = await getUserSubscription();
    if (!subscription)
      return { allowed: false, reason: "Unable to verify subscription" };

    const planId = subscription.plan?.id || "free";

    // Institutional and Researcher plans have unlimited autocomplete
    if (planId === "researcher" || planId === "institutional") {
      return { allowed: true };
    }

    // Get current usage
    const usage = await getAIUsage();
    if (!usage)
      return { allowed: false, reason: "Unable to verify usage limits" };

    // Check limits based on plan
    let limit;
    switch (planId) {
      case "free":
        limit = 10; // 10/day according to PricingPage.tsx
        break;
      case "onetime":
        limit = 100; // 100 per session according to PricingPage.tsx
        break;
      case "student":
        limit = 500; // 500 per session according to PricingPage.tsx
        break;
      default:
        limit = 10; // Default to free plan limit
    }

    // Check if user has reached their limit
    const used = limit - usage.remaining;
    if (used >= limit) {
      return {
        allowed: false,
        reason: `You've reached your autocomplete limit (${limit} requests). Upgrade for more.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking autocomplete limit:", error);
    return { allowed: true }; // Allow request if we can't verify limits
  }
}

// Process the request queue with exponential backoff
async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  // Check if session has timed out (6 minutes)
  const now = Date.now();
  if (now - sessionStartTime > SESSION_TIMEOUT) {
    // Clear the queue and don't process any requests
    requestQueue = [];
    isProcessingQueue = false;
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    let retryCount = 0;
    const maxRetries = 3;
    let delay = 1000; // Start with 1 second delay

    // Check if session has timed out during processing
    if (Date.now() - sessionStartTime > SESSION_TIMEOUT) {
      // Clear remaining queue and exit
      requestQueue = [];
      break;
    }

    while (retryCount <= maxRetries) {
      try {
        // Check if user can make an autocomplete request
        const limitCheck = await canMakeAutocompleteRequest();
        if (!limitCheck.allowed) {
          // Call the limit reached callback if provided
          if (request.onLimitReached) {
            request.onLimitReached(limitCheck.reason);
          }
          break; // Exit retry loop if limit reached
        }

        // Get AI suggestion
        // This is an automatic autocomplete suggestion
        const suggestion = await AIService.getAutocompleteSuggestion(
          request.textBefore,
          request.context, // Pass context to service
          true // isAutomatic
        );

        // Call the success callback
        if (request.onSuggestion) {
          request.onSuggestion({
            suggestion,
            position: request.position,
          });
        }

        break; // Success, exit retry loop
      } catch (error) {
        if (error.message && error.message.includes("AI_LIMIT_REACHED")) {
          // Handle rate limit error specifically
          if (request.onLimitReached) {
            request.onLimitReached(
              "You've reached your AI usage limit. Please try again later or upgrade your plan."
            );
          }
          break; // Exit retry loop for rate limit errors
        } else if (retryCount < maxRetries) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for next retry
          retryCount++;
        } else {
          // Max retries reached, call error callback
          console.error("AI Autocomplete error after retries:", error);
          break; // Exit retry loop on max retries
        }
      }
    }

    // Small delay between processing requests to prevent overwhelming the server
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

// Enhanced function to check if we should trigger autocomplete based on user activity and context
function shouldTriggerAutocomplete(
  textContext,
  cursorPosition,
  editorView,
  state
) {
  const now = Date.now();

  // Check if session has timed out (6 minutes)
  if (now - sessionStartTime > SESSION_TIMEOUT) {
    return false;
  }

  // Update active typing status
  if (isActiveTyping) {
    // If we were actively typing, check if we've stopped
    if (now - lastTriggerTime > ACTIVE_TYPING_TIMEOUT) {
      isActiveTyping = false;
    }
  }

  // Check if enough time has passed since last trigger
  if (now - lastTriggerTime < TRIGGER_COOLDOWN) {
    return false;
  }

  // Check if cursor is within editable content (not in UI elements)
  if (editorView) {
    const domAtPos = editorView.domAtPos(cursorPosition);
    if (domAtPos && domAtPos.node) {
      // Check if we're in a non-editable area
      let currentNode = domAtPos.node;
      while (currentNode && currentNode !== editorView.dom) {
        // Skip if we're in a non-editable element
        if (
          currentNode.nodeType === 1 &&
          currentNode.hasAttribute("contenteditable") &&
          currentNode.getAttribute("contenteditable") === "false"
        ) {
          return false;
        }
        // Skip if we're in certain UI elements
        if (
          currentNode.classList &&
          (currentNode.classList.contains("non-editable") ||
            currentNode.classList.contains("ui-element"))
        ) {
          return false;
        }
        currentNode = currentNode.parentNode;
      }
    }
  }

  // Get current paragraph content to check if we've already requested for this paragraph
  const currentParagraph = getCurrentParagraphContent(state, cursorPosition);

  // Don't trigger if we've already requested for this paragraph
  if (currentParagraph === lastRequestedParagraph) {
    return false;
  }

  // Check if cursor position has changed significantly
  if (Math.abs(cursorPosition - lastCursorPosition) < 5) {
    // Cursor hasn't moved much, check if text context has changed
    if (textContext === lastTextContext) {
      return false;
    }
  }

  // Check if we're at a logical point to trigger autocomplete
  // (e.g., end of sentence, after punctuation, etc.)
  if (textContext.length > 0) {
    const lastChar = textContext.slice(-1);
    const secondLastChar =
      textContext.length > 1 ? textContext.slice(-2, -1) : "";

    // Don't trigger if we're in the middle of typing a word
    if (lastChar.match(/[a-zA-Z]/)) {
      return false;
    }

    // Don't trigger immediately after certain punctuation unless it's end of sentence
    if ([".", "!", "?"].includes(secondLastChar) && lastChar === " ") {
      // This is a good place to trigger - end of sentence followed by space
    } else if ([" ", "\n", "\t"].includes(lastChar)) {
      // Check if there's meaningful content before this space
      const trimmedContext = textContext.trim();
      if (trimmedContext.length === 0) {
        // Don't trigger at the beginning of document or paragraph
        return false;
      }
    } else if (![".", "!", "?", ",", ";", ":"].includes(lastChar)) {
      // Don't trigger after other punctuation that doesn't indicate a pause
      return false;
    }
  }

  // Update tracking variables
  lastTriggerTime = now;
  lastCursorPosition = cursorPosition;
  lastTextContext = textContext;
  lastRequestedParagraph = currentParagraph; // Track the paragraph we're requesting for
  isActiveTyping = true;

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
      onLimitReached: () => { }, // Callback when limit is reached
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
                }
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
              lastRequestedParagraph = ""; // Reset paragraph tracking on acceptance

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
            lastRequestedParagraph = ""; // Reset paragraph tracking on dismissal
            return true;
          }

          // Mark that user is actively typing when they press a key
          if (
            event.key.length === 1 ||
            event.key === "Backspace" ||
            event.key === "Delete"
          ) {
            const now = Date.now();
            lastTriggerTime = now;
            isActiveTyping = true;
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
              sessionStartTime = Date.now();
            }

            // Only trigger on user-initiated transactions
            if (!view.state.docChanged) return;

            // Check if session has timed out before setting timer
            const currentTime = Date.now();
            if (currentTime - sessionStartTime > SESSION_TIMEOUT) {
              // Session timed out, don't set timer
              return;
            }

            // Clear any existing debounce timer
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }

            // Set new debounce timer
            debounceTimer = setTimeout(async () => {
              try {
                // Double-check session timeout before processing
                if (Date.now() - sessionStartTime > SESSION_TIMEOUT) {
                  return;
                }

                const state = view.state;
                const { from } = state.selection;

                // Get text before cursor position
                // Safely resolve position to prevent NaN errors
                const $from = safeResolvePosition({ state }, from);
                if (!$from) return false;

                const textBefore = state.doc.textBetween(
                  Math.max(0, from - this.options?.maxLength || 500),
                  from,
                  ""
                );

                // Check if we should trigger autocomplete
                // Pass the state to access paragraph information
                if (
                  !shouldTriggerAutocomplete(
                    textBefore,
                    $from.pos,
                    view,
                    state
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
                      editor.state.tr.setMeta("aiAutocomplete", true)
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
