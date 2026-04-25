import { Extension } from "@tiptap/core";
import spellCheckPlugin from "./spellCheckPlugin";
import spellCheckService from "./spellCheckService";

// Create a spell check extension for Tiptap
const SpellCheckExtension = Extension.create({
  name: "spellCheck",

  // Add storage for spell check state
  addStorage() {
    return {
      enabled: true, // Enable by default
      misspelledWords: new Set(),
      suggestions: new Map(),
    };
  },

  // Add options
  addOptions() {
    return {
      autoCorrect: false,
      language: "en-US",
      onMisspelledWords: () => {},
      spellCheckService: null,
    };
  },

  // Add commands
  addCommands() {
    return {
      toggleSpellCheck:
        () =>
        ({ commands }) => {
          this.storage.enabled = !this.storage.enabled;
          return true;
        },

      enableSpellCheck:
        () =>
        ({ commands }) => {
          this.storage.enabled = true;
          return true;
        },

      disableSpellCheck:
        () =>
        ({ commands }) => {
          this.storage.enabled = false;
          return true;
        },

      // Command to correct a misspelled word
      correctWord:
        (word, correction) =>
        ({ commands }) => {
          console.log(`Correcting "${word}" to "${correction}"`);
          return true;
        },
    };
  },

  // Add plugins
  addProseMirrorPlugins() {
    // Pass the spellCheckService to the plugin through schema
    return [spellCheckPlugin];
  },

  // Initialize the extension
  onCreate() {
    // Use the passed spellCheckService or the imported one
    const service = this.options.spellCheckService || spellCheckService;

    // Initialize the spell check service
    service
      .initialize()
      .then(() => {
        console.log("Spell check service initialized");
      })
      .catch((error) => {
        console.error("Failed to initialize spell check service:", error);
      });
  },
});

export default SpellCheckExtension;
