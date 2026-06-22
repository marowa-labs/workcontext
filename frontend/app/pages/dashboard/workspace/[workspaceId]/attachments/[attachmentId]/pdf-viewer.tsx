"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ZoomIn, ZoomOut, Loader2 } from "lucide-react";

// Configure pdf.js worker (client-side only — this file is dynamically imported)
// Use local worker file to avoid CDN/CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfHighlight {
  id: string;
  text: string;
  color: string;
  pageNumber: number;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
}

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  scale: number;
  onScaleChange: (scale: number) => void;
  onPageCount: (count: number) => void;
  highlights: PdfHighlight[];
  onEraserClick: (e: React.MouseEvent) => void;
  isEraserActive: boolean;
}

export default function PDFViewer({
  fileUrl,
  fileName,
  scale,
  onScaleChange,
  onPageCount,
  highlights,
  onEraserClick,
  isEraserActive,
}: PDFViewerProps) {
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);

  // Reset loading state when file changes
  useEffect(() => {
    setPdfLoading(true);
    setPdfError(null);
    setNumPages(0);
  }, [fileUrl]);

  return (
    <div
      className={`w-full h-full overflow-auto flex flex-col items-center bg-gray-800 py-4 ${
        isEraserActive ? "cursor-pointer" : ""
      }`}
      onClick={isEraserActive ? onEraserClick : undefined}
    >
      {pdfLoading && (
        <div className="flex items-center gap-2 text-white mb-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading PDF...</span>
        </div>
      )}
      {pdfError && (
        <div className="text-red-400 text-sm mb-4 px-4">{pdfError}</div>
      )}
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages: count }) => {
          setNumPages(count);
          onPageCount(count);
          setPdfLoading(false);
          setPdfError(null);
        }}
        onLoadError={(error) => {
          console.error("PDF load error:", error);
          setPdfLoading(false);
          setPdfError("Failed to load PDF. Try downloading the file.");
        }}
        loading={
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        }
        error={
          <div className="text-red-400 text-sm p-4 text-center">
            Failed to load PDF.
            <br />
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="underline text-red-300 hover:text-red-200"
            >
              Open in new tab
            </a>
          </div>
        }
        className="flex flex-col items-center gap-4"
      >
        {Array.from({ length: numPages }, (_, i) => {
          const pageNum = i + 1;
          const pageHighlights = highlights.filter(
            (h) => h.pageNumber === pageNum,
          );
          return (
            <div key={pageNum} className="relative" data-page-number={pageNum}>
              <Page
                pageNumber={pageNum}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer={false}
                className="shadow-lg"
              />
              {/* Highlight overlays for this page */}
              {pageHighlights.map((highlight) => (
                <div
                  key={highlight.id}
                  data-highlight-id={highlight.id}
                  className="absolute pointer-events-none"
                  style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                >
                  {highlight.rects.map((rect, idx) => (
                    <div
                      key={idx}
                      className="absolute"
                      style={{
                        left: `${rect.x}px`,
                        top: `${rect.y}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        backgroundColor: highlight.color,
                        opacity: 0.35,
                        borderRadius: "2px",
                        cursor: isEraserActive ? "pointer" : "default",
                        pointerEvents: isEraserActive ? "auto" : "none",
                      }}
                      title={highlight.text}
                    />
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </Document>
    </div>
  );
}
