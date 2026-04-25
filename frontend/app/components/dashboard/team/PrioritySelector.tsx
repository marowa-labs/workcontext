"use client";

import {
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";

export type Priority = "low" | "medium" | "high";

interface PrioritySelectorProps {
  value: string;
  onChange: (value: Priority) => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const priorities: {
    id: Priority;
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }[] = [
    {
      id: "high",
      label: "High",
      icon: ArrowUpCircle,
      color: "text-red-700",
      bgColor: "bg-red-50",
    },
    {
      id: "medium",
      label: "Medium",
      icon: MinusCircle,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
    },
    {
      id: "low",
      label: "Low",
      icon: ArrowDownCircle,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="flex gap-2">
      {priorities.map((p) => {
        const isActive = value === p.id;
        const Icon = p.icon;

        return (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(p.id)}
            className={cn(
              "flex-1 flex items-center gap-2 h-9 text-xs border-input transition-all bg-background text-foreground hover:bg-muted",
              isActive &&
                cn(
                  p.bgColor,
                  p.color,
                  "border-current font-medium shadow-sm border-2",
                ),
            )}>
            <Icon
              className={cn(
                "h-3.5 w-3.5",
                isActive ? p.color : "text-muted-foreground",
              )}
            />
            {p.label}
          </Button>
        );
      })}
    </div>
  );
}
