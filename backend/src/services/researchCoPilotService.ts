import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import logger from "../monitoring/logger";
import { SecretsService } from "./secrets-service";
import { CitationService } from "./citationService";
import { VectorStoreService } from "./vectorStoreService";
import { PaperDiscoveryService } from "./paperDiscoveryService";
import { prisma } from "../lib/prisma";

/**
 * AI Research Co-Pilot Service
 *
 * Provides intelligent research assistance with:
 * - Document context awareness
 * - Citation suggestions
 * - Paper recommendations
 * - Literature gap analysis
 * - Plagiarism-free content generation
 *
 * Supports multiple AI providers (Claude Sonnet, Gemini, OpenAI) with fallback
 */

interface DocumentContext {
  projectId: string;
  title?: string;
  content: string; // Full document content (TipTap JSON stringified)
  sections?: Array<{
    type: string;
    content: string;
    citations?: any[];
  }>;
  currentSection?: string;
  citationStyle?: string;
}

interface CitationSuggestion {
  text: string; // The text that needs citation
  suggestedCitations: Array<{
    paperId: string;
    title: string;
    authors: string[];
    year: number;
    relevanceScore: number;
    reason: string;
    formattedCitation: string;
  }>;
  confidence: number;
}

interface PaperRecommendation {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  relevanceScore: number;
  reason: string;
  citationCount: number;
  url?: string;
}

interface LiteratureGap {
  topic: string;
  description: string;
  suggestedPapers: PaperRecommendation[];
  priority: "high" | "medium" | "low";
}

interface ResearchCoPilotOptions {
  mode?: "general" | "research" | "autocomplete";
  includeDocumentContext?: boolean;
  includeCitationLibrary?: boolean;
  maxTokens?: number;
  temperature?: number;
  model?:
    | "claude-3-5-sonnet"
    | "gemini-3.1-flash-lite-preview"
    | "gpt-4o-mini"
    | "auto";
}

interface AIProvider {
  name: "claude" | "gemini" | "openai";
  available: boolean;
  priority: number;
}

export class ResearchCoPilotService {
  private static anthropic: Anthropic | null = null;
  private static genAI: GoogleGenerativeAI | null = null;
  private static openai: OpenAI | null = null;

  /**
   * Initialize AI providers
   */
  private static async initializeProviders(): Promise<AIProvider[]> {
    const providers: AIProvider[] = [];

    // Try to initialize Claude (priority 1)
    try {
      const claudeKey = await SecretsService.getSecret("ANTHROPIC_API_KEY");
      if (claudeKey && !this.anthropic) {
        this.anthropic = new Anthropic({ apiKey: claudeKey });
        providers.push({ name: "claude", available: true, priority: 1 });
        logger.info("Claude Sonnet initialized for Research Co-Pilot");
      }
    } catch (error) {
      logger.warn("Claude not available:", error);
      providers.push({ name: "claude", available: false, priority: 1 });
    }

    // Try to initialize Gemini (priority 2)
    try {
      const geminiKey = await SecretsService.getSecret("GEMINI_API_KEY");
      if (geminiKey && !this.genAI) {
        this.genAI = new GoogleGenerativeAI(geminiKey);
        providers.push({ name: "gemini", available: true, priority: 2 });
        logger.info("Gemini initialized for Research Co-Pilot");
      }
    } catch (error) {
      logger.warn("Gemini not available:", error);
      providers.push({ name: "gemini", available: false, priority: 2 });
    }

    // Try to initialize OpenAI (priority 3)
    try {
      const openaiKey = await SecretsService.getSecret("OPENAI_API_KEY");
      if (openaiKey && !this.openai) {
        this.openai = new OpenAI({ apiKey: openaiKey });
        providers.push({ name: "openai", available: true, priority: 3 });
        logger.info("OpenAI initialized for Research Co-Pilot");
      }
    } catch (error) {
      logger.warn("OpenAI not available:", error);
      providers.push({ name: "openai", available: false, priority: 3 });
    }

    return providers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get the best available AI provider
   */
  private static async getBestProvider(
    preferredModel?: string,
  ): Promise<AIProvider> {
    const providers = await this.initializeProviders();
    const availableProviders = providers.filter((p) => p.available);

    if (availableProviders.length === 0) {
      throw new Error(
        "No AI providers available. Please configure at least one API key.",
      );
    }

    // If a specific model is preferred and available, use it
    if (preferredModel) {
      if (
        preferredModel.includes("claude") &&
        availableProviders.find((p) => p.name === "claude")
      ) {
        return availableProviders.find((p) => p.name === "claude")!;
      }
      if (
        preferredModel.includes("gemini") &&
        availableProviders.find((p) => p.name === "gemini")
      ) {
        return availableProviders.find((p) => p.name === "gemini")!;
      }
      if (
        preferredModel.includes("gpt") &&
        availableProviders.find((p) => p.name === "openai")
      ) {
        return availableProviders.find((p) => p.name === "openai")!;
      }
    }

    // Return the highest priority available provider
    return availableProviders[0];
  }

  /**
   * Search across all user documents for relevant context
   */
  static async crossDocumentSearch(
    query: string,
    userId: string,
    limit: number = 5,
  ): Promise<string> {
    try {
      logger.info(`Performing cross-document search for user ${userId}`, {
        query,
      });

      const results = await VectorStoreService.search(
        query,
        { userId: userId }, // Filter by userId in metadata
        limit,
      );

      if (results.length === 0) {
        return "";
      }

      // format results
      const context = results
        .map((doc) => {
          const metadata = doc.metadata as any;
          const source =
            metadata.filename || metadata.title || "Unknown Document";
          return `[Source: ${source}]\n${doc.pageContent}`;
        })
        .join("\n\n---\n\n");

      return `\n\nRELEVANT INFORMATION FROM YOUR OTHER DOCUMENTS:\n${context}`;
    } catch (error) {
      logger.error("Error in cross-document search:", error);
      return "";
    }
  }

  /**
   * Generate content with full document context and research features
   */
  static async generateWithContext(
    prompt: string,
    documentContext: DocumentContext,
    userId: string,
    options: ResearchCoPilotOptions & { includeGlobalContext?: boolean } = {},
  ): Promise<{
    content: string;
    citations: any[];
    sources: any[];
    confidenceScore: number;
    provider: string;
  }> {
    try {
      const provider = await this.getBestProvider(options.model);
      logger.info(`Using ${provider.name} for research generation`);

      // Build structured context
      let structuredContext = this.buildStructuredContext(documentContext);

      // Add global context if requested
      if (options.includeGlobalContext) {
        const globalContext = await this.crossDocumentSearch(prompt, userId, 3);
        if (globalContext) {
          structuredContext += globalContext;
        }
      }

      // Get citation library if requested
      let citationLibrary = "";
      if (options.includeCitationLibrary) {
        citationLibrary = await this.getCitationLibraryContext(
          documentContext.projectId,
        );
      }

      // Build the research prompt
      const systemPrompt = this.buildResearchSystemPrompt(
        options.mode || "research",
      );
      const fullPrompt = this.buildFullPrompt(
        prompt,
        structuredContext,
        citationLibrary,
      );

      // Generate with the selected provider
      let response: {
        content: string;
        citations: any[];
        sources: any[];
        confidenceScore: number;
      };

      switch (provider.name) {
        case "claude":
          response = await this.generateWithClaude(
            systemPrompt,
            fullPrompt,
            options,
          );
          break;
        case "gemini":
          response = await this.generateWithGemini(
            systemPrompt,
            fullPrompt,
            options,
          );
          break;
        case "openai":
          response = await this.generateWithOpenAI(
            systemPrompt,
            fullPrompt,
            options,
          );
          break;
        default:
          throw new Error(`Unknown provider: ${provider.name}`);
      }

      return {
        ...response,
        provider: provider.name,
      };
    } catch (error: any) {
      logger.error("Error generating with context:", error);
      throw new Error(`Research generation failed: ${error.message}`);
    }
  }

  /**
   * Generate with Claude Sonnet
   */
  private static async generateWithClaude(
    systemPrompt: string,
    userPrompt: string,
    options: ResearchCoPilotOptions,
  ): Promise<{
    content: string;
    citations: any[];
    sources: any[];
    confidenceScore: number;
  }> {
    if (!this.anthropic) {
      throw new Error("Claude not initialized");
    }

    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet",
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract citations and sources from the response
    const extracted = this.extractCitationsFromResponse(content);

    return {
      content: extracted.cleanContent,
      citations: extracted.citations,
      sources: extracted.sources,
      confidenceScore: this.calculateConfidence(content, extracted.citations),
    };
  }

  /**
   * Generate with Gemini
   */
  private static async generateWithGemini(
    systemPrompt: string,
    userPrompt: string,
    options: ResearchCoPilotOptions,
  ): Promise<{
    content: string;
    citations: any[];
    sources: any[];
    confidenceScore: number;
  }> {
    if (!this.genAI) {
      throw new Error("Gemini not initialized");
    }

    const model = this.genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        maxOutputTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
      },
    });

    const content = result.response.text();
    const extracted = this.extractCitationsFromResponse(content);

    return {
      content: extracted.cleanContent,
      citations: extracted.citations,
      sources: extracted.sources,
      confidenceScore: this.calculateConfidence(content, extracted.citations),
    };
  }

  /**
   * Generate with OpenAI GPT-4o
   */
  private static async generateWithOpenAI(
    systemPrompt: string,
    userPrompt: string,
    options: ResearchCoPilotOptions,
  ): Promise<{
    content: string;
    citations: any[];
    sources: any[];
    confidenceScore: number;
  }> {
    if (!this.openai) {
      throw new Error("OpenAI not initialized");
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0].message.content || "";
    const extracted = this.extractCitationsFromResponse(content);

    return {
      content: extracted.cleanContent,
      citations: extracted.citations,
      sources: extracted.sources,
      confidenceScore: this.calculateConfidence(content, extracted.citations),
    };
  }

  /**
   * Build structured document context (Claude XML format, works for all)
   */
  private static buildStructuredContext(context: DocumentContext): string {
    let structured = `<document>\n`;
    structured += `  <metadata>\n`;
    if (context.title) {
      structured += `    <title>${context.title}</title>\n`;
    }
    structured += `    <project_id>${context.projectId}</project_id>\n`;
    if (context.citationStyle) {
      structured += `    <citation_style>${context.citationStyle}</citation_style>\n`;
    }
    structured += `  </metadata>\n`;

    if (context.sections && context.sections.length > 0) {
      structured += `  <sections>\n`;
      for (const section of context.sections) {
        structured += `    <section type="${section.type}">\n`;
        structured += `      <content>${this.escapeXml(section.content)}</content>\n`;
        if (section.citations && section.citations.length > 0) {
          structured += `      <citations>${JSON.stringify(section.citations)}</citations>\n`;
        }
        structured += `    </section>\n`;
      }
      structured += `  </sections>\n`;
    } else {
      structured += `  <content>\n${this.escapeXml(context.content)}\n  </content>\n`;
    }

    structured += `</document>`;
    return structured;
  }

  /**
   * Build research-specific system prompt
   */
  private static buildResearchSystemPrompt(mode: string): string {
    const basePrompt = `You are an expert AI Research Co-Pilot for academic writing. Your role is to assist researchers and students with:
- Writing high-quality academic content
- Suggesting relevant citations
- Maintaining academic integrity (no plagiarism)
- Providing evidence-based recommendations

CRITICAL RULES:
1. ALWAYS base suggestions on provided sources and document context
2. NEVER hallucinate citations - only suggest papers you can verify
3. Format citations properly according to the document's citation style
4. Maintain the author's voice and writing style
5. Provide confidence scores for your suggestions
6. Quote from the document before making suggestions

When suggesting citations, use this format:
[CITATION: Title (Authors, Year) - Reason for relevance]

When referencing sources, use:
[SOURCE: Paper ID or Title]`;

    if (mode === "research") {
      return (
        basePrompt +
        `\n\nMode: RESEARCH - Provide detailed, well-cited academic responses.`
      );
    } else if (mode === "autocomplete") {
      return (
        basePrompt +
        `\n\nMode: AUTOCOMPLETE - Provide brief, contextual writing suggestions (1-2 sentences).`
      );
    } else {
      return (
        basePrompt +
        `\n\nMode: GENERAL - Provide helpful, conversational assistance.`
      );
    }
  }

  /**
   * Build full prompt with context
   */
  private static buildFullPrompt(
    userPrompt: string,
    documentContext: string,
    citationLibrary: string,
  ): string {
    let prompt = "";

    if (documentContext) {
      prompt += `DOCUMENT CONTEXT:\n${documentContext}\n\n`;
    }

    if (citationLibrary) {
      prompt += `AVAILABLE CITATIONS:\n${citationLibrary}\n\n`;
    }

    prompt += `USER REQUEST:\n${userPrompt}`;

    return prompt;
  }

  /**
   * Get citation library context for the project
   */
  private static async getCitationLibraryContext(
    projectId: string,
  ): Promise<string> {
    try {
      // Get citations from the project
      const citations = await prisma.citation.findMany({
        where: { project_id: projectId },
        take: 50, // Limit to avoid context overflow
        orderBy: { created_at: "desc" },
      });

      if (citations.length === 0) {
        return "";
      }

      let context = "<citation_library>\n";
      for (const citation of citations) {
        context += `  <citation id="${citation.id}">\n`;
        context += `    <title>${this.escapeXml(citation.title || "")}</title>\n`;
        context += `    <authors>${this.escapeXml(citation.authors || "")}</authors>\n`;
        context += `    <year>${citation.year || "N/A"}</year>\n`;
        if (citation.doi) {
          context += `    <doi>${citation.doi}</doi>\n`;
        }
        context += `  </citation>\n`;
      }
      context += "</citation_library>";

      return context;
    } catch (error) {
      logger.error("Error fetching citation library:", error);
      return "";
    }
  }

  /**
   * Extract citations from AI response
   */
  private static extractCitationsFromResponse(content: string): {
    cleanContent: string;
    citations: any[];
    sources: any[];
  } {
    const citations: any[] = [];
    const sources: any[] = [];
    let cleanContent = content;

    // Extract [CITATION: ...] tags
    const citationRegex = /\[CITATION: ([^\]]+)\]/g;
    const citationMatches = Array.from(content.matchAll(citationRegex));

    for (const match of citationMatches) {
      const citationText = match[1];
      // Parse: Title (Authors, Year) - Reason
      const parsed = this.parseCitationTag(citationText);
      if (parsed) {
        citations.push(parsed);
      }
    }

    // Extract [SOURCE: ...] tags
    const sourceRegex = /\[SOURCE: ([^\]]+)\]/g;
    const sourceMatches = Array.from(content.matchAll(sourceRegex));

    for (const match of sourceMatches) {
      sources.push({ reference: match[1] });
    }

    // Remove tags from clean content
    cleanContent = cleanContent
      .replace(citationRegex, "")
      .replace(sourceRegex, "");

    return { cleanContent, citations, sources };
  }

  /**
   * Parse citation tag
   */
  private static parseCitationTag(text: string): any | null {
    try {
      // Try to extract title, authors, year, reason
      const match = text.match(/(.+?)\s*\((.+?),\s*(\d{4})\)\s*-\s*(.+)/);
      if (match) {
        return {
          title: match[1].trim(),
          authors: match[2].trim(),
          year: parseInt(match[3]),
          reason: match[4].trim(),
        };
      }
    } catch (error) {
      logger.warn("Failed to parse citation tag:", text);
    }
    return null;
  }

  /**
   * Calculate confidence score for the response
   */
  private static calculateConfidence(
    content: string,
    citations: any[],
  ): number {
    let score = 0.5; // Base score

    // Increase score if citations are present
    if (citations.length > 0) {
      score += 0.2;
    }

    // Increase score if content is well-structured
    if (content.includes("\n\n") && content.length > 100) {
      score += 0.1;
    }

    // Increase score if sources are referenced
    if (content.includes("[SOURCE:") || content.includes("According to")) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Suggest citations for a given text
   */
  static async suggestCitations(
    text: string,
    documentContext: DocumentContext,
    userId: string,
  ): Promise<CitationSuggestion[]> {
    try {
      const prompt = `Analyze the following text and identify claims or statements that need citations. For each, suggest relevant academic papers.

Text to analyze:
${text}

Provide suggestions in this format for each claim:
[CLAIM: "quote from text"]
[CITATION: Title (Authors, Year) - Why this paper is relevant]`;

      const result = await this.generateWithContext(
        prompt,
        documentContext,
        userId,
        {
          mode: "research",
          includeCitationLibrary: true,
          temperature: 0.3, // Lower temperature for more focused suggestions
        },
      );

      // Parse the suggestions
      const suggestions = await this.parseCitationSuggestions(
        result.content,
        documentContext.citationStyle || "apa",
      );
      return suggestions;
    } catch (error: any) {
      logger.error("Error suggesting citations:", error);
      throw new Error(`Citation suggestion failed: ${error.message}`);
    }
  }

  /**
   * Parse citation suggestions from AI response
   */
  private static async parseCitationSuggestions(
    content: string,
    style: string = "apa",
  ): Promise<CitationSuggestion[]> {
    const suggestions: CitationSuggestion[] = [];

    // Simple parsing logic - can be enhanced
    const claims = content.split("[CLAIM:");

    for (const claim of claims.slice(1)) {
      const claimMatch = claim.match(/"([^"]+)"/);
      if (!claimMatch) continue;

      const text = claimMatch[1];
      const citationMatches = Array.from(
        claim.matchAll(/\[CITATION: ([^\]]+)\]/g),
      );

      // Use Promise.all to handle async formatting
      const suggestedCitations = await Promise.all(
        citationMatches.map(async (match) => {
          const parsed = this.parseCitationTag(match[1]);

          // Use CitationService to format consistently if we parsed successfully
          let formattedCitation = match[1];
          if (parsed) {
            const authorsList = parsed.authors
              ? parsed.authors
                  .split(",")
                  .map((a: string) => ({ name: a.trim() }))
              : [];
            formattedCitation = await CitationService.formatCitation(
              {
                title: parsed.title,
                authors: authorsList,
                year: parsed.year,
                type: "article", // Default assumption
              },
              style,
            );
          }

          return {
            paperId: "", // Would be filled by actual paper lookup
            title: parsed?.title || "",
            authors: parsed?.authors?.split(",") || [],
            year: parsed?.year || 0,
            relevanceScore: 0.8,
            reason: parsed?.reason || "",
            formattedCitation: formattedCitation,
          };
        }),
      );

      suggestions.push({
        text,
        suggestedCitations,
        confidence: 0.8,
      });
    }

    return suggestions;
  }

  /**
   * Recommend papers based on topic/context
   */
  static async recommendPapers(
    topic: string,
    existingCitations: string[],
    limit: number = 10,
  ): Promise<PaperRecommendation[]> {
    try {
      // Use Semantic Scholar to find papers
      const papers = await PaperDiscoveryService.searchPapers(topic, limit);

      // Filter out existing citations
      const filtered = papers.filter(
        (paper: any) => !existingCitations.includes(paper.paperId),
      );

      return filtered.map((paper: any) => ({
        paperId: paper.paperId,
        title: paper.title,
        authors: paper.authors?.map((a: any) => a.name) || [],
        year: paper.year || 0,
        abstract: paper.abstract || "",
        relevanceScore: 0.85, // Would be calculated more sophisticatedly
        reason: "Relevant to topic",
        citationCount: paper.citationCount || 0,
        url: paper.url,
      }));
    } catch (error: any) {
      logger.error("Error recommending papers:", error);
      throw new Error(`Paper recommendation failed: ${error.message}`);
    }
  }

  /**
   * Analyze literature gaps in the document
   */
  /**
   * Analyze literature gaps in the document
   */
  static async analyzeGaps(
    documentContext: DocumentContext,
    userId: string,
  ): Promise<LiteratureGap[]> {
    try {
      const prompt = `Analyze the following research document and identify gaps in the literature review. 
For each gap, suggest specific topics or areas that should be covered with appropriate citations.

Focus on:
1. Missing theoretical frameworks
2. Uncited claims or assumptions
3. Areas where more recent research should be included
4. Methodological approaches not discussed

Provide gaps in this format:
[GAP: Topic/Area]
[DESCRIPTION: Why this is important]
[PRIORITY: high/medium/low]
[SEARCH_QUERY: Specific search query to find papers for this gap]`;

      const result = await this.generateWithContext(
        prompt,
        documentContext,
        userId,
        {
          mode: "research",
          includeCitationLibrary: true,
        },
      );

      // Parse gaps from response
      const gaps = this.parseGapAnalysis(result.content);

      // Enrich gaps with real papers
      const enrichedGaps = await Promise.all(
        gaps.map(async (gap) => {
          // If the AI provided a search query, use it. Otherwise fall back to topic.
          const query = (gap as any).searchQuery || gap.topic;

          try {
            // Search for papers to fill this gap
            const papers = await PaperDiscoveryService.searchPapers(query, 3); // Top 3 papers

            // Transform to recommended format
            const suggestedPapers = papers.map((paper: any) => ({
              paperId: paper.paperId,
              title: paper.title,
              authors: paper.authors?.map((a: any) => a.name) || [],
              year: paper.year || 0,
              abstract: paper.abstract || "",
              relevanceScore: 0.9,
              reason: "Addresses identified gap",
              citationCount: paper.citationCount || 0,
              url: paper.url,
            }));

            return {
              ...gap,
              suggestedPapers,
            };
          } catch (searchError) {
            logger.warn(
              `Failed to search papers for gap: ${gap.topic}`,
              searchError,
            );
            return gap; // Return gap without papers if search fails
          }
        }),
      );

      return enrichedGaps;
    } catch (error: any) {
      logger.error("Error analyzing gaps:", error);
      throw new Error(`Gap analysis failed: ${error.message}`);
    }
  }

  /**
   * Verify claims in the document against academic literature
   */
  static async verifyClaims(
    text: string,
    projectId: string,
    userId: string,
    options?: { includeGlobalContext?: boolean },
  ): Promise<any[]> {
    try {
      // Step 1: Extract claims
      const extractionPrompt = `Analyze the following text and extract distinct, factual claims that can be verified against academic literature.
      For each claim, provide a specific search query to find relevant research papers.
      
      Text: "${text.substring(0, 5000)}"
      
      Provide the output in this format:
      [CLAIM: The specific claim text]
      [QUERY: Search query for evidence]
      `;

      const extractionResult = await this.generateWithContext(
        extractionPrompt,
        {
          title: "Claim Verification",
          content: text,
          sections: [],
          projectId: projectId,
        },
        userId,
        { mode: "research" },
      );

      const claims: any[] = [];
      const claimBlocks = extractionResult.content.split("[CLAIM:");

      for (const block of claimBlocks.slice(1)) {
        const claimMatch = block.match(/([^\]]+)\]/);
        const queryMatch = block.match(/\[QUERY: ([^\]]+)\]/);

        if (claimMatch && queryMatch) {
          claims.push({
            claim: claimMatch[1].trim(),
            query: queryMatch[1].trim(),
            evidence: [],
            status: "verifying",
          });
        }
      }

      // Step 2: Verify each claim with real papers AND internal documents
      // Limit to first 3 claims to avoid timeouts/rate limits for now
      const verifiedClaims = await Promise.all(
        claims.slice(0, 3).map(async (item) => {
          try {
            // A. Search for external papers
            const papers = await PaperDiscoveryService.searchPapers(
              item.query,
              3,
            );

            // B. Search for internal documents if requested
            let internalDocs: any[] = [];
            if (options?.includeGlobalContext) {
              const docs = await VectorStoreService.search(
                item.query,
                { userId },
                3,
              );
              internalDocs = docs.map((d) => ({
                paperId: "internal_" + (d.metadata as any).id,
                title: (d.metadata as any).filename || "Internal Document",
                abstract: d.pageContent,
                authors: [{ name: "You" }], // Placeholder
                year: new Date().getFullYear(),
                isInternal: true,
              }));
            }

            // Combine sources
            const allSources = [...papers, ...internalDocs];

            if (allSources.length === 0) {
              return { ...item, status: "no_evidence", confidence: 0 };
            }

            // Verify against sources
            const evidence = await Promise.all(
              allSources.map(async (source: any) => {
                const sourceContent = source.abstract || source.pageContent; // handle both standard paper and internal doc
                if (!sourceContent) return null;

                const verifyPrompt = `
               Claim: "${item.claim}"
               
               Source Content: "${sourceContent}"
               
               Does this source SUPPORT, CONTRADICT, or is it NEUTRAL/UNRELATED to the claim?
               Provide a one sentence reasoning.
               
               Format:
               [VERDICT: SUPPORT/CONTRADICT/NEUTRAL]
               [REASON: reasoning]
               `;

                const analysis = await this.generateWithContext(
                  verifyPrompt,
                  {
                    title: "Verification",
                    content: "",
                    sections: [],
                    projectId: projectId,
                  },
                  userId,
                  { mode: "research" },
                );

                const verdictMatch = analysis.content.match(
                  /\[VERDICT: (SUPPORT|CONTRADICT|NEUTRAL)\]/i,
                );
                const reasonMatch =
                  analysis.content.match(/\[REASON: ([^\]]+)\]/);

                let verdict = "NEUTRAL";
                if (verdictMatch) verdict = verdictMatch[1].toUpperCase();

                return {
                  paperId: source.paperId,
                  title: source.title,
                  authors: source.authors?.map((a: any) => a.name) || [],
                  year: source.year,
                  url: source.url,
                  verdict: verdict,
                  reasoning: reasonMatch
                    ? reasonMatch[1].trim()
                    : "Analysis provided no reasoning.",
                  isInternal: source.isInternal, // Flag internal evidence
                };
              }),
            );

            const validEvidence = evidence.filter((e) => e !== null);

            // Calculate aggregate score
            // Simple logic: +1 for support, -1 for contradict
            let score = 0;
            validEvidence.forEach((e) => {
              if (e!.verdict === "SUPPORT") score++;
              if (e!.verdict === "CONTRADICT") score--;
            });

            let consensus = "NEUTRAL";
            if (score > 0) consensus = "SUPPORTED";
            if (score < 0) consensus = "CONTRADICTED";
            if (score === 0 && validEvidence.length > 0) consensus = "MIXED";

            return {
              ...item,
              evidence: validEvidence,
              status: consensus,
              confidence: Math.min(validEvidence.length * 33, 100), // Rough confidence based on source count
            };
          } catch (e) {
            logger.warn(`Failed to verify claim: ${item.claim}`, e);
            return { ...item, status: "error" };
          }
        }),
      );

      return verifiedClaims;
    } catch (error: any) {
      logger.error("Error verifying claims:", error);
      throw new Error(`Claim verification failed: ${error.message}`);
    }
  }

  /**
   * Parse gap analysis from AI response
   */
  private static parseGapAnalysis(content: string): LiteratureGap[] {
    const gaps: LiteratureGap[] = [];

    const gapBlocks = content.split("[GAP:");

    for (const block of gapBlocks.slice(1)) {
      const topicMatch = block.match(/([^\]]+)\]/);
      const descMatch = block.match(/\[DESCRIPTION: ([^\]]+)\]/);
      const priorityMatch = block.match(/\[PRIORITY: (high|medium|low)\]/);
      const queryMatch = block.match(/\[SEARCH_QUERY: ([^\]]+)\]/);

      if (topicMatch) {
        gaps.push({
          topic: topicMatch[1].trim(),
          description: descMatch?.[1] || "",
          suggestedPapers: [], // Initially empty, filled later
          priority: (priorityMatch?.[1] as any) || "medium",
          // Store query temporarily for the enrichment step
          ...({ searchQuery: queryMatch?.[1]?.trim() } as any),
        });
      }
    }

    return gaps;
  }

  /**
   * Check for potential plagiarism
   */
  /**
   * Check for potential plagiarism using Vector Embeddings
   */
  static async checkPlagiarism(
    text: string,
    sourcePapers: any[] = [],
  ): Promise<{
    score: number; // 0-100, higher means more similar
    matches: Array<{ source: string; similarity: number; excerpt: string }>;
    isOriginal: boolean;
  }> {
    try {
      // 1. If no source papers provided, search for them
      let papersToCompare = [...sourcePapers];
      if (papersToCompare.length === 0) {
        // IMPROVED: Use LLM to extract "search keyphrases" for better accuracy
        let searchQuery = text.substring(0, 200).replace(/\n/g, " "); // Default fallback

        try {
          // We ask the AI to identify the core topic/claim
          const keywordPrompt = `Extract 3-5 specific academic keywords or a short search query (max 10 words) that best represents the core topic of this text for a literature search. Return ONLY the keywords, nothing else.\n\nText: "${text.substring(0, 500)}..."`;

          // We use a fast model (gpt-4o-mini) for this
          const keywordResult = await this.generateWithContext(
            keywordPrompt,
            { projectId: "", content: "" },
            "system",
            { mode: "research" },
          );

          if (keywordResult && keywordResult.content) {
            searchQuery = keywordResult.content.replace(/["']/g, "").trim();
            logger.info(
              `Extracted plagiarism search keywords: "${searchQuery}"`,
            );
          }
        } catch (e) {
          logger.warn("Failed to extract keywords, using substring fallback.");
        }

        logger.info(
          `Searching for potential plagiarism sources for: ${searchQuery.substring(0, 50)}...`,
        );

        // Fetch more candidates to ensure we have good coverage
        papersToCompare = await PaperDiscoveryService.searchPapers(
          searchQuery,
          0,
          20,
        );
      }

      const matches: Array<{
        source: string;
        similarity: number;
        excerpt: string;
      }> = [];

      // 2. Generate Embeddings (Runtime)
      // Refactored to use VectorStoreService for cleaner architecture

      const apiKey = await SecretsService.getOpenAiApiKey();
      if (!apiKey) {
        // Fallback to simple similarity if no API Key
        return this.fallbackPlagiarismCheck(text, papersToCompare);
      }

      // Embed User Text
      const userVector = await VectorStoreService.generateEmbedding(text);

      // 3. Compare against papers
      let maxSimilarity = 0;

      for (const paper of papersToCompare) {
        if (!paper.abstract) continue;

        // Embed Paper Abstract
        // Optimization: In a real system, we'd cache these vectors or look them up if already in DB
        const paperVector = await VectorStoreService.generateEmbedding(
          paper.abstract,
        );

        // Calculate Cosine Similarity
        const similarity = this.cosineSimilarity(userVector, paperVector);

        // Threshold: 0.75 usually indicates strong semantic similarity
        if (similarity > 0.75) {
          matches.push({
            source: paper.title,
            similarity: similarity, // 0-1
            excerpt: paper.abstract.substring(0, 200) + "...",
          });
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
      }

      // Sort matches by similarity
      matches.sort((a, b) => b.similarity - a.similarity);

      const score = Math.round(maxSimilarity * 100);
      const isOriginal = score < 75; // Stricter threshold

      logger.info(
        `Plagiarism check complete. Score: ${score}, Matches: ${matches.length}`,
      );

      return { score, matches, isOriginal };
    } catch (error: any) {
      logger.error("Error checking plagiarism:", error);
      // Fallback
      return this.fallbackPlagiarismCheck(text, sourcePapers);
    }
  }

  /**
   * Fallback using Jaccard similarity if AI fails
   */
  private static fallbackPlagiarismCheck(text: string, papers: any[]) {
    const matches: any[] = [];
    let maxSimilarity = 0;
    for (const paper of papers) {
      if (paper.abstract) {
        const similarity = this.calculateTextSimilarity(text, paper.abstract);
        if (similarity > 0.6) {
          matches.push({
            source: paper.title,
            similarity,
            excerpt: paper.abstract.substring(0, 200),
          });
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
      }
    }
    return {
      score: maxSimilarity * 100,
      matches,
      isOriginal: maxSimilarity * 100 < 60,
    };
  }

  /**
   * Calculate Cosine Similarity between two vectors
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate text similarity (simple Jaccard similarity)
   */
  private static calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}
