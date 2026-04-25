import { apiClient } from "./apiClient";

// Function to save project content
export async function saveProjectContent(
  projectId: string,
  content: any,
  title?: string,
  wordCount?: number,
  options: RequestInit = {}
): Promise<any> {
  try {
    const response = await apiClient.put("/api/editor", {
      projectId,
      content,
      title,
      wordCount,
    }, options);
    return response.project;
  } catch (error) {
    console.error("Error saving project content:", error);
    throw error;
  }
}

// Function to create a document version (explicit save)
export async function createDocumentVersion(
  projectId: string,
  content: any,
  wordCount?: number,
  force: boolean = false,
): Promise<any> {
  try {
    const response = await apiClient.post("/api/editor/versions", {
      projectId,
      content,
      wordCount,
      force,
    });
    return response.version;
  } catch (error) {
    console.error("Error creating document version:", error);
    throw error;
  }
}

// Function to import a document
export async function importDocument(fileData: {
  title: string;
  content: any;
  fileType: string;
  wordCount?: number;
}): Promise<any> {
  try {
    const response = await apiClient.post("/api/projects/import", fileData);
    return response.project;
  } catch (error) {
    console.error("Error importing document:", error);
    throw error;
  }
}

// Function to perform non-disruptive content updates
// This function updates content without interrupting the user's typing flow
export function updateContentNonDisruptively(
  editor: any,
  newContent: any,
  currentContent: any,
): boolean {
  try {
    // Check if there's a significant difference between current and new content
    const currentStr = JSON.stringify(currentContent);
    const newStr = JSON.stringify(newContent);

    // If content is essentially the same, no need to update
    if (currentStr === newStr) {
      return false;
    }

    // For minor changes, we might want to merge rather than replace
    const lengthDiff = Math.abs(currentStr.length - newStr.length);

    // Only proceed with update if there's a substantial difference
    if (lengthDiff > 50) {
      // Preserve current cursor position
      const selection = editor.state.selection;

      // Get current scroll position to maintain view
      const scrollPosition = {
        top: window.scrollY || document.documentElement.scrollTop,
        left: window.scrollX || document.documentElement.scrollLeft,
      };

      // Update content
      editor.commands.setContent(newContent);

      // Try to restore cursor position
      try {
        editor.commands.setTextSelection(selection);
      } catch (error) {
        console.warn("Could not restore cursor position:", error);
      }

      // Restore scroll position
      try {
        window.scrollTo(scrollPosition.left, scrollPosition.top);
      } catch (error) {
        console.warn("Could not restore scroll position:", error);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in non-disruptive content update:", error);
    return false;
  }
}

// Enhanced content validation function with improved Tiptap document structure validation
export function validateAndPrepareContent(content: any): any {
  // Handle null, undefined, or empty content
  if (
    content === null ||
    content === undefined ||
    (typeof content === "object" && Object.keys(content).length === 0)
  ) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }], // Consistent representation
    };
  }

  // Handle string content (could be JSON string or plain text)
  if (typeof content === "string") {
    // If it looks like JSON, try to parse it
    if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(content);
        // If successfully parsed, validate the structure
        return validateAndPrepareContent(parsed);
      } catch (parseError) {
        // If parsing fails, treat as plain text
        // Fix for empty text nodes - Tiptap doesn't allow empty text nodes
        if (content.length === 0) {
          return {
            type: "doc",
            content: [{ type: "paragraph" }], // Consistent representation
          };
        }
        return {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: content }],
            },
          ],
        };
      }
    } else {
      // Plain text content
      // Fix for empty text nodes - Tiptap doesn't allow empty text nodes
      if (content.length === 0) {
        return {
          type: "doc",
          content: [{ type: "paragraph" }], // Consistent representation
        };
      }
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: content }],
          },
        ],
      };
    }
  }

  // Handle object content
  if (typeof content === "object" && !Array.isArray(content)) {
    // Check for valid Tiptap document structure
    if (content.type === "doc" && Array.isArray(content.content)) {
      // Process content to remove empty text nodes and invalid content
      const processedContent: any[] = [];

      for (const node of content.content) {
        // Skip null or undefined nodes
        if (node === null || node === undefined) {
          continue;
        }

        // Handle paragraph nodes with content arrays
        if (node.type === "paragraph" && Array.isArray(node.content)) {
          const validContent = node.content
            .map((contentItem: any) => {
              if (
                contentItem &&
                typeof contentItem === "object" &&
                contentItem.type === "text"
              ) {
                // Handle text nodes
                if (
                  contentItem.text === undefined ||
                  contentItem.text === null
                ) {
                  return null; // Remove invalid text nodes
                }
                const textValue = String(contentItem.text);
                if (textValue.length === 0) {
                  return null; // Remove empty text nodes
                }
                return { ...contentItem, text: textValue };
              } else if (
                contentItem &&
                typeof contentItem === "object" &&
                contentItem.type
              ) {
                // Keep valid nodes with defined types
                return contentItem;
              } else if (contentItem !== null && contentItem !== undefined) {
                // Convert non-object items to text nodes
                const stringValue = String(contentItem);
                if (stringValue.length > 0) {
                  return { type: "text", text: stringValue };
                }
                return null; // Skip empty strings
              }
              return null; // Remove invalid items
            })
            .filter((contentItem: any) => contentItem !== null); // Remove any null items

          if (validContent.length > 0) {
            processedContent.push({
              type: "paragraph",
              content: validContent,
            });
          }
          // Only add empty paragraph if it's the only content to prevent empty editor
          else if (
            processedContent.length === 0 &&
            content.content.length === 1
          ) {
            processedContent.push({ type: "paragraph" });
          }
          continue;
        }

        // Handle table-related nodes with special validation
        if (node.type === "table") {
          const validatedTable = validateTableStructure(node);
          if (validatedTable) {
            processedContent.push(validatedTable);
          }
          continue;
        }

        // Handle tableRow nodes
        if (node.type === "tableRow") {
          const validatedRow = validateTableRowStructure(node);
          if (validatedRow) {
            processedContent.push(validatedRow);
          }
          continue;
        }

        // Handle tableCell and tableHeader nodes
        if (node.type === "tableCell" || node.type === "tableHeader") {
          const validatedCell = validateTableCellStructure(node);
          if (validatedCell) {
            processedContent.push(validatedCell);
          }
          continue;
        }

        // Handle known node types and validate their content
        if (node.type) {
          // Log node type for debugging
          // console.log('Processing node type:', node.type);
          // Convert "list-item" to "listItem" for compatibility with Tiptap schema
          let processedNode = node;
          if (node.type === "list-item") {
            processedNode = { ...node, type: "listItem" };
          }

          // Handle visual-element nodes
          if (node.type === "visual-element") {
            processedNode = { ...node };
          }

          // Handle callout-block nodes
          if (node.type === "callout-block") {
            processedNode = { ...node };
          }

          // Handle cover-page nodes
          if (node.type === "cover-page") {
            processedNode = { ...node };
          }

          // Handle figure nodes
          if (node.type === "figure") {
            processedNode = { ...node };
          }

          // Handle section nodes
          if (node.type === "section") {
            processedNode = { ...node };
          }

          // Handle list nodes
          if (node.type === "list") {
            processedNode = { ...node };
          }

          // Handle action-list nodes
          if (node.type === "action-list") {
            processedNode = { ...node };
          }

          // Handle column nodes
          if (node.type === "columns" || node.type === "columnItem") {
            processedNode = { ...node };
          }

          // Handle visual-element nodes
          if (node.type === "visual-element") {
            processedNode = { ...node };
          }

          // Handle pricing-table nodes
          if (node.type === "pricing-table") {
            processedNode = { ...node };
          }

          // Handle footnote nodes
          if (node.type === "footnote" || node.type === "footnote-content") {
            processedNode = { ...node };
          }

          // Handle citation nodes
          if (node.type === "citation-block") {
            processedNode = { ...node };
          }

          // Handle AI tag nodes
          if (node.type === "ai-tag") {
            processedNode = { ...node };
          }

          // Handle annotation nodes
          if (node.type === "annotation-block") {
            processedNode = { ...node };
          }

          // Handle author nodes
          if (node.type === "author-block" || node.type === "author") {
            processedNode = { ...node };
          }

          // Handle keywords nodes
          if (node.type === "keywords") {
            processedNode = { ...node };
          }

          // Handle quote-block nodes
          if (node.type === "quote-block") {
            processedNode = { ...node };
          }

          // Handle sidebar-block nodes
          if (node.type === "sidebar-block") {
            processedNode = { ...node };
          }

          // Handle caption nodes
          if (node.type === "caption") {
            processedNode = { ...node };
          }

          // Handle image-placeholder nodes
          if (node.type === "image-placeholder") {
            processedNode = { ...node };
          }

          // Handle presentation-deck nodes
          if (node.type === "presentation-deck") {
            processedNode = { ...node };
          }

          // Validate node content if it exists
          if (Array.isArray(node.content)) {
            const processedNodeContent: any[] = [];
            for (const item of node.content) {
              const processedItem = item;
              if (
                typeof processedItem === "object" &&
                processedItem.type === "text"
              ) {
                // Handle text nodes
                if (
                  processedItem.text === undefined ||
                  processedItem.text === null
                ) {
                  // Skip invalid text nodes
                  continue;
                }
                const textValue = String(processedItem.text);
                if (textValue.length === 0) {
                  // Skip empty text nodes
                  continue;
                }
                processedNodeContent.push({
                  ...processedItem,
                  text: textValue,
                });
              } else if (
                typeof processedItem === "object" &&
                processedItem.type
              ) {
                // Keep valid nodes with defined types
                processedNodeContent.push(processedItem);
              } else if (
                processedItem !== null &&
                processedItem !== undefined
              ) {
                // Convert non-object items to text nodes
                const stringValue = String(processedItem);
                if (stringValue.length > 0) {
                  processedNodeContent.push({
                    type: "text",
                    text: stringValue,
                  });
                }
              }
              // Skip invalid items
            }

            if (
              processedNodeContent.length > 0 ||
              !["text", "paragraph"].includes(node.type)
            ) {
              processedContent.push({
                ...processedNode,
                content: processedNodeContent,
              });
            } else {
              // Nodes without content or with non-array content are kept as-is
              processedContent.push(processedNode);
            }
          } else {
            // Nodes without content or with non-array content are kept as-is
            processedContent.push(processedNode);
          }
        }
      }

      // Ensure we always have at least one paragraph to prevent empty content
      if (processedContent.length === 0) {
        processedContent.push({ type: "paragraph" });
      }

      return {
        ...content,
        content: processedContent,
      };
    } else {
      // Not a valid Tiptap document, convert to one
      const stringifiedContent = JSON.stringify(content);
      // Fix for empty text nodes
      if (stringifiedContent.length === 0) {
        return {
          type: "doc",
          content: [{ type: "paragraph" }], // Consistent representation
        };
      }
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: stringifiedContent }],
          },
        ],
      };
    }
  }

  // Handle array content
  if (Array.isArray(content)) {
    const processedContent: any[] = [];

    for (const item of content) {
      // Skip null or undefined items
      if (item === null || item === undefined) {
        continue;
      }

      // Handle string items
      if (typeof item === "string") {
        if (item.length > 0) {
          processedContent.push({
            type: "paragraph",
            content: [{ type: "text", text: item }],
          });
        }
        continue;
      }

      // Handle object items
      if (typeof item === "object") {
        // If it's already a valid node, keep it
        if (item.type) {
          processedContent.push(item);
        } else {
          // Convert to paragraph with stringified content
          const stringValue = String(JSON.stringify(item));
          if (stringValue.length > 0) {
            processedContent.push({
              type: "paragraph",
              content: [{ type: "text", text: stringValue }],
            });
          }
        }
        continue;
      }

      // Handle other types
      const stringValue = String(item);
      if (stringValue.length > 0) {
        processedContent.push({
          type: "paragraph",
          content: [{ type: "text", text: stringValue }],
        });
      }
    }

    // Ensure we always have at least one paragraph to prevent empty content
    if (processedContent.length === 0) {
      processedContent.push({ type: "paragraph" });
    }

    return {
      type: "doc",
      content: processedContent,
    };
  }

  // Fallback for any other content type
  const stringifiedContent = JSON.stringify(content);
  if (stringifiedContent.length === 0) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }], // Consistent representation
    };
  }
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: stringifiedContent }],
      },
    ],
  };
}

// Helper function to validate table structure
function validateTableStructure(tableNode: any): any {
  if (!tableNode || tableNode.type !== "table") {
    return null;
  }

  // Ensure table has content array
  if (!Array.isArray(tableNode.content)) {
    return {
      ...tableNode,
      content: [],
    };
  }

  // Validate each row in the table
  const validRows = tableNode.content
    .map((row: any) => validateTableRowStructure(row))
    .filter((row: any) => row !== null);

  // Only return table if it has valid rows
  if (validRows.length > 0) {
    return {
      ...tableNode,
      content: validRows,
    };
  }

  // Return null to skip invalid table
  return null;
}

// Helper function to validate table row structure
function validateTableRowStructure(rowNode: any): any {
  if (!rowNode || rowNode.type !== "tableRow") {
    return null;
  }

  // Ensure row has content array
  if (!Array.isArray(rowNode.content)) {
    return {
      ...rowNode,
      content: [],
    };
  }

  // Validate each cell in the row
  const validCells = rowNode.content
    .map((cell: any) => validateTableCellStructure(cell))
    .filter((cell: any) => cell !== null);

  // Only return row if it has valid cells
  if (validCells.length > 0) {
    return {
      ...rowNode,
      content: validCells,
    };
  }

  // Return empty row if no valid cells
  return {
    ...rowNode,
    content: [],
  };
}

// Helper function to validate table cell structure
function validateTableCellStructure(cellNode: any): any {
  if (
    !cellNode ||
    (cellNode.type !== "tableCell" && cellNode.type !== "tableHeader")
  ) {
    return null;
  }

  // Ensure cell has content array or create empty one
  if (!Array.isArray(cellNode.content)) {
    return {
      ...cellNode,
      content: [{ type: "paragraph" }],
    };
  }

  // Validate content within cell
  const validContent = cellNode.content
    .map((item: any) => {
      if (item && typeof item === "object" && item.type === "text") {
        // Handle text nodes
        if (item.text === undefined || item.text === null) {
          return null;
        }
        const textValue = String(item.text);
        if (textValue.length === 0) {
          return null;
        }
        return { ...item, text: textValue };
      } else if (item && typeof item === "object" && item.type) {
        // Keep valid nodes
        return item;
      } else if (item !== null && item !== undefined) {
        // Convert to text node
        const stringValue = String(item);
        if (stringValue.length > 0) {
          return { type: "text", text: stringValue };
        }
      }
      return null;
    })
    .filter((item: any) => item !== null);

  // Ensure cell always has at least one paragraph
  if (validContent.length === 0) {
    return {
      ...cellNode,
      content: [{ type: "paragraph" }],
    };
  }

  return {
    ...cellNode,
    content: validContent,
  };
}

// Function to get document statistics
export function getDocumentStats(content: any): {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
} {
  if (!content || !content.content) {
    return {
      wordCount: 0,
      characterCount: 0,
      paragraphCount: 0,
    };
  }

  let wordCount = 0;
  let characterCount = 0;
  let paragraphCount = 0;

  const traverseContent = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.type === "text" && node.text) {
        // Count words (simple implementation)
        wordCount += node.text
          .trim()
          .split(/\s+/)
          .filter((word: string) => word.length > 0).length;
        characterCount += node.text.length;
      } else if (node.type === "paragraph") {
        paragraphCount++;
      }

      // Traverse children recursively
      if (node.content && Array.isArray(node.content)) {
        traverseContent(node.content);
      }
    });
  };

  traverseContent(content.content);

  return {
    wordCount,
    characterCount,
    paragraphCount,
  };
}

// Function to get editor settings
export async function getEditorSettings(): Promise<any> {
  try {
    const response = await apiClient.get("/api/editor/settings");
    return response.settings;
  } catch (error) {
    console.error("Error fetching editor settings:", error);
    throw error;
  }
}

// Function to update editor settings
export async function updateEditorSettings(settings: any): Promise<any> {
  try {
    const response = await apiClient.put("/api/editor/settings", settings);
    return response.settings;
  } catch (error: any) {
    console.error("Error updating editor settings:", error);

    // Handle 500 errors specifically
    if (error.message && error.message.includes("500")) {
      throw new Error(
        "The editor settings service is temporarily unavailable. Please try again later.",
      );
    }

    throw error;
  }
}

// Function to get editor analytics
export async function getEditorActivity(): Promise<any> {
  try {
    const response = await apiClient.get("/api/editor/analytics");
    return response.data;
  } catch (error) {
    console.error("Error fetching editor analytics:", error);
    throw error;
  }
}

const EditorService = {
  saveProjectContent,
  createDocumentVersion,
  importDocument,
  updateContentNonDisruptively,
  validateAndPrepareContent,
  getDocumentStats,
  getEditorSettings,
  updateEditorSettings,
  getEditorActivity,
};

export default EditorService;
