import express from "express";
import { GET, POST, PUT, DELETE } from "./route";

const router: express.Router = express.Router();

// Get templates (with optional type filter)
router.get("/", async (req, res) => {
  try {
    // Create a mock request object that matches the Next.js API route signature
    const searchParams = new URLSearchParams(
      req.query as Record<string, string>
    );
    const url = new URL(`http://localhost${req.url}?${searchParams}`);

    // Create a mock NextRequest object
    const mockRequest = {
      url: url.toString(),
      json: async () => ({}),
    } as any;

    const response = await GET(mockRequest);
    const data = await response.json();
    return res.status(response.status || 200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get template by type
router.get("/type/:type", async (req, res) => {
  try {
    // Create a mock request object that matches the Next.js API route signature
    const { type } = req.params;
    const searchParams = new URLSearchParams(
      req.query as Record<string, string>
    );
    const url = new URL(
      `http://localhost/api/templates/type/${type}?${searchParams}`
    );

    // Create a mock NextRequest object
    const mockRequest = {
      url: url.toString(),
      json: async () => ({}),
    } as any;

    const response = await GET(mockRequest);
    const data = await response.json();
    return res.status(response.status || 200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new template
router.post("/", async (req, res) => {
  try {
    // Create a mock request object that matches the Next.js API route signature
    const mockRequest = {
      json: async () => req.body,
      url: `http://localhost${req.url}`,
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();
    return res.status(response.status || 200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update a template
router.put("/", async (req, res) => {
  try {
    // Create a mock request object that matches the Next.js API route signature
    const mockRequest = {
      json: async () => req.body,
      url: `http://localhost${req.url}`,
    } as any;

    const response = await PUT(mockRequest);
    const data = await response.json();
    return res.status(response.status || 200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a template
router.delete("/", async (req, res) => {
  try {
    // Create a mock request object that matches the Next.js API route signature
    const searchParams = new URLSearchParams(
      req.query as Record<string, string>
    );
    const url = new URL(`http://localhost${req.url}?${searchParams}`);

    const mockRequest = {
      url: url.toString(),
      json: async () => ({}),
    } as any;

    const response = await DELETE(mockRequest);
    const data = await response.json();
    return res.status(response.status || 200).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
