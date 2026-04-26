"use client";

import { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { Plus, GripVertical, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";

interface ParagraphActionMenuProps {
  editor: Editor | null;
  onAIAction: (action: string, text: string) => void;
  onAddCitation?: () => void;
}

export function ParagraphActionMenu({
  editor,
  onAIAction,
  onAddCitation,
}: ParagraphActionMenuProps) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [activeNodePos, setActiveNodePos] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed || !editor.view || !editor.view.dom) return;

    const editorDom = editor.view.dom;

    const handleMouseMove = (event: MouseEvent) => {
      // Find the editor content element securely
      if (editor.isDestroyed || !editor.view || !editor.view.dom) return;
      const editorContent = editor.view.dom;

      // Check if mouse is hovering over a paragraph within the editor
      const target = event.target as HTMLElement;
      const paragraph = target.closest("p");

      if (paragraph && editorContent.contains(paragraph)) {
        // Enforce visibility condition: Only show if doc has > 2 paragraphs (blocks)
        if (
          !editor.state ||
          !editor.state.doc ||
          editor.state.doc.childCount <= 2
        ) {
          setPosition(null);
          return;
        }

        // Get paragraph position
        const rect = paragraph.getBoundingClientRect();
        const editorRect = editorContent.getBoundingClientRect();

        // Calculate position relative to editor container
        // We want it to the left of the paragraph
        const top = rect.top - editorRect.top;
        const left = -64; // Moved further left (-40 -> -64) to be in the gutter

        // Get the node position
        const pos = editor.view.posAtDOM(paragraph, 0);

        setPosition({ top, left });
        setActiveNodePos(pos);
      } else {
        // If not hovering over a paragraph (and not hovering over the menu itself)
        if (menuRef.current && !menuRef.current.contains(target)) {
          // Small delay or check to prevent flickering when moving to the menu
          // For simple implementation, we might just hide it if far away
          // But actually, we want it to stay visible if hovering the MENU
        }
      }
    };

    // We attach the listener to the editor wrapper
    editorDom.addEventListener("mousemove", handleMouseMove);

    return () => {
      editorDom.removeEventListener("mousemove", handleMouseMove);
    };
  }, [editor]);

  // Handle Sparkle Click
  const handleSparkle = () => {
    if (!editor || activeNodePos === null) return;

    // Select the paragraph text
    if (!editor.state || !editor.state.doc) return;
    const node = editor.state.doc.nodeAt(activeNodePos);
    if (!node) return;

    const from = activeNodePos;
    const to = from + node.nodeSize;

    // Set selection
    editor.commands.setTextSelection({ from, to });

    // Trigger AI action
    onAIAction("ask", node.textContent);
  };

  // Handle Plus Actions
  const handlePlaceholder = () => {
    if (!editor || !editor.state || !editor.state.doc || activeNodePos === null)
      return;
    const node = editor.state.doc.nodeAt(activeNodePos);
    if (!node) return;

    const endPos = activeNodePos + node.content.size; // End of paragraph content
    editor.commands.insertContentAt(endPos, " (Citation Needed) ");
  };

  const handleCite = () => {
    if (!editor || !editor.state || !editor.state.doc || activeNodePos === null)
      return;
    // Set cursor to end of paragraph
    const node = editor.state.doc.nodeAt(activeNodePos);
    if (!node) return;
    const endPos = activeNodePos + node.content.size;
    editor.commands.setTextSelection(endPos);

    // Trigger citation modal via callback (if provided)
    if (onAddCitation) {
      onAddCitation();
    }
  };

  // Handle Drag Start
  // Tiptap doesn't make this super easy without a specialized extension
  // But we can approximate it or leave it as a visual placeholder for now as per instructions "menu like icon will be used to drag"
  // Implementing full drag-and-drop is complex; we'll add the handle but maybe standard drag behavior?
  // We'll set the paragraph draggable?

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="absolute flex items-center gap-2 z-50 transition-all duration-75 ease-out"
      style={{
        top: position.top,
        left: position.left, // This relies on the parent having relative positioning
        transform: "translateY(0)", // Align with top of paragraph
      }}>
      {/* Plus Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            title="Add Citations"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-blue-600 text-blue-600 hover:text-blue-700">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="text-gray-600 border border-gray-200 bg-white">
          <DropdownMenuItem onClick={handlePlaceholder}>
            Placeholder Citation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCite}>@ Cite</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Drag Handle */}
      {/* We add 'cursor-grab' to indicate it's draggable */}
      <div
        title="Drag Paragraph"
        className="cursor-grab text-gray-300 hover:text-gray-600 p-1">
        <GripVertical className="h-4 w-4 text-gray-600" />
      </div>

      {/* Sparkle AI */}
      <Button
        variant="ghost"
        size="icon"
        title="Ask AI"
        className="h-6 w-6 rounded-full hover:bg-purple-50 text-gray-400 hover:text-purple-600"
        onClick={handleSparkle}>
        <Sparkles className="h-4 w-4 text-purple-600" />
      </Button>
    </div>
  );
}
