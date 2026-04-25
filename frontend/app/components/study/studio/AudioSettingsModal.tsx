import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Label } from "../../ui/label";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (settings: { tone: string; length: string }) => void;
  loading: boolean;
}

export function AudioSettingsModal({
  isOpen,
  onClose,
  onGenerate,
  loading,
}: AudioSettingsModalProps) {
  const [tone, setTone] = React.useState("Deep Dive");
  const [length, setLength] = React.useState("Medium");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle>Customize Audio Overview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Conversation Style</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="bg-white border border-gray-200">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200">
                <SelectItem value="Deep Dive">Deep Dive (Standard)</SelectItem>
                <SelectItem value="Debate">Debate (Pro vs Con)</SelectItem>
                <SelectItem value="Casual">Casual & Fun</SelectItem>
                <SelectItem value="Formal">Academic Briefing</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Determines the personality and interaction style of the AI hosts.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Length</Label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger className="bg-white border border-gray-200">
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200">
                <SelectItem value="Short">Short (1-2 min)</SelectItem>
                <SelectItem value="Medium">Medium (3-5 min)</SelectItem>
                <SelectItem value="Long">Long (5-8 min)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Approximate duration of the generated podcast.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="bg-gray-500 hover:bg-gray-600 text-white cursor-pointer"
            onClick={onClose}
            disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            onClick={() => onGenerate({ tone, length })}
            disabled={loading}>
            {loading ? "Generating..." : "Generate Audio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
