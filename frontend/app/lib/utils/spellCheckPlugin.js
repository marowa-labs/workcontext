import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import spellCheckService from "./spellCheckService";

// Create a plugin key for the spell check plugin
const spellCheckPluginKey = new PluginKey("spellCheck");

// Create a spell check plugin for Tiptap
const spellCheckPlugin = new Plugin({
  key: spellCheckPluginKey,

  // Add state to track misspelled words
  state: {
    init() {
      return {
        decorations: DecorationSet.empty,
      };
    },
    apply(tr, prev) {
      // Return previous state if no transaction
      if (!tr) return prev;

      // If the document changed, recompute decorations
      if (tr.docChanged) {
        // Get spellCheckService from the extension options
        const spellCheckService =
          tr.doc.type.schema.marks.spellCheck?.spec.spellCheckService ||
          window.spellCheckService;
        return {
          decorations: getDecorations(tr.doc, spellCheckService),
        };
      }

      return prev;
    },
  },

  // Add decorations to highlight misspelled words
  props: {
    decorations(state) {
      return this.getState(state).decorations;
    },
  },

  // Handle updates
  view: () => ({
    update: (view, prevState) => {
      // Handle view updates
      // This could be used to update the UI when the document changes
    },
  }),
});

// Function to get decorations for misspelled words
function getDecorations(doc, spellCheckService) {
  const decorations = [];

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      // Check each word in the text node
      const words = node.text.match(/\b[\w']+\b/g) || [];
      let offset = 0;

      words.forEach((word) => {
        const wordStart = node.text.indexOf(word, offset);
        if (wordStart !== -1) {
          const from = pos + wordStart;
          const to = from + word.length;

          // Check if the word is misspelled
          if (
            spellCheckService &&
            spellCheckService.checkWord &&
            spellCheckService.initialized &&
            !spellCheckService.checkWord(word)
          ) {
            // Create decoration for misspelled word
            const decoration = Decoration.inline(from, to, {
              class: "misspelled-word",
              "data-word": word,
            });
            decorations.push(decoration);
          }

          offset = wordStart + word.length;
        }
      });
    }
  });

  return DecorationSet.create(doc, decorations);
}

export default spellCheckPlugin;
