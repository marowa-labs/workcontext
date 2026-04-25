import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import logger from "../../monitoring/logger";

//GET /api/research/notes?projectId=xxx&category=xxx
export const GET_NOTES = async (req: Request, res: Response) => {
  try {
    const { projectId, category } = req.query;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const whereClause: any = {
      project_id: projectId,
    };

    if (category && typeof category === "string" && category !== "all") {
      whereClause.category = category;
    }

    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        category: true,
        title: true,
        content: true,
        preview_image: true,
        tags: true,
        metadata: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.json({ notes });
  } catch (error) {
    logger.error("Error fetching notes:", error);
    return res.status(500).json({ error: "Failed to fetch notes" });
  }
};

// POST /api/research/notes
export const CREATE_NOTE = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      projectId,
      category,
      title,
      content,
      previewImage,
      tags,
      metadata,
    } = req.body;

    if (!userId || !projectId || !category || !title || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const note = await prisma.note.create({
      data: {
        user_id: userId,
        project_id: projectId,
        category,
        title,
        content,
        preview_image: previewImage || null,
        tags: tags || [],
        metadata: metadata || null,
      },
    });

    return res.status(201).json({ note });
  } catch (error) {
    logger.error("Error creating note:", error);
    return res.status(500).json({ error: "Failed to create note" });
  }
};

// PUT /api/research/notes/:id
export const UPDATE_NOTE = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, tags, metadata } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Note ID is required" });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (metadata !== undefined) updateData.metadata = metadata;

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    return res.json({ note });
  } catch (error) {
    logger.error("Error updating note:", error);
    return res.status(500).json({ error: "Failed to update note" });
  }
};

// DELETE /api/research/notes/:id
export const DELETE_NOTE = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Note ID is required" });
    }

    await prisma.note.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error: any) {
    // Handle specific Prisma error for record not found
    if (error.code === "P2025") {
      logger.warn(`Note not found for deletion: ${req.params.id}`);
      return res.status(404).json({ error: "Note not found" });
    }

    logger.error("Error deleting note:", error);
    return res.status(500).json({ error: "Failed to delete note" });
  }
};
