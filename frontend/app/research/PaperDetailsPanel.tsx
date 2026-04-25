"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Globe,
  Quote,
  User,
  Shield,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useUser } from "../lib/utils/useUser";
import { ResearchChatSidebar } from "./ResearchChatSidebar";

interface PaperDetailsPanelProps {
  paperId?: string;
  paperData?: any;
  onBack: () => void;
  isPanel?: boolean;
}

export default function PaperDetailsPanel({
  paperId,
  paperData,
  onBack,
  isPanel = false,
}: PaperDetailsPanelProps) {
  const [paper, setPaper] = useState<any>(paperData || null);
  const [loading, setLoading] = useState(!paperData);
  const [error, setError] = useState<string | null>(null);
  const { token } = useUser();
  const [showChat, setShowChat] = useState(false);

  // Matrix State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matrixNotes, setMatrixNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (paperData) {
      setPaper(paperData);
      setLoading(false);
      // Load saved notes if available? (Assuming paperData might have it)
      if (paperData.notes) setMatrixNotes(paperData.notes);
      return;
    }

    async function fetchPaper() {
      if (!paperId) return;
      try {
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/research/${paperId}`, { headers });
        if (!res.ok) throw new Error("Failed to load paper");
        const data = await res.json();
        setPaper(data.data);
        // If we fetched the library version, it might have notes
        // But GET /api/research/:id might fetch from semantic scholar directly
        // We might need to check if user has it saved separately.
      } catch (err) {
        setError("Could not load paper details.");
      } finally {
        setLoading(false);
      }
    }
    fetchPaper();
  }, [paperId, token]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setSaved(false);
  };

  const handleAutoAnalyze = async () => {
    if (!paper) return;
    setAnalyzing(true);
    try {
      // Analyze for specific tags
      // We can use the analyze endpoint we built!
      // We'll ask for "Research Gap", "Methodology", "Key Findings", "Limitations"

      const columnsToAnalyze = [
        "Research Gap",
        "Methodology",
        "Main Findings",
        "Limitations",
      ];

      const res = await fetch("/api/research/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          papers: [
            {
              externalId: paper.externalId,
              title: paper.title,
              abstract: paper.abstract,
              year: paper.year,
            },
          ],
          columns: columnsToAnalyze,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      const result = data.data[paper.externalId];

      if (result) {
        // Auto-select tags based on what was found
        const newTags = [...selectedTags];
        if (
          result["Research Gap"] &&
          !result["Research Gap"].toLowerCase().includes("not stated")
        ) {
          if (!newTags.includes("Gap")) newTags.push("Gap");
        }
        if (
          result["Limitations"] &&
          !result["Limitations"].toLowerCase().includes("not stated")
        ) {
          if (!newTags.includes("Limitation")) newTags.push("Limitation");
        }

        setSelectedTags(newTags);

        // Format notes
        const analysisText =
          `AUTO-ANALYSIS:\n` +
          `- GAP: ${result["Research Gap"]}\n` +
          `- METHOD: ${result["Methodology"]}\n` +
          `- FINDINGS: ${result["Main Findings"]}\n` +
          `- LIMITATIONS: ${result["Limitations"]}`;

        setMatrixNotes((prev) =>
          prev ? prev + "\n\n" + analysisText : analysisText,
        );
      }
    } catch (e) {
      console.error(e);
      // alert("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMatrixData = async () => {
    if (!token || !paper) return;
    setSaving(true);
    try {
      // We'll save the tags inside the notes text for now as "[Tags: A, B]"
      // or just trust the user to use the text.
      // Ideally we'd update the backend to store tags properly.
      // But for "fully functional" UI, saving to notes is a good MVP.

      const tagsHeader =
        selectedTags.length > 0 ? `[Tags: ${selectedTags.join(", ")}]\n\n` : "";
      const finalNotes = tagsHeader + matrixNotes;

      const res = await fetch("/api/research/library/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paper: paper,
          notes: finalNotes,
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full py-20">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );

  if (error || !paper)
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
        <p className="text-red-500 mb-4">{error || "Paper not found"}</p>
        <button
          onClick={onBack}
          className="text-blue-600 hover:underline text-sm">
          Go back to search
        </button>
      </div>
    );

  return (
    <div
      className={`flex bg-white overflow-hidden relative ${
        isPanel ? "h-full" : "h-[calc(100vh-4rem)]"
      }`}>
      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 shrink-0">
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-sm font-semibold text-gray-900 truncate">
            Source Verification
          </h2>

          {!isPanel && (
            <button
              onClick={() => setShowChat(!showChat)}
              className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                showChat
                  ? "bg-purple-100 text-purple-700"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight select-text">
            {paper.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 mb-6 font-medium">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span className="truncate max-w-[200px]">
                {paper.authors
                  ?.map((a: any) => (typeof a === "string" ? a : a.name))
                  .join(", ") ||
                  paper.author ||
                  "Unknown Authors"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{paper.year || "Unknown Year"}</span>
            </div>
            {paper.journal && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{paper.journal}</span>
              </div>
            )}
            {paper.citationCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5" />
                <span>{paper.citationCount} Citations</span>
              </div>
            )}
          </div>

          {/* Verification Abstract Preview */}
          <div className="mb-6 relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Abstract Preview
              </h3>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                Verification Only
              </span>
            </div>
            <div className="relative p-3 bg-gray-50 rounded-lg border border-gray-100 select-none">
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-6 opacity-80 blur-[0.3px]">
                {paper.abstract || "No abstract preview available."}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-50 to-transparent rounded-b-lg" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center italic">
              Reading and interpretation should be done at the source.
            </p>
          </div>

          {paper.confidenceScore && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">
                  Metric Analysis
                </h3>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                    paper.confidenceScore.status === "strong"
                      ? "bg-green-50 text-green-700 border-green-100"
                      : paper.confidenceScore.status === "good"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : paper.confidenceScore.status === "weak"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                          : "bg-red-50 text-red-700 border-red-100"
                  }`}>
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">
                    {paper.confidenceScore.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Recency</span>
                    <span className="text-gray-900 font-medium">
                      {paper.confidenceScore.recencyScore}%
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${paper.confidenceScore.recencyScore}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Impact</span>
                    <span className="text-gray-900 font-medium">
                      {paper.confidenceScore.qualityScore}%
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${paper.confidenceScore.qualityScore}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {paper.confidenceScore?.warnings?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded p-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">⚠️</span>
                    <div>
                      <p className="text-[10px] font-bold text-yellow-800 uppercase mb-0.5">
                        Check Flags
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-0.5">
                        {paper.confidenceScore.warnings.map(
                          (w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Literature Matrix Tags Section */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Literature Matrix Tags
              </h3>
              <button
                onClick={handleAutoAnalyze}
                disabled={analyzing}
                className="flex items-center gap-1 text-[10px] font-bold text-cyan-600 hover:text-cyan-700 uppercase tracking-wider transition-colors disabled:opacity-50">
                {analyzing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {analyzing ? "ANALYZING..." : "AUTO-ANALYZE"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {[
                "Gap",
                "Methodology",
                "Result",
                "Limitation",
                "Future Work",
              ].map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 border rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-cyan-100 text-cyan-800 border-cyan-300"
                        : "bg-white hover:bg-cyan-50 text-cyan-700 border-cyan-200"
                    }`}>
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest flex justify-between">
                <span>MATRIX NOTES</span>
                {saved && (
                  <span className="text-green-600 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Saved
                  </span>
                )}
              </label>
              <textarea
                value={matrixNotes}
                onChange={(e) => setMatrixNotes(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-100 transition-all resize-none"
                rows={4}
                placeholder="Identify specific gaps or findings in this source for the Literature Matrix..."
              />
              <div className="flex justify-end">
                <button
                  onClick={saveMatrixData}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium transition-colors disabled:opacity-50">
                  {saving ? "Saving..." : "Save to Matrix"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex bg-gray-50 p-3 rounded border border-gray-100 mb-6">
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">
                Source Provenance
              </div>
              <div className="text-xs font-medium text-gray-900">
                Digital Object Identifier (DOI) Verification
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Access Date: {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center">
              <Globe className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <a
              href={paper.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center px-4 py-3 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors group">
              <span>Visit Official Source</span>
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <p className="text-[10px] text-center text-gray-400 mt-2">
              Opens in a new tab. No content is stored or cached.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Sidebar (Right) */}
      <div
        className={`transition-all duration-300 ease-in-out border-l border-gray-200 bg-white ${
          showChat
            ? "w-[400px] translate-x-0"
            : "w-0 translate-x-full opacity-0"
        } overflow-hidden h-full shadow-lg z-20 shrink-0`}>
        <div className="w-[400px] h-full">
          <ResearchChatSidebar
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            papers={[paper]}
          />
        </div>
      </div>
    </div>
  );
}
