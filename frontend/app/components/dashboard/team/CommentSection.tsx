"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import apiClient from "../../../lib/utils/apiClient";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

interface CommentSectionProps {
  taskId: string;
  currentUserId?: string;
}

export function CommentSection({ taskId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchComments();
    }
  }, [taskId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(
        `/api/workspaces/tasks/comments?taskId=${taskId}`,
      );
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const data = await apiClient.post("/api/workspaces/tasks/comments", {
        taskId,
        content: newComment,
      });
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await apiClient.delete(`/api/workspaces/tasks/comments/${commentId}`, {
        params: {
          taskId,
        },
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const getInitials = (fullName: string | null, email: string) => {
    if (fullName) {
      return fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm font-outfit">
          <MessageSquare className="w-4 h-4 text-teal-600" />
          Comments
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
            {comments.length}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <p className="text-xs text-slate-400">Loading discussion...</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="group flex gap-3">
                <Avatar className="w-8 h-8 shrink-0 border border-slate-100 shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-teal-50 to-slate-100 text-teal-700 text-[10px] font-bold">
                    {getInitials(comment.user.full_name, comment.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                        {comment.user.full_name || comment.user.email}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {currentUserId === comment.user.id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 bg-slate-50 border border-slate-100/50 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm inline-block max-w-full break-words">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
              <MessageSquare className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              No comments yet
            </p>
            <p className="text-[10px] text-slate-300">
              Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>

      <div className="relative group pt-2">
        <Textarea
          placeholder="Write a comment... (Enter to send)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[45px] max-h-[120px] text-sm py-3 px-4 resize-none bg-white border-slate-200 rounded-xl focus-visible:ring-teal-500/10 focus-visible:border-teal-500 transition-all shadow-sm group-focus-within:shadow-md"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="absolute right-2 bottom-2">
          <Button
            size="icon"
            disabled={!newComment.trim() || submitting}
            onClick={handleSubmit}
            className="h-8 w-8 rounded-lg bg-teal-600 hover:bg-teal-700 shadow-sm disabled:bg-slate-100 disabled:text-slate-400">
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
