/**
 * Notion Block → BlockNote Block Mapper
 *
 * Converts Notion's block structure directly to BlockNote-compatible JSON,
 * preserving headings, lists, toggles, code blocks, tables, and nesting.
 *
 * Notion blocks: https://developers.notion.com/reference/block
 * BlockNote blocks: https://www.blocknotejs.org/docs/editor-basics/document-structure
 */

// Helper to generate unique IDs for BlockNote blocks
function generateId(): string {
  return Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

/**
 * Extract plain text from Notion rich_text array
 */
function extractRichText(richText: any[] | undefined): string {
  if (!richText || !Array.isArray(richText)) return "";
  return richText.map((t) => t.plain_text || "").join("");
}

/**
 * Convert Notion rich_text array to BlockNote inline content array.
 * Preserves bold, italic, code, and link formatting.
 */
function richTextToInlineContent(richText: any[] | undefined): any[] {
  if (!richText || !Array.isArray(richText) || richText.length === 0) return [];

  const content: any[] = [];
  for (const item of richText) {
    const text = item.plain_text || "";
    if (!text) continue;

    const marks: any[] = [];

    if (item.annotations) {
      if (item.annotations.bold) marks.push({ type: "bold" });
      if (item.annotations.italic) marks.push({ type: "italic" });
      if (item.annotations.strikethrough) marks.push({ type: "strike" });
      if (item.annotations.underline) marks.push({ type: "underline" });
      if (item.annotations.code) marks.push({ type: "code" });
    }

    if (item.href) {
      marks.push({ type: "link", href: item.href });
    }

    const inlineObj: any = { type: "text", text };
    if (marks.length > 0) inlineObj.marks = marks;
    content.push(inlineObj);
  }

  return content;
}

/**
 * Create a default paragraph block with given text
 */
function makeParagraph(text: string, inlineContent?: any[]): any {
  return {
    id: generateId(),
    type: "paragraph",
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: inlineContent || text,
    children: [],
  };
}

/**
 * Create a heading block
 */
function makeHeading(text: string, level: 1 | 2 | 3, inlineContent?: any[]): any {
  return {
    id: generateId(),
    type: "heading",
    props: { level, textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: inlineContent || text,
    children: [],
  };
}

/**
 * Create a bullet list item
 */
function makeBulletItem(text: string, children: any[] = [], inlineContent?: any[]): any {
  return {
    id: generateId(),
    type: "bulletListItem",
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: inlineContent || text,
    children,
  };
}

/**
 * Create a numbered list item
 */
function makeNumberedItem(text: string, children: any[] = [], inlineContent?: any[]): any {
  return {
    id: generateId(),
    type: "numberedListItem",
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: inlineContent || text,
    children,
  };
}

/**
 * Create a check list item
 */
function makeCheckItem(text: string, checked: boolean = false): any {
  return {
    id: generateId(),
    type: "checkListItem",
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left", checked },
    content: text,
    children: [],
  };
}

/**
 * Create a code block
 */
function makeCodeBlock(text: string, language: string = "plainText"): any {
  return {
    id: generateId(),
    type: "codeBlock",
    props: { language: mapNotionLanguage(language) },
    content: text,
    children: [],
  };
}

/**
 * Create a quote block (styled paragraph)
 */
function makeQuote(text: string): any {
  return {
    id: generateId(),
    type: "paragraph",
    props: { textColor: "default", backgroundColor: "gray", textAlignment: "left" },
    content: text,
    children: [],
  };
}

/**
 * Create a callout block (styled paragraph with emoji prefix)
 */
function makeCallout(text: string, icon?: string): any {
  const displayText = icon ? `${icon} ${text}` : text;
  return {
    id: generateId(),
    type: "paragraph",
    props: { textColor: "default", backgroundColor: "yellow", textAlignment: "left" },
    content: displayText,
    children: [],
  };
}

/**
 * Create a divider block
 */
function makeDivider(): any {
  return {
    id: generateId(),
    type: "paragraph",
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: "─────────────────────────────────────",
    children: [],
  };
}

/**
 * Create an image block
 */
function makeImage(url: string, caption?: string): any {
  return {
    id: generateId(),
    type: "image",
    props: { url, caption: caption || "", previewWidth: 512 },
    content: undefined,
    children: [],
  };
}

/**
 * Create a bookmark/link block
 */
function makeBookmark(url: string, title?: string): any {
  return {
    id: generateId(),
    type: "paragraph",
    props: { textColor: "blue", backgroundColor: "default", textAlignment: "left" },
    content: title || url,
    children: [],
  };
}

/**
 * Map Notion language names to BlockNote-compatible language identifiers
 */
function mapNotionLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    javascript: "typescript",
    typescript: "typescript",
    python: "python",
    java: "java",
    c: "c",
    "c++": "cpp",
    "c#": "csharp",
    go: "go",
    rust: "rust",
    ruby: "ruby",
    php: "php",
    swift: "swift",
    kotlin: "kotlin",
    html: "html",
    css: "css",
    json: "json",
    yaml: "yaml",
    markdown: "markdown",
    bash: "bash",
    shell: "bash",
    sql: "sql",
    graphql: "graphql",
    plaintext: "plainText",
    "plain text": "plainText",
    text: "plainText",
  };
  return langMap[lang?.toLowerCase()] || "plainText";
}

/**
 * Convert a single Notion block to an array of BlockNote blocks.
 * Handles nested children recursively.
 */
export function convertNotionBlock(block: any, childBlocks?: any[]): any {
  if (!block || !block.type) return null;

  const type = block.type;
  const blockData = block[type];
  if (!blockData) return null;

  // Convert children if provided
  const children: any[] = [];
  if (childBlocks && childBlocks.length > 0) {
    for (const child of childBlocks) {
      const converted = convertNotionBlock(child, child._children);
      if (converted) {
        if (Array.isArray(converted)) {
          children.push(...converted);
        } else {
          children.push(converted);
        }
      }
    }
  }

  const inlineContent = richTextToInlineContent(blockData.rich_text);
  const plainText = extractRichText(blockData.rich_text);

  switch (type) {
    // ---- Headings ----
    case "heading_1":
      return makeHeading(plainText, 1, inlineContent);
    case "heading_2":
      return makeHeading(plainText, 2, inlineContent);
    case "heading_3":
      return makeHeading(plainText, 3, inlineContent);

    // ---- Paragraph ----
    case "paragraph":
      return makeParagraph(plainText, inlineContent);

    // ---- Lists ----
    case "bulleted_list_item":
      return makeBulletItem(plainText, children, inlineContent);
    case "numbered_list_item":
      return makeNumberedItem(plainText, children, inlineContent);
    case "to_do":
      return makeCheckItem(plainText, blockData.checked || false);

    // ---- Toggle (collapsible) ----
    case "toggle":
      // Render as a heading with children (closest equivalent in BlockNote)
      return {
        id: generateId(),
        type: "heading",
        props: { level: 2, textColor: "default", backgroundColor: "default", textAlignment: "left" },
        content: `▸ ${plainText}`,
        children,
      };

    // ---- Quote ----
    case "quote":
      return makeQuote(plainText);

    // ---- Callout ----
    case "callout":
      const icon = blockData.icon?.emoji || blockData.icon?.type === "emoji" ? blockData.icon.emoji : "";
      return makeCallout(plainText, icon);

    // ---- Code ----
    case "code":
      return makeCodeBlock(plainText, blockData.language || "plainText");

    // ---- Divider ----
    case "divider":
      return makeDivider();

    // ---- Image ----
    case "image": {
      const imageUrl =
        blockData.type === "external"
          ? blockData.external?.url
          : blockData.file?.url || "";
      const caption = extractRichText(blockData.caption);
      return makeImage(imageUrl, caption);
    }

    // ---- Video ----
    case "video": {
      const videoUrl =
        blockData.type === "external"
          ? blockData.external?.url
          : blockData.file?.url || "";
      return makeParagraph(`[Video: ${videoUrl}]`);
    }

    // ---- File ----
    case "file": {
      const fileUrl =
        blockData.type === "external"
          ? blockData.external?.url
          : blockData.file?.url || "";
      const fileName = blockData.name || "File";
      return makeBookmark(fileUrl, fileName);
    }

    // ---- PDF ----
    case "pdf": {
      const pdfUrl =
        blockData.type === "external"
          ? blockData.external?.url
          : blockData.file?.url || "";
      return makeBookmark(pdfUrl, "PDF Document");
    }

    // ---- Bookmark ----
    case "bookmark":
      return makeBookmark(blockData.url, blockData.caption ? extractRichText(blockData.caption) : undefined);

    // ---- Equation ----
    case "equation":
      return makeCodeBlock(`EQUATION: ${blockData.expression || ""}`, "plainText");

    // ---- Table of Contents ----
    case "table_of_contents":
      return makeParagraph("[Table of Contents]");

    // ---- Breadcrumb ----
    case "breadcrumb":
      return null; // Skip breadcrumbs - they're navigation elements

    // ---- Synced Block ----
    case "synced_block":
      // Synced blocks just wrap other blocks - children are already handled
      return children.length > 0 ? children : null;

    // ---- Child page ----
    case "child_page":
      return makeBookmark(
        `#page-${block.id}`,
        `📄 ${blockData.title || "Untitled Page"}`
      );

    // ---- Child database ----
    case "child_database":
      return makeParagraph(`📊 Database: ${blockData.title || "Untitled Database"}`);

    // ---- Link Preview ----
    case "link_preview":
      return makeBookmark(blockData.url, blockData.url);

    // ---- Table ----
    case "table": {
      // Notion tables have children that are table_row blocks
      // We render each row as a pipe-separated line in a code block for readability
      const rows: string[] = [];
      for (const child of childBlocks || []) {
        if (child.type === "table_row") {
          const cells = (child.table_row?.cells || [])
            .map((cell: any[]) => extractRichText(cell))
            .join(" | ");
          rows.push(`| ${cells} |`);
        }
      }
      if (rows.length > 0) {
        // Add separator after first row (header)
        rows.splice(1, 0, rows[0].replace(/[^\|]/g, "-"));
      }
      return makeCodeBlock(rows.join("\n"), "markdown");
    }

    // ---- Table Row (handled by table) ----
    case "table_row":
      return null; // Handled by parent table

    // ---- Column / Column List ----
    case "column_list":
    case "column":
      // Multi-column layouts → render children sequentially
      return children.length === 1 ? children[0] : children;

    // ---- Link to Page ----
    case "link_to_page":
      return makeBookmark(`#page-${block.id}`, "Linked Page");

    // ---- Template ----
    case "template":
      return null;

    // ---- Unsupported ----
    case "unsupported":
      return makeParagraph("[Unsupported block type]");

    // ---- Fallback ----
    default:
      if (plainText) {
        return makeParagraph(plainText, inlineContent);
      }
      return null;
  }
}

/**
 * Convert an array of Notion blocks (with pre-resolved children) to BlockNote blocks.
 * This is the main entry point for converting a Notion page body.
 *
 * @param notionBlocks - Raw blocks from Notion API with _children attached
 * @returns Array of BlockNote-compatible blocks
 */
export function convertNotionBlocksToBlockNote(notionBlocks: any[]): any[] {
  const result: any[] = [];

  for (const block of notionBlocks) {
    const converted = convertNotionBlock(block, block._children);
    if (converted) {
      if (Array.isArray(converted)) {
        result.push(...converted);
      } else {
        result.push(converted);
      }
    }
  }

  return result;
}
