import { useState, useEffect, useRef } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import useAuth from "../utils/useAuth";

const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_COLLABORATION_API_URL || "ws://localhost:9081";

export interface PresenceUser {
  clientId: number;
  user: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
}

export function usePresence(documentId: string) {
  const { user, token } = useAuth();
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);

  useEffect(() => {
    if (!user || !documentId || !token) return;

    // Create a new Y.Doc for this context
    const ydoc = new Y.Doc();
    docRef.current = ydoc;

    // Initialize provider
    const provider = new HocuspocusProvider({
      url: WEBSOCKET_URL,
      name: documentId, // Scoped to this ID (e.g., 'dashboard-team-123')
      document: ydoc,
      token: token,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onAwarenessChange: ({ states }) => {
        const users: PresenceUser[] = [];
        states.forEach((state: any, clientId: number) => {
          if (state.user) {
            users.push({
              clientId,
              user: state.user,
            });
          }
        });
        setActiveUsers(users);
      },
    });

    providerRef.current = provider;

    // Set initial awareness state for current user
    if (user) {
      provider.setAwarenessField("user", {
        id: user.id,
        name: user.user_metadata?.full_name || user.email,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        avatar: user.user_metadata?.avatar_url,
      });
    }

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [user, documentId, token]);

  return {
    activeUsers,
    isConnected,
    provider: providerRef.current,
  };
}
