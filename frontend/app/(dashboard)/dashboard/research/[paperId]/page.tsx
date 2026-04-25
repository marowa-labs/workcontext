"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Calendar,
  Globe,
  Quote,
  Share2,
  User,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "../../../../lib/utils/useUser";
import { ResearchChatSidebar } from "../../../../research/ResearchChatSidebar";

export default function PaperDetailsPage() {
  const { paperId } = useParams(); // Note: this is the external ID (paperId from Semantic Scholar)
  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, loading: userLoading } = useUser();
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    async function fetchPaper() {
      if (!paperId || userLoading) return;

      // If valid user check fails (no token after loading), you might want to redirect
      // For now, we just don't fetch, or fetch without headers if public access allowed
      // But assuming protected route:
      if (!token) return;

      try {
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/research/${paperId}`, { headers });

        if (res.status === 429) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error ||
              "Too many requests to research API. Please try again later.",
          );
        }

        if (res.status === 401) throw new Error("Unauthorized");

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load paper");
        }

        const data = await res.json();
        setPaper(data.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not load paper details.");
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchPaper();
    }
  }, [paperId, token, userLoading]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  if (error || !paper)
    return (
      <div className="text-center mt-20 text-red-500">
        Error: {error || "Paper not found"}
      </div>
    );

  return (
    <div className="flex w-full h-[calc(100vh-4rem)] bg-white overflow-hidden relative">
      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-100 shrink-0">
          <Link
            href="/dashboard/library"
            className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Library
          </Link>

          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showChat
                ? "bg-purple-100 text-purple-700"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-4xl mx-auto bg-white dark:bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-black mb-4 leading-tight">
                {paper.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-black mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{paper.year || "Unknown Year"}</span>
                </div>
                {paper.venue && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>{paper.venue}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Quote className="w-4 h-4" />
                  <span>{paper.citationCount || 0} Citations</span>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
                  Abstract
                </h2>
                <p className="text-black leading-relaxed text-lg">
                  {paper.abstract || "No abstract available for this paper."}
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">
                  Authors
                </h2>
                <div className="flex flex-wrap gap-3">
                  {paper.authors?.map((author: any, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-black">
                      <User className="w-3 h-3 mr-2 text-black" />
                      {author.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-8 border-t border-gray-100">
                <button className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                  <Bookmark className="w-5 h-5 mr-2" />
                  Save to Library
                </button>

                {paper.openAccessPdf && (
                  <a
                    href={paper.openAccessPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Read PDF
                  </a>
                )}

                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-xl font-medium transition-colors">
                    <Share2 className="w-5 h-5 mr-2" />
                    View Source
                  </a>
                )}
              </div>
            </div>
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
