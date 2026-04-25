"use client";

import { AlertTriangle, Lightbulb, Search } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { PaperCard } from "./PaperCard";

export interface LiteratureGap {
  topic: string;
  description: string;
  suggestedPapers: any[];
  priority: "high" | "medium" | "low";
}

export interface GapAnalysisPanelProps {
  gaps: LiteratureGap[];
  isLoading?: boolean;
  onInsertCitation: (paper: any) => void;
  onAddToLibrary: (paper: any) => void;
}

const priorityColors = {
  high: "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800",
  medium:
    "bg-yellow-100 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-800",
  low: "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800",
};

const priorityIcons = {
  high: AlertTriangle,
  medium: Lightbulb,
  low: Search,
};

export function GapAnalysisPanel({
  gaps,
  isLoading,
  onInsertCitation,
  onAddToLibrary,
}: GapAnalysisPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">
            Analyzing literature gaps...
          </p>
        </div>
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            No literature gaps detected
          </p>
          <p className="text-xs text-muted-foreground">
            Your document appears well-cited
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="font-semibold">Literature Gap Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Found {gaps.length} area{gaps.length !== 1 ? "s" : ""} that need
            more citations
          </p>
        </div>

        {/* Gaps */}
        {gaps.map((gap, index) => {
          const Icon = priorityIcons[gap.priority];
          return (
            <Card
              key={index}
              className={`p-4 space-y-3 ${priorityColors[gap.priority]}`}>
              {/* Gap Header */}
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{gap.topic}</h4>
                    <Badge
                      variant={
                        gap.priority === "high"
                          ? "destructive"
                          : gap.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs">
                      {gap.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {gap.description}
                  </p>
                </div>
              </div>

              {/* Suggested Papers */}
              {gap.suggestedPapers.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase">
                    Suggested Papers
                  </h5>
                  {gap.suggestedPapers.map((paper) => (
                    <PaperCard
                      key={paper.paperId}
                      paper={paper}
                      onInsertCitation={onInsertCitation}
                      onAddToLibrary={onAddToLibrary}
                      compact
                    />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
