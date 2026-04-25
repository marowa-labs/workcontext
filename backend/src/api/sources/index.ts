import { Request, Response, Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { SourceService } from "../../services/sourceService";
import { PaperDiscoveryService } from "../../services/paperDiscoveryService";
import { WebSearchService } from "../../services/webSearchService";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads", "sources");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, can be restricted later
    cb(null, true);
  },
});

// GET /api/sources - Get all sources for a project
router.get("/", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId } = req.query;
    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const sources = await SourceService.getProjectSources(projectId, userId);
    return res.json({ success: true, sources });
  } catch (error: any) {
    logger.error("Error fetching sources:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch sources" });
  }
});

// POST /api/sources/upload - Upload files
router.post(
  "/upload",
  authenticateExpressRequest,
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const sources = await SourceService.addFileSources(
        projectId,
        userId,
        files.map((f) => ({
          originalname: f.originalname,
          filename: f.filename,
          path: f.path,
          size: f.size,
          mimetype: f.mimetype,
        }))
      );

      return res.json({ success: true, sources });
    } catch (error: any) {
      logger.error("Error uploading files:", error);
      return res.status(500).json({ error: error.message || "Failed to upload files" });
    }
  }
);

// POST /api/sources/web - Add website URL
router.post("/web", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, url, title } = req.body;
    if (!projectId || !url) {
      return res.status(400).json({ error: "Project ID and URL are required" });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const source = await SourceService.addUrlSource(projectId, userId, url, title);
    return res.json({ success: true, source });
  } catch (error: any) {
    logger.error("Error adding web source:", error);
    return res.status(500).json({ error: error.message || "Failed to add web source" });
  }
});

// POST /api/sources/text - Add text content
router.post("/text", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, content, title } = req.body;
    if (!projectId || !content) {
      return res.status(400).json({ error: "Project ID and content are required" });
    }

    const source = await SourceService.addTextSource(projectId, userId, content, title);
    return res.json({ success: true, source });
  } catch (error: any) {
    logger.error("Error adding text source:", error);
    return res.status(500).json({ error: error.message || "Failed to add text source" });
  }
});

// POST /api/sources/search - Search web for sources
router.post("/search", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { query, maxResults = 10 } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const results = await WebSearchService.search(query, maxResults);
    return res.json({ success: true, results });
  } catch (error: any) {
    logger.error("Error searching web:", error);
    return res.status(500).json({ error: error.message || "Failed to search web" });
  }
});

// POST /api/sources/web/save - Save selected web search results
router.post("/web/save", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, sources } = req.body;
    if (!projectId || !sources || !Array.isArray(sources)) {
      return res.status(400).json({ error: "Project ID and sources array are required" });
    }

    const savedSources = await SourceService.saveWebSources(projectId, userId, sources);
    return res.json({ success: true, sources: savedSources });
  } catch (error: any) {
    logger.error("Error saving web sources:", error);
    return res.status(500).json({ error: error.message || "Failed to save web sources" });
  }
});

// DELETE /api/sources/:id - Delete a source
router.delete("/:id", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Source ID is required" });
    }

    await SourceService.deleteSource(id as string, userId);
    return res.json({ success: true });
  } catch (error: any) {
    logger.error("Error deleting source:", error);
    return res.status(500).json({ error: error.message || "Failed to delete source" });
  }
});

// PATCH /api/sources/:id - Update a source
router.patch("/:id", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Source ID is required" });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const updatedSource = await SourceService.updateSource(id as string, userId, { title });
    return res.json({ success: true, source: updatedSource });
  } catch (error: any) {
    logger.error("Error updating source:", error);
    return res.status(500).json({ error: error.message || "Failed to update source" });
  }
});

// POST /api/projects/sources/import - Import sources from other projects
router.post("/projects/import", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, fromProjectIds } = req.body;
    if (!projectId || !fromProjectIds || !Array.isArray(fromProjectIds)) {
      return res.status(400).json({ error: "Project ID and fromProjectIds array are required" });
    }

    const importedSources = await SourceService.importSourcesFromProjects(
      projectId,
      userId,
      fromProjectIds
    );
    return res.json({ success: true, sources: importedSources });
  } catch (error: any) {
    logger.error("Error importing sources:", error);
    return res.status(500).json({ error: error.message || "Failed to import sources" });
  }
});

// POST /api/projects/sources/add - Add existing sources to project (from library)
router.post("/projects/add", authenticateExpressRequest, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { projectId, sourceIds } = req.body;
    if (!projectId || !sourceIds || !Array.isArray(sourceIds)) {
      return res.status(400).json({ error: "Project ID and sourceIds array are required" });
    }

    const addedSources = await SourceService.addSourcesToProject(projectId, userId, sourceIds);
    return res.json({ success: true, sources: addedSources });
  } catch (error: any) {
    logger.error("Error adding sources to project:", error);
    return res.status(500).json({ error: error.message || "Failed to add sources" });
  }
});

export default router;
