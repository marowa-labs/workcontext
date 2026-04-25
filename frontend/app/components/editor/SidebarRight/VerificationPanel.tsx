"use client";

import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../../ui/button";
import { useResearchCoPilot } from "../../../hooks/useResearchCoPilot";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import { toast } from "../../../hooks/use-toast";
import { PaperCard } from "../../research/PaperCard";

interface VerificationPanelProps {
  editor?: any;
  projectId?: string;
  documentTitle?: string;
}

export function VerificationPanel({
  editor,
  projectId,
}: VerificationPanelProps) {
  const { verifyClaims, isLoading } = useResearchCoPilot();
  const [claims, setClaims] = useState<any[] | null>(null);
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);
  const [includeGlobalContext, setIncludeGlobalContext] = useState(false);

  const runVerification = async () => {
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
      const { from, to } = editor.state.selection;
      let textToVerify = editor.state.doc.textBetween(from, to, " ");

      if (!textToVerify || textToVerify.length < 50) {
        textToVerify = editor.getText();
        toast({
          title: "Verifying Full Document",
          description: "No text selected, verifying entire document...",
        });
      }

      if (!projectId) {
        toast({
          title: "Error",
          description: "Project ID not found",
          variant: "destructive",
        });
        return;
      }

      const results = await verifyClaims(textToVerify, projectId, {
        includeGlobalContext,
      });
      setClaims(results);

      if (results && results.length > 0) {
        setExpandedClaim(0); // Auto-expand first claim
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Could not verify claims. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!claims && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Claim Verification</h3>
        <p className="text-sm mb-6 max-w-xs">
          Verify factual accuracy by cross-referencing your text against real
          academic papers.
        </p>
        <div className="flex items-center gap-2 mb-4 w-full justify-start">
          <input
            type="checkbox"
            id="global-context"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={includeGlobalContext}
            onChange={(e) => setIncludeGlobalContext(e.target.checked)}
          />
          <label
            htmlFor="global-context"
            className="text-sm text-gray-700 select-none cursor-pointer">
            Check against all my projects
          </label>
        </div>
        <Button
          onClick={runVerification}
          className="w-full text-white bg-blue-600 hover:bg-blue-700">
          Verify Claims
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm font-medium text-gray-600">
          Consulting Semantic Scholar...
        </p>
        <div className="flex gap-2 opacity-50 text-xs text-gray-400">
          Analyzing abstract coherence & consensus
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Verification Result
          </h3>
          <p className="text-xs text-gray-500">
            {claims?.length} claims analyzed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <input
              type="checkbox"
              id="global-context-header"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
              checked={includeGlobalContext}
              onChange={(e) => setIncludeGlobalContext(e.target.checked)}
            />
            <label
              htmlFor="global-context-header"
              className="text-xs text-gray-500 select-none cursor-pointer">
              All projects
            </label>
          </div>
          <Button variant="ghost" size="sm" onClick={runVerification}>
            Re-verify
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {claims?.map((claim, index) => {
            const isExpanded = expandedClaim === index;

            let consensusColor = "bg-gray-100 text-gray-700";
            if (claim.status === "SUPPORTED")
              consensusColor = "bg-green-100 text-green-700";
            if (claim.status === "CONTRADICTED")
              consensusColor = "bg-rose-100 text-rose-700";
            if (claim.status === "MIXED")
              consensusColor = "bg-amber-100 text-amber-700";

            return (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div
                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedClaim(isExpanded ? null : index)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Badge
                        className={`${consensusColor} border-transparent hover:${consensusColor}`}>
                        {claim.status}
                      </Badge>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">
                        "{claim.claim}"
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
                    <div className="space-y-3 mt-3">
                      {claim.evidence && claim.evidence.length > 0 ? (
                        claim.evidence.map((ev: any, evIdx: number) => (
                          <div
                            key={evIdx}
                            className="bg-white p-3 rounded-md border border-gray-200 text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              {ev.verdict === "SUPPORT" && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              {ev.verdict === "CONTRADICT" && (
                                <XCircle className="w-4 h-4 text-rose-500" />
                              )}
                              {ev.verdict === "NEUTRAL" && (
                                <AlertTriangle className="w-4 h-4 text-gray-400" />
                              )}

                              <span
                                className={`text-xs font-bold ${
                                  ev.verdict === "SUPPORT"
                                    ? "text-green-700"
                                    : ev.verdict === "CONTRADICT"
                                      ? "text-rose-700"
                                      : "text-gray-600"
                                }`}>
                                {ev.verdict}ED by
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mb-2 italic">
                              "{ev.reasoning}"
                            </p>

                            <PaperCard
                              paper={ev}
                              compact={true}
                              onInsertCitation={(paper) => {
                                if (editor) {
                                  editor
                                    .chain()
                                    .focus()
                                    .insertContent(
                                      ` (${paper.authors?.[0] || "Unknown"}, ${paper.year}) `,
                                    )
                                    .run();
                                  toast({ title: "Citation Added" });
                                }
                              }}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic p-2 text-center">
                          No direct evidence found for this claim yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
