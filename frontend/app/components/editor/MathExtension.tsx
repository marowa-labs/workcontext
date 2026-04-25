import { Node, mergeAttributes, nodeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useEffect, useRef, useState } from "react";

const MathComponent = ({ node, updateAttributes, selected }: any) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (
      containerRef.current &&
      typeof window !== "undefined" &&
      (window as any).katex
    ) {
      try {
        (window as any).katex.render(
          node.attrs.latex || " ",
          containerRef.current,
          {
            throwOnError: false,
            displayMode: node.attrs.displayMode || false,
          },
        );
      } catch (e) {
        console.error("KaTeX rendering error", e);
      }
    }
  }, [node.attrs.latex, node.attrs.displayMode]);

  return (
    <NodeViewWrapper
      as="span"
      className={`math-node inline-block px-1 rounded cursor-pointer transition-all duration-200 ${
        selected
          ? "ring-2 ring-blue-400 bg-blue-50/50"
          : "hover:bg-slate-100/50"
      }`}
      onClick={() => setIsEditing(true)}>
      {isEditing ? (
        <input
          autoFocus
          className="bg-white border border-blue-400 outline-none px-1 rounded text-sm font-mono"
          value={node.attrs.latex}
          onChange={(e) => updateAttributes({ latex: e.target.value })}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <span ref={containerRef} />
      )}
    </NodeViewWrapper>
  );
};

export const MathExtension = Node.create({
  name: "math",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
      },
      displayMode: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='math']",
        getAttrs: (element) => ({
          latex: (element as HTMLElement).getAttribute("data-latex"),
          displayMode:
            (element as HTMLElement).getAttribute("data-display") === "true",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "math",
        "data-latex": HTMLAttributes.latex,
        "data-display": HTMLAttributes.displayMode,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\$([^$]+)\$$/,
        type: this.type,
        getAttributes: (match) => ({
          latex: match[1],
        }),
      }),
    ];
  },
});
