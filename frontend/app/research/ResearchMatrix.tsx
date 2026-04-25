"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, ArrowUpDown, Download, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { CitationModal } from "./CitationModal";
import { useUser } from "../lib/utils/useUser";

interface ResearchMatrixProps {
  papers: any[];
}

interface Column {
  id: string;
  label: string;
  type: "metadata" | "ai";
}

const DEFAULT_COLUMNS: Column[] = [
  { id: "title", label: "Paper", type: "metadata" },
  { id: "year", label: "Year", type: "metadata" },
  { id: "citations", label: "Citations", type: "metadata" },
];

const AVAILABLE_AI_COLUMNS = [
  "Abstract Summary",
  "Main Findings",
  "Methodology",
  "Limitations",
  "Sample Size",
  "Data Source",
];

export function ResearchMatrix({ papers }: ResearchMatrixProps) {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [analysisData, setAnalysisData] = useState<Record<string, any>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const { token } = useUser();

  const addColumn = (label: string) => {
    if (columns.find((c) => c.label === label)) return;
    const newColumns = [...columns, { id: label, label, type: "ai" } as Column];
    setColumns(newColumns);

    // Trigger analysis for the new column
    analyzePapers(papers, [label]);
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const analyzePapers = async (
    targetPapers: any[],
    targetColumns: string[],
  ) => {
    if (!token || targetPapers.length === 0 || targetColumns.length === 0)
      return;

    setAnalyzing(true);
    try {
      // Filter out papers/columns we already have?
      // For simplicity, just request the batch. The backend handles parsing.

      const response = await fetch("/api/research/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          papers: targetPapers.map((p) => ({
            externalId: p.externalId,
            title: p.title,
            abstract: p.abstract,
            year: p.year,
          })),
          columns: targetColumns,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();

      // Merge new data into existing analysisData
      setAnalysisData((prev) => {
        const next = { ...prev };
        Object.keys(data.data).forEach((paperId) => {
          next[paperId] = { ...(next[paperId] || {}), ...data.data[paperId] };
        });
        return next;
      });
    } catch (error) {
      console.error("Error analyzing papers:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Re-analyze when papers change (e.g. Load More) IF we have AI columns
  useEffect(() => {
    const aiColumns = columns.filter((c) => c.type === "ai").map((c) => c.id);
    if (aiColumns.length > 0 && papers.length > 0) {
      // Identify papers that are missing data for these columns
      const papersNeedingAnalysis = papers.filter((p) => {
        const pData = analysisData[p.externalId] || {};
        return aiColumns.some((col) => !pData[col]);
      });

      if (papersNeedingAnalysis.length > 0 && !analyzing) {
        // Debounce or just call? prevent infinite loop if analysis fails (it wont bc we check !analyzing)
        // actually !analyzing might prevent parallel batches.
        // Better: just analyze the missing ones.
        analyzePapers(papersNeedingAnalysis, aiColumns);
      }
    }
  }, [papers.length, columns.length]); // Dependency on length changes

  const handleExport = (format: "csv" | "bibtex") => {
    setIsCitationModalOpen(true);
  };

  return (
    <>
      <CitationModal
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
        count={papers.length}
      />
      <div className="w-full h-full overflow-hidden flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Table Container */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="p-3 text-left text-xs font-semibold text-gray-600 border-b border-r last:border-r-0 border-gray-200 min-w-[150px] relative group">
                    <div className="flex items-center justify-between">
                      <span>{col.label}</span>
                      {col.type === "ai" && (
                        <div className="flex items-center">
                          <ArrowUpDown className="w-3 h-3 text-gray-300 mr-1 cursor-pointer hover:text-gray-600" />
                          <X
                            className="w-3 h-3 text-gray-300 cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeColumn(col.id)}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-2 border-b border-gray-200 w-[50px] bg-gray-50 sticky right-0 z-20">
                  <div className="flex items-center justify-end gap-1">
                    {/* Add Column */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200">
                          <Plus className="w-4 h-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        {AVAILABLE_AI_COLUMNS.map((colName) => (
                          <DropdownMenuItem
                            key={colName}
                            onClick={() => addColumn(colName)}
                            disabled={
                              !!columns.find((c) => c.label === colName)
                            }>
                            {colName}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem disabled>
                          <span className="text-gray-400 italic">
                            Custom question... (Pro)
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Export */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                          title="Export Data">
                          <Download className="w-4 h-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <DropdownMenuItem onClick={() => handleExport("csv")}>
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport("bibtex")}>
                          Export to BibTeX
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {papers.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="p-8 text-center text-gray-500 text-sm">
                    No papers to analyze. Search and add papers to populate the
                    matrix.
                  </td>
                </tr>
              ) : (
                papers.map((paper, idx) => (
                  <tr
                    key={paper.externalId || idx}
                    className="hover:bg-blue-50/30 group">
                    {columns.map((col) => {
                      const _cellKey = `${paper.externalId}-${col.id}`;
                      let content: React.ReactNode = "";

                      // Metadata Columns
                      if (col.id === "title") {
                        content = (
                          <div
                            className="font-medium text-sm text-gray-900 line-clamp-2"
                            title={paper.title}>
                            {paper.title}
                          </div>
                        );
                      } else if (col.id === "year") {
                        content = (
                          <span className="text-sm text-gray-600">
                            {paper.year}
                          </span>
                        );
                      } else if (col.id === "citations") {
                        content = (
                          <span className="text-sm text-gray-600">
                            {paper.citationCount || "-"}
                          </span>
                        );
                      }
                      // AI Columns
                      else {
                        const paperData = analysisData[paper.externalId];
                        const text = paperData ? paperData[col.id] : null;

                        // If analyzing and no text yet, show loader or pending
                        // But we don't track loading per cell finely here to spare complexity

                        content = text ? (
                          <div className="text-xs text-gray-700 leading-snug">
                            {text}
                          </div>
                        ) : (
                          <div className="flex items-center text-xs text-gray-400 italic">
                            {analyzing ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : null}
                            {analyzing ? "Analyzing..." : "Pending"}
                          </div>
                        );
                      }

                      return (
                        <td
                          key={col.id}
                          className="p-3 border-b border-r last:border-r-0 border-gray-100 align-top">
                          {content}
                        </td>
                      );
                    })}
                    <td className="border-b border-gray-100"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
