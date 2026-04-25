import { Router } from "express";
import logger from "../../monitoring/logger";
import { authenticateExpressRequest } from "../../middleware/auth";
import { GET, POST } from "./route";
import {
  GET as GET_NOTIFICATION_SETTINGS,
  PUT as PUT_NOTIFICATION_SETTINGS,
} from "./settings/route";
import { POST as POST_NOTIFICATION_SETTINGS_RESET } from "./settings/reset/route";
import { POST as POST_NOTIFICATION_ACTIONS } from "./actions/route";
import {
  POST_REGISTER as POST_PUSH_REGISTER,
  POST_UNREGISTER as POST_PUSH_UNREGISTER,
  POST_TEST as POST_PUSH_TEST,
} from "./push/route";
import {
  POST_READ,
  POST_DELETE,
  POST_DISMISS,
  POST_SNOOZE,
} from "./bulk/route";
import { POST as POST_TEST_NOTIFICATION } from "./test/route";
import { POST as POST_SEND_TEST_NOTIFICATION } from "./test/send-test-notification";

const router: Router = Router();

// Apply authentication middleware to all notification routes
router.use(authenticateExpressRequest);

// Get user notifications
router.get("/", async (req, res) => {
  try {
    logger.info("Notification GET route called", {
      url: req.url,
      userId: (req as any).user?.id,
      query: req.query,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await GET(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Notification GET failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create notification
router.post("/", async (req, res) => {
  try {
    logger.info("Notification POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Add user ID to request body
    const requestBody = {
      ...req.body,
      userId: (req as any).user?.id,
    };

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(requestBody),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Notification POST failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get notification settings
router.get("/settings", async (req, res) => {
  try {
    logger.info("Notification settings GET route called", {
      url: req.url,
      userId: (req as any).user?.id,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await GET_NOTIFICATION_SETTINGS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Notification settings GET failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update notification settings
router.put("/settings", async (req, res) => {
  try {
    logger.info("Notification settings PUT route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(req.body),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await PUT_NOTIFICATION_SETTINGS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Notification settings PUT failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Reset notification settings
router.post("/settings/reset", async (req, res) => {
  try {
    logger.info("Notification settings reset POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_NOTIFICATION_SETTINGS_RESET(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Notification settings reset POST failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Handle notification actions (mark as read, dismiss, snooze)
router.post("/actions", async (req, res) => {
  try {
    logger.info("Notification actions POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(req.body),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_NOTIFICATION_ACTIONS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Notification actions POST failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Register push notification token
router.post("/push/register", async (req, res) => {
  try {
    logger.info("Push notification register POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(req.body),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_PUSH_REGISTER(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Push notification register POST failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Unregister push notification token
router.post("/push/unregister", async (req, res) => {
  try {
    logger.info("Push notification unregister POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(req.body),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_PUSH_UNREGISTER(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Push notification unregister POST failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Test push notification
router.post("/push/test", async (req, res) => {
  try {
    logger.info("Push notification test POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Add user ID to request body
    const requestBody = {
      ...req.body,
      userId: (req as any).user?.id,
    };

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(requestBody),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_PUSH_TEST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Push notification test POST failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk operations routes
router.post("/bulk/read", async (req, res) => {
  try {
    logger.info("Bulk read notifications POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(req.body),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_READ(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Bulk read notifications POST failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/bulk/delete", async (req, res) => {
  try {
    logger.info("Bulk delete notifications POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(req.body),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_DELETE(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Bulk delete notifications POST failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/bulk/dismiss", async (req, res) => {
  try {
    logger.info("Bulk dismiss notifications POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(req.body),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_DISMISS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Bulk dismiss notifications POST failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/bulk/snooze", async (req, res) => {
  try {
    logger.info("Bulk snooze notifications POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(req.body),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_SNOOZE(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Bulk snooze notifications POST failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Test notification routes
router.post("/test", async (req, res) => {
  try {
    logger.info("Test notification POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Add user ID to request body
    const requestBody = {
      ...req.body,
      userId: (req as any).user?.id,
    };

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(requestBody),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    const response = await POST_TEST_NOTIFICATION(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Test notification POST failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Send test notification route
router.post("/test/send", async (req, res) => {
  try {
    logger.info("Send test notification POST route called", {
      url: req.url,
      userId: (req as any).user?.id,
      body: req.body,
    });

    // Add user ID to request body
    const requestBody = {
      ...req.body,
      userId: (req as any).user?.id,
    };

    // Create a mock request object that matches the Edge function signature
    const fullUrl = `http://localhost:3001${req.url}`;

    // Convert express headers to Headers-like object with get method
    const headers = {
      get: (name: string) => req.headers[name.toLowerCase()] || null,
      has: (name: string) => !!req.headers[name.toLowerCase()],
    };

    const mockRequest = {
      url: fullUrl,
      headers,
      json: () => Promise.resolve(requestBody),
      user: (req as any).user,
      auth: (req as any).user ? { userId: (req as any).user.id } : undefined,
    };

    // Call the function with both request and response parameters
    return await POST_SEND_TEST_NOTIFICATION(mockRequest as any, res);
  } catch (error: any) {
    logger.error("Send test notification POST failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
