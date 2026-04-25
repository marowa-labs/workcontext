"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlertCircle,
  Minimize2,
  Download,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ChevronsUpDown,
} from "lucide-react";
import { ConceptNode, ConceptNodeData } from "./ConceptNode";
import { TimelineChart } from "./TimelineChart";
import { ResearchService } from "../lib/utils/researchService";

interface ResearchGraphProps {
  query?: string;
  papers?: any[];
}

export function ResearchGraph({ query, papers = [] }: ResearchGraphProps) {
  const [loading, setLoading] = useState(false); // Default false, fetch on mount if query exists
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"network" | "timeline">("network");
  const [mapData, setMapData] = useState<ConceptNodeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [expandAllKey, setExpandAllKey] = useState(0);
  const [areNodesExpanded, setAreNodesExpanded] = useState(false);

  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Reset View Transform
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setExpandAllKey(0); // Reset expansion on new data
    setAreNodesExpanded(false);
  };

  // Fetch Concept Map when query changes
  useEffect(() => {
    if (viewMode === "network" && query && !mapData) {
      const fetchMap = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await ResearchService.getConceptMap(query);
          if (!res.data) throw new Error("No data returned");
          setMapData(res.data);
          resetView(); // Reset view on new data
        } catch (e) {
          console.error("Map generation failed", e);
          setError("Failed to generate research map.");
        } finally {
          setLoading(false);
        }
      };

      fetchMap();
    }
  }, [query, viewMode, mapData]);

  // Reset map if query changes drastically
  useEffect(() => {
    setMapData(null);
    resetView();
  }, [query]);

  // Zoom Handlers
  const handleZoomIn = () => setScale((s) => Math.min(s * 1.2, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.2, 0.5));
  const handleFitBounds = () => resetView();
  const toggleMaximize = () => setIsMaximized(!isMaximized);

  const handleExpandAll = () => {
    setAreNodesExpanded((prev) => !prev); // Toggle expansion
    setExpandAllKey((prev) => prev + 1); // Force re-render of ConceptNode
  };

  const handleDownload = () => {
    // In a real app, we'd use html2canvas or export to SVG.
    // For now, we'll trigger a browser print.
    window.print();
  };

  const handleFeedback = (type: "good" | "bad") => {
    console.log(`User feedback for map: ${type}`);
    alert(`Thank you for your feedback! Marked as ${type}.`);
  };

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== "network") return; // Only pan in map mode
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || viewMode !== "network") return;

    const nativeWheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.min(Math.max(s * delta, 0.5), 3));
    };

    container.addEventListener("wheel", nativeWheelHandler, { passive: false });
    return () => {
      container.removeEventListener("wheel", nativeWheelHandler);
    };
  }, [viewMode]);

  const renderContent = () => (
    <div
      className={`flex-1 w-full h-full bg-slate-50 overflow-hidden relative ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}>
      {viewMode === "network" ? (
        <div
          className="min-w-full min-h-full flex items-center justify-center origin-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}>
          {loading ? (
            <div className="flex flex-col items-center gap-3 scale-100">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-500 select-none">
                Generating research map with AI...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 text-red-500 scale-100">
              <AlertCircle className="w-6 h-6" />
              <p className="text-sm select-none">{error}</p>
            </div>
          ) : mapData ? (
            <div className="p-20">
              <ConceptNode
                key={expandAllKey}
                node={mapData}
                isRoot={true}
                defaultExpanded={areNodesExpanded}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 select-none">
              Enter a query to view map
            </p>
          )}
        </div>
      ) : (
        <div className="w-full h-full overflow-auto cursor-default bg-white items-center justify-center flex">
          <TimelineChart papers={papers} />
        </div>
      )}
    </div>
  );

  // MAXIMIZED VIEW
  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {query || "Research Map"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Based on {papers.length || 4} sources
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              title="Download">
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={toggleMaximize}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              title="Minimize">
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#fafafa]">
          {renderContent()}

          {/* Floating Controls - Bottom Right */}
          <div className="absolute bottom-6 right-6 flex flex-col bg-white rounded-full shadow-lg border border-gray-100 p-1.5 gap-1 select-none z-40">
            <button
              onClick={handleExpandAll}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 mb-1"
              title={
                areNodesExpanded ? "Collapse all nodes" : "Expand all nodes"
              }
              disabled={viewMode !== "network"}>
              <ChevronsUpDown className="w-5 h-5" />
            </button>
            <div className="w-full h-px bg-gray-200 my-0.5" />
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              title="Zoom In"
              disabled={viewMode !== "network"}>
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              title="Zoom Out"
              disabled={viewMode !== "network"}>
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className="w-full h-px bg-gray-200 my-0.5" />
            <button
              onClick={handleFitBounds}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              title="Reset View">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback Controls - Bottom Left */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3 select-none z-40">
            <button
              onClick={() => handleFeedback("good")}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
              <ThumbsUp className="w-4 h-4" />
              <span>Good content</span>
            </button>
            <button
              onClick={() => handleFeedback("bad")}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
              <ThumbsDown className="w-4 h-4" />
              <span>Bad content</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD VIEW
  return (
    <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden relative group">
      {/* View Toggle */}
      <div className="absolute top-4 left-4 z-20 flex bg-gray-100/90 backdrop-blur rounded-lg border border-gray-200 p-1 font-medium text-xs shadow-sm select-none">
        <button
          onClick={() => {
            setViewMode("network");
            resetView();
          }}
          className={`px-3 py-1.5 rounded-md transition-all ${
            viewMode === "network"
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-gray-600 hover:bg-white"
          }`}>
          Map
        </button>
        <button
          onClick={() => setViewMode("timeline")}
          className={`px-3 py-1.5 rounded-md transition-all ${
            viewMode === "timeline"
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-gray-600 hover:bg-white"
          }`}>
          Timeline
        </button>
      </div>

      {/* Standard Toolbox */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 bg-white/90 p-1 rounded-lg shadow-sm border border-gray-100 select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleExpandAll}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-600 active:bg-gray-200"
          title={areNodesExpanded ? "Collapse all nodes" : "Expand all nodes"}
          disabled={viewMode !== "network"}>
          <ChevronsUpDown className="w-4 h-4" />
        </button>
        <div className="h-px bg-gray-200 my-1 mx-2" />
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-600 active:bg-gray-200"
          title="Zoom In"
          disabled={viewMode !== "network"}>
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-600 active:bg-gray-200"
          title="Zoom Out"
          disabled={viewMode !== "network"}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitBounds}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-600 active:bg-gray-200"
          title="Fit to Screen"
          disabled={viewMode !== "network"}>
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-px bg-gray-200 my-1 mx-2" />
        <button
          onClick={toggleMaximize}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-600 active:bg-gray-200"
          title="Maximize">
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {renderContent()}
    </div>
  );
}
