"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  LayoutList,
  Share2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ResearchChatSidebar } from "../../../../research/ResearchChatSidebar";
import { ResearchService } from "../../../../lib/utils/researchService";
import { supabase } from "../../../../lib/supabase/client";

export default function PdfChatViewerPage() {
  const { pdfId } = useParams();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"view" | "summary" | "related">(
    "view",
  );
  const [showChat, setShowChat] = useState(true);
  const [pdfData, setPdfData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [relatedPapers, setRelatedPapers] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  React.useEffect(() => {
    if (!pdfId) return;

    const fetchPdf = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.error("No auth token found");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Fetch Metadata
        const res = await fetch(`/api/pdf/${pdfId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setPdfData(data);
        } else {
          console.error("Failed to fetch PDF data");
        }

        // Fetch PDF Blob for Viewer
        try {
          const blobRes = await fetch(`/api/pdf/${pdfId}/download`, {
            headers,
          });
          if (blobRes.ok) {
            const blob = await blobRes.blob();
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
          } else {
            console.error("Failed to download PDF file");
          }
        } catch (downloadErr) {
          console.error("Error downloading PDF:", downloadErr);
        }
      } catch (error) {
        console.error("Error fetching PDF:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    // Cleanup blob URL
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfId]);

  // Fetch summary when tab is active
  React.useEffect(() => {
    if (activeTab === "summary" && !summary && !loadingSummary && pdfId) {
      const fetchSummary = async () => {
        setLoadingSummary(true);
        try {
          const result = await ResearchService.chatWithPdf(
            "Please provide a comprehensive summary of this document, highlighting the main objectives, methodology, key results, and conclusions.",
            pdfId as string,
          );
          setSummary(result);
        } catch (err) {
          console.error("Failed to generate summary:", err);
        } finally {
          setLoadingSummary(false);
        }
      };
      fetchSummary();
    }
  }, [activeTab, pdfId, summary]);

  // Fetch related papers when tab is active
  React.useEffect(() => {
    if (
      activeTab === "related" &&
      relatedPapers.length === 0 &&
      !loadingRelated &&
      pdfId
    ) {
      setLoadingRelated(true);
      const fetchRelated = async () => {
        try {
          // We need token for authorized request
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;

          const res = await fetch(`/api/pdf/${pdfId}/related`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (res.ok) {
            const data = await res.json();
            setRelatedPapers(data);
          }
        } catch (err) {
          console.error("Error fetching related papers:", err);
        } finally {
          setLoadingRelated(false);
        }
      };
      fetchRelated();
    }
  }, [activeTab, pdfId, relatedPapers.length]);

  const filename = pdfData?.filename || searchParams.get("name") || "Document";

  // Real paper object for chat context
  const paperContext = pdfData
    ? {
        externalId: pdfData.id,
        title: pdfData.filename,
        source: "pdf_upload",
        abstract: summary || "PDF Upload",
        authors: [{ name: "User Uploaded" }],
        year: new Date(pdfData.created_at).getFullYear(),
      }
    : {
        // Fallback/Loading context to preventing crashing before load
        externalId: pdfId as string,
        title: filename,
        source: "pdf_upload",
        abstract: "Loading...",
        authors: [],
        year: new Date().getFullYear(),
      };

  return (
    <div className="flex w-full h-[calc(100vh-4rem)] bg-background overflow-hidden relative">
      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border shrink-0 bg-background z-10">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/dashboard/pdf-chat"
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-foreground truncate max-w-[300px] sm:max-w-md">
                {filename}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-1.5 py-0.5 rounded font-medium">
                  PDF
                </span>
                <span>•</span>
                <span>Ready to chat</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs (Visible on large screens, or simplified) */}
            {/* Tabs (Visible on large screens, or simplified) */}
            <div className="hidden md:flex bg-muted p-1 rounded-lg mr-2">
              <button
                onClick={() => setActiveTab("view")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "view"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <FileText className="w-3.5 h-3.5" />
                View PDF
              </button>
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "summary"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <LayoutList className="w-3.5 h-3.5" />
                Summary
              </button>
              <button
                onClick={() => setActiveTab("related")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "related"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <Share2 className="w-3.5 h-3.5" />
                Related Papers
              </button>
            </div>

            <button
              onClick={() => setShowChat(!showChat)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                showChat
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-background border border-border text-muted-foreground hover:bg-muted"
              }`}>
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </div>
        </div>

        {/* Mobile Tabs (Visible on small screens) */}
        <div className="flex md:hidden bg-background border-b border-border overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("view")}
            className={`flex-1 min-w-[100px] px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === "view"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <FileText className="w-4 h-4" />
            View
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 min-w-[100px] px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === "summary"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <LayoutList className="w-4 h-4" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab("related")}
            className={`flex-1 min-w-[100px] px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === "related"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <Share2 className="w-4 h-4" />
            Related
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 bg-muted/30 overflow-hidden relative w-full h-full">
          {activeTab === "view" && (
            <div className="w-full h-full flex flex-col items-center justify-center p-0">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading document...
                  </span>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                />
              ) : (
                <div className="w-full max-w-4xl h-full bg-card shadow-sm border border-border rounded-xl overflow-hidden flex flex-col items-center justify-center text-muted-foreground">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p>Document not available</p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Could not load the PDF file.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "summary" && (
            <div className="w-full h-full overflow-y-auto p-8 flex justify-center">
              <div className="w-full max-w-3xl bg-card rounded-2xl p-8 shadow-sm border border-border min-h-[500px]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <h2 className="text-xl font-bold text-foreground">
                    Document Summary
                  </h2>
                </div>

                {loadingSummary ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                ) : summary ? (
                  <div className="prose prose-blue dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                    {summary}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Failed to generate summary. Please try again.</p>
                    <button
                      onClick={() => {
                        setSummary(null);
                        setLoadingSummary(false);
                      }} // Retry logic could be better
                      className="mt-4 text-primary hover:underline">
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "related" && (
            <div className="w-full h-full overflow-y-auto p-4 md:p-8 flex justify-center">
              <div className="w-full max-w-4xl bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border min-h-[500px]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <Share2 className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-foreground">
                    Related Research
                  </h2>
                </div>

                {loadingRelated ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 border border-border rounded-xl animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : relatedPapers && relatedPapers.length > 0 ? (
                  <div className="grid gap-4">
                    {relatedPapers.map((paper: any) => (
                      <div
                        key={paper.paperId}
                        className="group relative p-5 border border-border rounded-xl hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all bg-card">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline">
                                {paper.title}
                              </a>
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {paper.abstract}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{paper.year}</span>
                              <span>•</span>
                              <span>
                                {paper.authors
                                  ?.map((a: any) => a.name)
                                  .slice(0, 3)
                                  .join(", ")}
                              </span>
                              {paper.citationCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600 font-medium">
                                    {paper.citationCount} Citations
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-muted text-muted-foreground rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <Share2 className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Share2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p>No related papers found.</p>
                    <p className="text-xs mt-2">
                      Try uploading a document with a clear title.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar (Right) */}
      <div
        className={`transition-all duration-300 ease-in-out border-l border-border bg-background ${
          showChat
            ? "w-[400px] translate-x-0"
            : "w-0 translate-x-full opacity-0"
        } overflow-hidden h-full shadow-lg z-20 shrink-0`}>
        <div className="w-[400px] h-full">
          {paperContext.externalId && (
            <ResearchChatSidebar
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              papers={[paperContext]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
