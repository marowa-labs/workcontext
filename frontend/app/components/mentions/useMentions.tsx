"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Editor, Range } from "@tiptap/core";
import { MentionItem } from "./MentionSuggestionList";
import { supabase } from "../../lib/supabase/client";

interface UseMentionsProps {
  editor: Editor | null;
  workspaceId?: string;
}

export function useMentions({ editor, workspaceId }: UseMentionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MentionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [range, setRange] = useState<Range | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch mention suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!workspaceId) return;

    try {
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `/api/workspaces/${workspaceId}/search?q=${encodeURIComponent(searchQuery)}&limit=20`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();
      setItems(data.results || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Failed to fetch mention suggestions:", error);
      setItems([]);
    }
  }, [workspaceId]);

  // Insert mention into editor
  const insertMention = useCallback(
    (item: MentionItem) => {
      if (!editor || !range) return;

      const mentionText = `@${item.title}`;
      const isExternalTool = item.category === "integration" && item.external_url;

      const contentBlocks: any[] = [
        {
          type: "text",
          marks: [
            {
              type: "mention",
              attrs: {
                id: item.id,
                type: item.type,
                label: item.title,
                category: item.category,
                source_label: item.source_label,
                external_url: item.external_url,
              },
            },
          ],
          text: mentionText,
        },
        { type: "text", text: " " },
      ];

      // If it's an external tool mention, add a link after
      if (isExternalTool) {
        contentBlocks.push({
          type: "text",
          marks: [
            {
              type: "link",
              attrs: { href: item.external_url },
            },
          ],
          text: `(${item.source_label})`,
        });
        contentBlocks.push({ type: "text", text: " " });
      }

      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(contentBlocks)
        .run();

      setIsOpen(false);
      setQuery("");
      setItems([]);
    },
    [editor, range]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!isOpen) return false;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;

        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          return true;

        case "Enter":
        case "Tab":
          event.preventDefault();
          if (items[selectedIndex]) {
            insertMention(items[selectedIndex]);
          }
          return true;

        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          return true;

        default:
          return false;
      }
    },
    [isOpen, items, selectedIndex, insertMention]
  );

  // Check for @ trigger
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { selection } = editor.state;
      const { from, to } = selection;

      // Check if we're typing @
      if (from !== to) {
        setIsOpen(false);
        return;
      }

      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 50),
        from,
        " "
      );

      const match = textBefore.match(/@([^\s]*)$/);

      if (match) {
        const queryText = match[1];
        const startPos = from - queryText.length - 1; // -1 for @

        setQuery(queryText);
        setRange({ from: startPos, to: from });
        setIsOpen(true);

        // Debounce search
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          fetchSuggestions(queryText);
        }, 150);
      } else {
        setIsOpen(false);
      }
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, fetchSuggestions]);

  // Add keyboard listener
  useEffect(() => {
    if (!editor) return;

    const keyHandler = (event: KeyboardEvent) => {
      if (isOpen) {
        const handled = handleKeyDown(event);
        if (handled) {
          event.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [editor, isOpen, handleKeyDown]);

  return {
    isOpen,
    query,
    items,
    selectedIndex,
    setSelectedIndex,
    insertMention,
  };
}
