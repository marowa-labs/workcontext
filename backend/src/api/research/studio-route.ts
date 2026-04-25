import { Request, Response } from "express";
import { multiAIService } from "../../services/MultiAIService";
import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";

export const GENERATE_STUDIO_ITEM = async (req: Request, res: Response) => {
  try {
    logger.info("=== GENERATE_STUDIO_ITEM REQUEST ===", { body: req.body });
    const { projectId, type, forceRefresh } = req.body; // type: 'flashcards', 'quiz', 'report', 'data_table'

    if (!projectId) {
      logger.warn("Missing projectId", { body: req.body });
      return res.status(400).json({
        error: "Project ID is required",
        received: { projectId, type },
      });
    }

    if (!type) {
      logger.warn("Missing type", { body: req.body });
      return res
        .status(400)
        .json({ error: "Type is required", received: { projectId, type } });
    }

    logger.info("Validation passed", { projectId, type });

    // 1. Check Cache
    if (!forceRefresh) {
      const cachedAnalysis = await prisma.researchAnalysis.findUnique({
        where: { project_id: projectId },
      });

      if (cachedAnalysis) {
        if (type === "flashcards" && cachedAnalysis.flashcards)
          return res.json({ data: cachedAnalysis.flashcards });
        if (type === "quiz" && cachedAnalysis.quiz)
          return res.json({ data: cachedAnalysis.quiz });
        if (type === "reports" && cachedAnalysis.reports)
          return res.json({ data: cachedAnalysis.reports });
        if (type === "data_table" && cachedAnalysis.data_table)
          return res.json({ data: cachedAnalysis.data_table });
        if (type === "infographic" && cachedAnalysis.infographic)
          return res.json({ data: cachedAnalysis.infographic });
        if (type === "slide_deck" && cachedAnalysis.slide_deck)
          return res.json({ data: cachedAnalysis.slide_deck });
      }
    }

    // 2. Prepare Context (Sources and Summary)
    const analysis = await prisma.researchAnalysis.findUnique({
      where: { project_id: projectId },
      select: { summary: true, topics: true },
    });

    const citations = await prisma.citation.findMany({
      where: { project_id: projectId },
      take: 20,
    });

    logger.info("Research data check", {
      citationsCount: citations.length,
      hasSummary: !!analysis?.summary,
    });

    if (citations.length === 0 && !analysis?.summary) {
      logger.warn("No research data available");
      return res.status(400).json({
        error: "No research data found",
        message:
          "Please add papers to your library or generate a Literature Review first. Studio items require research context to generate.",
        hint: "Click 'Discovery' to find papers, or generate a 'Lit Review' first.",
      });
    }

    const context = `
      Research Summary: ${analysis?.summary || "N/A"}
      
      Key Sources:
      ${citations.map((c: any) => `- ${c.title} (${c.year}): ${c.abstract?.substring(0, 100)}...`).join("\n")}
    `;

    // 3. Generate Content based on Type
    let prompt = "";
    if (type === "flashcards") {
      prompt = `
          Based on the research context below, generate 15 high-quality study flashcards.
          Create a mix of different types: definitions, concepts, comparisons, applications, and critical thinking.
          
          context: ${context}
          
          Return JSON array with this structure:
          [
            { 
              "front": "Clear, concise question or term",
              "back": "Comprehensive answer or definition (2-3 sentences)",
              "category": "Definition|Concept|Application|Comparison|Critical",
              "difficulty": "Easy|Medium|Hard",
              "hint": "Optional hint if difficulty is Medium or Hard"
            },
            ...
          ]
          
          Guidelines:
          - Front: Keep questions/terms clear and specific
          - Back: Provide detailed but focused answers
          - Mix difficulty levels: 5 Easy, 7 Medium, 3 Hard
          - Categories should be balanced across the set
          - Hints should guide thinking without giving away the answer
        `;
    } else if (type === "quiz") {
      prompt = `
          Based on the research context below, generate a 10-question multiple choice quiz to assess understanding.
          Questions should range from basic recall to critical analysis.
          
          context: ${context}
          
          Return JSON array with this structure:
          [
            { 
              "question": "Clear, specific question testing a key concept",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,  // index of correct option (0-3)
              "explanation": "Detailed 2-3 sentence explanation of why the answer is correct and why others are wrong",
              "difficulty": "Easy|Medium|Hard",
              "category": "Recall|Comprehension|Application|Analysis"
            },
            ...
          ]
          
          Guidelines:
          - Mix question types: 3 Easy, 5 Medium, 2 Hard
          - Categories: Balance across Recall, Comprehension, Application, Analysis
          - Options: Make all plausible, avoid obvious wrong answers
          - Explanations: Educational, explain the reasoning
          - Questions: Test understanding, not just memorization
        `;
    } else if (type === "reports") {
      prompt = `
            Based on the research context below, generate a comprehensive Executive Research Report.
            This should be a publication-ready document with clear structure and insights.
            
            context: ${context}

            Return JSON with this exact structure:
            {
                "title": "Executive Research Report: [Topic]",
                "abstract": "Brief 2-3 sentence overview of the entire report",
                "date": "${new Date().toISOString().split("T")[0]}",
                "sections": [
                    { 
                        "heading": "Introduction", 
                        "content": "Overview of the research domain and objectives. 2-3 paragraphs."
                    },
                    { 
                        "heading": "Methodology Overview", 
                        "content": "Summary of research approaches found in the sources. Include common methodologies, sample characteristics, etc."
                    },
                    { 
                        "heading": "Key Findings", 
                        "content": "Most important discoveries and results from the research. Use bullet points where appropriate. 3-5 major findings."
                    },
                    { 
                        "heading": "Discussion & Implications", 
                        "content": "Analysis of what the findings mean. Implications for theory, practice, or policy."
                    },
                    { 
                        "heading": "Limitations & Future Research", 
                        "content": "Identified gaps, limitations in current research, and suggested future directions."
                    },
                    { 
                        "heading": "Conclusions", 
                        "content": "Summary of main takeaways and final thoughts."
                    }
                ],
                "keyMetrics": {
                    "sourcesAnalyzed": ${citations.length},
                    "primaryThemes": ["Theme 1", "Theme 2", "Theme 3"],
                    "timeframe": "Estimated based on source years"
                }
            }
            
            Make content substantive and academic in tone. Use markdown formatting within content sections (**bold**, *italic*, lists).
        `;
    } else if (type === "data_table") {
      prompt = `
        Based on the research context below, generate a comprehensive Data Comparison Table.
        Extract key information and organize it in a structured, comparative format.
        
        context: ${context}

        Return JSON with this EXACT structure:
        {
          "title": "Research Comparison Table: [Topic]",
          "description": "Brief overview of what is being compared",
          "headers": ["Source/Study", "Methodology", "Key Findings", "Sample Size", "Year", "Limitations"],
          "rows": [
            {
              "Source/Study": "Study name or author",
              "Methodology": "Brief description",
              "Key Findings": "Main results",
              "Sample Size": "N=XXX or description",
              "Year": "Publication year",
              "Limitations": "Key limitations"
            },
            // ... more rows (extract from available papers)
          ]
        }

        Guidelines:
        - Extract actual data from research papers
        - Create 5-10 rows depending on available sources
        - Ensure all cells are filled with relevant information
        - Keep entries concise but informative
        - Use consistent formatting across rows
      `;
    } else if (type === "infographic") {
      prompt = `
        Based on the research context below, generate a beautiful, professional SVG infographic.
        Create a visual summary of key research findings with statistics, timeline, and comparisons.
        
        context: ${context}

        Generate valid SVG markup (viewBox="0 0 800 1200") with:
        
        1. **Title Section** (y: 0-80)
           - Main title of research topic
           - Purple/magenta gradient background (#9333EA to #C084FC)
           
        2. **Statistical Boxes** (y: 100-300, 4 boxes in 2x2 grid)
           - Each box: rounded rectangle with icon + number + label
           - Colors: purple gradients
           - Example: "73% Accuracy Improvement", "2.5x Faster Diagnosis"
           
        3. **Timeline Visualization** (y: 320-520)
           - Horizontal timeline from start year to present
           - Key milestones with dates and descriptions
           - Connected with lines
           
        4. **Comparison Chart** (y: 540-780)
           - Bar chart comparing different methodologies/approaches
           - 3-4 bars with labels and percentages
           - Purple color scheme
           
        5. **Key Takeaways** (y: 800-1200)
           - 3-4 bullet points with icons
           - Clean typography
           - Purple accent colors

        Use professional design principles:
        - Clean, modern sans-serif fonts
        - Consistent purple/magenta color palette
        - Proper spacing and alignment
        - Icons represented as simple SVG shapes
        - Responsive viewBox for scaling
        
        Return ONLY the SVG markup, no explanations.
      `;
    } else if (type === "slide_deck") {
      prompt = `
        Based on the research context below, generate a professional 10-15 slide presentation.
        Create slides suitable for academic presentation with speaker notes.
        
        context: ${context}

        Return JSON array with this structure:
        [
          {
            "number": 1,
            "type": "title",
            "title": "Engaging presentation title",
            "subtitle": "Brief descriptive subtitle",
            "notes": "Speaker notes: Introduction and context"
          },
          {
            "number": 2,
            "type": "content",
            "title": "Problem Statement",
            "content": "**What gap does this research address?**\n\n- Research gap 1\n- Research gap 2\n- Research gap 3",
            "layout": "text",
            "notes": "Emphasize the significance of this research problem"
          },
          {
            "number": 3,
            "type": "content",
            "title": "Background & Context",
            "content": "Brief overview in markdown format with bullet points",
            "layout": "text",
            "notes": "Provide necessary background without overwhelming"
          },
          // ... slides 4-6: Methodology
          // ... slides 7-10: Key Findings (with data/charts)
          // ... slide 11: Comparison
          // ... slide 12: Implications  
          // ... slide 13: Future Work
          // ... slide 14: Conclusion
          // ... slide 15: References
        ]

        Guidelines:
        - 10-15 slides total
        - Each slide max 5 bullet points
        - Content in markdown format
        - Include helpful speaker notes
        - Balance text with concepts
        - Suggest data visualization where appropriate
        - Professional academic tone but engaging
        - Teal color theme (#14B8A6)
      `;
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    prompt += "\nReturn ONLY valid JSON. No markdown.";

    const result = await multiAIService.generateContent(
      prompt,
      "gemini-3.1-flash-lite-preview",
    );

    // Parse JSON
    let cleanContent = result.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const startIndex = cleanContent.indexOf("{");
    const arrayStartIndex = cleanContent.indexOf("[");
    const start =
      startIndex !== -1 &&
      (arrayStartIndex === -1 || startIndex < arrayStartIndex)
        ? startIndex
        : arrayStartIndex;

    if (start !== -1) {
      cleanContent = cleanContent.substring(start);
      const end = cleanContent.lastIndexOf(start === startIndex ? "}" : "]");
      if (end !== -1) cleanContent = cleanContent.substring(0, end + 1);
    }

    let generatedData;
    try {
      generatedData = JSON.parse(cleanContent);

      // Recursive sanitization function to handle objects and arrays
      const sanitize = (val: any): any => {
        if (typeof val === "string") {
          return val.replace(/\\"/g, '"').replace(/\\'/g, "'");
        }
        if (Array.isArray(val)) {
          return val.map(sanitize);
        }
        if (val !== null && typeof val === "object") {
          const newObj: any = {};
          for (const key in val) {
            newObj[key] = sanitize(val[key]);
          }
          return newObj;
        }
        return val;
      };

      generatedData = sanitize(generatedData);
    } catch (e) {
      logger.error("Failed to parse studio item JSON", e);
      return res
        .status(500)
        .json({ error: "Failed to generate valid content" });
    }

    // 4. Save to DB
    const updateData: any = {};
    if (type === "flashcards") updateData.flashcards = generatedData;
    if (type === "quiz") updateData.quiz = generatedData;
    if (type === "reports") updateData.reports = generatedData;
    if (type === "data_table") updateData.data_table = generatedData;
    if (type === "infographic") updateData.infographic = generatedData;
    if (type === "slide_deck") updateData.slide_deck = generatedData;

    await prisma.researchAnalysis.upsert({
      where: { project_id: projectId },
      create: {
        project_id: projectId,
        ...updateData,
      },
      update: updateData,
    });

    // 5. Auto-save as Note
    try {
      // Get project owner
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { user_id: true, title: true },
      });

      if (project?.user_id) {
        // Format content based on type
        let noteContent = "";
        let noteTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleTimeString()}`;
        let noteCategory = type === "reports" ? "report" : type; // Map 'reports' to 'report'

        if (type === "flashcards") {
          noteContent = (generatedData as any[])
            .map(
              (c, i) =>
                `### Card ${i + 1}\n**Front:** ${c.front}\n\n**Back:** ${c.back}\n---`,
            )
            .join("\n");
          noteTitle = "Flashcards Study Set";
        } else if (type === "quiz") {
          noteContent = (generatedData as any[])
            .map(
              (q, i) =>
                `### Question ${i + 1}\n${q.question}\n\n${(q.options || []).map((o: string) => `* [ ] ${o}`).join("\n")}\n\n<details><summary>Answer</summary>${q.options?.[q.correctAnswer]}\n${q.explanation}</details>`,
            )
            .join("\n\n");
          noteTitle = "Practice Quiz";
        } else if (type === "reports") {
          noteContent =
            `# ${generatedData.title || "Report"}\n\n${generatedData.abstract ? `*${generatedData.abstract}*\n\n` : ""}` +
            (generatedData.sections || [])
              .map((s: any) => `## ${s.heading}\n${s.content}`)
              .join("\n\n");
          noteTitle = generatedData.title || "Research Report";
        } else if (type === "data_table") {
          const table = generatedData;
          const headers = (table.headers || table.columns || []).join(" | "); // Handle both structures if needed, prompt asked for 'headers'
          const separator = (table.headers || table.columns || [])
            .map(() => "---")
            .join(" | ");
          const rows = (table.rows || [])
            .map((r: any) => {
              // Handle if row is object or array
              if (Array.isArray(r)) return r.join(" | ");
              // If object, map based on headers order if possible, or just values
              return Object.values(r).join(" | ");
            })
            .join("\n");
          noteContent = `| ${headers} |\n| ${separator} |\n${rows}`;
          noteTitle = table.title || "Data Comparison Table";
        } else if (type === "infographic") {
          noteContent = "```xml\n" + generatedData + "\n```"; // SVG content
          noteTitle = "Infographic Visualization";
        } else if (type === "slide_deck") {
          noteContent = (generatedData as any[])
            .map(
              (s) =>
                `## Slide ${s.number}: ${s.title}\n\n${s.content}\n\n*Speaker Notes: ${s.notes}*`,
            )
            .join("\n\n---\n\n");
          noteTitle = "Presentation Deck";
        } else {
          noteContent = JSON.stringify(generatedData, null, 2);
        }

        await prisma.note.create({
          data: {
            user_id: project.user_id,
            project_id: projectId,
            category: noteCategory,
            title: noteTitle,
            content: noteContent,
            preview_image:
              type === "infographic" ? "infographic_placeholder" : null, // Optional
            tags: ["studio-generated", type],
          },
        });
        logger.info("Auto-saved Studio item as Note", { projectId, type });
      }
    } catch (noteError) {
      logger.error("Failed to auto-save note:", noteError);
      // Don't fail the request if note creation fails
    }

    return res.json({ data: generatedData });
  } catch (error) {
    logger.error("Error generating studio item:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
