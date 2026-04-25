"use client";

import { Brain, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export type ChatMode = "general" | "research" | "autocomplete";

export interface ChatModeSelectorProps {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
}

const modes = [
  {
    value: "general" as ChatMode,
    label: "General",
    icon: MessageSquare,
    description: "General AI chat and assistance",
  },
  {
    value: "research" as ChatMode,
    label: "Research",
    icon: Brain,
    description: "Document-aware with citations and papers",
  },
  {
    value: "autocomplete" as ChatMode,
    label: "Autocomplete",
    icon: Sparkles,
    description: "Real-time writing suggestions",
  },
];

export function ChatModeSelector({ mode, onChange }: ChatModeSelectorProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.value;

          return (
            <Tooltip key={m.value}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onChange(m.value)}
                  className={`gap-2 ${isActive ? "bg-gray-500 text-white" : "bg-blue-500 hover:bg-blue-500 hover:text-white"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{m.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white border border-gray-200 rounded-md">
                <p className="text-xs">{m.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
