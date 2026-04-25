import React, { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  RotateCcw,
  ChevronDown,
  Trash2,
  Minimize2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { StudioItem } from "./types";

interface InfographicViewProps {
  content: string; // SVG markup
  metadata?: {
    sources?: string[];
    createdAt?: Date;
    sections?: string[];
  };
  item?: StudioItem; // Now required for ID access in delete
  onBack?: () => void;
  onDelete?: (id: string) => void;
  onToggleFullscreen?: (item: StudioItem) => void;
  isFullscreen?: boolean;
}

export function StudioInfographicView({
  content,
  metadata,
  item,
  onDelete,
  onToggleFullscreen,
  isFullscreen,
}: InfographicViewProps) {
  const [zoom, setZoom] = useState(100);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);

  const handleExport = (format: "png" | "pdf" | "svg") => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`);
    setShowExportMenu(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F9FAFB]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="h-8">
              <ZoomOut className="w-4 h-4 mr-1" />
              Zoom Out
            </Button>
            <div className="text-sm font-medium text-gray-600 min-w-[60px] text-center">
              {zoom}%
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="h-8">
              <ZoomIn className="w-4 h-4 mr-1" />
              Zoom In
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              className="h-8">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset View
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="h-8">
                <Download className="w-4 h-4 mr-1" />
                Export
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                  <button
                    onClick={() => handleExport("png")}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                    PNG
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("svg")}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                    SVG
                  </button>
                </div>
              )}
            </div>

            {item && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="h-8 text-gray-500 hover:text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => item && onToggleFullscreen?.(item)}
              className="h-8">
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-1" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4 mr-1" />
                  Fullscreen
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Infographic Canvas */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-gray-50">
          <div
            className="bg-white rounded-lg shadow-lg transition-transform duration-200"
            style={{ transform: `scale(${zoom / 100})` }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[300px] border-l border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-purple-100">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Infographic</h3>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Metadata
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                {metadata?.createdAt && (
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(metadata.createdAt).toLocaleDateString()}
                  </div>
                )}
                {metadata?.sources && metadata.sources.length > 0 && (
                  <div>
                    <span className="font-medium">Sources Used:</span>{" "}
                    {metadata.sources.length}
                  </div>
                )}
              </div>
            </div>

            {/* Color Theme Selector */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Color Theme
              </h4>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-600" />
                <button className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-transparent hover:border-blue-600" />
                <button className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-transparent hover:border-green-600" />
                <button className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-transparent hover:border-amber-600" />
              </div>
            </div>

            {/* Section Jump Links */}
            {metadata?.sections && metadata.sections.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Section Jump Links
                </h4>
                <div className="space-y-1">
                  {metadata.sections.map((section, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors flex items-center justify-between">
                      <span>{section}</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
