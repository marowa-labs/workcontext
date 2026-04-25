"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { FileText, Users, Clock, AlertCircle } from "lucide-react";

interface ProjectJoinDialogProps {
  open: boolean;
  project: {
    id: string;
    title: string;
    user: { full_name: string; email: string };
    updated_at: string;
    collaborators?: any[];
  };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProjectJoinDialog({
  open,
  project,
  onConfirm,
  onCancel,
  isLoading = false,
}: ProjectJoinDialogProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Updated moments ago";
    } else if (diffInHours < 24) {
      return `Updated ${Math.floor(diffInHours)} hours ago`;
    } else {
      return `Updated on ${date.toLocaleDateString()}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader className="bg-white">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Join Collaborative Project
          </DialogTitle>
          <DialogDescription>
            You've been invited to collaborate on this document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Info */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-lg mb-3">{project.title}</h3>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  Owner: {project.user.full_name || project.user.email}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatDate(project.updated_at)}</span>
              </div>

              {project.collaborators && project.collaborators.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {project.collaborators.length} active collaborator
                    {project.collaborators.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Permission Info */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">You'll join as an Editor</p>
              <p className="text-blue-700 mt-1">
                You can view and edit this document in real-time with other
                collaborators.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? "Joining..." : "Join Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
