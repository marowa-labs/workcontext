"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  RotateCw,
} from "lucide-react";
import { Button } from "../../ui/button";
import { SmartCitationBadge } from "../../citations/SmartCitationBadge";
import CitationService from "../../../lib/utils/citationService";
import { useToast } from "../../../hooks/use-toast";

interface CitationMetric {
  id: string;
  doi: string;
  title: string;
  isRetracted: boolean;
  retractionReason?: string;
  supportingCount: number;
  contrastingCount: number;
  mentioningCount: number;
  totalCitations: number;
  smartRationale?: string;
  reliabilityScore?: number;
}

interface CitationAnalysisPanelProps {
  editor?: any;
  projectId?: string;
}

export function CitationAnalysisPanel({
  editor,
  projectId,
}: CitationAnalysisPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [metrics, setMetrics] = useState<CitationMetric[]>([]);
  const { toast } = useToast();

  const runAnalysis = async () => {
    if (!editor || !projectId) return;

    setAnalyzing(true);
    try {
      if (!editor.state || !editor.state.doc) {
        toast({
          title: "Editor not initialized",
          description:
            "The editor is still loading. Please try again in a moment.",
          variant: "destructive",
        });
        setAnalyzing(false);
        return;
      }

      // 1. Extract citation IDs from editor document
      const citationIds = new Set<string>();
      if (editor.state && editor.state.doc) {
        editor.state.doc.descendants((node: any) => {
          if (node.type.name === "citation-chip") {
            if (node.attrs.id) citationIds.add(node.attrs.id);
          }
        });
      }

      if (citationIds.size === 0) {
        toast({
          title: "No Citations Found",
          description: "Please add some citations to your document first.",
          variant: "destructive",
        });
        setAnalyzing(false);
        return;
      }

      // 2. Fetch full citation data from project library
      const libraryCitations =
        await CitationService.getProjectCitations(projectId);
      const documentCitations = libraryCitations.filter((c: any) =>
        citationIds.has(c.id),
      );

      if (documentCitations.length === 0) {
        toast({
          title: "Citations Not Found",
          description: "Citations in document not found in your library.",
          variant: "destructive",
        });
        setAnalyzing(false);
        return;
      }

      // 3. Call backend for smart analysis
      const results = await CitationService.smartCheck(documentCitations);
      setMetrics(results);
      setReportReady(true);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${results.length} citations.`,
      });
    } catch (error) {
      console.error("Citation analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not perform smart citation check.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (!reportReady) {
    return (
      <div className="p-6 text-center space-y-6">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-blue-600" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">Smart Citation Check</h3>
          <p className="text-sm text-gray-500">
            Analyze your bibliography to see how others have cited your
            references. Identify retracted papers and contrasting evidence.
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={analyzing} className="w-full">
          {analyzing ? (
            <>
              <RotateCw className="w-4 h-4 mr-2 animate-spin" />
              Checking{" "}
              {editor?.storage?.citations?.citations?.length || "citations"}...
            </>
          ) : (
            "Run Smart Analysis"
          )}
        </Button>
      </div>
    );
  }

  const retractedCount = metrics.filter((m) => m.isRetracted).length;
  const highContrastCount = metrics.filter(
    (m) => m.contrastingCount > m.supportingCount * 2 && m.contrastingCount > 5,
  ).length;

  return (
    <div className="h-full flex flex-col">
      {/* Summary Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Citation Report</h3>
          <span className="text-xs text-gray-500">
            {metrics.length} References checked
          </span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <AlertTriangle
                className={`w-3.5 h-3.5 ${retractedCount > 0 ? "text-rose-500" : "text-amber-500"}`}
              />
              Retracted Papers
            </span>
            <span
              className={`font-mono font-medium ${retractedCount > 0 ? "text-rose-600 font-bold" : "text-gray-900"}`}>
              {retractedCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <XCircle
                className={`w-3.5 h-3.5 ${highContrastCount > 0 ? "text-rose-500" : "text-gray-400"}`}
              />
              High Contrast
            </span>
            <span
              className={`font-mono font-medium ${highContrastCount > 0 ? "text-rose-600 font-bold" : "text-gray-900"}`}>
              {highContrastCount}
            </span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {metrics.map((metric, idx) => (
          <React.Fragment key={metric.id}>
            {idx > 0 && <hr className="border-gray-100" />}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 mr-2">
                  <h4 className="text-sm font-medium text-gray-900 leading-snug">
                    {metric.title}
                  </h4>
                  {metric.smartRationale && (
                    <p className="text-xs text-gray-500 italic">
                      {metric.smartRationale}
                    </p>
                  )}
                </div>
                {metric.isRetracted ? (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : metric.reliabilityScore && metric.reliabilityScore < 60 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                    DOI: {metric.doi || "N/A"}
                  </span>
                  {metric.reliabilityScore !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            metric.reliabilityScore > 80
                              ? "bg-green-500"
                              : metric.reliabilityScore > 50
                                ? "bg-amber-400"
                                : "bg-rose-500"
                          }`}
                          style={{ width: `${metric.reliabilityScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-500">
                        {metric.reliabilityScore}%
                      </span>
                    </div>
                  )}
                </div>
                <SmartCitationBadge
                  supporting={metric.supportingCount}
                  mentioning={metric.mentioningCount}
                  contrasting={metric.contrastingCount}
                  size="sm"
                />
              </div>

              {metric.isRetracted && (
                <div className="bg-rose-50 text-rose-800 text-xs p-2 rounded flex items-start gap-2 border border-rose-100">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Retracted:</span>{" "}
                    {metric.retractionReason ||
                      "This paper has been retracted."}
                  </div>
                </div>
              )}

              {metric.contrastingCount > metric.supportingCount &&
                !metric.isRetracted && (
                  <div className="bg-amber-50 text-amber-800 text-xs p-2 rounded flex items-start gap-2 border border-amber-100">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">High Contrast:</span> More
                      papers contradict this work than support it. Use with
                      caution.
                    </div>
                  </div>
                )}
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setReportReady(false)}
          className="w-full">
          Re-run Analysis
        </Button>
      </div>
    </div>
  );
}
