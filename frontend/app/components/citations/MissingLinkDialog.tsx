"use client";

import React, { useState } from "react";
import {
  useCitationConfidence,
  SuggestedPaper,
} from "../../hooks/useCitationConfidence";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Loader2, ExternalLink, Plus } from "lucide-react";

interface MissingLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  field?: string;
  onAddCitation?: (paper: SuggestedPaper) => void;
}

export function MissingLinkDialog({
  open,
  onOpenChange,
  topic,
  field,
  onAddCitation,
}: MissingLinkDialogProps) {
  const { findMissingLinks, isFindingLinks } = useCitationConfidence();
  const [suggestions, setSuggestions] = useState<SuggestedPaper[] | null>(null);

  React.useEffect(() => {
    if (open && topic && !suggestions) {
      loadSuggestions();
    }
  }, [open, topic]);

  const loadSuggestions = async () => {
    const results = await findMissingLinks(topic, field, 5);
    if (results) {
      setSuggestions(results);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Find Missing Link</DialogTitle>
          <DialogDescription>
            Recent relevant papers that could strengthen your citations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isFindingLinks && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Searching for recent papers...
              </span>
            </div>
          )}

          {suggestions && !isFindingLinks && (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {suggestions.map((paper, index) => (
                  <div
                    key={index}
                    className="rounded-lg border p-4 hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-semibold text-sm leading-tight flex-1">
                        {paper.title}
                      </h4>
                      <Badge variant="outline" className="flex-shrink-0">
                        {paper.year}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">
                      {paper.authors.slice(0, 3).join(", ")}
                      {paper.authors.length > 3 && " et al."}
                    </p>

                    {paper.journal && (
                      <p className="text-xs text-muted-foreground italic mb-2">
                        {paper.journal}
                      </p>
                    )}

                    <p className="text-xs text-black mb-3 line-clamp-2">
                      {paper.abstract}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>📊 {paper.citationCount} citations</span>
                        <span>⚡ Relevance: {paper.relevanceScore}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(paper.url, "_blank")}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {onAddCitation && (
                          <Button
                            size="sm"
                            onClick={() => onAddCitation(paper)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add to Bibliography
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {suggestions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No recent papers found for this topic.</p>
                    <p className="text-sm mt-1">
                      Try adjusting your search terms.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
