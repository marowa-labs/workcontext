"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Send,
  Reply,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  AtSign,
  Quote,
  Filter,
  Clock,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import CollaborationService, {
  Comment,
} from "../../../lib/utils/collaborationService";
import { ProjectService } from "../../../lib/utils/projectService";
import workspaceService from "../../../lib/utils/workspaceService";

interface CommentPanelProps {
  projectId: string;
  sectionId?: string;
  contextText?: string;
  onClose?: () => void;
  editor?: any;
}

type CommentStatus = "active" | "resolved" | "closed";
type StatusFilter = "all" | "active" | "resolved" | "closed";

export function CommentPanel({
  projectId,
  sectionId,
  contextText: initialContextText,
  onClose,
  editor,
}: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyStates, setReplyStates] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionableUsers, setMentionableUsers] = useState<
    { id: string; full_name: string; email: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const project = await ProjectService.getProjectById(projectId);
        const users: { id: string; full_name: string; email: string }[] = [];

        if (project.user) {
          users.push(project.user);
        }
        if (project.collaborators) {
          for (const collab of project.collaborators) {
            if (collab.user && !users.find((u) => u.id === collab.user.id)) {
              users.push(collab.user);
            }
          }
        }
        if (project.workspace_id) {
          try {
            const members = await workspaceService.getWorkspaceMembers(
              project.workspace_id,
            );
            for (const m of members) {
              if (!users.find((u) => u.id === m.user.id)) {
                users.push(m.user);
              }
            }
          } catch {
            // workspace member fetch failed, continue without
          }
        }

        setMentionableUsers(users);
      } catch {
        // project fetch failed, will show no mentions
      }
    })();
  }, [projectId]);

  const filteredMentions = useMemo(
    () =>
      mentionableUsers.filter(
        (u) =>
          (u.full_name ?? u.email)
            .toLowerCase()
            .includes(mentionSearch.toLowerCase()),
      ),
    [mentionSearch, mentionableUsers],
  );

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

  const filteredComments = useMemo(() => {
    if (statusFilter === "all") return comments;
    return comments.filter((c) => {
      if (statusFilter === "active") return c.status === "active" || !c.status;
      return c.status === statusFilter;
    });
  }, [comments, statusFilter]);

  // Detect @mentions in text and show suggestion popup
  const handleContentChange = (value: string, setter: (v: string) => void) => {
    setter(value);
    const match = value.match(/@(\w*)$/);
    if (match) {
      setMentionSearch(match[1]);
      setShowMentions(true);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (
    name: string,
    content: string,
    setter: (v: string) => void,
  ) => {
    const newVal = content.replace(/@(\w*)$/, `@${name} `);
    setter(newVal);
    setShowMentions(false);
    setMentionIndex(0);
  };

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

  const handleStatusChange = async (
    commentId: string,
    newStatus: CommentStatus,
  ) => {
    try {
      await CollaborationService.updateComment(commentId, {
        status: newStatus,
        is_resolved: newStatus === "resolved" || newStatus === "closed",
      });
      await fetchComments();
    } catch (err: any) {
      setError(err.message || "Failed to update comment status");
    }
  };

  const handleContextClick = (contextText: string) => {
    if (!editor) return;
    const doc = editor.state.doc;
    let found = false;
    doc.descendants((node: any, pos: number) => {
      if (found) return false;
      if (node.isText && node.text?.includes(contextText)) {
        editor.commands.setTextSelection({
          from: pos,
          to: pos + contextText.length,
        });
        editor.commands.scrollIntoView();
        found = true;
        return false;
      }
    });
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

  const statusBadge = (status?: string) => {
    switch (status) {
      case "resolved":
        return (
          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
            Resolved
          </span>
        );
      case "closed":
        return (
          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
            Closed
          </span>
        );
      default:
        return (
          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
            Active
          </span>
        );
    }
  };

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="text-blue-600 font-medium">
          {part}
        </span>
      ) : (
        part
      ),
    );
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
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
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
      </div>

      {/* New comment input */}
      <div className="px-4 py-3 border-b border-gray-100 relative">
        {initialContextText && (
          <div className="mb-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 flex items-start gap-1">
            <Quote className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="italic line-clamp-2">{initialContextText}</span>
          </div>
        )}
        <Textarea
          placeholder="Add a comment... Use @ to mention someone"
          value={newContent}
          onChange={(e) => handleContentChange(e.target.value, setNewContent)}
          className="min-h-[60px] text-sm resize-none mb-2"
          onKeyDown={(e) => {
            if (showMentions) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex((i) =>
                  Math.min(i + 1, filteredMentions.length - 1),
                );
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex((i) => Math.max(i - 1, 0));
                return;
              }
              if (
                e.key === "Enter" &&
                filteredMentions[mentionIndex] &&
                !e.shiftKey
              ) {
                e.preventDefault();
                insertMention(
                  filteredMentions[mentionIndex].full_name ||
                    filteredMentions[mentionIndex].email,
                  newContent,
                  setNewContent,
                );
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
        />
        {/* @mention popup */}
        {showMentions && filteredMentions.length > 0 && (
          <div className="absolute bottom-16 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
            {filteredMentions.map((u, i) => {
              const displayName = u.full_name || u.email;
              return (
                <button
                  key={u.id}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                    i === mentionIndex
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(displayName, newContent, setNewContent);
                  }}
                >
                  <AtSign className="h-3 w-3 shrink-0" />
                  <span className="truncate">{displayName}</span>
                  <span className="text-xs text-gray-400 truncate ml-auto">
                    {u.email}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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

        {!loading && !error && filteredComments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p className="text-sm">No comments yet</p>
          </div>
        )}

        {filteredComments.length > 0 && (
          <div className="divide-y divide-gray-50">
            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={`px-4 py-3 ${
                  comment.status === "closed"
                    ? "opacity-60"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1">
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
                      <div className="flex items-center gap-1">
                        {statusBadge(comment.status)}
                        <div className="relative group">
                          <button className="p-1 rounded hover:bg-gray-100">
                            <Clock className="h-3 w-3 text-gray-400" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block min-w-[120px]">
                            {["active", "resolved", "closed"].map((s) => (
                              <button
                                key={s}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                                  (comment.status || "active") === s
                                    ? "text-blue-600 font-medium"
                                    : "text-gray-600"
                                }`}
                                onClick={() =>
                                  handleStatusChange(
                                    comment.id,
                                    s as CommentStatus,
                                  )
                                }
                              >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Context text (anchored selection) */}
                    {comment.context_text && (
                      <button
                        onClick={() => handleContextClick(comment.context_text!)}
                        className="mt-1 w-full text-left text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 flex items-start gap-1 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        title="Click to jump to this text in the editor"
                      >
                        <Quote className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="italic line-clamp-2">
                          {comment.context_text}
                        </span>
                      </button>
                    )}

                    <p
                      className={`text-sm mt-1 ${
                        comment.is_resolved
                          ? "text-gray-400 line-through"
                          : "text-gray-700"
                      }`}
                    >
                      {renderContentWithMentions(comment.content)}
                    </p>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-100 pl-3">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="flex items-start gap-2"
                          >
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
                                {renderContentWithMentions(reply.content)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    <div className="mt-2">
                      {replyStates[comment.id] !== undefined ? (
                        <div className="flex items-start gap-2 relative">
                          <Textarea
                            placeholder="Write a reply... Use @ to mention someone"
                            value={replyStates[comment.id] || ""}
                            onChange={(e) =>
                              handleContentChange(
                                e.target.value,
                                (v: string) =>
                                  setReplyStates((prev) => ({
                                    ...prev,
                                    [comment.id]: v,
                                  })),
                              )
                            }
                            className="min-h-[40px] text-xs resize-none"
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                !e.shiftKey &&
                                !showMentions
                              ) {
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
