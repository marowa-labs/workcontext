// Helper functions for exporting documents with formatting preserved

import PDFDocument from "pdfkit";
import https from "https";
import http from "http";
import { URL } from "url";

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface ContentBlock {
  type:
    | "heading"
    | "paragraph"
    | "listItem"
    | "codeBlock"
    | "blockquote"
    | "image"
    | "columns"
    | "horizontalRule"
    | "table";
  level?: number;
  runs: TextRun[];
  listOrdered?: boolean;
  tableRows?: TableRow[];
  imageSrc?: string;
  imageAlt?: string;
  columnBlocks?: ContentBlock[][];
}

interface TableRow {
  cells: TextRun[][];
}

export function extractStructuredContent(content: any): ContentBlock[] {
  if (!content) return [];
  if (typeof content === "string") {
    return content.trim()
      ? [{ type: "paragraph", runs: [{ text: content }] }]
      : [];
  }
  if (content && typeof content === "object") {
    return extractBlocksFromProseMirror(content);
  }
  return [{ type: "paragraph", runs: [{ text: String(content) }] }];
}

function extractBlocksFromProseMirror(node: any): ContentBlock[] {
  if (!node) return [];
  const blocks: ContentBlock[] = [];
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      const block = extractBlockFromNode(child);
      if (block) blocks.push(block);
    }
  }
  return blocks;
}

function extractBlockFromNode(node: any): ContentBlock | null {
  if (!node) return null;

  switch (node.type) {
    case "heading":
      return {
        type: "heading",
        level: node.attrs?.level || 1,
        runs: extractRunsFromContent(node.content),
      };

    case "paragraph":
      return { type: "paragraph", runs: extractRunsFromContent(node.content) };

    case "codeBlock":
    case "code-block":
      return { type: "codeBlock", runs: extractRunsFromContent(node.content) };

    case "blockquote":
    case "quote-block":
      return { type: "blockquote", runs: extractRunsFromContent(node.content) };

    case "bulletList":
    case "orderedList":
    case "list": {
      const items: string[] = [];
      if (Array.isArray(node.content)) {
        for (const item of node.content) {
          const itemText = flattenText(item.content);
          if (itemText.trim()) items.push(itemText);
        }
      }
      if (items.length === 0) return null;
      return {
        type: "paragraph",
        runs: [
          {
            text: items
              .map(
                (item, i) =>
                  `${node.type === "orderedList" ? `${i + 1}. ` : "• "}${item}`,
              )
              .join("\n"),
          },
        ],
      };
    }

    case "taskList": {
      const items: string[] = [];
      if (Array.isArray(node.content)) {
        for (const item of node.content) {
          const checked = item.attrs?.checked ? "☑" : "☐";
          const itemText = flattenText(item.content);
          if (itemText.trim()) items.push(`${checked} ${itemText}`);
        }
      }
      if (items.length === 0) return null;
      return {
        type: "paragraph",
        runs: [{ text: items.join("\n") }],
      };
    }

    case "table": {
      const rows: TableRow[] = [];
      if (Array.isArray(node.content)) {
        for (const rowNode of node.content) {
          if (rowNode.type === "tableRow") {
            const cells: TextRun[][] = [];
            if (Array.isArray(rowNode.content)) {
              for (const cellNode of rowNode.content) {
                if (
                  cellNode.type === "tableCell" ||
                  cellNode.type === "tableHeader"
                ) {
                  const cellRuns = extractRunsFromContent(cellNode.content);
                  cells.push(cellRuns.length > 0 ? cellRuns : [{ text: "" }]);
                }
              }
            }
            if (cells.length > 0) rows.push({ cells });
          }
        }
      }
      if (rows.length === 0) return null;
      return { type: "table", runs: [], tableRows: rows };
    }

    case "pricing-table": {
      const rows: TableRow[] = [];
      if (Array.isArray(node.content)) {
        for (const rowNode of node.content) {
          if (rowNode.type === "tableRow" || rowNode.content) {
            const cells: TextRun[][] = [];
            const cellContent = Array.isArray(rowNode.content)
              ? rowNode.content
              : [rowNode];
            for (const cellNode of cellContent) {
              const cellRuns = extractRunsFromContent(
                cellNode.content || [cellNode],
              );
              cells.push(cellRuns.length > 0 ? cellRuns : [{ text: "" }]);
            }
            if (cells.length > 0) rows.push({ cells });
          }
        }
      }
      if (rows.length === 0) return null;
      return { type: "table", runs: [], tableRows: rows };
    }

    case "image":
    case "image-placeholder":
    case "resizableImage":
      return {
        type: "image",
        runs: [],
        imageSrc: node.attrs?.src || "",
        imageAlt: node.attrs?.alt || "image",
      };

    case "columns":
    case "columnBlock": {
      const columnBlocks: ContentBlock[][] = [];
      if (Array.isArray(node.content)) {
        for (const columnNode of node.content) {
          if (
            columnNode.type === "column" ||
            columnNode.type === "columnItem"
          ) {
            const colBlocks = extractBlocksFromProseMirror(columnNode);
            if (colBlocks.length > 0) columnBlocks.push(colBlocks);
          }
        }
      }
      if (columnBlocks.length === 0) return null;
      return { type: "columns", runs: [], columnBlocks };
    }

    case "horizontalRule":
      return { type: "horizontalRule", runs: [{ text: "---" }] };

    case "text":
      return { type: "paragraph", runs: extractMarksFromText(node) };

    // Inline atom nodes — represented inline in the document but extracted
    // here in case they appear as standalone blocks (unlikely but defensive).
    case "math":
      return {
        type: "paragraph",
        runs: [
          {
            text: node.attrs?.latex
              ? `$${node.attrs.latex}$`
              : "[math formula]",
          },
        ],
      };

    case "footnote":
      return {
        type: "paragraph",
        runs: [{ text: node.attrs?.label ? `[fn:${node.attrs.label}]` : "[footnote]" }],
      };

    case "citation-chip":
      return {
        type: "paragraph",
        runs: [{ text: node.attrs?.citationText || "[citation]" }],
      };

    case "ai-tag":
      return {
        type: "paragraph",
        runs: [{ text: "[AI-generated content]" }],
      };

    // Container nodes — extract child blocks recursively
    case "section":
    case "figure":
    case "callout-block":
    case "cover-page":
    case "sidebar-block":
    case "presentation-deck":
    case "annotation-block":
    case "visual-element":
    case "author-block":
    case "author":
    case "footnoteContent":
    case "caption": {
      const childBlocks = extractBlocksFromProseMirror(node);
      if (childBlocks.length === 0) return null;
      // Flatten single-child containers
      if (childBlocks.length === 1) return childBlocks[0];
      // Multi-child: wrap as paragraph with joined text
      return {
        type: "paragraph",
        runs: [
          {
            text: childBlocks
              .map((b) => b.runs.map((r) => r.text).join(""))
              .filter(Boolean)
              .join(" "),
          },
        ],
      };
    }

    case "keywords":
    case "citation-block":
      return {
        type: "paragraph",
        runs: extractRunsFromContent(node.content),
      };

    default:
      if (Array.isArray(node.content)) {
        // First try direct runs (inline content)
        const runs = extractRunsFromContent(node.content);
        if (runs.length > 0) {
          return { type: "paragraph", runs };
        }
        // No direct inline content → recursively extract child blocks.
        // This handles unknown container nodes generically.
        const childBlocks = extractBlocksFromProseMirror(node);
        if (childBlocks.length > 0) {
          if (childBlocks.length === 1) return childBlocks[0];
          return {
            type: "paragraph",
            runs: [
              {
                text: childBlocks
                  .map((b) => b.runs.map((r) => r.text).join(""))
                  .filter(Boolean)
                  .join(" "),
              },
            ],
          };
        }
      }
      return null;
  }
}

// Flatten nested ProseMirror content into a single string (for lists).
function flattenText(content: any[]): string {
  if (!Array.isArray(content)) return "";
  let result = "";
  for (const node of content) {
    if (node.type === "text") {
      result += node.text || "";
    } else if (node.type === "hardBreak") {
      result += "\n";
    } else if (node.type === "math") {
      result += node.attrs?.latex ? `$${node.attrs.latex}$` : "[math]";
    } else if (node.type === "footnote") {
      result += node.attrs?.label ? `[fn:${node.attrs.label}]` : "[footnote]";
    } else if (node.type === "citation-chip") {
      result += node.attrs?.label || "[citation]";
    } else if (node.type === "ai-tag") {
      result += " ";
    } else if (Array.isArray(node.content)) {
      result += flattenText(node.content);
    }
  }
  return result;
}

function extractRunsFromContent(content: any[]): TextRun[] {
  if (!Array.isArray(content)) return [];
  const runs: TextRun[] = [];
  for (const node of content) {
    if (node.type === "text") {
      const run: TextRun = { text: node.text || "" };
      if (Array.isArray(node.marks)) {
        for (const mark of node.marks) {
          if (mark.type === "bold") run.bold = true;
          if (mark.type === "italic") run.italic = true;
          if (mark.type === "underline") run.underline = true;
          if (mark.type === "strike") run.strikethrough = true;
          if (mark.type === "code") run.code = true;
        }
      }
      runs.push(run);
    } else if (node.type === "hardBreak") {
      runs.push({ text: "\n" });
    } else if (node.type === "math") {
      runs.push({
        text: node.attrs?.latex ? `$${node.attrs.latex}$` : "[math]",
      });
    } else if (node.type === "footnote") {
      runs.push({
        text: node.attrs?.label ? `[fn:${node.attrs.label}]` : "[footnote]",
      });
    } else if (node.type === "citation-chip") {
      runs.push({ text: node.attrs?.label || "[citation]" });
    } else if (node.type === "ai-tag") {
      runs.push({ text: "" });
    } else if (Array.isArray(node.content)) {
      runs.push(...extractRunsFromContent(node.content));
    }
  }
  return runs;
}

function extractMarksFromText(node: any): TextRun[] {
  const run: TextRun = { text: node.text || "" };
  if (Array.isArray(node.marks)) {
    for (const mark of node.marks) {
      if (mark.type === "bold") run.bold = true;
      if (mark.type === "italic") run.italic = true;
      if (mark.type === "underline") run.underline = true;
      if (mark.type === "strike") run.strikethrough = true;
      if (mark.type === "code") run.code = true;
    }
  }
  return run.text ? [run] : [];
}

// Download or decode an image URL into a Buffer.
// Handles data URIs, https, and http URLs. Returns null on failure.
async function downloadImage(src: string): Promise<{ buffer: Buffer; ext: string } | null> {
  try {
    if (src.startsWith("data:")) {
      const match = src.match(/^data:image\/(\w+);base64,(.+)$/);
      if (match) {
        return { buffer: Buffer.from(match[2], "base64"), ext: match[1] };
      }
      return null;
    }

    const url = new URL(src);
    const mod = url.protocol === "https:" ? https : http;

    return new Promise((resolve) => {
      mod
        .get(url, (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (ch: Buffer) => chunks.push(ch));
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const buffer = Buffer.concat(chunks);
              const ct = res.headers["content-type"] || "";
              const ext = ct.includes("png") ? "png" : ct.includes("jpeg") || ct.includes("jpg") ? "jpeg" : "png";
              resolve({ buffer, ext });
            } else {
              resolve(null);
            }
          });
        })
        .on("error", () => resolve(null));
    });
  } catch {
    return null;
  }
}

export async function generateDocx(
  title: string,
  blocks: ContentBlock[],
): Promise<Buffer> {
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
  } = docx;

  const children: any[] = [];

  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  );

  for (const block of blocks) {
    if (block.type === "table" && block.tableRows) {
      const tableRows: any[] = [];
      for (const row of block.tableRows) {
        const cells: any[] = [];
        for (const cellRuns of row.cells) {
          const cellText = cellRuns.map((r) => r.text).join("");
          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      bold: cellRuns[0]?.bold,
                      size: 24, // 12pt
                    }),
                  ],
                }),
              ],
              width: {
                size: Math.floor(9000 / row.cells.length),
                type: WidthType.DXA,
              },
            }),
          );
        }
        tableRows.push(new TableRow({ children: cells }));
      }
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            insideHorizontal: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "CCCCCC",
            },
            insideVertical: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "CCCCCC",
            },
          },
        }),
      );
      children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      continue;
    }

    if (block.type === "image") {
      const img = block.imageSrc ? await downloadImage(block.imageSrc) : null;
      if (img) {
        children.push(
          new Paragraph({
            children: [
              new docx.ImageRun({
                data: img.buffer,
                transformation: { width: 400, height: 300 },
                type: img.ext === "jpeg" ? "jpg" : "png",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
          }),
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[Image: ${block.imageAlt || "image"}]`,
                italics: true,
                color: "666666",
              }),
            ],
            spacing: { before: 100, after: 100 },
            alignment: AlignmentType.CENTER,
          }),
        );
      }
      continue;
    }

    if (block.type === "columns" && block.columnBlocks) {
      for (let i = 0; i < block.columnBlocks.length; i++) {
        const colBlocks = block.columnBlocks[i];
        for (const colBlock of colBlocks) {
          children.push(
            new Paragraph({
              children:
                colBlock.runs.length > 0
                  ? colBlock.runs.map(
                      (run) =>
                        new TextRun({
                          text: run.text,
                          bold: run.bold,
                          italics: run.italic,
                          size: 24, // 12pt
                        }),
                    )
                  : [new TextRun({ text: "" })],
              spacing: { before: 60, after: 60 },
            }),
          );
        }
      }
      continue;
    }

    if (block.type === "heading" && block.level) {
      const headingMap: Record<number, any> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };

      // Determine font size based on heading level
      // Heading 1: Title or top section, 14pt+ (28+)
      // Heading 2: 14pt (28)
      // Heading 3+: Smaller (e.g., 14 - (level-2)*2)

      let size = 28; // Default to 14pt for H2
      if (block.level === 1)
        size = 32; // 16pt for H1
      else if (block.level > 2) size = Math.max(24, 28 - (block.level - 2) * 2);

      children.push(
        new Paragraph({
          heading: headingMap[block.level] || HeadingLevel.HEADING_1,
          children: block.runs.map(
            (run) =>
              new TextRun({
                text: run.text,
                bold: run.bold,
                italics: run.italic,
                strike: run.strikethrough,
                size: size,
              }),
          ),
          spacing: { before: 200, after: 100 },
        }),
      );
    } else if (block.type === "codeBlock") {
      children.push(
        new Paragraph({
          children: block.runs.map(
            (run) =>
              new TextRun({ text: run.text, font: "Courier New", size: 24 }),
          ),
          spacing: { before: 100, after: 100 },
          shading: { type: "clear", color: "auto", fill: "F0F0F0" },
        }),
      );
    } else {
      const isEmpty =
        block.runs.length === 0 || block.runs.every((r) => !r.text);
      children.push(
        new Paragraph({
          children: isEmpty
            ? [new TextRun({ text: "" })]
            : block.runs.map(
                (run) =>
                  new TextRun({
                    text: run.text,
                    bold: run.bold,
                    italics: run.italic,
                    strike: run.strikethrough,
                    font: run.code ? "Courier New" : undefined,
                    size: 24, // 12pt
                  }),
              ),
          spacing: { before: 60, after: 60 },
          indent:
            block.type === "blockquote"
              ? { left: 720 }
              : block.type === "listItem"
                ? { left: 720, hanging: 360 }
                : undefined,
          border:
            block.type === "blockquote"
              ? { left: { style: "single", size: 6, color: "CCCCCC" } }
              : undefined,
        }),
      );
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

function pickFont(run: TextRun): string {
  if (run.bold && run.italic) return "Helvetica-BoldOblique";
  if (run.bold) return "Helvetica-Bold";
  if (run.italic) return "Helvetica-Oblique";
  return "Helvetica";
}

export async function generatePdf(
  title: string,
  blocks: ContentBlock[],
): Promise<Buffer> {
  // Pre-download all images in parallel before the synchronous PDF loop.
  const imageCache = new Map<string, { buffer: Buffer; ext: string }>();
  await Promise.all(
    blocks
      .filter((b) => b.type === "image" && !!b.imageSrc)
      .map(async (b) => {
        if (!b.imageSrc) return;
        const cached = imageCache.get(b.imageSrc);
        if (cached) return;
        const img = await downloadImage(b.imageSrc);
        if (img) imageCache.set(b.imageSrc, img);
      }),
  );

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 72,
        size: "A4",
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Title
      doc.fontSize(24).font("Helvetica-Bold").text(title, { align: "center" });
      doc.moveDown(2);

      for (const block of blocks) {
        // ── Table ──
        if (block.type === "table" && block.tableRows) {
          const marginL = doc.page.margins.left;
          const tableWidth =
            doc.page.width - marginL - doc.page.margins.right;
          const rowH = 20;
          const numCols = block.tableRows[0]?.cells.length || 1;
          const colW = tableWidth / numCols;
          const startY = doc.y;

          // Check if table fits; if not, new page
          const tableH = block.tableRows.length * rowH;
          if (startY + tableH > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
          }

          let curY = Math.max(startY, doc.y);
          for (const row of block.tableRows) {
            for (let c = 0; c < row.cells.length; c++) {
              const cellX = marginL + c * colW;
              doc.rect(cellX, curY, colW, rowH).stroke("#CCCCCC");
              const cellText = row.cells[c].map((r) => r.text).join("");
              if (cellText) {
                doc
                  .fontSize(10)
                  .font("Helvetica")
                  .text(cellText, cellX + 4, curY + 4, {
                    width: colW - 8,
                    height: rowH - 8,
                    ellipsis: true,
                  });
              }
            }
            curY += rowH;
          }
          doc.y = curY + 10;
          continue;
        }

        // ── Image ──
        if (block.type === "image") {
          const img = block.imageSrc ? imageCache.get(block.imageSrc) : null;
          if (img) {
            const maxW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const maxH = 400;
            try {
              doc.image(img.buffer, {
                fit: [maxW, maxH],
                align: "center",
                valign: "center",
              });
              doc.moveDown(0.5);
            } catch {
              doc
                .fontSize(11)
                .font("Helvetica-Oblique")
                .text(`[Image: ${block.imageAlt || "image"}]`, { align: "center" });
              doc.moveDown(1);
            }
          } else {
            doc
              .fontSize(11)
              .font("Helvetica-Oblique")
              .text(`[Image: ${block.imageAlt || "image"}]`, { align: "center" });
            doc.moveDown(1);
          }
          continue;
        }

        // ── Columns (render as sequential blocks) ──
        if (block.type === "columns" && block.columnBlocks) {
          for (const colBlocks of block.columnBlocks) {
            for (const colBlock of colBlocks) {
              const t = colBlock.runs.map((r) => r.text).join("");
              if (t.trim()) {
                doc.fontSize(11).font("Helvetica").text(t, { indent: 10 });
              }
            }
          }
          doc.moveDown(1);
          continue;
        }

        // ── Heading ──
        if (block.type === "heading" && block.level) {
          // Ensure heading doesn't orphan at bottom of page
          if (doc.y > doc.page.height - doc.page.margins.bottom - 60) {
            doc.addPage();
          }
          const size = Math.max(14, 22 - block.level * 2);
          doc.fontSize(size).font("Helvetica-Bold");
          doc.text(block.runs.map((r) => r.text).join(""), {
            lineGap: 4,
          });
          doc.moveDown(0.5);
          continue;
        }

        // ── Code block ──
        if (block.type === "codeBlock") {
          doc.fontSize(10).font("Courier");
          for (const run of block.runs) {
            doc.text(run.text, { indent: 10 });
          }
          doc.moveDown(0.5);
          continue;
        }

        // ── Everything else (paragraph, blockquote, listItem) ──
        const text = block.runs.map((r) => r.text).join("");
        if (!text.trim()) {
          doc.moveDown(0.3);
          continue;
        }

        const hasFormatting = block.runs.some(
          (r) => r.bold || r.italic || r.underline || r.strikethrough,
        );

        if (!hasFormatting || block.type === "blockquote") {
          doc.fontSize(11).font("Helvetica");
          if (block.type === "blockquote") {
            doc.text(text, { indent: 30, lineGap: 2 });
          } else {
            doc.text(text, { lineGap: 2, align: "justify" });
          }
        } else {
          // Rich-text paragraph: use continued:true so PDFKit handles
          // wrapping and keeps its internal cursor in sync.
          doc.fontSize(11);
          for (let i = 0; i < block.runs.length; i++) {
            const run = block.runs[i];
            const isLast = i === block.runs.length - 1;
            doc.font(pickFont(run));
            doc.text(run.text, {
              continued: !isLast,
              lineGap: 2,
              align: "justify",
            });
          }
        }
        doc.moveDown(0.3);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateTxt(title: string, blocks: ContentBlock[]): string {
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");

  for (const block of blocks) {
    if (block.type === "table" && block.tableRows) {
      for (let i = 0; i < block.tableRows.length; i++) {
        const row = block.tableRows[i];
        const cells = row.cells.map((cell) =>
          cell
            .map((r) => r.text)
            .join("")
            .trim(),
        );
        lines.push(`| ${cells.join(" | ")} |`);
        if (i === 0) lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
      }
      lines.push("");
      continue;
    }

    if (block.type === "image") {
      lines.push(`![${block.imageAlt || "image"}](${block.imageSrc || ""})`);
      lines.push("");
      continue;
    }

    if (block.type === "columns" && block.columnBlocks) {
      for (const colBlocks of block.columnBlocks) {
        for (const colBlock of colBlocks) {
          const text = colBlock.runs.map((r) => r.text).join("");
          if (text.trim()) lines.push(text);
        }
        lines.push("---");
      }
      lines.push("");
      continue;
    }

    if (block.type === "heading" && block.level) {
      const prefix = "#".repeat(Math.min(block.level + 1, 6));
      lines.push(`${prefix} ${block.runs.map((r) => r.text).join("")}`);
      lines.push("");
    } else if (block.type === "codeBlock") {
      lines.push("```");
      for (const run of block.runs) lines.push(run.text);
      lines.push("```");
      lines.push("");
    } else {
      const text = block.runs.map((r) => r.text).join("");
      if (block.type === "blockquote") lines.push(`> ${text}`);
      else if (block.type === "listItem") lines.push(`• ${text}`);
      else lines.push(text);
      lines.push("");
    }
  }

  return lines.join("\n");
}
