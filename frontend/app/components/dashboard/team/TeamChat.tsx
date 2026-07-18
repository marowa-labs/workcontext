"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Send,
  MessageSquare,
  X,
  CornerDownRight,
  MoreHorizontal,
  Trash2,
  Reply,
} from "lucide-react";
import TeamChatService, {
  TeamChatMessage,
} from "../../../lib/utils/teamChatService";
import { supabase } from "../../../lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "../../../lib/utils/useUser";

interface TeamChatProps {
  workspaceId?: string;
  projectId?: string;
  title?: string;
  className?: string;
  onClose?: () => void;
}

export function TeamChat({
  workspaceId,
  projectId,
  className = "",
  onClose,
}: TeamChatProps) {
  const { data: user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<TeamChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  useEffect(() => {
    // Wait for user authentication to initialize
    if (userLoading) return;

    // If no user after loading, stop here (DashboardLayout usually handles redirect)
    if (!user) {
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      try {
        const data = await TeamChatService.getMessages({
          workspaceId,
          projectId,
        });
        setMessages(data);
      } catch (err) {
        console.error("Failed to load chat messages:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [workspaceId, projectId, user, userLoading]);

  // Real-time subscription via Supabase Realtime broadcast
  useEffect(() => {
    const channelName = `team-chat-${workspaceId || projectId}`;
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "new_message" }, (payload) => {
        const newMessage = payload.payload as any;
        // Skip if this is our own optimistic message that was already added
        if (newMessage && newMessage.id && !newMessage.id.startsWith("temp-")) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [
              ...prev,
              {
                id: newMessage.id,
                content: newMessage.content,
                created_at: newMessage.created_at,
                user_id: newMessage.user_id,
                workspace_id: newMessage.workspace_id,
                project_id: newMessage.project_id,
                parent_id: newMessage.parent_id,
                user: newMessage.user || null,
              } as TeamChatMessage,
            ];
          });
        }
      })
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "TeamChatMessage",
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !user) return;

    try {
      const content = inputValue;
      setInputValue("");

      // Optimistically add message to UI immediately
      const optimisticMessage: TeamChatMessage = {
        id: `temp-${Date.now()}`,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
        user: {
          id: user.id,
          full_name:
            user.user_metadata?.full_name || user.user_metadata?.name || null,
          email: user.email || "",
        },
        workspace_id: workspaceId,
        project_id: projectId,
        parent_id: replyTo?.id || undefined,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setReplyTo(null);

      // Broadcast immediately via Supabase Realtime for instant delivery
      const channelName = `team-chat-${workspaceId || projectId}`;
      supabase.channel(channelName).send({
        type: "broadcast",
        event: "new_message",
        payload: {
          ...optimisticMessage,
          workspace_id: workspaceId || null,
          project_id: projectId || null,
        },
      });

      const sentMessage = await TeamChatService.sendMessage({
        content,
        workspaceId,
        projectId,
        parentId: replyTo?.id,
      });

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMessage.id
            ? {
                ...sentMessage,
                role: "user" as any,
                user: sentMessage.user || optimisticMessage.user,
              }
            : m,
        ),
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await TeamChatService.deleteMessage(id);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-card border-l border-border ${className}`}
    >
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
              <MessageSquare className="w-10 h-10 mb-2" />
              <p className="text-xs">
                No messages yet.
                <br />
                Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="group relative flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {msg.user.full_name?.charAt(0) || msg.user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                      {msg.user.full_name || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <div className="text-sm text-foreground bg-muted rounded-r-lg rounded-bl-lg p-2 inline-block max-w-full break-words">
                    {msg.content}
                  </div>

                  {/* Message Actions (Visible on hover) */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <Reply className="w-3 h-3" /> Reply
                    </button>
                    {msg.user_id === user?.id && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        {replyTo && (
          <div className="flex items-center justify-between mb-2 p-2 bg-primary/10 rounded text-[10px] text-primary animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-1 truncate">
              <CornerDownRight className="w-3 h-3" />
              Replying to{" "}
              <span className="font-bold">
                {replyTo.user.full_name || "User"}
              </span>
            </div>
            <button onClick={() => setReplyTo(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-9 text-sm border-border focus:ring-primary bg-background"
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 bg-primary hover:bg-primary/90 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
