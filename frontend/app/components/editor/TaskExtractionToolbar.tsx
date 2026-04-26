"use client";

import { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/core";
import { CheckSquare, Calendar, User, X, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/use-toast";

interface TaskExtractionToolbarProps {
  editor: Editor | null;
  workspaceId: string;
  onCreateTask: (task: {
    title: string;
    description: string;
    assignee?: string;
    dueDate?: string;
  }) => Promise<void>;
}

export function TaskExtractionToolbar({
  editor,
  workspaceId,
  onCreateTask,
}: TaskExtractionToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Listen for text selection
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ");
        if (text.trim().length > 10) {
          setSelectedText(text);
          setTaskTitle(text.slice(0, 100)); // Auto-fill title with selected text
          
          // Calculate position
          const { view } = editor;
          const startPos = view.coordsAtPos(from);
          const endPos = view.coordsAtPos(to);
          
          setPosition({
            top: Math.min(startPos.top, endPos.top) - 60,
            left: (startPos.left + endPos.left) / 2,
          });
          
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } else {
        setIsVisible(false);
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    
    // Also listen for mouseup to catch drag selections
    const handleMouseUp = () => {
      setTimeout(handleSelectionUpdate, 0);
    };
    
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editor]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        // Don't close if clicking in the editor (might be starting a new selection)
        const target = event.target as HTMLElement;
        if (!target.closest(".ProseMirror")) {
          setIsVisible(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;

    setIsCreating(true);
    try {
      await onCreateTask({
        title: taskTitle,
        description: `Extracted from: "${selectedText}"`,
        assignee: assignee || undefined,
        dueDate: dueDate || undefined,
      });

      toast({
        title: "Task Created",
        description: "Task has been added to your workspace",
      });

      setIsVisible(false);
      setTaskTitle("");
      setAssignee("");
      setDueDate("");
      setSelectedText("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Extract mentions from selected text for auto-suggest
  const extractMentions = (text: string) => {
    const mentionRegex = /@([^\s]+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  // Auto-extract assignee from @mentions in selected text
  useEffect(() => {
    if (selectedText) {
      const mentions = extractMentions(selectedText);
      if (mentions.length > 0 && !assignee) {
        setAssignee(mentions[0]);
      }
    }
  }, [selectedText]);

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-[320px] animate-in fade-in zoom-in duration-200"
      style={{
        top: Math.max(10, position.top),
        left: Math.max(10, Math.min(position.left - 160, window.innerWidth - 330)),
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Create Task from Text
          </span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected text preview */}
      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
        "{selectedText.slice(0, 150)}..."
      </div>

      {/* Task form */}
      <div className="space-y-3">
        <div>
          <Input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Task title..."
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <User className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Assignee (@name)"
              className="pl-8 text-sm"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
        </div>

        <Button
          onClick={handleCreateTask}
          disabled={isCreating || !taskTitle.trim()}
          className="w-full"
          size="sm"
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          {isCreating ? "Creating..." : "Create Task"}
        </Button>
      </div>
    </div>
  );
}
