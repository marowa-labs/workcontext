"use client";

import React, { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import { useCreateBlockNote, BlockNoteViewRaw, getDefaultReactSlashMenuItems } from "@blocknote/react";
import "@blocknote/core/style.css";
import { debounce } from "lodash";
import { useTheme } from "../../contexts/ThemeContext";

// ---------- Types ----------

export interface BlockEditorRef {
  getContent: () => any;
  insertContent: (html: string) => void;
  getDocument: () => any;
  setDocument: (blocks: any[]) => void;
}

export interface BlockEditorProps {
  initialContent?: any; // BlockNote JSON blocks or TipTap JSON
  onSave?: (content: any) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
}

// ---------- Helpers ----------

/**
 * Convert a TipTap JSON document to BlockNote blocks.
 * Handles the most common TipTap node types.
 */
function tiptapToBlockNote(tiptapContent: any): any[] {
  if (!tiptapContent || !tiptapContent.content) return [];

  const blocks: any[] = [];

  for (const node of tiptapContent.content) {
    const converted = convertNode(node);
    if (converted) {
      if (Array.isArray(converted)) {
        blocks.push(...converted);
      } else {
        blocks.push(converted);
      }
    }
  }

  return blocks;
}

function convertNode(node: any): any | any[] | null {
  if (!node) return null;

  const textContent = extractText(node.content);

  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level || 1;
      const headingType = level === 1 ? "heading" : level === 2 ? "heading" : "heading";
      return {
        id: generateId(),
        type: headingType,
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
          level: Math.min(level, 3) as 1 | 2 | 3,
        },
        content: textContent,
        children: [],
      };
    }

    case "paragraph":
      return {
        id: generateId(),
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
        },
        content: textContent,
        children: [],
      };

    case "bulletList":
    case "listItem": {
      // Recurse into children
      if (node.content && node.content.length > 0) {
        return node.content
          .map((child: any) => convertNode(child))
          .flat()
          .filter(Boolean);
      }
      return null;
    }

    case "orderedList":
      if (node.content && node.content.length > 0) {
        return node.content
          .map((child: any) => convertNode(child))
          .flat()
          .filter(Boolean);
      }
      return null;

    case "checkList":
    case "taskList":
      if (node.content && node.content.length > 0) {
        return node.content
          .map((child: any) => convertNode(child))
          .flat()
          .filter(Boolean);
      }
      return null;

    case "taskItem":
      return {
        id: generateId(),
        type: "checkListItem",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
          checked: node.attrs?.checked || false,
        },
        content: textContent,
        children: [],
      };

    case "listItem":
      return {
        id: generateId(),
        type: "bulletListItem",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
        },
        content: textContent,
        children: [],
      };

    case "blockquote":
      return {
        id: generateId(),
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "gray",
          textAlignment: "left",
        },
        content: textContent,
        children: [],
      };

    case "codeBlock":
      return {
        id: generateId(),
        type: "codeBlock",
        props: {
          language: node.attrs?.language || "plainText",
        },
        content: textContent,
        children: [],
      };

    case "horizontalRule":
      return {
        id: generateId(),
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
        },
        content: "---",
        children: [],
      };

    case "image":
      return {
        id: generateId(),
        type: "image",
        props: {
          url: node.attrs?.src || node.attrs?.url || "",
          caption: node.attrs?.alt || "",
          previewWidth: node.attrs?.width || 512,
        },
        content: undefined,
        children: [],
      };

    case "table":
      // Convert table to a paragraph with table info
      return {
        id: generateId(),
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
        },
        content: "[Table content]",
        children: [],
      };

    default:
      // For unknown types, try to extract text
      if (textContent) {
        return {
          id: generateId(),
          type: "paragraph",
          props: {
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: textContent,
          children: [],
        };
      }
      return null;
  }
}

function extractText(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item.text) return item.text;
        if (item.type === "text") return item.text || "";
        return "";
      })
      .join("");
  }
  return "";
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

// ---------- Component ----------

const BlockEditor = forwardRef<BlockEditorRef, BlockEditorProps>(
  ({ initialContent, onSave, readOnly = false, className, placeholder }, ref) => {
  const { settings } = useTheme();
  const isDark = settings.theme === "dark";
    // Convert initial content to BlockNote blocks
    const initialBlocks = useMemo(() => {
      if (!initialContent) return undefined;

      // Already BlockNote format (array of blocks)
      if (Array.isArray(initialContent)) {
        return initialContent;
      }

      // BlockNote format with doc wrapper
      if (initialContent.type === "doc" && initialContent.content) {
        // Could be TipTap or BlockNote doc
        // Check if it looks like TipTap (has marks, attrs, etc.)
        if (initialContent.content[0]?.attrs?.level !== undefined || initialContent.content[0]?.type === "paragraph") {
          return tiptapToBlockNote(initialContent);
        }
        // It's BlockNote
        return initialContent.content;
      }

      // TipTap format
      if (initialContent.type === "doc") {
        return tiptapToBlockNote(initialContent);
      }

      return undefined;
    }, [initialContent]);

    // Create the editor
    const editor = useCreateBlockNote({
      initialContent: initialBlocks,
      uploadFile: async (file: File) => {
        // Create a data URL for the file
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      },
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getContent: () => editor.document,
      insertContent: (html: string) => {
        // Simple text insertion as blocks
        const textContent = html.replace(/<[^>]*>/g, "").trim();
        if (textContent) {
          const block = editor.getTextCursorPosition().block;
          editor.insertBlocks(
            [{ type: "paragraph", content: textContent }],
            block,
            "after"
          );
        }
      },
      getDocument: () => editor.document,
      setDocument: (blocks: any[]) => {
        // Replace editor content
        editor.replaceBlocks(editor.document, blocks);
      },
    }));

    // Auto-save on changes
    const debouncedSave = useMemo(
      () =>
        debounce((content: any) => {
          onSave?.(content);
        }, 1000),
      [onSave],
    );

    // Handle editor changes
    const handleUpdate = useCallback(() => {
      debouncedSave(editor.document);
    }, [editor, debouncedSave]);

    // Custom slash menu items
    const slashMenuItems = useMemo(() => getDefaultReactSlashMenuItems(editor), [editor]);

    return (
      <div className={className}>
        <BlockNoteViewRaw
          editor={editor}
          theme={isDark ? "dark" : "light"}
          editable={!readOnly}
          onChange={handleUpdate}
        >
        </BlockNoteViewRaw>
      </div>
    );
  },
);

BlockEditor.displayName = "BlockEditor";

export default BlockEditor;
