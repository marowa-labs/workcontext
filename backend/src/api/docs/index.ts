import { Router } from "express";
import { GET } from "./route";

const router: Router = Router();

// Get documentation content by path
router.get("/:docPath", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      params: req.params,
    };

    const response = await GET(mockRequest as any);

    // If it's a direct markdown response, send it as is
    if (response.headers.get("content-type")?.includes("text/markdown")) {
      const content = await response.text();
      res.set("Content-Type", "text/markdown; charset=utf-8");
      return res.send(content);
    }

    // Otherwise parse as JSON
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
