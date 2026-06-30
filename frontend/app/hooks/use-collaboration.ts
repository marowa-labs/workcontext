import { useState, useEffect } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { supabase } from "../lib/supabase/client";

interface UseCollaborationProps {
  documentId: string;
  isCollaborative: boolean;
  username: string;
  onStatusChange?: (status: string) => void;
}

export const useCollaboration = ({
  documentId,
  isCollaborative,
  username,
  onStatusChange,
}: UseCollaborationProps) => {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  useEffect(() => {
    // 1. Reset state if not collaborative or missing basics
    if (!isCollaborative || !documentId) {
      setProvider(null);
      setIsReady(false);
      setStatus("disconnected");
      return;
    }

    let newProvider: HocuspocusProvider | null = null;
    let mounted = true;

    const initProvider = async () => {
      setStatus("connecting");

      try {
        // 2. Fetch Auth Token
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token || "";

        if (!mounted) return;

        // 3. Initialize Hocuspocus Provider
        const wsUrl =
          process.env.NEXT_PUBLIC_COLLAB_URL || "ws://localhost:9081";

        newProvider = new HocuspocusProvider({
          url: wsUrl,
          name: `project-${documentId}`,
          token: token,
          onAuthenticationFailed: ({ reason }) => {
            console.error("Collab Auth Failed:", reason);
            if (mounted) setStatus("disconnected");
          },
          onStatus: ({ status: newStatus }) => {
            console.log("Collab Status:", newStatus);
            if (mounted) {
              setStatus(
                newStatus === "connected" ? "connected" : "disconnected",
              );
              if (onStatusChange) onStatusChange(newStatus);
            }
          },
          onSynced: () => {
            // CRITICAL: Only consider ready when fully synced
            console.log(
              "Collab Synced - Doc Ready, doc size:",
              (newProvider?.document as any)?.encodeStateAsUpdate?.()?.length ??
                0,
              "bytes",
            );
            if (mounted && newProvider?.document) {
              // Log the actual document content for debugging
              try {
                const ydoc = newProvider.document;
                // Safely check if the prosemirror type exists
                let prosemirrorJSON = null;
                try {
                  const ytypes = ydoc.share;
                  if (ytypes && ytypes.has("prosemirror")) {
                    prosemirrorJSON = ydoc.get("prosemirror") as any;
                  }
                } catch (typeError) {
                  console.log(
                    "[Collab Synced] prosemirror type not initialized yet:",
                    typeError,
                  );
                }
                console.log(
                  "[Collab Synced] Document content:",
                  prosemirrorJSON
                    ? JSON.stringify(prosemirrorJSON).substring(0, 200)
                    : "not available",
                );
              } catch (e) {
                console.log(
                  "[Collab Synced] Could not read document content:",
                  e,
                );
              }
              setIsReady(true);
            }
          },
        });

        // 4. Set Awareness (User Presence)
        newProvider.setAwarenessField("user", {
          name: username,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          lastActive: Date.now(),
        });

        // COMPATIBILITY FIX: Alias .doc to .document for Tiptap CollaborationCursor
        // The cursor extension expects a .doc property, but HocuspocusProvider v2+ uses .document
        // @ts-ignore
        if (!newProvider.doc) {
          Object.defineProperty(newProvider, "doc", {
            get: () => newProvider?.document,
          });
        }

        setProvider(newProvider);
      } catch (err) {
        console.error("Collab Init Error:", err);
        if (mounted) setStatus("disconnected");
      }
    };

    initProvider();

    // 5. Cleanup
    return () => {
      mounted = false;
      if (newProvider) {
        newProvider.destroy();
      }
      setProvider(null);
      setIsReady(false);
      setStatus("disconnected");
    };
  }, [documentId, isCollaborative, username]); // Re-run if these change

  return {
    provider,
    isReady, // True only when connected AND synced (doc valid)
    status,
  };
};
