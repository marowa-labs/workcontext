"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "../ui/button";
import {
  Wand2,
  PenLine,
  FileText,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface FloatingAIMenuProps {
  editor: Editor | null;
  onAction: (action: string, selectedText: string) => void;
}

export function FloatingAIMenu({ editor, onAction }: FloatingAIMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!editor || !editor.state) return;
    const { from, to, empty } = editor.state.selection;

    if (empty) {
      setIsVisible(false);
      return;
    }

    try {
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);

      // Get the editor container rect for proper positioning
      const editorContainer =
        editor.view.dom.parentElement?.getBoundingClientRect();
      if (!editorContainer) return;

      // Calculate position relative to the viewport
      // Position the menu slightly above the selection and center it
      const top = start.top - 45; // Position slightly above the selection relative to viewport
      const left = (start.left + end.right) / 2; // Center of the selection relative to viewport

      setPosition({
        top: Math.max(0, top),
        left: Math.max(0, left),
      });
      setIsVisible(true);
    } catch (error) {
      console.warn("Failed to calculate floating menu position:", error);
      setIsVisible(false);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.on("selectionUpdate", updatePosition);
    editor.on("blur", () => setIsVisible(false));

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("blur", () => setIsVisible(false));
    };
  }, [editor, updatePosition]);

  const getSelectedText = () => {
    if (!editor || !editor.state || !editor.state.doc) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to);
  };

  const handleAction = (action: string) => {
    const selectedText = getSelectedText();
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
      icon: <PenLine className="h-3.5 w-3.5" />,
      label: "Academic Tone",
      action: "academic",
    },
    {
      icon: <ShieldCheck className="h-3.5 w-3.5 text-green-600" />,
      label: "Defensibility Check",
      action: "defensibility",
    },
    {
      icon: <MessageSquare className="h-3.5 w-3.5" />,
      label: "Ask AI",
      action: "ask",
    },
  ];

  return (
    <div
      className={cn(
        // Added solid white background with some opacity and better shadow
        "absolute z-50 flex items-center gap-1 rounded-lg border border-gray-200 bg-white/90 dark:bg-white/90 backdrop-blur-sm p-1 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-200",
      )}
      style={{
        top: position.top,
        left: position.left,
        // Fix: Use transform to properly center the menu
        transform: "translateX(-50%)",
      }}>
      {actions.map((item) => (
        <Button
          key={item.action}
          className="h-7 gap-1 px-2 text-xs hover:bg-gray-100 dark:hover:bg-white"
          onClick={() => handleAction(item.action)}>
          {item.icon}
          <span className="hidden sm:inline">{item.label}</span>
        </Button>
      ))}
    </div>
  );
}
