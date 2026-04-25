"use client";

import { useState } from "react";
import {
  SearchCheck,
  AlertTriangle,
  Lightbulb,
  Target,
  BookOpen,
} from "lucide-react";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { useResearchCoPilot } from "../../../hooks/useResearchCoPilot";
import { toast } from "../../../hooks/use-toast";
import { PaperCard } from "../../research/PaperCard";

interface GapAnalysisPanelProps {
  editor?: any;
  projectId?: string;
  documentTitle?: string;
}

export function GapAnalysisPanel({
  editor,
  projectId = "",
  documentTitle = "",
}: GapAnalysisPanelProps) {
  const { analyzeGaps, isLoading, literatureGaps } = useResearchCoPilot();
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);
  const runGapAnalysis = async () => {
    if (!editor) {
      toast({
        title: "Editor not ready",
        description: "Please wait for the editor to load completely.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Extract content from editor
      const textContent = editor.getText();

      // Determine sections (simplified for now)
      // Ideally we would parse headings from the JSON

      await analyzeGaps({
        projectId,
        title: documentTitle,
        content: textContent, // Send text for easier analysis for now
      });

      setHasRunAnalysis(true);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not complete gap analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInsertChain = (paper: any) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent(
          ` (${paper.authors?.[0] || "Unknown"}, ${paper.year || "n.d."}) `,
        )
        .run();

      toast({
        title: "Citation Added",
        description: `Added citation for ${paper.title}`,
      });
    }
  };

  const priorityColors = {
    high: "bg-rose-50 border-rose-100 text-rose-900",
    medium: "bg-amber-50 border-amber-100 text-amber-900",
    low: "bg-blue-50 border-blue-100 text-blue-900",
  };

  const priorityIcons = {
    high: AlertTriangle,
    medium: Lightbulb,
    low: SearchCheck,
  };

  const iconColors = {
    high: "text-rose-500",
    medium: "text-amber-500",
    low: "text-blue-500",
  };

  if (!hasRunAnalysis && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-200 blur-xl opacity-50 rounded-full animate-pulse"></div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative">
            <SearchCheck className="w-12 h-12 text-amber-600" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Research Auditor
        </h3>
        <p className="text-sm text-gray-500 max-w-xs mb-8">
          Identify missing topics, potential biases, and unexplored angles in
          your literature review using AI.
        </p>
        <Button
          size="lg"
          onClick={runGapAnalysis}
          className="w-full max-w-xs bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-900/20">
          Find Research Gaps
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
        <h3 className="font-semibold text-gray-900">Analyzing Research...</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-xs">
          Detecting thematic gaps and finding relevant papers to fill them.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Gap Analysis</h3>
            <p className="text-xs text-gray-500">
              {literatureGaps?.length || 0} gaps found
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={runGapAnalysis}>
          Run Again
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {(literatureGaps?.length || 0) === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No significant gaps found! Good job.
              </p>
            </div>
          ) : (
            literatureGaps?.map((gap, index) => {
              const Icon = priorityIcons[gap.priority] || Lightbulb;
              const colorClass = priorityColors[gap.priority];
              const iconColor = iconColors[gap.priority];

              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {gap.priority} Priority Gap
                    </span>
                  </div>

                  <div
                    className={`border rounded-xl p-4 ${colorClass} bg-opacity-50`}>
                    <h4 className="font-semibold text-sm mb-2">{gap.topic}</h4>
                    <p className="text-xs opacity-90 mb-4 leading-relaxed">
                      {gap.description}
                    </p>

                    {/* Suggested Papers */}
                    {gap.suggestedPapers && gap.suggestedPapers.length > 0 && (
                      <div className="space-y-3 mt-4 pt-4 border-t border-gray-200/50">
                        <h5 className="text-xs font-bold opacity-70 uppercase tracking-wider flex items-center gap-2">
                          <BookOpen className="w-3 h-3" />
                          Suggested Sources
                        </h5>

                        <div className="space-y-2">
                          {gap.suggestedPapers.map(
                            (paper: any, pIdx: number) => (
                              <PaperCard
                                key={pIdx}
                                paper={paper}
                                compact={true}
                                onInsertCitation={() =>
                                  handleInsertChain(paper)
                                }
                              />
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
