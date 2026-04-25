import { Router } from "express";
import {
  GET_STORAGE,
  POST_CLEANUP,
  POST_ANALYZE,
  GET_BREAKDOWN,
  POST_MONITOR,
} from "./route";

const router: Router = Router();

// Get storage information
router.get("/storage", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      user: { id: (req as any).user?.id },
    };

    const response = await GET_STORAGE(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Error in /storage endpoint:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Clean up storage
router.post("/cleanup", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await POST_CLEANUP(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Error in /cleanup endpoint:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Analyze storage usage
router.post("/analyze", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await POST_ANALYZE(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Error in /analyze endpoint:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get detailed storage breakdown
router.get("/breakdown", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      user: { id: (req as any).user?.id },
    };

    const response = await GET_BREAKDOWN(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Error in /breakdown endpoint:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Monitor storage thresholds
router.post("/monitor", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      user: { id: (req as any).user?.id },
    };

    const response = await POST_MONITOR(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Error in /monitor endpoint:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
