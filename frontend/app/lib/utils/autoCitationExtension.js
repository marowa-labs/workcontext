import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import CitationService from "./citationService";
import AIService from "./aiService";

// Create a plugin key for the auto citation plugin
const autoCitationPluginKey = new PluginKey("autoCitation");

// Track recent user typing to avoid interrupting the flow
let lastUserInputTime = 0;
const INPUT_DEBOUNCE_TIME = 3000; // 3 seconds

// Track already suggested citations to avoid duplicates
const suggestedCitations = new Set();

// Extract recent content from the document
const extractRecentContent = (doc, paragraphCount) => {
  const paragraphs = [];
  doc.descendants((node) => {
    if (node.type.name === "paragraph" && node.textContent.trim().length > 0) {
      paragraphs.push(node.textContent.trim());
    }
  });

  // Get the last few paragraphs
  const recentParagraphs = paragraphs.slice(-paragraphCount);
  return recentParagraphs.join(" ").trim();
};

// Analyze content to determine if it might need a citation
const analyzeContentForCitation = (content, minSentenceLength) => {
  // Simple heuristic-based approach for now
  // In a more advanced implementation, this would use AI

  // Keywords that suggest the content might be a factual claim
  const citationIndicators = [
    "according to",
    "studies show",
    "research indicates",
    "it is believed",
    "it has been found",
    "the data suggests",
    "evidence shows",
    "experts agree",
    "statistics show",
    "survey results",
    "analysis reveals",
    "findings suggest",
  ];

  const contentLower = content.toLowerCase();
  const hasCitationIndicators = citationIndicators.some((indicator) =>
    contentLower.includes(indicator)
  );

  // Check if content contains numerical data or specific facts
  const hasNumbers = /\d/.test(content);
  const hasSpecificClaims = content.length > minSentenceLength;

  // Return true if content seems to warrant a citation
  return hasCitationIndicators || (hasNumbers && hasSpecificClaims);
};

// Generate citation suggestions for content
const generateCitationSuggestions = async (content) => {
  try {
    // Use the existing CitationService to search for relevant citations
    const searchResults = await CitationService.searchExternal(
      content,
      "article" // Default to articles
    );

    // Limit to top 3 results
    return searchResults ? searchResults.slice(0, 3) : [];
  } catch (error) {
    console.error("Error generating citation suggestions:", error);
    return [];
  }
};

const AutoCitationExtension = Extension.create({
  name: "autoCitation",

  // Add storage for auto citation state
  addStorage() {
    return {
      enabled: true,
      suggestions: [],
      lastSuggestionTime: 0,
    };
  },

  // Add options
  addOptions() {
    return {
      projectId: null,
      onSuggestion: () => {},
      debounceTime: 5000, // 5 seconds between checks
      minSentenceLength: 50, // Minimum length for citation-worthy content
    };
  },

  // Add commands
  addCommands() {
    return {
      toggleAutoCitation:
        () =>
        ({ commands }) => {
          this.storage.enabled = !this.storage.enabled;
          return true;
        },

      enableAutoCitation:
        () =>
        ({ commands }) => {
          this.storage.enabled = true;
          return true;
        },

      disableAutoCitation:
        () =>
        ({ commands }) => {
          this.storage.enabled = false;
          return true;
        },
    };
  },

  // Add plugins
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: autoCitationPluginKey,
        state: {
          init() {
            return {
              suggestions: [],
            };
          },
          apply(tr, prev) {
            // Handle transaction updates
            return prev;
          },
        },
        view: (view) => {
          let debounceTimer;

          // Function to check for citation-worthy content
          const checkForCitations = async () => {
            if (!this.storage.enabled || !this.options.projectId) {
              return;
            }

            // Check if enough time has passed since last user input
            const currentTime = Date.now();
            if (currentTime - lastUserInputTime < INPUT_DEBOUNCE_TIME) {
              return;
            }

            // Check if enough time has passed since last suggestion
            if (
              currentTime - this.storage.lastSuggestionTime <
              this.options.debounceTime
            ) {
              return;
            }

            try {
              const editorState = view.state;
              const doc = editorState.doc;
              const textContent = doc.textContent;

              // Only process if document has sufficient content
              if (textContent.length < this.options.minSentenceLength) {
                return;
              }

              // Extract recent content (last few paragraphs)
              const recentContent = extractRecentContent(doc, 3);

              // Skip if content is too short or already suggested
              if (
                recentContent.length < this.options.minSentenceLength ||
                suggestedCitations.has(recentContent)
              ) {
                return;
              }

              // Check if this content might need a citation using AI
              const needsCitation = analyzeContentForCitation(
                recentContent,
                this.options.minSentenceLength
              );

              if (needsCitation) {
                // Generate citation suggestions
                const citations =
                  await generateCitationSuggestions(recentContent);

                if (citations && citations.length > 0) {
                  // Store to avoid duplicate suggestions
                  suggestedCitations.add(recentContent);

                  // Update last suggestion time
                  this.storage.lastSuggestionTime = currentTime;

                  // Call the onSuggestion callback with the suggestions
                  if (typeof this.options.onSuggestion === "function") {
                    this.options.onSuggestion({
                      content: recentContent,
                      citations: citations,
                    });
                  } else {
                    console.warn(
                      "onSuggestion is not a function:",
                      typeof this.options.onSuggestion
                    );
                  }
                }
              }
            } catch (error) {
              console.error("Error in auto citation check:", error);
            }
          };

          // Set up document change observer
          view.dom.addEventListener("input", () => {
            lastUserInputTime = Date.now();

            // Clear existing timer
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }

            // Set new timer to check for citations after debounce
            debounceTimer = setTimeout(
              checkForCitations,
              this.options.debounceTime
            );
          });

          return {
            update: (view, prevState) => {
              // Handle view updates if needed
            },
            destroy: () => {
              // Clean up
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }
            },
          };
        },
      }),
    ];
  },
});

export default AutoCitationExtension;
