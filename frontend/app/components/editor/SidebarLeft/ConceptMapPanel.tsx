"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ResearchService } from "../../../lib/utils/researchService";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
  RefreshCw,
  Search,
  Bot,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../../ui/button";

interface ConceptNode {
  id: string;
  label: string;
  type: "root" | "branch" | "leaf";
  description?: string;
  children?: ConceptNode[];
  // Layout properties calculated at runtime
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  collapsed?: boolean;
}

interface ConceptMapPanelProps {
  currentTitle?: string;
  onSearchNode?: (term: string) => void;
  onChatNode?: (message: string) => void;
}

export function ConceptMapPanel({
  currentTitle,
  onSearchNode,
  onChatNode,
}: ConceptMapPanelProps) {
  const [zoom, setZoom] = useState(100);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  const [rootNode, setRootNode] = useState<ConceptNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTitle) {
      loadGraph(currentTitle);
    }
  }, [currentTitle]);

  const loadGraph = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ResearchService.getConceptMap(query);
      if (response && response.data) {
        setRootNode(response.data);
        // Reset view on new graph
        setZoom(100);
        setTranslate({ x: 50, y: 50 });
      } else {
        setError("No data returned for concept map");
      }
    } catch (err) {
      setError("Failed to generate concept map");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // --- Pan & Zoom Handlers ---

  // Use native event listener for wheel to support preventDefault (non-passive)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const scaleAmount = -e.deltaY * 0.001;
      setZoom((prevZoom) =>
        Math.max(20, Math.min(300, prevZoom * (1 + scaleAmount))),
      );
    };

    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", onWheel);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button or Left click on background
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      startPanRef.current = {
        x: e.clientX - translate.x,
        y: e.clientY - translate.y,
      };
      document.body.style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    const newX = e.clientX - startPanRef.current.x;
    const newY = e.clientY - startPanRef.current.y;
    setTranslate({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      document.body.style.cursor = "default";
    }
  };

  // --- Layout Algorithm ---
  const treeLayout = useMemo(() => {
    if (!rootNode) return { nodes: [], edges: [], maxX: 0, maxY: 0 };

    const NODE_WIDTH = 220;
    const NODE_HEIGHT = 50;
    const HORIZONTAL_GAP = 120;
    const VERTICAL_GAP = 20;

    const nodesWithPos: ConceptNode[] = [];
    const edges: any[] = [];
    let maxY = 0;
    let maxX = 0;

    const calculateSubtreeSize = (node: ConceptNode): number => {
      if (
        collapsedNodes.has(node.id) ||
        !node.children ||
        node.children.length === 0
      ) {
        return NODE_HEIGHT + VERTICAL_GAP;
      }
      let height = 0;
      node.children.forEach((child) => {
        height += calculateSubtreeSize(child);
      });
      return height;
    };

    const assignPositions = (node: ConceptNode, x: number, startY: number) => {
      const myHeight = calculateSubtreeSize(node);
      const y = startY + myHeight / 2;

      const positionedNode = {
        ...node,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        collapsed: collapsedNodes.has(node.id),
      };
      nodesWithPos.push(positionedNode);

      maxX = Math.max(maxX, x + NODE_WIDTH);
      maxY = Math.max(maxY, startY + myHeight);

      if (
        !collapsedNodes.has(node.id) &&
        node.children &&
        node.children.length > 0
      ) {
        let currentChildY = startY;
        node.children.forEach((child) => {
          const childHeight = calculateSubtreeSize(child);
          assignPositions(
            child,
            x + NODE_WIDTH + HORIZONTAL_GAP,
            currentChildY,
          );

          const pX = x + NODE_WIDTH;
          const pY = y;
          const cX = x + NODE_WIDTH + HORIZONTAL_GAP;
          const cY = currentChildY + childHeight / 2;

          edges.push({
            id: `${node.id}-${child.id}`,
            sourceId: node.id,
            targetId: child.id,
            x1: pX,
            y1: pY,
            x2: cX,
            y2: cY,
          });

          currentChildY += childHeight;
        });
      }
    };

    assignPositions(rootNode, 0, 0); // Local coordinates relative to translate group
    return { nodes: nodesWithPos, edges, maxX, maxY };
  }, [rootNode, collapsedNodes]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-start z-20 bg-white relative">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Concept Map
          </h3>
          <p className="text-xs text-gray-500">
            AI-Generated Mind Map for "{currentTitle || "Topic"}"
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => loadGraph(currentTitle || "")}
            disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setZoom(100);
              setTranslate({ x: 50, y: 50 });
            }}
            title="Reset View">
            <Maximize className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center px-4 z-20 relative">
        <div className="flex gap-1 bg-white rounded-md border border-gray-200 p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(Math.max(50, zoom - 10))}>
            <ZoomOut className="h-3.5 w-3.5 text-gray-600" />
          </Button>
          <span className="text-xs text-gray-600 flex items-center px-2 min-w-[3rem] justify-center">
            {Math.round(zoom)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(Math.min(300, zoom + 10))}>
            <ZoomIn className="h-3.5 w-3.5 text-gray-600" />
          </Button>
        </div>
        <span className="text-xs text-gray-400">
          Scroll to zoom • Drag to pan
        </span>
      </div>

      {/* Graph Area */}
      <div
        className="flex-1 relative bg-gray-50/30 overflow-hidden cursor-grab active:cursor-grabbing"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}>
        {loading && !rootNode ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center p-4 bg-white/80 backdrop-blur rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-500">Generating Concept Map...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 pointer-events-none">
            <p className="mb-2">{error}</p>
            <Button
              variant="link"
              onClick={() => loadGraph(currentTitle || "")}
              className="pointer-events-auto">
              Try Again
            </Button>
          </div>
        ) : (
          <div
            className="relative transform-origin-top-left transition-transform duration-75 ease-out min-h-full min-w-full"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom / 100})`,
              // We do NOT set explicit width/height here anymore to avoid scrollbars
            }}>
            <svg
              className="absolute overflow-visible pointer-events-none"
              style={{ left: 0, top: 0 }}>
              {treeLayout.edges.map((edge) => {
                const midX = (edge.x1 + edge.x2) / 2;
                return (
                  <path
                    key={edge.id}
                    d={`M ${edge.x1} ${edge.y1} C ${midX} ${edge.y1}, ${midX} ${edge.y2}, ${edge.x2} ${edge.y2}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>

            {treeLayout.nodes.map((node) => (
              <div
                key={node.id}
                className="absolute transform -translate-y-1/2 z-10 flex items-center group"
                style={{ top: node.y, left: node.x, width: node.width }}>
                {/* Node Card */}
                <div
                  className={`
                        flex-1 flex items-center justify-between
                        p-3 rounded-lg border shadow-sm transition-all cursor-auto
                        ${node.type === "root" ? "bg-blue-600 border-blue-700 text-white" : "bg-white border-blue-100 hover:border-blue-300 hover:shadow-md"}
                    `}
                  onMouseDown={(e) => e.stopPropagation()} // Allow clicking node without dragging map
                >
                  <span
                    className={`text-sm font-medium line-clamp-2 ${node.type === "root" ? "text-white" : "text-slate-700"}`}>
                    {node.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/20">
                    <button
                      title="Search this topic"
                      className={`p-1 rounded-full hover:bg-white/20 transition-colors ${node.type === "root" ? "text-white" : "text-slate-400 hover:text-blue-600"}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSearchNode) onSearchNode(node.label);
                      }}>
                      <Search className="w-3 h-3" />
                    </button>
                    <button
                      title="Ask AI about this"
                      className={`p-1 rounded-full hover:bg-white/20 transition-colors ${node.type === "root" ? "text-white" : "text-slate-400 hover:text-purple-600"}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onChatNode) {
                          const msg = `Discuss what these sources say about "${node.label}", in the larger context of "${currentTitle || "the research"}".`;
                          onChatNode(msg);
                        }
                      }}>
                      <Bot className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Expand Toggle */}
                {node.children && node.children.length > 0 && (
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNode(node.id);
                    }}
                    className={`
                            ml-[-10px] z-20 w-5 h-5 rounded-full flex items-center justify-center border transition-colors bg-white hover:bg-slate-50
                            ${node.collapsed ? "border-slate-300 text-slate-500" : "border-blue-200 text-blue-500"}
                        `}
                    style={{ marginLeft: -8 }}>
                    {node.collapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronLeft className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
