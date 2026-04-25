import Typo from "typo-js";

class SpellCheckService {
  constructor() {
    this.dictionary = null;
    this.initialized = false;
    this.ignoreList = new Set(); // Add ignore list
    this.customDictionary = new Set(); // Add custom dictionary
  }

  async initialize() {
    try {
      // Load the dictionary files
      const affData = await fetch("/assets/dictionaries/en_US.aff").then(
        (response) => response.text()
      );
      const dicData = await fetch("/assets/dictionaries/en_US.dic").then(
        (response) => response.text()
      );

      // Initialize the Typo.js dictionary
      this.dictionary = new Typo("en_US", affData, dicData, {
        asyncLoad: false,
        loadedCallback: () => {
          console.log("Dictionary loaded successfully");
        },
      });

      this.initialized = true;
      console.log("Spell check service initialized with real dictionary");
    } catch (error) {
      console.error("Failed to initialize spell check service:", error);
      // Set initialized to false but don't fallback to mock implementation
      this.initialized = false;
      throw new Error(
        "Spell check service initialization failed. Spell checking will be disabled."
      );
    }
  }

  // Check if a word is spelled correctly
  checkWord(word) {
    if (!this.initialized || !this.dictionary) {
      return true; // Don't mark as misspelled if not initialized
    }

    // Check if word is in ignore list
    if (this.ignoreList.has(word.toLowerCase())) {
      return true; // Don't mark as misspelled if in ignore list
    }

    // Check if word is in custom dictionary
    if (this.customDictionary.has(word.toLowerCase())) {
      return true; // Don't mark as misspelled if in custom dictionary
    }

    // Remove any trailing punctuation for checking
    const cleanWord = word.replace(/[^\w']|_/g, "");
    if (cleanWord.length === 0) {
      return true;
    }

    return this.dictionary.check(cleanWord);
  }

  // Add a word to the ignore list
  ignoreWord(word) {
    const cleanWord = word.replace(/[^\w']|_/g, "").toLowerCase();
    if (cleanWord.length > 0) {
      this.ignoreList.add(cleanWord);
      console.log(`Added "${word}" to ignore list`);
    }
  }

  // Remove a word from the ignore list
  unignoreWord(word) {
    const cleanWord = word.replace(/[^\w']|_/g, "").toLowerCase();
    if (cleanWord.length > 0) {
      this.ignoreList.delete(cleanWord);
      console.log(`Removed "${word}" from ignore list`);
    }
  }

  // Get the current ignore list
  getIgnoreList() {
    return Array.from(this.ignoreList);
  }

  // Clear the ignore list
  clearIgnoreList() {
    this.ignoreList.clear();
    console.log("Ignore list cleared");
  }

  // Add a word to the custom dictionary
  addToDictionary(word) {
    const cleanWord = word.replace(/[^\w']|_/g, "").toLowerCase();
    if (cleanWord.length > 0) {
      this.customDictionary.add(cleanWord);
      console.log(`Added "${word}" to custom dictionary`);
    }
  }

  // Remove a word from the custom dictionary
  removeFromDictionary(word) {
    const cleanWord = word.replace(/[^\w']|_/g, "").toLowerCase();
    if (cleanWord.length > 0) {
      this.customDictionary.delete(cleanWord);
      console.log(`Removed "${word}" from custom dictionary`);
    }
  }

  // Get the current custom dictionary
  getCustomDictionary() {
    return Array.from(this.customDictionary);
  }

  // Clear the custom dictionary
  clearCustomDictionary() {
    this.customDictionary.clear();
    console.log("Custom dictionary cleared");
  }

  // Get suggestions for a misspelled word
  getSuggestions(word) {
    if (!this.initialized || !this.dictionary) {
      return [];
    }

    // Remove any trailing punctuation for suggestions
    const cleanWord = word.replace(/[^\w']|_/g, "");
    if (cleanWord.length === 0) {
      return [];
    }

    try {
      const suggestions = this.dictionary.suggest(cleanWord);
      return suggestions.slice(0, 10); // Return top 10 suggestions
    } catch (error) {
      console.error("Error getting suggestions:", error);
      return [];
    }
  }

  // Extract words from text
  extractWords(text) {
    // Extract words using regex (removing punctuation)
    const words = text.match(/\b[\w']+\b/g) || [];
    return words.map((word) => ({
      word: word,
      isMisspelled: !this.checkWord(word),
    }));
  }

  // Process text and return misspelled words with suggestions
  processText(text) {
    if (!this.initialized) {
      return [];
    }

    const words = this.extractWords(text);
    const misspelledWords = words
      .filter((item) => item.isMisspelled)
      .map((item) => ({
        word: item.word,
        suggestions: this.getSuggestions(item.word),
      }));

    return misspelledWords;
  }
}

// Create a singleton instance
const spellCheckService = new SpellCheckService();

export default spellCheckService;
