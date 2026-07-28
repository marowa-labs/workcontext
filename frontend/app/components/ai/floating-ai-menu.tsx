"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "../ui/button";
import { Wand2, FileText, Lightbulb, MessageSquare, MessageCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface FloatingAIMenuProps {
  editor: Editor | null;
  onAction: (action: string, selectedText: string) => void;
}

export function FloatingAIMenu({ editor, onAction }: FloatingAIMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (!editor || !editor.state || editor.isDestroyed) return;
    const { from, to, empty } = editor.state.selection;

    if (empty) {
      setIsVisible(false);
      return;
    }

    try {
      const editorView = (editor as any).view;
      if (!editorView || !editorView.dom) {
        setIsVisible(false);
        return;
      }

      const start = editorView.coordsAtPos(from);
      const end = editorView.coordsAtPos(to);
      if (!start || !end) {
        setIsVisible(false);
        return;
      }

      const editorContainer = editorView.dom.parentElement;
      if (!editorContainer) {
        setIsVisible(false);
        return;
      }

      // Check if editor DOM is still connected
      try {
        editorContainer.getBoundingClientRect();
      } catch {
        setIsVisible(false);
        return;
      }

      const top = start.top - 45;
      const left = (start.left + end.right) / 2;

      setPosition({
        top: Math.max(0, top),
        left: Math.max(0, left),
      });
      setIsVisible(true);
    } catch {
      setIsVisible(false);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.on("selectionUpdate", updatePosition);

    // Delayed hide on blur so button clicks register
    editor.on("blur", () => {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 200);
    });

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("blur", () => setIsVisible(false));
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [editor, updatePosition]);

  // Cancel hide when mouse re-enters the menu
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const getSelectedText = () => {
    if (!editor || !editor.state || !editor.state.doc) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to);
  };

  const handleAction = (action: string) => {
    const selectedText = getSelectedText();
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(false);
    onAction(action, selectedText);
  };

  if (!isVisible || !editor) return null;

  const actions = [
    {
      icon: <Wand2 className="h-3.5 w-3.5" />,
      label: "Improve",
      action: "improve",
    },
    {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: "Shorten",
      action: "shorten",
    },
    {
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      label: "Expand",
      action: "expand",
    },
    {
      icon: <MessageSquare className="h-3.5 w-3.5" />,
      label: "Ask AI",
      action: "ask",
    },
    {
      icon: <MessageCircle className="h-3.5 w-3.5" />,
      label: "Comment",
      action: "comment",
    },
  ];

  return (
    <div
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "absolute z-50 flex items-center gap-1 rounded-lg border border-gray-200 bg-white dark:bg-white backdrop-blur-sm p-1 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-200",
      )}
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
    >
      {actions.map((item) => (
        <Button
          key={item.action}
          className="h-7 gap-1 px-2 text-xs hover:bg-gray-100 dark:hover:bg-white"
          onClick={() => handleAction(item.action)}
        >
          {item.icon}
          <span className="hidden sm:inline">{item.label}</span>
        </Button>
      ))}
    </div>
  );
}
