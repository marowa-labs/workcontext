import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { multiAIService } from "../../services/MultiAIService";
import { elevenLabsService } from "../../services/elevenLabsService";
import { SupabaseStorageService } from "../../services/supabaseStorageService";

const router = Router();
// const prisma = new PrismaClient(); // Removed local instantiation

// Helper function to perform research analysis
async function performResearchAnalysis(projectId: string) {
  // Fetch Sources (Real)
  const citations = await prisma.citation.findMany({
    where: { project_id: projectId },
    take: 20, // Increased limit
  });

  // Fetch Chat History
  const chatSessions = await prisma.aIChatSession.findMany({
    where: { project_id: projectId },
    include: {
      messages: {
        take: 20,
        orderBy: { created_at: "desc" }, // Get recent
      },
    },
    take: 5, // Last 5 sessions
    orderBy: { updated_at: "desc" },
  });

  const chatContext = chatSessions
    .map((session: any) => {
      return session.messages
        .reverse()
        .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");
    })
    .join("\n---\n");

  const sourcesContext = citations
    .map((c: any) => `Title: ${c.title}\nAbstract: ${c.abstract || "N/A"}`)
    .join("\n\n");

  // Generate with AI
  const prompt = `
      Act as a senior academic researcher. You are writing a Literature Review for a project.
      
      Input Data:
      1. Research Citations (Sources):
      ${sourcesContext.substring(0, 15000)}

      2. User's Chat History (Context on their thoughts/questions):
      ${chatContext.substring(0, 5000)}

      Task:
      Generate a comprehensive Literature Review based on the above.
      Return a JSON object with:
      - summary: A detailed Literature Review (Markdown format). 
        IMPORTANT FORMATTING RULES:
        1. Use DOUBLE NEWLINES (\n\n) between every paragraph.
        2. Use standard bullet points (- or *) for lists, with a newline before and after the list.
        3. Use bolding (**term**) for key concepts.
        4. Synthesize the sources and user's research direction.
      - topics: Array of 5 key research topics / themes.
      - questions: Array of 5 suggested future research questions.
      
      The 'summary' should be substantial (3-4 paragraphs), simulating a real Lit Review section.
    `;

  const aiRes = await multiAIService.generateContent(
    prompt,
    "gemini-3.1-flash-lite-preview",
  );
  let data;
  try {
    const cleaned = aiRes.content.replace(/```json/g, "").replace(/```/g, "");
    data = JSON.parse(cleaned);

    // Sanitization: Remove literal backslash escapes for quotes that AI sometimes adds
    const sanitize = (text: any) => {
      if (typeof text !== "string") return text;
      return text.replace(/\\"/g, '"').replace(/\\'/g, "'");
    };

    if (data.summary) data.summary = sanitize(data.summary);
    if (Array.isArray(data.topics)) data.topics = data.topics.map(sanitize);
    if (Array.isArray(data.questions))
      data.questions = data.questions.map(sanitize);
  } catch (e) {
    data = { summary: aiRes.content, topics: [], questions: [] };
  }

  // Save to DB
  const analysis = await prisma.researchAnalysis.upsert({
    where: { project_id: projectId },
    create: {
      project_id: projectId,
      summary: data.summary,
      topics: data.topics || [],
      questions: data.questions || [],
      sources_used: citations.length,
    },
    update: {
      summary: data.summary,
      topics: data.topics || [],
      questions: data.questions || [],
      sources_used: citations.length,
    },
  });

  // Auto-save as Note (Lit Review)
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { user_id: true },
    });

    if (project?.user_id) {
      const noteContent = `# Research Guide & Literature Review\n\n${data.summary}\n\n## Key Topics\n${(data.topics || []).map((t: any) => `- ${t}`).join("\n")}\n\n## Future Research Questions\n${(data.questions || []).map((q: any) => `- ${q}`).join("\n")}`;

      await prisma.note.create({
        data: {
          user_id: project.user_id,
          project_id: projectId,
          category: "lit_review",
          title: "Research Guide & Literature Review",
          content: noteContent,
          tags: ["studio-generated", "lit_review"],
        },
      });
    }
  } catch (noteError) {
    console.error("Failed to auto-save lit review note:", noteError);
  }

  return analysis;
}

// POST /api/research/guide - Generate topics, summary, questions
router.post("/guide", async (req, res) => {
  try {
    const { projectId } = req.body;

    // Enhanced validation
    if (
      !projectId ||
      typeof projectId !== "string" ||
      projectId.trim() === ""
    ) {
      return res.status(400).json({
        error: "Valid Project ID is required",
      });
    }

    // Check cache
    const cached = await prisma.researchAnalysis.findUnique({
      where: { project_id: projectId },
    });

    if (cached && cached.summary) {
      return res.json({
        summary: cached.summary,
        topics: cached.topics,
        questions: cached.questions,
        sourcesUsed: cached.sources_used,
        reports: cached.reports,
        flashcards: cached.flashcards,
        quiz: cached.quiz,
        data_table: cached.data_table,
      });
    }

    const data = await performResearchAnalysis(projectId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate guide" });
  }
});

// GET /audio/status/:projectId
router.get("/audio/status/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const record = await prisma.generatedAudio.findUnique({
      where: { project_id: projectId },
    });

    if (!record) return res.json({ status: "not_started" });

    res.json({
      status: record.status,
      // If completed
      audioUrl: record.audio_url,
      provider: record.provider,
      script: record.script,
      title: record.title,
      // If failed
      failureReason: record.failure_reason,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// Post /audio/generate
router.post("/audio/generate", async (req, res) => {
  try {
    const { projectId, tone = "Deep Dive", length = "Medium" } = req.body;

    // Strict Check: Validate API Key availability
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({
        error:
          "Configuration Error: ElevenLabs API Key is missing. Please check backend .env file.",
      });
    }

    // We need userId for upload, but request might be authenticated middleware?
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    // Check existing
    const existing = await prisma.generatedAudio.findUnique({
      where: { project_id: projectId },
    });

    if (existing) {
      if (existing.status === "completed") {
        return res.json({ status: "completed", audioUrl: existing.audio_url });
      }
      if (existing.status === "processing") {
        return res.json({ status: "processing" });
      }
      // If failed or pending, we retry/start
    }

    // Set status to processing immediately
    await prisma.generatedAudio.upsert({
      where: { project_id: projectId },
      create: {
        project_id: projectId,
        status: "processing",
        provider: "elevenlabs",
      },
      update: {
        status: "processing",
        failure_reason: null,
      },
    });

    // Start background task
    generateAudioBackground(projectId, project.user_id, tone, length).catch(
      (err) => {
        console.error("Critical background error:", err);
      },
    );

    res.json({ status: "processing" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start generation" });
  }
});

/**
 * Background Task for Audio Generation
 */
async function generateAudioBackground(
  projectId: string,
  userId: string,
  tone: string,
  length: string,
) {
  try {
    console.log(`[AudioGen] Starting for project ${projectId}`);

    // 1. Get Analysis
    let analysis = await prisma.researchAnalysis.findUnique({
      where: { project_id: projectId },
    });

    // If no analysis exists, generate one on the fly
    if (!analysis) {
      console.log(
        `[AudioGen] Analysis missing for project ${projectId}, generating on the fly...`,
      );
      analysis = await performResearchAnalysis(projectId);
    }

    // 2. Generate Script
    let lengthInstruction = "about 3 minutes long (approx 12-15 exchanges)";
    if (length === "Short")
      lengthInstruction =
        "brief, about 1-2 minutes long (approx 5-8 exchanges)";
    if (length === "Long")
      lengthInstruction =
        "in-depth, about 5-8 minutes long (approx 20+ exchanges)";

    let toneInstruction =
      "Host A is the knowledgeable leader, Host B is the curious co-host.";
    if (tone === "Debate")
      toneInstruction =
        "Host A and Host B should have opposing views. Host A is optimistic, Host B is skeptical.";
    if (tone === "Formal")
      toneInstruction =
        "Both hosts are professional researchers. The tone is academic and precise.";
    if (tone === "Casual")
      toneInstruction =
        "The tone is fun, energetic, and accessible. Use simple analogies.";

    const scriptPrompt = `
      Create a "${tone}" podcast dialogue script between two hosts (Host A and Host B) discussing this research topic:
      Topics: ${JSON.stringify(analysis.topics)}
      Summary: ${analysis.summary}

      Format as JSON List of objects: [{ speaker: "Host A", text: "." }, ...]
      Keep it ${lengthInstruction}.
      ${toneInstruction}
    `;

    const aiRes = await multiAIService.generateContent(
      scriptPrompt,
      "gemini-3.1-flash-lite-preview",
    );
    let script = [];
    try {
      const cleaned = aiRes.content.replace(/```json/g, "").replace(/```/g, "");
      script = JSON.parse(cleaned);
    } catch (e) {
      console.error("[AudioGen] JSON parse error", e);
      throw new Error("Failed to generate valid script JSON");
    }

    // 3. Synthesize Audio
    const audioBuffer = await elevenLabsService.generatePodcastAudio(script);

    if (!audioBuffer) {
      throw new Error("ElevenLabs failed to generate audio buffer");
    }

    // 4. Upload
    const fileName = `podcast-${projectId}-${Date.now()}.mp3`;
    const uploadRes = await SupabaseStorageService.uploadFile(
      audioBuffer,
      fileName,
      "audio/mpeg",
      userId,
      { projectId, description: "Audio Overview" },
    );

    // 5. Success Update
    await prisma.generatedAudio.update({
      where: { project_id: projectId },
      data: {
        status: "completed",
        audio_url: uploadRes.url,
        script: script,
        provider: "elevenlabs",
        title: `Audio Overview: ${tone}`,
      },
    });

    // Auto-save as Note (Audio Transcript)
    try {
      if (userId) {
        let transcript = "*Audio generated successfully.*\n\n";
        if (Array.isArray(script)) {
          transcript += script
            .map((s: any) => `**${s.speaker || "Host"}:** ${s.text}`)
            .join("\n\n");
        }

        await prisma.note.create({
          data: {
            user_id: userId,
            project_id: projectId,
            category: "audio",
            title: `Audio Overview: ${tone}`,
            content: transcript,
            tags: ["studio-generated", "audio"],
            metadata: { audioUrl: uploadRes.url },
          },
        });
        console.log(`[AudioGen] Auto-saved Audio Note for ${projectId}`);
      }
    } catch (noteError) {
      console.error("[AudioGen] Failed to auto-save audio note:", noteError);
    }

    console.log(`[AudioGen] Success for ${projectId}`);
  } catch (err: any) {
    console.error(`[AudioGen] Failed: ${err.message}`);
    await prisma.generatedAudio.update({
      where: { project_id: projectId },
      data: {
        status: "failed",
        failure_reason: err.message || "Unknown error",
      },
    });
  }
}

export default router;
