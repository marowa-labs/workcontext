import logger from "../monitoring/logger";
import * as mammoth from "mammoth";
// Use the server version of generateJSON for Node.js environment
// @ts-ignore
import { generateJSON } from "@tiptap/html/server";

// Import available extensions to preserve more formatting
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";
import { CalloutBlockExtension } from "../extensions/CalloutBlockExtension";
import { QuoteBlockExtension } from "../extensions/QuoteBlockExtension";
import { PricingTableExtension } from "../extensions/PricingTableExtension";
import { VisualElementExtension } from "../extensions/VisualElementExtension";
import { AuthorBlockExtension } from "../extensions/AuthorBlockExtension";
import { AuthorExtension } from "../extensions/AuthorExtension";
import { SectionExtension } from "../extensions/SectionExtension";
import { KeywordsExtension } from "../extensions/KeywordsExtension";
import { CustomCodeBlockExtension } from "../extensions/CustomCodeBlockExtension";
import { FigureExtension } from "../extensions/FigureExtension";
import { ListExtension } from "../extensions/ListExtension";
import { CoverPageExtension } from "../extensions/CoverPageExtension";

// Define the extensions array for reuse with richer formatting support
const tipTapExtensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Underline,
  Strike,
  Code,
  Heading,
  BulletList,
  OrderedList,
  ListItem,
  Blockquote,
  HorizontalRule,
  Link,
  CalloutBlockExtension,
  QuoteBlockExtension,
  PricingTableExtension,
  VisualElementExtension,
  AuthorBlockExtension,
  AuthorExtension,
  SectionExtension,
  KeywordsExtension,
  CustomCodeBlockExtension,
  FigureExtension,
  ListExtension,
  CoverPageExtension,
];

/**
 * Process different file types and extract formatted content
 * @param fileData Base64 encoded file content
 * @param fileType MIME type of the file
 * @returns Promise<{ content: any; wordCount: number }> Extracted formatted content and word count
 */
export async function processFileContent(
  fileData: string,
  fileType: string
): Promise<{ content: any; wordCount: number }> {
  try {
    let content: any = "";
    let wordCount = 0;

    switch (fileType) {
      case "text/plain":
        content = fileData;
        wordCount = content.trim().split(/\s+/).length;
        // Convert plain text to Tiptap JSON format
        content = generateJSON(content, tipTapExtensions);
        break;

      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        // For DOC and DOCX files, convert base64 to buffer and process with mammoth
        const docBuffer = Buffer.from(fileData, "base64");
        if (fileType === "application/msword") {
          // For .doc files, we need to convert them to .docx first or use a different approach
          // For now, we'll just store the base64 content
          content = fileData;
          wordCount = 0; // Will be calculated when opened in editor
          // Return as plain text for .doc files
          content = {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Content from .doc file - formatting preservation not supported for this file type",
                  },
                ],
              },
            ],
          };
        } else {
          // For .docx files, use mammoth to convert to HTML and then to Tiptap JSON
          try {
            const result = await mammoth.convertToHtml({ buffer: docBuffer });
            const htmlContent = result.value;

            // Convert HTML to Tiptap JSON format
            content = generateJSON(htmlContent, tipTapExtensions);

            // Calculate word count from the HTML text content by stripping HTML tags
            const strippedText = htmlContent
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            wordCount = strippedText
              .split(/\s+/)
              .filter((word) => word.length > 0).length;
          } catch (docxError) {
            logger.warn(
              "Failed to process DOCX file with mammoth, storing as base64",
              docxError
            );
            content = fileData;
            wordCount = 0; // Will be calculated when opened in editor
            // Fallback to plain text conversion
            content = {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Content from .docx file - formatting preservation failed during import",
                    },
                  ],
                },
              ],
            };
          }
        }
        break;

      case "application/pdf":
        // For PDF files, convert base64 to buffer and process with pdf-parse
        try {
          logger.debug("Starting PDF processing");
          const pdfBuffer = Buffer.from(fileData, "base64");
          logger.debug("PDF buffer created, length:", pdfBuffer.length);

          // Dynamically import pdf-parse (the correct version)
          // @ts-ignore
          const pdfParse = (await import("pdf-parse")).default;
          logger.debug("pdf-parse imported successfully");

          const pdfData = await pdfParse(pdfBuffer);
          logger.debug(
            "PDF parsed successfully, text length:",
            pdfData.text.length
          );

          const pdfText = pdfData.text;

          // Convert plain text to Tiptap JSON format
          content = generateJSON(pdfText, tipTapExtensions);

          wordCount = pdfText.trim().split(/\s+/).length;
          logger.debug("PDF processing completed successfully");
        } catch (pdfError: any) {
          logger.warn(
            "Failed to process PDF file with pdf-parse, storing as base64",
            {
              error: pdfError.message || pdfError,
              stack: pdfError.stack,
              fileDataLength: fileData?.length || 0,
            }
          );
          content = fileData;
          wordCount = 0; // Will be calculated when opened in editor
          // Fallback to plain text conversion
          content = {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Content from PDF file - text extraction failed during import",
                  },
                ],
              },
            ],
          };
        }
        break;

      default:
        content = fileData;
        wordCount = content.trim().split(/\s+/).length;
        // Convert plain text to Tiptap JSON format
        content = generateJSON(content, tipTapExtensions);
        break;
    }

    return { content, wordCount };
  } catch (error: any) {
    logger.error("Error processing file content:", {
      error: error.message || error,
      stack: error.stack,
      fileType,
    });
    // Return fallback content if processing fails
    return {
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Error processing document content during import",
              },
            ],
          },
        ],
      },
      wordCount: 0,
    };
  }
}

/**
 * Convert base64 string to buffer
 * @param base64String Base64 encoded string
 * @returns Buffer
 */
export function base64ToBuffer(base64String: string): Buffer {
  return Buffer.from(base64String, "base64");
}

/**
 * Convert buffer to base64 string
 * @param buffer Buffer to convert
 * @returns Base64 encoded string
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}
