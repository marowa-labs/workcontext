"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Play,
  BookOpen,
  Hash,
  HelpCircle,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { NotebookPanel } from "./NotebookPanel";
import { useRouter, useParams } from "next/navigation";
import { ResearchService } from "../lib/utils/researchService";
import CitationService from "../lib/utils/citationService";

interface StudyDashboardProps {
  projectId: string; // Required for fetching data
  projectTitle: string;
  sourceCount?: number; // Optional fallback
  projects?: any[];
}

interface GuideData {
  summary: string;
  topics: string[];
  questions: string[];
  sourcesUsed: number;
}

export function StudyDashboard({
  projectId,
  projectTitle,
  sourceCount,
  projects = [],
}: StudyDashboardProps) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [activeTab, setActiveTab] = useState<"guide" | "notebook">("guide");
  const [guideData, setGuideData] = useState<GuideData | null>(null);
  const [citationCount, setCitationCount] = useState(sourceCount || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      // Fetch citation count independently
      CitationService.getProjectCitations(projectId)
        .then((citations) => {
          setCitationCount(citations.length);
        })
        .catch((err) => console.error("Failed to fetch citations", err));
    }

    if (projectId && activeTab === "guide") {
      fetchGuideData();
    }
  }, [projectId, activeTab]);

  const fetchGuideData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ResearchService.getResearchGuide(projectId);
      setGuideData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load research guide.");
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === "notebook") {
    return (
      <div className="h-full flex flex-col bg-gray-50/50">
        {/* Simple Header for Navigation */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-gray-900">{projectTitle}</h1>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("guide")}
              className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md transition-colors">
              Source Guide
            </button>
            <button
              onClick={() => setActiveTab("notebook")}
              className="px-4 py-1.5 text-sm font-medium bg-white text-gray-900 shadow-sm rounded-md transition-colors">
              Notebook
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <NotebookPanel projectId={projectId} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 p-8">
      <div className="w-full space-y-8">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 border border-gray-200 p-2 rounded-lg">
              {projects.length > 0 ? (
                <Select
                  value={projectId}
                  onValueChange={(newId) => {
                    if (workspaceId) {
                      router.push(
                        `/dashboard/workspace/${workspaceId}/source-guide?projectId=${newId}`,
                      );
                    } else {
                      router.push(`/dashboard/source-guide?projectId=${newId}`);
                    }
                  }}>
                  <SelectTrigger className="text-3xl font-bold text-gray-900 border-none shadow-none p-0 h-auto focus:ring-0 w-auto gap-2 bg-transparent hover:bg-transparent">
                    <SelectValue>
                      {projectTitle || "Select Project"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">
                  {projectTitle || "Research Guide"}
                </h1>
              )}
            </div>
            <p className="text-gray-600 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>
                {loading
                  ? "Analyzing sources..."
                  : guideData
                    ? `${guideData.sourcesUsed} sources analyzed`
                    : `${citationCount} sources available`}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              onClick={fetchGuideData}
              disabled={loading}>
              <RefreshCw
                className={`w-3 h-3 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <div className="flex bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
              <button
                onClick={() => setActiveTab("guide")}
                className="px-4 py-1.5 text-sm font-medium bg-gray-100 text-gray-900 rounded-md transition-colors">
                Source Guide
              </button>
              <button
                onClick={() => setActiveTab("notebook")}
                className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md transition-colors">
                Notebook
              </button>
            </div>
          </div>
        </div>

        {/* Research Overview Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                <Sparkles className="w-3 h-3" />
                Research Guide Overview
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Deep Dive Conversation
                </h2>
                <p className="text-blue-100 text-sm max-w-md">
                  AI host discuss your projects against your saved sources,
                  connecting key themes and findings in an engaging Lit Review,
                  Mind Map, Reports, Flashcards, quiz, data table and podcast
                  formats.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="text-gray-500 bg-white hover:bg-white/10 hover:text-gray-500 rounded-full"
                  onClick={() => {
                    router.push(`/study?projectId=${projectId}`);
                  }}>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500">
              Generating research guide from your sources...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
            {error}
            <br />
            <Button variant="link" onClick={fetchGuideData}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Topics */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Key Topics</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guideData?.topics?.length ? (
                    guideData.topics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => {
                          const prompt = `Analyze key topic: ${topic}`;
                          router.push(`/study?projectId=${projectId}&initialMessage=${encodeURIComponent(prompt)}`);
                        }}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
                        {topic}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No topics found.</p>
                  )}
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">
                    Suggested Questions
                  </h3>
                </div>
                <div className="space-y-2">
                  {guideData?.questions?.length ? (
                    guideData.questions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const question = q;
                          router.push(`/study?projectId=${projectId}&initialMessage=${encodeURIComponent(question)}`);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors text-sm text-gray-700 flex items-start gap-3">
                        <span className="mt-0.5 bg-gray-100 text-gray-500 w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0">
                          {i + 1}
                        </span>
                        {q}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No questions suggested.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Source Summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm cursor-pointer hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">
                    Source Summary
                  </h3>
                </div>
              </div>
              <div
                className="prose prose-sm prose-indigo max-w-none text-gray-700 text-[13px] leading-relaxed 
                prose-headings:font-bold prose-headings:text-gray-900 
                prose-p:mb-4 prose-p:last:mb-0 
                prose-ul:list-disc prose-ul:ml-4 prose-li:marker:text-indigo-500
                prose-strong:font-bold prose-strong:text-gray-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {guideData?.summary || "No summary available."}
                </ReactMarkdown>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
