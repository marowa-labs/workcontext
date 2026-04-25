"use client";

import React, { useState, useRef } from "react";
import {
  Paperclip,
  X,
  Plus,
  FileIcon,
  FileText,
  ImageIcon,
  Loader2,
  Download,
} from "lucide-react";
import { WorkspaceAttachment } from "../../../lib/utils/workspaceTaskService";
import { Button } from "../../ui/button";
import workspaceTaskService from "../../../lib/utils/workspaceTaskService";
import { toast } from "../../../hooks/use-toast";

interface AttachmentSectionProps {
  taskId: string;
  attachments: WorkspaceAttachment[];
  onAttachmentChange: (attachments: WorkspaceAttachment[]) => void;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  taskId,
  attachments,
  onAttachmentChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (fileType.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const newAttachment = await workspaceTaskService.uploadAttachment(
        taskId,
        file,
      );
      onAttachmentChange([...attachments, newAttachment]);
      toast({
        title: "Success",
        description: "File uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload failed", error);
      toast({
        title: "Upload failed",
        description: "Could not upload the file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await workspaceTaskService.deleteAttachment(id);
      onAttachmentChange(attachments.filter((a) => a.id !== id));
      toast({
        title: "Deleted",
        description: "Attachment removed.",
      });
    } catch (error) {
      console.error("Delete failed", error);
      toast({
        title: "Error",
        description: "Could not delete attachment.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Paperclip className="w-4 h-4 text-slate-500" />
          Attachments
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
            {attachments.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] gap-1 text-slate-500 hover:text-indigo-600"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          Add File
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {attachments.map((file) => (
          <div
            key={file.id}
            className="group flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-200 hover:bg-slate-50/50 transition-all">
            <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              {getFileIcon(file.file_type)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-700 truncate">
                {file.name}
              </p>
              <p className="text-[9px] text-slate-400">
                {formatFileSize(file.file_size)}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || ""}/api/workspaces/tasks/attachments/${file.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-white rounded text-slate-400 hover:text-indigo-600"
                title="Download">
                <Download className="w-3 h-3" />
              </a>
              <button
                onClick={() => handleDelete(file.id)}
                className="p-1 hover:bg-white rounded text-slate-400 hover:text-red-600"
                title="Delete">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {attachments.length === 0 && !isUploading && (
        <p className="text-[10px] text-slate-400 italic py-2">
          No files attached yet.
        </p>
      )}
    </div>
  );
};
