import { PaperDiscoveryService } from "./paperDiscoveryService";
import { multiAIService } from "./MultiAIService";
import { ProjectServiceEnhanced } from "./projectServiceEnhanced";
import logger from "../monitoring/logger";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class ChatWithPapersService {
  /**
   * Chat with a selection of papers using RAG (Retrieval-Augmented Generation)
   * For the MVP, we use the Abstract as the "retrieved" content.
   */
  static async chat(
    query: string,
    paperIds: string[],
    history: ChatMessage[] = [],
    projectId?: string,
    model?: string,
  ): Promise<string> {
    try {
      const start = Date.now();

      // 1. Retrieve Context (Abstracts & Project Content)
      const context = await this.buildContext(paperIds, projectId);

      if (!context) {
        return "I couldn't find any information on these papers. They might be missing abstracts.";
      }

      // 2. Build the System Prompt with Context
      const systemPrompt = `You are an advanced research assistant and co-author. 
      
      CONTEXT:
      ${context}
      
      INSTRUCTIONS:
      - Answer the user's question comprehensively.
      - PRIORITY: Use the provided CONTEXT (papers and project content) first. Cite papers by title (e.g., "According to...") when using them.
      - SECONDARY: If the context doesn't fully answer the question, or if the user asks for general assistance, creative writing, or explanation, USE YOUR OWN GENERAL KNOWLEDGE and reasoning.
      - You are NOT limited to only the provided papers, but you should prioritize them for factual claims.
      - If you use general knowledge, you don't need to cite it, but distinguish it if necessary.
      - Be helpful, academic yet conversational, and ready to assist with writing, editing, or explaining complex topics.
      `;

      // 3. Serialize History and Call Multi-AI Service
      // Convert history to a dialog string for the prompt (simplest portable format)
      const historyStr = history
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      const finalPrompt = `${systemPrompt}\n\n--- CHAT HISTORY ---\n${historyStr}\n\nUSER: ${query}\n\nASSISTANT:`;

      const result = await multiAIService.generateContent(finalPrompt, model);
      const response = result.content;

      logger.info("RAG Chat completed", {
        papers: paperIds.length,
        queryLength: query.length,
        responseLength: response.length,
        duration: Date.now() - start,
      });

      return response;
    } catch (error) {
      logger.error("Error in ChatWithPapersService:", error);
      throw new Error("Failed to generate chat response");
    }
  }

  /**
   * Fetch abstracts and project content for the prompt
   */
  private static async buildContext(
    paperIds: string[],
    projectId?: string,
  ): Promise<string> {
    let contextParts: string[] = [];
    const { prisma } = require("../lib/prisma");

    // 0. Fetch Project Content if projectId is provided
    if (projectId) {
      try {
        // We use a simplified fetch or assume we can access the latest version
        // Ideally we use ProjectServiceEnhanced.getProjectById but we need to extract text from JSON content
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { title: true, content: true },
        });

        if (project && project.content) {
          // Rudimentary text extraction from Tiptap JSON
          let projectText = "";
          try {
            const contentObj =
              typeof project.content === "string"
                ? JSON.parse(project.content)
                : project.content;
            projectText = JSON.stringify(contentObj); // Fallback: just dump JSON if traversal is complex
            // A better extraction would traverse the nodes, but JSON dump is readable enough for LLM
          } catch (e) {
            projectText = String(project.content);
          }

          contextParts.push(
            `CURRENT PROJECT: "${project.title}"\nCONTENT:\n${projectText.substring(0, 5000)}...\n---`,
          );
        }
      } catch (e) {
        logger.warn(`Failed to fetch project context for ${projectId}`, e);
      }
    }

    // Parallel fetch for speed
    await Promise.all(
      paperIds.map(async (id) => {
        try {
          // 1. Try fetching from Local Citation (Prisma)
          // We assume if it's a UUID, it might be a local citation
          const localCitation = await prisma.citation.findUnique({
            where: { id: id },
          });

          if (localCitation) {
            const content =
              localCitation.abstract ||
              localCitation.notes ||
              (localCitation.metadata as any)?.tldr ||
              "[No abstract available]";

            contextParts.push(
              `PAPER: "${localCitation.title}" (${localCitation.year || "N.d."})\nSOURCE: ${localCitation.type}\nCONTENT: ${content}\n---`,
            );
            return;
          }

          // 2. Fallback to External Paper Discovery (Semantic Scholar/etc)
          // Only if it doesn't look like a local UUID or wasn't found
          const paper = await PaperDiscoveryService.getPaperDetails(id);
          if (paper && paper.abstract) {
            contextParts.push(
              `PAPER: "${paper.title}" (${paper.year})\nABSTRACT: ${paper.abstract}\n---`,
            );
          } else if (paper) {
            contextParts.push(
              `PAPER: "${paper.title}" (${paper.year})\nABSTRACT: [No abstract available]\n---`,
            );
          }
        } catch (e) {
          logger.warn(`Failed to fetch paper context for ${id}`, e);
        }
      }),
    );

    return contextParts.join("\n\n");
  }
}
