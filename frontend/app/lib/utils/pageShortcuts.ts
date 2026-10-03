import type { ShortcutInfo } from "../../hooks/useKeyboardShortcuts";

type ShortcutsProvider = () => ShortcutInfo[];

let activeProvider: ShortcutsProvider | null = null;

/**
 * Lets a page expose its own shortcuts to the global shortcuts dialog.
 * Returns an unregister function, suitable as a useEffect cleanup.
 */
export function registerPageShortcuts(provider: ShortcutsProvider) {
  activeProvider = provider;
  return () => {
    if (activeProvider === provider) {
      activeProvider = null;
    }
  };
}

export function getPageShortcuts(): ShortcutInfo[] {
  return activeProvider ? activeProvider() : [];
}
