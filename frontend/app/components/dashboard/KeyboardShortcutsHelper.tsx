"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ShortcutHandler } from "../../hooks/useKeyboardShortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelperProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutHandler[];
}

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
    {} as Record<string, ShortcutHandler[]>,
  );

  const formatKey = (shortcut: ShortcutHandler) => {
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

    parts.push(shortcut.key.toUpperCase());

    return parts.join(" + ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white border border-slate-200 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(
            ([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, idx) => (
                    <div
                      key={`${category}-${idx}`}
                      className="flex items-center justify-between py-2 px-3 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className="text-sm text-slate-600">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded shadow-sm">
                        {formatKey(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            Press{" "}
            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded">
              Ctrl + ?
            </kbd>{" "}
            to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
