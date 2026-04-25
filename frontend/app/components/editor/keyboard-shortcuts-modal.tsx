"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcutCategories = [
  {
    name: "Text Formatting",
    shortcuts: [
      { keys: ["Ctrl", "B"], action: "Bold" },
      { keys: ["Ctrl", "I"], action: "Italic" },
      { keys: ["Ctrl", "U"], action: "Underline" },
      { keys: ["Ctrl", "Shift", "S"], action: "Strikethrough" },
      { keys: ["Ctrl", "`"], action: "Inline Code" },
      { keys: ["Ctrl", "Shift", "H"], action: "Highlight" },
    ],
  },
  {
    name: "Paragraph Formatting",
    shortcuts: [
      { keys: ["Ctrl", "Alt", "1"], action: "Heading 1" },
      { keys: ["Ctrl", "Alt", "2"], action: "Heading 2" },
      { keys: ["Ctrl", "Alt", "3"], action: "Heading 3" },
      { keys: ["Ctrl", "Alt", "0"], action: "Paragraph" },
      { keys: ["Ctrl", "Shift", "8"], action: "Bullet List" },
      { keys: ["Ctrl", "Shift", "9"], action: "Numbered List" },
      { keys: ["Ctrl", "Shift", "C"], action: "Code Block" },
      { keys: ["Ctrl", "Shift", "B"], action: "Blockquote" },
    ],
  },
  {
    name: "Alignment",
    shortcuts: [
      { keys: ["Ctrl", "Shift", "L"], action: "Align Left" },
      { keys: ["Ctrl", "Shift", "E"], action: "Align Center" },
      { keys: ["Ctrl", "Shift", "R"], action: "Align Right" },
      { keys: ["Ctrl", "Shift", "J"], action: "Justify" },
    ],
  },
  {
    name: "Editing",
    shortcuts: [
      { keys: ["Ctrl", "Z"], action: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], action: "Redo" },
      { keys: ["Ctrl", "A"], action: "Select All" },
      { keys: ["Ctrl", "K"], action: "Insert Link" },
      { keys: ["Tab"], action: "Indent" },
      { keys: ["Shift", "Tab"], action: "Outdent" },
    ],
  },
  {
    name: "Navigation",
    shortcuts: [
      { keys: ["Ctrl", "Home"], action: "Go to Start" },
      { keys: ["Ctrl", "End"], action: "Go to End" },
      { keys: ["Ctrl", "F"], action: "Find" },
      { keys: ["Ctrl", "H"], action: "Find & Replace" },
    ],
  },
  {
    name: "Document",
    shortcuts: [
      { keys: ["Ctrl", "S"], action: "Save" },
      { keys: ["Ctrl", "P"], action: "Print" },
      { keys: ["Ctrl", "N"], action: "New Document" },
      { keys: ["Escape"], action: "Exit Focus Mode" },
    ],
  },
];

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Master these shortcuts to boost your productivity
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {shortcutCategories.map((category) => (
              <div key={category.name}>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">
                  {category.name}
                </h3>
                <div className="grid gap-2">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.action}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.action}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, index) => (
                          <span key={index} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 text-xs bg-background border border-border rounded shadow-sm font-mono min-w-[28px] text-center">
                              {key}
                            </kbd>
                            {index < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs">
                                +
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t text-center text-xs text-muted-foreground">
          <p>
            Use{" "}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Cmd</kbd>{" "}
            instead of{" "}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd>{" "}
            on Mac
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
