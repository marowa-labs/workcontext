import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { prisma } from "../lib/prisma";
import { SecretsService } from "./secrets-service";

export class VectorStoreService {
  /**
   * Stores documents in the vector store using direct Prisma inserts.
   * @param documents The documents to store.
   */
  static async storeDocuments(documents: Document[]): Promise<void> {
    const apiKey = await SecretsService.getOpenAiApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
    });

    console.log(`Storing ${documents.length} documents...`);

    for (const doc of documents) {
      try {
        // Generate embedding for the document
        console.log("Generating embedding for document...");
        const embedding = await embeddings.embedQuery(doc.pageContent);
        console.log("Embedding generated, length:", embedding.length);

        // Insert directly using Prisma raw SQL to insert into documents table
        console.log("Inserting into database...");
        await prisma.$executeRawUnsafe(
          `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)`,
          doc.pageContent,
          JSON.stringify(doc.metadata),
          `[${embedding.join(",")}]`, // Convert array to PostgreSQL vector format
        );
        console.log("Document inserted successfully");
      } catch (error) {
        console.error("Error storing document:", error);
        throw error;
      }
    }

    console.log("All documents stored successfully");
  }

  /**
   * Searches for similar documents based on a query.
   * @param query The search query.
   * @param filter Optional metadata filter.
   * @returns Array of matching documents with scores.
   */
  static async search(
    query: string,
    filter?: any,
    k: number = 5,
  ): Promise<Document[]> {
    const apiKey = await SecretsService.getOpenAiApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: "text-embedding-3-small", // Ensure consistent model
    });

    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(query);
    const vectorString = `[${queryEmbedding.join(",")}]`;

    // Construct metadata filter query if filter is provided
    let results: any[];

    if (filter) {
      // Use metadata filtering
      // Note: We're using raw SQL for pgvector similarity search with metadata filter
      // The <=> operator is cosine distance, so 1 - (a <=> b) is cosine similarity
      // We explicitly cast the metadata column and filter to jsonb for the @> operator
      results = await prisma.$queryRawUnsafe(
        `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
         FROM documents
         WHERE 1 - (embedding <=> $1::vector) > 0.5
         AND metadata @> $2::jsonb
         ORDER BY similarity DESC
         LIMIT $3`,
        vectorString,
        JSON.stringify(filter),
        k,
      );
    } else {
      // No filter, simple similarity search
      results = await prisma.$queryRawUnsafe(
        `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
         FROM documents
         WHERE 1 - (embedding <=> $1::vector) > 0.5
         ORDER BY similarity DESC
         LIMIT $2`,
        vectorString,
        k,
      );
    }

    // Convert results to Document format
    return results.map(
      (row) =>
        new Document({
          pageContent: row.content,
          metadata: row.metadata,
        }),
    );
  }

  /**
   * Generates an embedding for a given text.
   * Centralized method to ensure consistency and single configuration.
   * @param text The text to generate an embedding for.
   * @returns The embedding vector.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = await SecretsService.getOpenAiApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: "text-embedding-3-small", // Explicitly set model for consistency
    });

    return await embeddings.embedQuery(text);
  }
}
