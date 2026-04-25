"use client";

import { ExternalLink, Users, Calendar, Quote } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

export interface PaperCardProps {
  paper: {
    paperId: string;
    title: string;
    authors: Array<{ authorId?: string; name: string }>;
    year: number;
    abstract?: string;
    citationCount: number;
    url?: string;
    doi?: string;
    venue?: string;
    fieldsOfStudy?: string[];
  };
  onInsertCitation?: (paper: any) => void;
  onAddToLibrary?: (paper: any) => void;
  onViewDetails?: (paperId: string) => void;
  compact?: boolean;
}

export function PaperCard({
  paper,
  onInsertCitation,
  onAddToLibrary,
  onViewDetails,
  compact = false,
}: PaperCardProps) {
  const authorNames =
    paper.authors.length > 3
      ? `${paper.authors
          .slice(0, 3)
          .map((a) => a.name)
          .join(", ")} et al.`
      : paper.authors.map((a) => a.name).join(", ");

  return (
    <Card
      className={`p-4 hover:bg-accent/50 transition-colors ${compact ? "space-y-2" : "space-y-3"}`}>
      {/* Title */}
      <div className="space-y-1">
        <h4
          className={`font-semibold text-foreground hover:text-primary cursor-pointer line-clamp-2 ${compact ? "text-sm" : "text-base"}`}
          onClick={() => onViewDetails?.(paper.paperId)}>
          {paper.title}
        </h4>

        {/* Authors and Year */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span className="line-clamp-1">{authorNames}</span>
          {paper.year && (
            <>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{paper.year}</span>
            </>
          )}
        </div>
      </div>

      {/* Abstract (only in full mode) */}
      {!compact && paper.abstract && (
        <p className="text-sm text-muted-foreground line-clamp-3">
          {paper.abstract}
        </p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Citation Count */}
        {paper.citationCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Quote className="h-3 w-3 mr-1" />
            {paper.citationCount} citations
          </Badge>
        )}

        {/* Venue */}
        {paper.venue && !compact && (
          <Badge variant="outline" className="text-xs">
            {paper.venue}
          </Badge>
        )}

        {/* Fields of Study */}
        {paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0 && !compact && (
          <Badge variant="outline" className="text-xs">
            {paper.fieldsOfStudy[0]}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {onInsertCitation && (
          <Button
            size="sm"
            variant="default"
            onClick={() => onInsertCitation(paper)}
            className="text-xs">
            <Quote className="h-3 w-3 mr-1" />
            Insert Citation
          </Button>
        )}

        {onAddToLibrary && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddToLibrary(paper)}
            className="text-xs">
            Add to Library
          </Button>
        )}

        {paper.url && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(paper.url, "_blank")}
            className="text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>
        )}
      </div>
    </Card>
  );
}
