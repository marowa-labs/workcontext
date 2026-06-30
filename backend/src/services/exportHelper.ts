// Helper functions for exporting documents with formatting preserved

import PDFDocument from "pdfkit";

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
      return { type: "codeBlock", runs: extractRunsFromContent(node.content) };

    case "blockquote":
      return { type: "blockquote", runs: extractRunsFromContent(node.content) };

    case "bulletList":
    case "orderedList":
    case "taskList": {
      const items: string[] = [];
      if (Array.isArray(node.content)) {
        for (const item of node.content) {
          const itemContent = extractRunsFromContent(item.content);
          const itemText = itemContent.map((r) => r.text).join("");
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

    case "image":
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

    default:
      if (Array.isArray(node.content)) {
        return {
          type: "paragraph",
          runs: extractRunsFromContent(node.content),
        };
      }
      return null;
  }
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
                      size: 20,
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
                          size: 20,
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
              new TextRun({ text: run.text, font: "Courier New", size: 20 }),
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
                    size: 20,
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

export function generatePdf(
  title: string,
  blocks: ContentBlock[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 72 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(24).font("Helvetica-Bold").text(title, { align: "center" });
      doc.moveDown(2);

      for (const block of blocks) {
        if (block.type === "table" && block.tableRows) {
          const startX = doc.page.margins.left;
          const tableWidth =
            doc.page.width - doc.page.margins.left - doc.page.margins.right;
          const rowHeight = 20;
          const numCols = block.tableRows[0]?.cells.length;
          const colWidth = tableWidth / numCols;
          let tableY = doc.y;

          for (const row of block.tableRows) {
            for (let c = 0; c < row.cells.length; c++) {
              const cellX = startX + c * colWidth;
              doc.rect(cellX, tableY, colWidth, rowHeight).stroke("#CCCCCC");
              const cellText = row.cells[c].map((r) => r.text).join("");
              if (cellText) {
                doc
                  .fontSize(10)
                  .font("Helvetica")
                  .text(cellText, cellX + 4, tableY + 4, {
                    width: colWidth - 8,
                    height: rowHeight - 8,
                    ellipsis: true,
                  });
              }
            }
            tableY += rowHeight;
          }
          doc.y = tableY + 10;
          continue;
        }

        if (block.type === "image") {
          doc
            .fontSize(10)
            .font("Helvetica-Oblique")
            .text(`[Image: ${block.imageAlt || "image"}]`, { align: "center" });
          doc.moveDown(1);
          continue;
        }

        if (block.type === "columns" && block.columnBlocks) {
          for (const colBlocks of block.columnBlocks) {
            for (const colBlock of colBlocks) {
              const text = colBlock.runs.map((r) => r.text).join("");
              if (text.trim()) {
                doc.fontSize(10).font("Helvetica").text(text);
              }
            }
          }
          doc.moveDown(1);
          continue;
        }

        if (block.type === "heading" && block.level) {
          const size = Math.max(12, 22 - (block.level - 1) * 2);
          doc.fontSize(size).font("Helvetica-Bold");
          doc.text(block.runs.map((r) => r.text).join(""), {
            continued: false,
          });
          doc.moveDown(0.5);
        } else if (block.type === "codeBlock") {
          doc.fontSize(10).font("Courier");
          for (const run of block.runs) doc.text(run.text);
          doc.moveDown(0.5);
        } else {
          const text = block.runs.map((r) => r.text).join("");
          if (!text.trim()) {
            doc.moveDown(0.3);
            continue;
          }

          const hasFormatting = block.runs.some(
            (r) => r.bold || r.italic || r.underline || r.strikethrough,
          );
          if (!hasFormatting) {
            doc.fontSize(12).font("Helvetica");
            if (block.type === "blockquote") doc.text(text, { indent: 30 });
            else if (block.type === "listItem") doc.text(text, { indent: 20 });
            else doc.text(text);
          } else {
            doc.fontSize(12);
            let posY = doc.y;
            let posX = doc.page.margins.left;
            const maxWidth = doc.page.width - doc.page.margins.right;
            for (const run of block.runs) {
              const font = run.bold
                ? run.italic
                  ? "Helvetica-BoldOblique"
                  : "Helvetica-Bold"
                : run.italic
                  ? "Helvetica-Oblique"
                  : "Helvetica";
              doc.font(font);
              const textWidth = doc.widthOfString(run.text);
              if (posX + textWidth > maxWidth) {
                posX = doc.page.margins.left;
                posY += 14;
              }
              doc.text(run.text, posX, posY, { lineBreak: false });
              posX += textWidth;
            }
            doc.y = posY + 18;
          }
          doc.moveDown(0.3);
        }
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
