"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Reply,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Plus,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import CollaborationService, {
  Comment,
} from "../../../lib/utils/collaborationService";

interface CommentPanelProps {
  projectId: string;
  sectionId?: string;
  onClose?: () => void;
}

export function CommentPanel({
  projectId,
  sectionId,
  onClose,
}: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyStates, setReplyStates] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await CollaborationService.getComments(projectId, sectionId);
      setComments(res.comments || []);
    } catch (err: any) {
      setError(err.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [projectId, sectionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async () => {
    if (!newContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      await CollaborationService.createComment({
        projectId,
        content: newContent.trim(),
        sectionId,
      });
      setNewContent("");
      await fetchComments();
    } catch (err: any) {
      setError(err.message || "Failed to create comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    const content = replyStates[commentId];
    if (!content?.trim() || submittingReply) return;
    setSubmittingReply(commentId);
    try {
      await CollaborationService.addReply(commentId, content.trim());
      setReplyStates((prev) => ({ ...prev, [commentId]: "" }));
      await fetchComments();
    } catch (err: any) {
      setError(err.message || "Failed to add reply");
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleResolve = async (commentId: string, isResolved: boolean) => {
    try {
      await CollaborationService.updateComment(commentId, {
        is_resolved: !isResolved,
      });
      await fetchComments();
    } catch (err: any) {
      setError(err.message || "Failed to update comment");
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-600" />
          <span className="font-semibold text-sm">Comments</span>
          {comments.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <span className="text-lg leading-none">&times;</span>
          </Button>
        )}
      </div>

      {/* New comment input */}
      <div className="px-4 py-3 border-b border-gray-100">
        <Textarea
          placeholder="Add a comment..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-[60px] text-sm resize-none mb-2"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmitComment}
            disabled={!newContent.trim() || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Comment
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 m-3 rounded-md">
            {error}
          </div>
        )}

        {loading && comments.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p className="text-sm">No comments yet</p>
          </div>
        )}

        {comments.length > 0 && (
          <div className="divide-y divide-gray-50">
            {comments.map((comment) => (
              <div key={comment.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {comment.user?.full_name ||
                            comment.user?.email ||
                            "Unknown"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(comment.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleResolve(comment.id, comment.is_resolved)
                        }
                        className={`p-1 rounded transition-colors ${
                          comment.is_resolved
                            ? "text-green-500 hover:text-green-600"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        title={comment.is_resolved ? "Resolved" : "Mark resolved"}
                      >
                        {comment.is_resolved ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        comment.is_resolved
                          ? "text-gray-400 line-through"
                          : "text-gray-700"
                      }`}
                    >
                      {comment.content}
                    </p>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-100 pl-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                              <User className="h-3 w-3 text-gray-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-800">
                                  {reply.user?.full_name ||
                                    reply.user?.email ||
                                    "Unknown"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatTime(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    <div className="mt-2">
                      {replyStates[comment.id] !== undefined ? (
                        <div className="flex items-start gap-2">
                          <Textarea
                            placeholder="Write a reply..."
                            value={replyStates[comment.id] || ""}
                            onChange={(e) =>
                              setReplyStates((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value,
                              }))
                            }
                            className="min-h-[40px] text-xs resize-none"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitReply(comment.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 flex-shrink-0"
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={
                              !replyStates[comment.id]?.trim() ||
                              submittingReply === comment.id
                            }
                          >
                            {submittingReply === comment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setReplyStates((prev) => ({
                              ...prev,
                              [comment.id]: "",
                            }))
                          }
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-1 transition-colors"
                        >
                          <Reply className="h-3 w-3" />
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
