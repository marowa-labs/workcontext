import express, { type Request, type Response } from "express";
import { authenticateExpressRequest } from "../../middleware/auth";
import { MeetingTranscriptService } from "../../services/meetingTranscriptService";
import { DecisionService } from "../../services/decisionService";
import { ActivityFeedService } from "../../services/activityFeedService";
import { AutoSummaryService } from "../../services/autoSummaryService";

const memoryRouter = express.Router();

// All memory routes require authentication
memoryRouter.use(authenticateExpressRequest);

// ============================================================
// MEETING TRANSCRIPTS
// ============================================================

// Upload a transcript
memoryRouter.post("/transcripts", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      workspace_id,
      title,
      source,
      external_url,
      content,
      duration_min,
      participants,
      meeting_date,
    } = req.body;

    if (!workspace_id || !title || !content) {
      return res.status(400).json({
        error: "workspace_id, title, and content are required",
      });
    }

    const transcript = await MeetingTranscriptService.uploadTranscript({
      userId: user.id,
      workspaceId: workspace_id,
      title,
      source: source || "manual",
      externalUrl: external_url,
      content,
      durationMin: duration_min,
      participants,
      meetingDate: meeting_date,
    });

    res.json(transcript);
  } catch (error) {
    console.error("Failed to upload transcript:", error);
    res.status(500).json({ error: "Failed to upload transcript" });
  }
});

// Analyze a transcript with AI
memoryRouter.post("/transcripts/:id/analyze", async (req: Request, res: Response) => {
  try {
    const analysis = await MeetingTranscriptService.analyzeTranscript(req.params.id as string);
    res.json(analysis);
  } catch (error) {
    console.error("Failed to analyze transcript:", error);
    res.status(500).json({ error: "Failed to analyze transcript" });
  }
});

// List transcripts
memoryRouter.get("/transcripts", async (req: Request, res: Response) => {
  try {
    const { workspace_id, source, limit, offset } = req.query;

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" });
    }

    const result = await MeetingTranscriptService.getTranscripts(
      workspace_id as string,
      {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        source: source as string,
      }
    );

    res.json(result);
  } catch (error) {
    console.error("Failed to list transcripts:", error);
    res.status(500).json({ error: "Failed to list transcripts" });
  }
});

// Get single transcript
memoryRouter.get("/transcripts/:id", async (req: Request, res: Response) => {
  try {
    const transcript = await MeetingTranscriptService.getTranscript(req.params.id as string);
    if (!transcript) {
      return res.status(404).json({ error: "Transcript not found" });
    }
    res.json(transcript);
  } catch (error) {
    console.error("Failed to get transcript:", error);
    res.status(500).json({ error: "Failed to get transcript" });
  }
});

// Delete a transcript
memoryRouter.delete("/transcripts/:id", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await MeetingTranscriptService.deleteTranscript(req.params.id as string, user.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete transcript:", error);
    res.status(500).json({ error: "Failed to delete transcript" });
  }
});

// ============================================================
// DECISIONS / ACTION ITEMS
// ============================================================

// Create a decision
memoryRouter.post("/decisions", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      workspace_id,
      project_id,
      transcript_id,
      type,
      title,
      description,
      assignee,
      priority,
      status,
      due_date,
      source_url,
      source_tool,
    } = req.body;

    if (!workspace_id || !type || !title || !description) {
      return res.status(400).json({
        error: "workspace_id, type, title, and description are required",
      });
    }

    const decision = await DecisionService.create({
      userId: user.id,
      workspaceId: workspace_id,
      projectId: project_id,
      transcriptId: transcript_id,
      type,
      title,
      description,
      assignee,
      priority,
      status,
      dueDate: due_date,
      sourceUrl: source_url,
      sourceTool: source_tool,
    });

    res.json(decision);
  } catch (error) {
    console.error("Failed to create decision:", error);
    res.status(500).json({ error: "Failed to create decision" });
  }
});

// Update a decision
memoryRouter.put("/decisions/:id", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, assignee, priority, status, due_date } = req.body;

    const decision = await DecisionService.update(req.params.id as string, user.id, {
      title,
      description,
      assignee,
      priority,
      status,
      dueDate: due_date,
    });

    res.json(decision);
  } catch (error) {
    console.error("Failed to update decision:", error);
    res.status(500).json({ error: "Failed to update decision" });
  }
});

// List decisions
memoryRouter.get("/decisions", async (req: Request, res: Response) => {
  try {
    const {
      workspace_id,
      project_id,
      type,
      status,
      assignee,
      priority,
      search,
      limit,
      offset,
    } = req.query;

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" });
    }

    const result = await DecisionService.list({
      workspaceId: workspace_id as string,
      projectId: project_id as string,
      type: type as string,
      status: status as string,
      assignee: assignee as string,
      priority: priority as string,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to list decisions:", error);
    res.status(500).json({ error: "Failed to list decisions" });
  }
});

// Get single decision
memoryRouter.get("/decisions/:id", async (req: Request, res: Response) => {
  try {
    const decision = await DecisionService.get(req.params.id as string);
    if (!decision) {
      return res.status(404).json({ error: "Decision not found" });
    }
    res.json(decision);
  } catch (error) {
    console.error("Failed to get decision:", error);
    res.status(500).json({ error: "Failed to get decision" });
  }
});

// Delete a decision
memoryRouter.delete("/decisions/:id", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await DecisionService.delete(req.params.id as string, user.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete decision:", error);
    res.status(500).json({ error: "Failed to delete decision" });
  }
});

// Get decision stats
memoryRouter.get("/decisions/stats/overview", async (req: Request, res: Response) => {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" });
    }
    const stats = await DecisionService.getStats(workspace_id as string);
    res.json(stats);
  } catch (error) {
    console.error("Failed to get decision stats:", error);
    res.status(500).json({ error: "Failed to get decision stats" });
  }
});

// ============================================================
// ACTIVITY FEED
// ============================================================

// Get activity feed
memoryRouter.get("/activity", async (req: Request, res: Response) => {
  try {
    const {
      workspace_id,
      project_id,
      user_id,
      entity_type,
      action,
      start_date,
      end_date,
      limit,
      offset,
    } = req.query;

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" });
    }

    const result = await ActivityFeedService.getFeed({
      workspaceId: workspace_id as string,
      projectId: project_id as string,
      userId: user_id as string,
      entityType: entity_type as string,
      action: action as string,
      startDate: start_date as string,
      endDate: end_date as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to get activity feed:", error);
    res.status(500).json({ error: "Failed to get activity feed" });
  }
});

// Get activity stats
memoryRouter.get("/activity/stats", async (req: Request, res: Response) => {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" });
    }
    const stats = await ActivityFeedService.getStats(workspace_id as string);
    res.json(stats);
  } catch (error) {
    console.error("Failed to get activity stats:", error);
    res.status(500).json({ error: "Failed to get activity stats" });
  }
});

// ============================================================
// AUTO SUMMARIES
// ============================================================

// Generate a summary
memoryRouter.post("/summaries/generate", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      workspace_id,
      project_id,
      summary_type,
      title,
      custom_prompt,
      date_range,
    } = req.body;

    if (!workspace_id || !summary_type) {
      return res.status(400).json({
        error: "workspace_id and summary_type are required",
      });
    }

    const summary = await AutoSummaryService.generate({
      userId: user.id,
      workspaceId: workspace_id,
      projectId: project_id,
      summaryType: summary_type,
      title,
      customPrompt: custom_prompt,
      dateRange: date_range,
    });

    res.json(summary);
  } catch (error) {
    console.error("Failed to generate summary:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// List summaries
memoryRouter.get("/summaries", async (req: Request, res: Response) => {
  try {
    const { workspace_id, project_id, summary_type, limit, offset } = req.query;

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" });
    }

    const result = await AutoSummaryService.getSummaries(workspace_id as string, {
      projectId: project_id as string,
      summaryType: summary_type as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to list summaries:", error);
    res.status(500).json({ error: "Failed to list summaries" });
  }
});

// Get single summary
memoryRouter.get("/summaries/:id", async (req: Request, res: Response) => {
  try {
    const summary = await AutoSummaryService.getSummary(req.params.id as string);
    if (!summary) {
      return res.status(404).json({ error: "Summary not found" });
    }
    res.json(summary);
  } catch (error) {
    console.error("Failed to get summary:", error);
    res.status(500).json({ error: "Failed to get summary" });
  }
});

// Toggle pin on summary
memoryRouter.put("/summaries/:id/pin", async (req: Request, res: Response) => {
  try {
    const summary = await AutoSummaryService.togglePin(req.params.id as string);
    res.json(summary);
  } catch (error) {
    console.error("Failed to toggle pin:", error);
    res.status(500).json({ error: "Failed to toggle pin" });
  }
});

// Delete a summary
memoryRouter.delete("/summaries/:id", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await AutoSummaryService.deleteSummary(req.params.id as string, user.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete summary:", error);
    res.status(500).json({ error: "Failed to delete summary" });
  }
});

export { memoryRouter };
