"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Copy, Check, Globe, Lock } from "lucide-react";
import { toast } from "../../hooks/use-toast";
import { ProjectService } from "../../lib/utils/projectService";

interface ShareProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  onUpdate: (updatedProject: any) => void;
}

export function ShareProjectDialog({
  open,
  onOpenChange,
  project,
  onUpdate,
}: ShareProjectDialogProps) {
  const [isSharingEnabled, setIsSharingEnabled] = useState(
    project?.share_settings?.link_sharing_enabled || false,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Generate the share link based on current window location or project ID
  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/editor/${project?.id}`
      : "";

  const handleToggleSharing = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const updatedProject = await ProjectService.updateProject(project.id, {
        share_settings: {
          link_sharing_enabled: enabled,
          link_permission: "edit", // Always use edit permission
        },
      });

      setIsSharingEnabled(enabled);
      onUpdate(updatedProject); // Update parent state
      toast({
        title: enabled ? "Link sharing enabled" : "Link sharing disabled",
        description: enabled
          ? "Anyone with the link can now join."
          : "Access via link is now restricted.",
      });
    } catch (error) {
      console.error("Failed to update share settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
      // Revert state on error
      setIsSharingEnabled(!enabled);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setHasCopied(true);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-800">Share Project</DialogTitle>
          <DialogDescription className="text-gray-600">
            Anyone with the link can view and edit this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue={shareLink}
              readOnly
              className="h-9 bg-white border-gray-300 text-gray-700"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="px-3"
            onClick={copyToClipboard}
            disabled={!isSharingEnabled}>
            <span className="sr-only">Copy</span>
            {hasCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="share-mode" className="font-medium text-gray-800">
              {isSharingEnabled ? "Link sharing is on" : "Link sharing is off"}
            </Label>
            <span className="text-xs text-muted-foreground">
              {isSharingEnabled
                ? "People with the link can access this project."
                : "Only invited members can access."}
            </span>
          </div>
          <Switch
            id="share-mode"
            checked={isSharingEnabled}
            onCheckedChange={handleToggleSharing}
            disabled={isLoading}
          />
        </div>

        {isSharingEnabled && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md flex items-start gap-3 text-sm text-muted-foreground">
            <Globe className="h-4 w-4 mt-0.5 text-blue-500" />
            <p>
              Users joining via this link will automatically be added as{" "}
              <strong>Editors</strong>.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
