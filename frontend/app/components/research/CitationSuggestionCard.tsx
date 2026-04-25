"use client";

import { Sparkles, Quote, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

export interface CitationSuggestionProps {
  text: string;
  suggestions: Array<{
    paperId: string;
    title: string;
    authors: string[];
    year: number;
    relevanceScore: number;
    reason: string;
    formattedCitation: string;
  }>;
  confidence: number;
  onInsertCitation: (citation: any) => void;
  onDismiss?: () => void;
}

export function CitationSuggestionCard({
  text,
  suggestions,
  confidence,
  onInsertCitation,
  onDismiss,
}: CitationSuggestionProps) {
  return (
    <Card className="p-4 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-sm text-foreground">
            Citation Suggestions
          </h4>
        </div>
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
            ×
          </Button>
        )}
      </div>

      {/* Original Text */}
      <div className="bg-white/50 dark:bg-black/20 p-3 rounded border">
        <p className="text-sm text-muted-foreground italic line-clamp-2">
          "{text}"
        </p>
      </div>

      {/* AI Confidence */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">AI Confidence</span>
          <span className="font-medium">{Math.round(confidence * 100)}%</span>
        </div>
        <Progress value={confidence * 100} className="h-1.5" />
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <div
            key={suggestion.paperId}
            className="bg-white dark:bg-card p-3 rounded border space-y-2">
            {/* Citation */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>
                      {Math.round(suggestion.relevanceScore * 100)}% match
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium line-clamp-1">
                  {suggestion.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.authors.join(", ")} ({suggestion.year})
                </p>
              </div>
            </div>

            {/* Reason */}
            <p className="text-xs text-muted-foreground italic">
              {suggestion.reason}
            </p>

            {/* Action */}
            <Button
              size="sm"
              onClick={() => onInsertCitation(suggestion)}
              className="w-full text-xs">
              <Quote className="h-3 w-3 mr-1" />
              Insert "{suggestion.authors[0]} et al., {suggestion.year}"
            </Button>
          </div>
        ))}
      </div>

      {/* Show More */}
      {suggestions.length > 3 && (
        <Button variant="ghost" size="sm" className="w-full text-xs">
          Show {suggestions.length - 3} more suggestions
        </Button>
      )}
    </Card>
  );
}
