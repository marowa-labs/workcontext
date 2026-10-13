"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ShortcutInfo } from "../../hooks/useKeyboardShortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelperProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutInfo[];
}

const KEY_LABELS: Record<string, string> = {
  escape: "Esc",
  enter: "Enter",
};

export function KeyboardShortcutsHelper({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsHelperProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category || "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, ShortcutInfo[]>,
  );

  const formatKey = (shortcut: ShortcutInfo) => {
    const parts: string[] = [];

    if (shortcut.ctrlKey || shortcut.metaKey) {
      parts.push("⌘/Ctrl");
    }
    if (shortcut.shiftKey) {
      parts.push("Shift");
    }
    if (shortcut.altKey) {
      parts.push("Alt");
    }

    parts.push(
      KEY_LABELS[shortcut.key.toLowerCase()] ?? shortcut.key.toUpperCase(),
    );

    return parts.join(" + ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-card border border-border overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Shortcuts available on this page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(
            ([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, idx) => (
                    <div
                      key={`${category}-${idx}`}
                      className="flex items-center justify-between py-2 px-3 rounded bg-muted/50 hover:bg-muted transition-colors">
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-background border border-border rounded shadow-sm">
                        {formatKey(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press{" "}
            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">
              ?
            </kbd>{" "}
            to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
