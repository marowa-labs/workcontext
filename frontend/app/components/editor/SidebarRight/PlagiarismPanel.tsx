"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
} from "lucide-react";
import { Button } from "../../ui/button";
import { useResearchCoPilot } from "../../../hooks/useResearchCoPilot";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import { toast } from "../../../hooks/use-toast";
import { Progress } from "../../ui/progress";

interface PlagiarismPanelProps {
  editor?: any;
  projectId?: string;
  documentTitle?: string;
}

export function PlagiarismPanel({
  editor,
  projectId = "",
  documentTitle = "",
}: PlagiarismPanelProps) {
  const { checkPlagiarism, isLoading } = useResearchCoPilot();
  const [result, setResult] = useState<{
    score: number;
    matches: Array<{ source: string; similarity: number; excerpt: string }>;
    isOriginal: boolean;
  } | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  const runCheck = async () => {
    if (!editor) {
      toast({
        title: "Editor not ready",
        description: "Please wait for the editor to load completely.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!editor.state || !editor.state.doc) {
        toast({
          title: "Editor not initialized",
          description:
            "The editor is still loading. Please try again in a moment.",
          variant: "destructive",
        });
        return;
      }

      // Get selected text or full text
      let textToCheck = "";
      if (editor.state && editor.state.doc) {
        const { from, to } = editor.state.selection;
        textToCheck = editor.state.doc.textBetween(from, to, " ");
      }

      if (!textToCheck || textToCheck.length < 50) {
        textToCheck = editor.getText();
        toast({
          title: "Checking Full Document",
          description: "No text selected, checking entire document...",
        });
      }

      if (textToCheck.length < 50) {
        toast({
          title: "Text too short",
          description: "Please write at least 50 characters to check.",
          variant: "destructive",
        });
        return;
      }

      const checkResult = await checkPlagiarism(textToCheck);

      setResult(checkResult);
      if (checkResult.matches.length > 0) {
        setExpandedMatch(0);
      }
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Could not complete plagiarism check. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 20) return "text-green-600";
    if (score < 50) return "text-amber-500";
    return "text-rose-600";
  };

  const getScoreBg = (score: number) => {
    if (score < 20) return "bg-green-100";
    if (score < 50) return "bg-amber-100";
    return "bg-rose-100";
  };

  if (!result && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
        <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Plagiarism Check</h3>
        <p className="text-sm mb-6 max-w-xs">
          Scan your text against millions of academic papers to ensure
          originality.
        </p>
        <Button
          onClick={runCheck}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          Scan Now
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="text-sm font-medium text-gray-600">
          Scanning Literature...
        </p>
        <div className="flex gap-2 opacity-50 text-xs text-gray-400">
          Comparing against academic index
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              Originality Report
            </h3>
            <p className="text-xs text-gray-500">
              {result?.matches.length} matches found
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={runCheck}>
            Re-scan
          </Button>
        </div>

        {/* Score Card */}
        {result && (
          <div
            className={`p-3 rounded-lg border ${result.isOriginal ? "bg-green-50 border-green-100" : "bg-rose-50 border-rose-100"}`}>
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Similarity Score
              </span>
              <span
                className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                {result.score}%
              </span>
            </div>
            <Progress
              value={result.score}
              className="h-2"
              indicatorClassName={
                result.score > 50 ? "bg-rose-500" : "bg-green-500"
              }
            />
            <p className="text-xs mt-2 text-gray-600">
              {result.isOriginal
                ? "Your content appears original."
                : "Significant similarity detected. Consider revising."}
            </p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {result?.matches.map((match, index) => {
            const isExpanded = expandedMatch === index;

            return (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div
                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedMatch(isExpanded ? null : index)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getScoreBg(Math.round(match.similarity * 100))} border-transparent`}>
                          {Math.round(match.similarity * 100)}% Match
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {match.source}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-gray-100 bg-gray-50/30">
                    <div className="space-y-2 mt-3 text-xs text-gray-600">
                      <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                        Source Excerpt
                      </p>
                      <p className="italic bg-white p-2 border border-gray-200 rounded">
                        "...{match.excerpt}..."
                      </p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-blue-600 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Find Source
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {result?.matches.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No matches found.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
