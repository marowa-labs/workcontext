"use client";

import { useState } from "react";
import { Check, X, Wand2, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import AIService from "../../../lib/utils/aiService";
import { useToast } from "../../../hooks/use-toast";

interface Suggestion {
  id: string;
  type: "grammar" | "tone" | "conciseness" | "spelling" | "style";
  original: string;
  suggestion: string;
  reason: string;
  context: string;
}

interface LanguageCheckPanelProps {
  editor?: any;
}

export function LanguageCheckPanel({ editor }: LanguageCheckPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runCheck = async () => {
    if (!editor) return;

    setIsLoading(true);
    try {
      const text = editor.getText();
      const results = await AIService.checkLanguage(text);
      setSuggestions(results);

      if (results.length === 0) {
        toast({
          title: "All clear!",
          description: "No language issues found in your document.",
        });
      }
    } catch (error) {
      console.error("Language check failed:", error);
      toast({
        title: "Check Failed",
        description: "Could not analyze document language.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = (suggestion: Suggestion) => {
    if (!editor) return;

    // Use Tiptap's search and replace logic
    // We try to find the original text in the document
    // For simplicity, we search for the exact string
    // A more advanced version would use the 'context' to disambiguate

    const { state } = editor;
    if (!state) return;

    let found = false;

    state.doc.descendants((node: any, pos: number) => {
      if (found || !node.isText) return;

      const index = node.text.indexOf(suggestion.original);
      if (index !== -1) {
        const from = pos + index;
        const to = from + suggestion.original.length;

        editor
          .chain()
          .focus()
          .insertContentAt({ from, to }, suggestion.suggestion)
          .run();
        found = true;
      }
    });

    if (found) {
      setSuggestions(suggestions.filter((s) => s.id !== suggestion.id));
    } else {
      toast({
        title: "Correction Failed",
        description:
          "Could not find the text in the editor. It might have been changed.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptAll = () => {
    if (!editor || suggestions.length === 0) return;

    // Sort suggestions by position (reverse) to avoid offset shifts
    // But since we are doing text search, we can just do them one by one
    // and hope for the best, or use a more robust approach.

    let acceptedCount = 0;
    const remainingSuggestions = [...suggestions];

    for (const suggestion of suggestions) {
      const { state } = editor;
      if (!state) continue;

      let found = false;

      state.doc.descendants((node: any, pos: number) => {
        if (found || !node.isText) return;

        const index = node.text.indexOf(suggestion.original);
        if (index !== -1) {
          const from = pos + index;
          const to = from + suggestion.original.length;

          editor
            .chain()
            .focus()
            .insertContentAt({ from, to }, suggestion.suggestion)
            .run();
          found = true;
          acceptedCount++;
        }
      });

      if (found) {
        const idx = remainingSuggestions.findIndex(
          (s) => s.id === suggestion.id,
        );
        if (idx !== -1) remainingSuggestions.splice(idx, 1);
      }
    }

    setSuggestions(remainingSuggestions);

    toast({
      title: "Corrections Applied",
      description: `Successfully applied ${acceptedCount} corrections.`,
    });
  };

  const handleDismiss = (id: string) => {
    setSuggestions(suggestions.filter((s) => s.id !== id));
  };

  if (suggestions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">All clear!</h3>
        <p className="text-sm">Your document meets academic standards.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-1.5 rounded-lg text-purple-600">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">
                Language Check
              </h3>
              <p className="text-xs text-gray-500">
                {isLoading
                  ? "Analyzing..."
                  : `${suggestions.length} suggestions found`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={runCheck}
            disabled={isLoading}
            className="h-8 text-xs gap-1.5">
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3" />
            )}
            Check Now
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-3">
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs gap-1.5"
              onClick={handleAcceptAll}>
              <Check className="w-3.5 h-3.5" /> Accept All {suggestions.length}{" "}
              Corrections
            </Button>
          </div>
        )}
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
        {isLoading && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-sm">Analyzing your document...</p>
          </div>
        )}

        {!isLoading && suggestions.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-green-100">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 font-serif">
              All clear!
            </h3>
            <p className="text-sm">
              Your document meets academic standards. Click "Check Now" to
              re-analyze.
            </p>
          </div>
        )}

        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header / Reason */}
            <div className="bg-gray-50/80 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
              {suggestion.type === "tone" && (
                <Sparkles className="w-3 h-3 text-blue-500" />
              )}
              {suggestion.type === "grammar" && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
              {suggestion.type === "spelling" && (
                <AlertCircle className="w-3 h-3 text-orange-500" />
              )}
              {suggestion.type === "conciseness" && (
                <Wand2 className="w-3 h-3 text-purple-500" />
              )}
              {suggestion.type === "style" && (
                <Sparkles className="w-3 h-3 text-indigo-500" />
              )}
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                {suggestion.type}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {suggestion.reason}
              </p>

              {/* Diff View */}
              <div className="space-y-2.5 text-sm">
                <div className="line-through text-red-500 bg-red-50/50 px-2 py-1.5 rounded block decoration-red-400/50 border border-red-100/50">
                  {suggestion.original}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-green-50 text-green-800 px-2 py-1.5 rounded font-semibold border border-green-200 shadow-sm">
                    {suggestion.suggestion}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-50 mt-4">
                <Button
                  size="sm"
                  className="flex-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 gap-1.5 h-8 text-[11px] font-bold shadow-none"
                  onClick={() => handleAccept(suggestion)}>
                  <Check className="w-3.5 h-3.5" /> Accept
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100"
                  onClick={() => handleDismiss(suggestion.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
