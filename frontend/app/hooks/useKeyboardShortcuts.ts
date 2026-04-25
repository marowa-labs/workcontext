import { useEffect, useCallback, useRef } from "react";

interface ShortcutHandler {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutHandler[],
  options: UseKeyboardShortcutsOptions = {},
) {
  const { enabled = true, preventDefault = true } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      // Allow Escape to work in input fields
      if (isInputField && e.key !== "Escape") {
        return;
      }

      // Find matching shortcut
      const matchingShortcut = shortcutsRef.current.find((shortcut) => {
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();

        // If the shortcut specifies a modifier, it must match
        // If the shortcut doesn't specify a modifier, we don't care about that modifier
        const ctrlMatch =
          shortcut.ctrlKey !== undefined
            ? shortcut.ctrlKey === (e.ctrlKey || e.metaKey)
            : true;
        const shiftMatch =
          shortcut.shiftKey !== undefined
            ? shortcut.shiftKey === e.shiftKey
            : true;
        const altMatch =
          shortcut.altKey !== undefined ? shortcut.altKey === e.altKey : true;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchingShortcut) {
        if (preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        matchingShortcut.handler(e);
      }
    },
    [enabled, preventDefault],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return { shortcuts: shortcutsRef.current };
}

export type { ShortcutHandler };
