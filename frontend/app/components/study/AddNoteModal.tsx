import React, { useState } from "react";
import { X, Save, FileText, Tag, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { NoteService } from "../../lib/utils/noteService";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  projectId: string;
  onSuccess?: () => void;
}

export function AddNoteModal({
  isOpen,
  onClose,
  userId,
  projectId,
  onSuccess,
}: AddNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please provide both title and content");
      return;
    }

    try {
      setIsSaving(true);
      await NoteService.createNote({
        userId,
        projectId,
        category: "manual",
        title,
        content,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
      });
      alert("Note saved successfully!");
      setTitle("");
      setContent("");
      setTags("");
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Add Note</h3>
              <p className="text-xs text-gray-500">Create a new manual note</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="font-medium bg-gray-50 border-gray-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              className="min-h-[150px] resize-none bg-gray-50 border-gray-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="research, ideas, important (comma separated)"
              className="bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Note
          </Button>
        </div>
      </div>
    </div>
  );
}
