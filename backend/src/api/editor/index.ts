import express from "express";
import {
  GET,
  PUT,
  GET_VERSIONS,
  POST_COMMENT,
  GET_COMMENTS,
  POST_RESTORE_VERSION,
  GET_SETTINGS,
  PUT_SETTINGS,
  GET_ANALYTICS,
  POST_IMPORT,
  POST_BEACON_DRAFT,
} from "./route";
import { POST_VERSION } from "./version-route";

const router: express.Router = express.Router();
// Get project content
router.get("/", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      url: req.url,
      user: { id: (req as any).user?.id },
    };

    const response = await GET(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Save project content
router.put("/", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await PUT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get document versions/history
router.get("/versions", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      url: req.url,
      user: { id: (req as any).user?.id },
    };

    const response = await GET_VERSIONS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create document version
router.post("/versions", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await POST_VERSION(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Add comment to document
router.post("/comments", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await POST_COMMENT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get comments for document
router.get("/comments", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      url: req.url,
      user: { id: (req as any).user?.id },
    };

    const response = await GET_COMMENTS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Restore document version
router.post("/restore-version", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await POST_RESTORE_VERSION(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get editor settings
router.get("/settings", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      url: req.url,
      user: { id: (req as any).user?.id },
    };

    const response = await GET_SETTINGS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update editor settings
router.put("/settings", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await PUT_SETTINGS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get editor analytics
router.get("/analytics", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      url: req.url,
      user: { id: (req as any).user?.id },
    };

    const response = await GET_ANALYTICS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Handle beacon draft
router.post("/beacon-draft", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await POST_BEACON_DRAFT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Import document
router.post("/import", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await POST_IMPORT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
