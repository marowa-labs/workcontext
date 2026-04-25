"use client";

import { useState } from "react";

export interface ConceptNodeData {
  id: string;
  label: string;
  type: "root" | "branch" | "leaf";
  description?: string;
  children?: ConceptNodeData[];
}

interface ConceptNodeProps {
  node: ConceptNodeData;
  isRoot?: boolean;
  defaultExpanded?: boolean;
}

export function ConceptNode({
  node,
  isRoot = false,
  defaultExpanded = false,
}: ConceptNodeProps) {
  const [expanded, setExpanded] = useState(isRoot || defaultExpanded);
  const hasChildren = node.children && node.children.length > 0;

  // Colors based on DNA image
  const nodeClass = isRoot
    ? "bg-indigo-200 border-indigo-300 text-indigo-900"
    : "bg-blue-200 border-blue-300 text-blue-900";

  return (
    <div className="flex items-center">
      {/* Node Content */}
      <div className="relative z-20 flex items-center">
        <div
          className={`
            relative px-5 py-3 rounded-xl border shadow-sm transition-all cursor-default select-none
            ${nodeClass}
            min-w-[150px] max-w-[300px]
          `}>
          <div className="text-sm font-bold break-words leading-relaxed text-center">
            {node.label}
          </div>

          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer z-30">
              {expanded ? (
                <span className="font-bold text-xs leading-none relative top-[-1px]">
                  &lt;
                </span>
              ) : (
                <span className="font-bold text-xs leading-none relative top-[-1px]">
                  &gt;
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Children Container */}
      {hasChildren && expanded && (
        <div className="flex items-center">
          {/* Connector Line from Parent to Spine */}
          <div className="w-8 h-px bg-gray-300"></div>

          {/* Correction: Use the per-child loop for structure, remove the border-l from container */}
          <div className="flex flex-col justify-center relative">
            {node.children!.map((child, index, arr) => {
              const isFirst = index === 0;
              const isLast = index === arr.length - 1;
              const isSingle = arr.length === 1;

              return (
                <div
                  key={child.id}
                  className="relative flex items-center pl-8 py-5">
                  {!isFirst && (
                    <div className="absolute left-0 top-0 w-px bg-gray-300 h-[calc(50%+1px)]"></div>
                  )}
                  {!isLast && (
                    <div className="absolute left-0 bottom-0 w-px bg-gray-300 h-[calc(50%+1px)]"></div>
                  )}

                  {isSingle ? (
                    /* Just a straight line */
                    <div className="absolute left-0 top-1/2 w-8 h-px bg-gray-300"></div>
                  ) : (
                    <>
                      {/* Horizontal Arm (shortened to allow for curve) */}
                      <div className="absolute left-3 top-1/2 right-full w-5 h-px bg-gray-300"></div>

                      {isFirst ? (
                        // Top-most child: Curve `╭`
                        <div className="absolute left-0 top-1/2 w-3 h-6 border-l border-t border-gray-300 rounded-tl-xl"></div>
                      ) : isLast ? (
                        // Bottom-most child: Curve `╰`
                        <div className="absolute left-0 bottom-1/2 w-3 h-6 border-l border-b border-gray-300 rounded-bl-xl"></div>
                      ) : (
                        <div className="absolute left-0 top-1/2 w-3 h-px bg-gray-300"></div>
                      )}

                      {/* Extend Horizontal from Curve to Child */}
                      <div className="absolute left-3 top-1/2 w-5 h-px bg-gray-300"></div>
                    </>
                  )}

                  {/* Single Child Horizontal Fix */}
                  {isSingle && (
                    <div className="absolute left-0 top-1/2 w-8 h-px bg-gray-300"></div>
                  )}

                  <ConceptNode node={child} defaultExpanded={defaultExpanded} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
