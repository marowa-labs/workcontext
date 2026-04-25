/**
 * Utility functions for safe editor operations to prevent NaN position errors
 */

import { Editor } from "@tiptap/react";

/**
 * Safely insert content at a specific position, with fallbacks for invalid positions
 * @param editor The Tiptap editor instance
 * @param content The content to insert
 * @param position Optional position to insert at (will use current cursor position if invalid)
 */
export function safeInsertContent(
  editor: Editor,
  content: any,
  position?: number
): boolean {
  if (!editor) {
    console.warn("Cannot insert content: editor is not available");
    return false;
  }

  try {
    // Validate position if provided
    if (position !== undefined) {
      // Check if position is a valid number
      if (typeof position !== "number" || isNaN(position)) {
        console.warn(
          "Invalid position provided, falling back to current cursor position"
        );
        position = undefined;
      }
      // Check if position is within document bounds
      else if (position < 0 || position > editor.state.doc.content.size) {
        console.warn(
          "Position out of bounds, falling back to current cursor position"
        );
        position = undefined;
      }
    }

    // Insert at specified position or current cursor position
    if (position !== undefined) {
      editor.commands.insertContentAt(position, content);
    } else {
      editor.commands.insertContent(content);
    }

    return true;
  } catch (error) {
    console.error("Error during content insertion:", error);

    // Final fallback: try inserting at the end of the document
    try {
      const endPosition = editor.state.doc.content.size;
      editor.commands.insertContentAt(endPosition, content);
      return true;
    } catch (fallbackError) {
      console.error("Fallback content insertion also failed:", fallbackError);
      return false;
    }
  }
}

/**
 * Safely set editor content with validation
 * @param editor The Tiptap editor instance
 * @param content The content to set
 */
export function safeSetContent(editor: Editor, content: any): boolean {
  if (!editor) {
    console.warn("Cannot set content: editor is not available");
    return false;
  }

  try {
    // Validate content structure
    if (!content || typeof content !== "object") {
      console.warn("Invalid content structure, using empty document");
      content = {
        type: "doc",
        content: [{ type: "paragraph" }],
      };
    }

    // Ensure content has the correct structure
    if (!content.type) {
      content = {
        type: "doc",
        content: Array.isArray(content)
          ? content
          : [{ type: "paragraph", content }],
      };
    }

    editor.commands.setContent(content);
    return true;
  } catch (error) {
    console.error("Error setting editor content:", error);
    return false;
  }
}

/**
 * Validate and fix selection positions to prevent NaN errors
 * @param editor The Tiptap editor instance
 */
export function validateSelection(
  editor: Editor
): { from: number; to: number } | null {
  if (!editor) {
    return null;
  }

  try {
    const { from, to } = editor.state.selection;

    // Validate that positions are numbers and not NaN
    if (typeof from !== "number" || isNaN(from) || from < 0) {
      console.warn("Invalid 'from' position in selection, defaulting to 0");
      return {
        from: 0,
        to: typeof to === "number" && !isNaN(to) && to >= 0 ? to : 0,
      };
    }

    const docSize = editor.state.doc.content.size;
    if (from > docSize) {
      console.warn("From position exceeds document size, adjusting");
      return { from: docSize, to: Math.min(to, docSize) };
    }

    if (typeof to !== "number" || isNaN(to) || to < 0) {
      console.warn("Invalid 'to' position in selection, using 'from' position");
      return { from, to: from };
    }

    if (to > docSize) {
      console.warn("To position exceeds document size, adjusting");
      return { from, to: docSize };
    }

    if (from > to) {
      console.warn("'from' position greater than 'to' position, swapping");
      return { from: to, to: from };
    }

    return { from, to };
  } catch (error) {
    console.error("Error validating selection:", error);
    return null;
  }
}

/**
 * Safely resolve a position in the document
 * @param editorOrState The Tiptap editor instance or state object
 * @param pos The position to resolve
 */
export function safeResolvePosition(editorOrState: any, pos: number): any {
  if (!editorOrState) {
    return null;
  }

  try {
    // Validate position
    if (typeof pos !== "number" || isNaN(pos)) {
      console.warn("Cannot resolve invalid position:", pos);
      return null;
    }

    // Get state from editor or use directly
    const state = editorOrState.state || editorOrState;

    if (!state || !state.doc) {
      console.warn("Invalid state object provided");
      return null;
    }

    const docSize = state.doc.content.size;
    if (pos < 0 || pos > docSize) {
      console.warn("Position out of bounds:", pos, "Document size:", docSize);
      return null;
    }

    return state.doc.resolve(pos);
  } catch (error) {
    console.error("Error resolving position:", error);
    return null;
  }
}

/**
 * Safely delete a table node and handle any contentMatchAt errors
 * @param editor The Tiptap editor instance
 */
export function safeDeleteTable(editor: Editor): boolean {
  if (!editor) {
    console.warn("Cannot delete table: editor is not available");
    return false;
  }

  try {
    // First, check if we're inside a table
    const { selection } = editor.state;
    const { $from, $to } = selection;

    // Find the table node if we're inside one
    let tablePos = -1;
    let depth = $from.depth;

    while (depth > 0) {
      const node = $from.node(depth);
      if (node.type.name === "table") {
        tablePos = $from.before(depth);
        break;
      }
      depth--;
    }

    if (tablePos !== -1) {
      // We found a table, delete it safely
      const tr = editor.state.tr.delete(
        tablePos,
        tablePos + $from.node(depth).nodeSize
      );
      editor.view.dispatch(tr);
      return true;
    } else {
      // Not in a table, try the standard delete command
      return editor.commands.deleteTable();
    }
  } catch (error) {
    console.error("Error deleting table:", error);

    // Fallback: try to delete the current selection
    try {
      return editor.commands.deleteSelection();
    } catch (fallbackError) {
      console.error("Fallback table deletion also failed:", fallbackError);
      return false;
    }
  }
}

/**
 * Validate and fix table structure to prevent contentMatchAt errors
 * @param tableNode The table node to validate
 */
export function validateTableStructure(tableNode: any): any {
  if (!tableNode || tableNode.type !== "table") {
    return null;
  }

  // Create a copy of the table node
  const validatedTable = { ...tableNode };

  // Ensure table has proper attributes
  if (!validatedTable.attrs) {
    validatedTable.attrs = {};
  }

  // Validate table content structure
  if (validatedTable.content && Array.isArray(validatedTable.content)) {
    validatedTable.content = validatedTable.content
      .map((row: any) => {
        if (row && typeof row === "object" && row.type === "tableRow") {
          // Validate row content
          const validatedRow = { ...row };
          if (validatedRow.content && Array.isArray(validatedRow.content)) {
            validatedRow.content = validatedRow.content.map((cell: any) => {
              if (
                cell &&
                typeof cell === "object" &&
                (cell.type === "tableCell" || cell.type === "tableHeader")
              ) {
                // Validate cell content
                const validatedCell = { ...cell };
                if (!validatedCell.content) {
                  validatedCell.content = [{ type: "paragraph" }];
                } else if (!Array.isArray(validatedCell.content)) {
                  validatedCell.content = [
                    {
                      type: "paragraph",
                      content: [
                        { type: "text", text: String(validatedCell.content) },
                      ],
                    },
                  ];
                } else if (validatedCell.content.length === 0) {
                  validatedCell.content = [{ type: "paragraph" }];
                }
                return validatedCell;
              }
              return cell;
            });
          } else {
            // Ensure row has content array
            validatedRow.content = [];
          }
          return validatedRow;
        }
        return row;
      })
      .filter((row: any) => row !== null);
  } else {
    // Ensure table has content array
    validatedTable.content = [];
  }

  return validatedTable;
}

/**
 * Apply template content with proper table validation
 * @param editor The Tiptap editor instance
 * @param templateContent The template content to apply
 */
export function applyTemplateContentWithValidation(
  editor: Editor,
  templateContent: any
): boolean {
  if (!editor || !templateContent) {
    console.warn("Cannot apply template: editor or content not available");
    return false;
  }

  try {
    // Validate and fix table structures in the template content
    const validateContent = (content: any): any => {
      if (!content || typeof content !== "object") return content;

      // Handle arrays
      if (Array.isArray(content)) {
        return content.map(validateContent);
      }

      // Handle objects
      let processedContent = { ...content };

      // Special handling for table nodes
      if (processedContent.type === "table") {
        const validatedTable = validateTableStructure(processedContent);
        if (validatedTable) {
          return validatedTable;
        }
        return processedContent; // Return original if validation failed
      }

      // Process nested content recursively
      if (processedContent.content && Array.isArray(processedContent.content)) {
        processedContent.content =
          processedContent.content.map(validateContent);
      }

      return processedContent;
    };

    // Apply validation to the template content
    const validatedContent = validateContent(templateContent);

    // Apply the validated content to the editor
    return safeSetContent(editor, validatedContent);
  } catch (error) {
    console.error("Error applying template with validation:", error);
    return false;
  }
}

/**
 * Safely insert a table with proper structure validation
 * @param editor The Tiptap editor instance
 * @param rows Number of rows
 * @param cols Number of columns
 */
export function safeInsertTable(
  editor: Editor,
  rows: number = 3,
  cols: number = 3
): boolean {
  if (!editor) {
    console.warn("Cannot insert table: editor is not available");
    return false;
  }

  try {
    // Create a properly structured table
    const tableContent = [];

    for (let i = 0; i < rows; i++) {
      const rowContent = [];
      for (let j = 0; j < cols; j++) {
        rowContent.push({
          type: "tableCell",
          content: [{ type: "paragraph", content: [] }],
        });
      }
      tableContent.push({
        type: "tableRow",
        content: rowContent,
      });
    }

    const tableNode = {
      type: "table",
      content: tableContent,
    };

    // Insert the table
    return editor.commands.insertContent(tableNode);
  } catch (error) {
    console.error("Error inserting table:", error);

    // Fallback: try the standard insert table command
    try {
      return editor.commands.insertTable({ rows, cols, withHeaderRow: true });
    } catch (fallbackError) {
      console.error("Fallback table insertion also failed:", fallbackError);
      return false;
    }
  }
}
