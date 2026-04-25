import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Trash2,
  Maximize2,
  Minimize2,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../../ui/button";
import { StudioItem } from "./types";

interface StudioMindMapViewProps {
  item: StudioItem;
  onBack: () => void;
  onNodeClick: (label: string) => void;
  onDelete?: (id: string) => void;
  onToggleFullscreen?: (item: StudioItem) => void;
  isFullscreen?: boolean;
}

// Recursive Node Component
const MindMapNode = ({
  node,
  isRoot = false,
  onNodeClick,
  expandState,
}: {
  node: any;
  isRoot?: boolean;
  onNodeClick: (label: string) => void;
  expandState?: "expanded" | "collapsed" | null;
}) => {
  const [isOpen, setIsOpen] = useState(isRoot);
  const hasChildren = node.children && node.children.length > 0;

  useEffect(() => {
    if (expandState === "expanded") setIsOpen(true);
    if (expandState === "collapsed") setIsOpen(false);
  }, [expandState]);

  return (
    <div className="flex items-center">
      {/* Node Content */}
      <div className="flex flex-col items-center z-10">
        <div
          className={`
            relative flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all cursor-pointer group
            ${
              isRoot
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md font-bold text-sm px-6 py-3"
                : "bg-white border-blue-100 text-gray-700 hover:border-indigo-300 hover:shadow-md text-xs font-medium"
            }
          `}
          style={{ minWidth: isRoot ? "120px" : "auto" }}>
          {/* Label triggers Chat */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node.label);
            }}
            className={
              isRoot
                ? ""
                : "hover:underline decoration-indigo-400 underline-offset-2"
            }>
            {node.label}
          </span>

          {/* Expand/Collapse Trigger */}
          {hasChildren && (
            <div
              className={`
                    ml-2 flex items-center justify-center w-5 h-5 rounded-full 
                    ${isRoot ? "text-white/80 hover:bg-white/20" : "text-gray-400 hover:bg-gray-100"}
                    cursor-pointer transition-colors
                `}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}>
              {isOpen ? (
                <div className="text-[10px]">&lt;</div> // Simple symbol for collapse
              ) : (
                <div className="text-[10px]">&gt;</div> // Simple symbol for expand
              )}
            </div>
          )}
        </div>
      </div>

      {/* Children Connector */}
      {hasChildren && isOpen && (
        <div className="flex items-center">
          {/* Spacer to right of parent */}
          <div className="w-12 h-px bg-gray-300"></div>

          {/* Children Column */}
          <div className="flex flex-col relative justify-center">
            {node.children.map((child: any, i: number) => {
              // Determine if this is the first, last, or middle child to draw lines correctly
              const isFirst = i === 0;
              const isLast = i === node.children.length - 1;
              const isOnly = node.children.length === 1;

              return (
                <div key={i} className="flex items-center relative pl-8 py-2">
                  {/* Access Line (Curved) */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center">
                    {/* The Bracket Shape */}
                    <div
                      className={`
                                w-full border-gray-300
                                ${isOnly ? "h-px border-t mb-auto mt-auto" : ""} 
                                ${!isOnly && isFirst ? "h-1/2 mt-auto border-t border-l rounded-tl-xl" : ""}
                                ${!isOnly && isLast ? "h-1/2 mb-auto border-b border-l rounded-bl-xl" : ""}
                                ${!isOnly && !isFirst && !isLast ? "h-full border-l flex items-center" : ""}
                            `}>
                      {/* Middle element connector if it's a middle node */}
                      {!isOnly && !isFirst && !isLast && (
                        <div className="w-full h-px bg-gray-300"></div>
                      )}
                    </div>
                  </div>
                  <MindMapNode
                    node={child}
                    onNodeClick={onNodeClick}
                    expandState={expandState}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsed Branch Indicator */}
      {hasChildren && !isOpen && (
        <div className="w-8 border-t border-dashed border-gray-300"></div>
      )}
    </div>
  );
};

export function StudioMindMapView({
  item,
  onBack,
  onNodeClick,
  onDelete,
  onToggleFullscreen,
  isFullscreen,
}: StudioMindMapViewProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [expandAllState, setExpandAllState] = useState<
    "expanded" | "collapsed" | null
  >(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  let data = null;
  try {
    data =
      typeof item.content === "string"
        ? JSON.parse(item.content)
        : item.content;
    if (data && data.data) data = data.data;
  } catch (e) {
    console.warn("Failed to parse map data", e);
  }

  const handleDownload = () => {
    // Simple print-to-pdf trigger for now as we don't have html2canvas installed
    window.print();
  };

  const toggleExpandAll = () => {
    setExpandAllState((prev) =>
      prev === "expanded" ? "collapsed" : "expanded",
    );
  };

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(0.2, prev.scale + delta), 2),
    }));
  };

  // Attach non-passive wheel listener
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleFactor = 0.05;
      const delta = -Math.sign(e.deltaY) * scaleFactor;
      handleZoom(delta);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Full Screen styles
  const containerClasses = isFullscreen
    ? "bg-white flex flex-col h-full w-full"
    : "flex flex-col h-full bg-white animate-in slide-in-from-right-4 duration-200";

  return (
    <div className={containerClasses}>
      {/* Breadcrumbs (Hide in Full Screen if desired, or keep simple) */}
      {!isFullscreen && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 shrink-0 z-10 bg-white">
          <span
            className="cursor-pointer hover:text-gray-600 transition-colors"
            onClick={onBack}>
            Studio
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 truncate max-w-[140px]">Mind map</span>
        </div>
      )}

      {/* Full Screen Header */}
      {isFullscreen && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 z-10 bg-white/95 backdrop-blur">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-900">
              {item.title}
            </h1>
            <p className="text-sm text-gray-500">
              Based on your project sources
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFullscreen?.(item)}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0 z-10 bg-white">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400"
            onClick={() => handleZoom(0.1)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400"
            onClick={() => handleZoom(-0.1)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-[10px] text-gray-400 w-8 text-center">
            {Math.round(transform.scale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => onDelete?.(item.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400"
            onClick={() => onToggleFullscreen?.(item)}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content Area - Hidden Scroll, Interactive Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gray-50/50 relative cursor-grab active:cursor-grabbing print:overflow-visible print:h-auto print:bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}>
        <div
          className="w-full h-full flex items-center justify-center origin-center transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}>
          <div className="bg-white/50 p-20 rounded-3xl border border-dashed border-gray-200 print:border-none print:p-0">
            {data ? (
              <MindMapNode
                node={data}
                isRoot={true}
                onNodeClick={onNodeClick}
                expandState={expandAllState}
              />
            ) : (
              <div className="text-center text-gray-400">
                <p>Map data unavailable.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons (Bottom Right) */}
      <div className="absolute top-36 right-6 flex flex-row gap-3 z-50 print:hidden">
        {/* Download Button */}
        <Button
          onClick={handleDownload}
          className="h-12 w-12 rounded-full bg-white shadow-lg border border-gray-100 text-gray-600 hover:text-indigo-600 hover:border-indigo-100 flex items-center justify-center transition-all"
          title="Download Map">
          <div className="flex flex-col items-center">
            <div className="h-4 w-0.5 bg-current mb-0.5"></div>
            <div className="w-3 h-3 border-b-2 border-r-2 border-current rotate-45 -mt-2"></div>
            <div className="w-3 h-0.5 bg-current mt-1"></div>
          </div>
        </Button>

        {/* Expand/Collapse All Button */}
        <Button
          onClick={toggleExpandAll}
          className="h-12 w-12 rounded-full bg-white shadow-lg border border-gray-100 text-gray-600 hover:text-indigo-600 hover:border-indigo-100 flex items-center justify-center transition-all"
          title={expandAllState === "expanded" ? "Collapse All" : "Expand All"}>
          <div className="flex flex-col items-center">
            {expandAllState === "expanded" ? (
              // Chevrons facing each other when expanded (ready to collapse)
              <>
                <ChevronDown className="w-4 h-4" />
                <ChevronUp className="w-4 h-4 -mt-2" />
              </>
            ) : (
              // Chevrons facing away when collapsed (ready to expand)
              <>
                <ChevronUp className="w-4 h-4" />
                <ChevronDown className="w-4 h-4 -mt-1" />
              </>
            )}
          </div>
        </Button>
      </div>

      {/* Footer Feedback */}
      <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center text-xs text-gray-500 shrink-0 z-10 print:hidden">
        <span>{item.time}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ThumbsUp className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ThumbsDown className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
