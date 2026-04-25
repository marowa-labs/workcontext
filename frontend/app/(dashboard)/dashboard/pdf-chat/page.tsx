"use client";

import React, { useState } from "react";
import {
  FileText,
  ArrowRight,
  Loader2,
  Sparkles,
  Quote,
  HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

interface PdfDocument {
  id: string;
  filename: string;
  status: string;
  created_at: string;
}

export default function PdfUploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);

  React.useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.error("No auth token found");
          return;
        }

        const res = await fetch("/api/pdf", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setPdfs(data);
        }
      } catch (err) {
        console.error("Failed to fetch PDFs", err);
      } finally {
        setLoadingPdfs(false);
      }
    };

    fetchPdfs();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);

    // Real upload
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert("You must be logged in to upload files.");
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type, let browser set multipart/form-data boundary
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      router.push(
        `/dashboard/pdf-chat/${data.documentId}?name=${encodeURIComponent(
          file.name,
        )}`,
      );
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload PDF. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] relative overflow-hidden bg-background">
      {/* Background Decorations - Cloud/Wave Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl opacity-60 mix-blend-multiply dark:mix-blend-screen filter" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-purple-100/40 dark:bg-purple-900/10 rounded-full blur-3xl opacity-60 mix-blend-multiply dark:mix-blend-screen filter" />
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-60 mix-blend-multiply dark:mix-blend-screen filter" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight">
            Chat with any PDF
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Upload your documents to summarize, analyze, and ask questions
            instantly.
          </p>
        </div>

        {/* Upload Card */}
        <div className="w-full max-w-4xl relative mb-8">
          {/* Floating Icons Decor */}
          <div className="absolute -top-8 -left-8 animate-bounce delay-700 hidden md:block">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-2xl shadow-sm transform -rotate-12">
              <span className="text-2xl">💬</span>
            </div>
          </div>
          <div className="absolute -top-6 -right-6 animate-bounce delay-100 hidden md:block">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl shadow-sm transform rotate-6">
              <span className="text-2xl">⚙️</span>
            </div>
          </div>

          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            htmlFor="pdf-upload"
            className={`
              relative flex flex-col items-center justify-center 
              w-full aspect-[2/1] md:aspect-[2.5/1] max-h-[400px]
              bg-card/80 backdrop-blur-sm
              border-2 border-dashed rounded-[2rem]
              transition-all duration-300 ease-in-out cursor-pointer
              shadow-[0_8px_30px_rgb(0,0,0,0.04)]
              ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01] shadow-xl ring-4 ring-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-card/90 hover:shadow-lg"
              }
            `}>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              id="pdf-upload"
              onChange={handleFileSelect}
            />

            {isUploading ? (
              <div className="flex flex-col items-center animate-pulse">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Processing Document...
                </h3>
                <p className="text-muted-foreground">
                  Analyzing structure and extracting insights
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-8">
                {/* Central Icon Illustration */}
                {/* Central Icon Illustration */}
                <div className="mb-6 relative">
                  <div className="w-20 h-24 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 rounded-lg shadow-sm flex items-center justify-center transform -rotate-3 mb-2 mx-auto">
                    <div className="w-12 h-1 bg-blue-200 dark:bg-blue-700 rounded-full mb-2"></div>
                    <div className="w-8 h-1 bg-blue-200 dark:bg-blue-700 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-[-10px] right-[-10px] bg-primary text-primary-foreground p-2 rounded-full shadow-md">
                    <ArrowRight className="w-5 h-5 transform -rotate-45" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Drop PDF here or click to upload
                </h3>
                <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                  Supports research papers, agreements, contracts, and books
                  from your computer.
                </p>

                <div className="px-8 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-xl transition-colors flex items-center gap-2">
                  Select File <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl pb-12">
          {/* Card 1: Smart Summaries */}
          <div className="bg-card p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-border hover:shadow-lg transition-all hover:-translate-y-1 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Smart Summaries
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">
              Get instant overviews of long papers. Understand key points in
              seconds.
            </p>
          </div>

          {/* Card 2: Citation Extraction */}
          <div className="bg-card p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-border hover:shadow-lg transition-all hover:-translate-y-1 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
              <Quote className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Citation Extraction
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">
              Automatically find and verify references included in the document.
            </p>
          </div>

          {/* Card 3: Q&A Assistant */}
          <div className="bg-card p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-border hover:shadow-lg transition-all hover:-translate-y-1 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Q&A Assistant
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">
              Ask specific questions about methods, results, or any detail in
              the text.
            </p>
          </div>
        </div>

        {/* Your Documents List */}
        <div className="w-full max-w-4xl mt-16 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Your Documents
            </h2>
          </div>

          {loadingPdfs ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : pdfs.length === 0 ? (
            <div className="text-center p-12 bg-card rounded-3xl border border-border shadow-sm">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                No documents yet
              </h3>
              <p className="text-muted-foreground mt-1">
                Upload a PDF to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  onClick={() =>
                    router.push(
                      `/dashboard/pdf-chat/${pdf.id}?name=${encodeURIComponent(
                        pdf.filename,
                      )}`,
                    )
                  }
                  className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-lg">
                        {pdf.filename}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>
                          {new Date(pdf.created_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span>•</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            pdf.status === "completed" || "processing" // simplify for now
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}>
                          {pdf.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted p-2 rounded-full text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
