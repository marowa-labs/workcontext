// @ts-ignore
const pdf = require("pdf-parse");
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

export class PdfService {
  /**
   * Extracts text from a PDF buffer.
   * @param buffer The PDF file buffer.
   * @returns The extracted text content.
   */
  static async extractText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Failed to parse PDF document");
    }
  }

  /**
   * Splits text into manageable chunks for embeddings.
   * @param text The full text content.
   * @param metadata Optional metadata to attach to each chunk.
   * @returns Array of Document objects.
   */
  static async chunkText(
    text: string,
    metadata: Record<string, any> = {},
  ): Promise<Document[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([text], [metadata]);
    return docs;
  }
}
