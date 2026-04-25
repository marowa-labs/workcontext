import express from "express";
import logger from "../../monitoring/logger";
import {
  GET,
  POST,
  PUT,
  DELETE,
  SEARCH_EXTERNAL,
  IMPORT_DOI,
  GET_SETTINGS,
  PUT_SETTINGS,
  GET_ANALYTICS,
  GET_TRENDS,
  POST_SHARE,
  GET_SHARED,
  GET_CITATION_ACCESS,
} from "./route";
import confidenceRouter from "./confidence";
import analysisRouter from "./analysis";

const router = express.Router();

// Mount confidence routes (Feature #2: Citation Confidence Auditor)
router.use(confidenceRouter);

// Mount analysis routes (Feature: Cite Like This / AI Style Matcher)
router.use(analysisRouter);

// Get all citations for a project
router.get("/", async (req, res) => {
  try {
    logger.info("Citation GET route called", {
      url: req.url,
      userId: (req as any).user?.id,
      query: req.query,
      headers: {
        authorization: req.headers.authorization,
        "content-type": req.headers["content-type"],
      },
    });

    // Create a mock request object that matches the Edge function signature
    // Construct a full URL since Edge functions expect a complete URL
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await GET(mockRequest as any);
    const data = await response.json();

    logger.info("Citation GET response", {
      status: response.status,
      userId: (req as any).user?.id,
      projectId: req.query.projectId,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation GET route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new citation
router.post("/", async (req, res) => {
  try {
    logger.info("Citation POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      json: async () => req.body,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    logger.info("Citation POST response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation POST route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update a citation
router.put("/", async (req, res) => {
  try {
    logger.info("Citation PUT route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      json: async () => req.body,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await PUT(mockRequest as any);
    const data = await response.json();

    logger.info("Citation PUT response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation PUT route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a citation
router.delete("/", async (req, res) => {
  try {
    logger.info("Citation DELETE route called", {
      url: req.url,
      userId: (req as any).user?.id,
      query: req.query,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await DELETE(mockRequest as any);
    const data = await response.json();

    logger.info("Citation DELETE response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation DELETE route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Search external databases for citations
router.post("/search-external", async (req, res) => {
  try {
    logger.info("Citation SEARCH_EXTERNAL route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      json: async () => req.body,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await SEARCH_EXTERNAL(mockRequest as any);
    const data = await response.json();

    logger.info("Citation SEARCH_EXTERNAL response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation SEARCH_EXTERNAL route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Import citation by DOI
router.post("/import-doi", async (req, res) => {
  try {
    logger.info("Citation IMPORT_DOI route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      json: async () => req.body,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await IMPORT_DOI(mockRequest as any);
    const data = await response.json();

    logger.info("Citation IMPORT_DOI response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation IMPORT_DOI route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get user citation settings
router.get("/settings", async (req, res) => {
  try {
    logger.info("Citation GET_SETTINGS route called", {
      url: req.url,
      userId: (req as any).user?.id,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await GET_SETTINGS(mockRequest as any);
    const data = await response.json();

    logger.info("Citation GET_SETTINGS response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation GET_SETTINGS route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update user citation settings
router.put("/settings", async (req, res) => {
  try {
    logger.info("Citation PUT_SETTINGS route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      json: async () => req.body,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await PUT_SETTINGS(mockRequest as any);
    const data = await response.json();

    logger.info("Citation PUT_SETTINGS response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation PUT_SETTINGS route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get real-time citation trends
router.get("/trends", async (req, res) => {
  try {
    logger.info("Citation GET_TRENDS route called", {
      url: req.url,
    });

    // Call the handler directly without authentication
    const mockRequest = {
      url: `http://localhost:3001${req.url}`,
      headers: req.headers,
    };

    const response = await GET_TRENDS(mockRequest as any);
    const data = await response.json();

    logger.info("Citation GET_TRENDS response", {
      status: response.status,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation GET_TRENDS route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Add a public route for citation trends that doesn't require authentication
router.get("/trends-public", async (req, res) => {
  try {
    logger.info("Public citation trends route called", {
      url: req.url,
    });

    // Call the handler directly without authentication
    const mockRequest = {
      url: `http://localhost:3001${req.url}`,
      headers: req.headers,
    };

    const response = await GET_TRENDS(mockRequest as any);
    const data = await response.json();

    logger.info("Public citation trends response", {
      status: response.status,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Public citation trends route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get citation analytics
router.get("/analytics", async (req, res) => {
  try {
    logger.info("Citation GET_ANALYTICS route called", {
      url: req.url,
      userId: (req as any).user?.id,
      query: req.query,
    }); // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await GET_ANALYTICS(mockRequest as any);
    const data = await response.json();

    logger.info("Citation GET_ANALYTICS response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation GET_ANALYTICS route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Share a citation
router.post("/share", async (req, res) => {
  try {
    logger.info("Citation POST_SHARE route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      json: async () => req.body,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_SHARE(mockRequest as any);
    const data = await response.json();

    logger.info("Citation POST_SHARE response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation POST_SHARE route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get shared citations
router.get("/shared", async (req, res) => {
  try {
    logger.info("Citation GET_SHARED route called", {
      url: req.url,
      userId: (req as any).user?.id,
      query: req.query,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await GET_SHARED(mockRequest as any);
    const data = await response.json();

    logger.info("Citation GET_SHARED response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation GET_SHARED route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get citation access for a project
router.get("/access/:id", async (req, res) => {
  try {
    const { id: projectId } = req.params;

    logger.info("Citation GET_CITATION_ACCESS route called", {
      projectId,
      userId: (req as any).user?.id,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;
    const mockRequest = {
      url: fullUrl,
      headers: req.headers, // Pass through the original headers
      user: (req as any).user, // Pass through the user object
      // Also add auth object to match what the handler expects
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await GET_CITATION_ACCESS(mockRequest as any, projectId);
    const data = await response.json();

    logger.info("Citation GET_CITATION_ACCESS response", {
      status: response.status,
      userId: (req as any).user?.id,
    });

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Citation GET_CITATION_ACCESS route error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
