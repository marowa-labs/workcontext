import { Router } from "express";
import { GET, PUT, DELETE } from "./route";
import { POST_REQUEST_OTP as REQUEST_OTP_POST } from "./route";

const router: Router = Router();

// Get user account details
router.get("/", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      headers: {
        get: (name: string) => req.headers[name.toLowerCase()],
      },
    };

    const response = await GET(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile or password
router.put("/", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      headers: {
        get: (name: string) => req.headers[name.toLowerCase()],
      },
    };

    const response = await PUT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Request OTP for profile update
router.post("/request-otp", async (req, res) => {
  try {
    // Create a mock request object that matches the Edge function signature
    const mockRequest = {
      json: async () => req.body,
      headers: {
        get: (name: string) => req.headers[name.toLowerCase()],
      },
    };

    const response = await REQUEST_OTP_POST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user account
router.delete("/", async (req, res) => {
  try {
    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object that matches the Edge function signature and includes user info
    const mockRequest = {
      json: async () => req.body,
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === "authorization") {
            return authHeader;
          }
          return req.headers[name.toLowerCase()];
        },
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await DELETE(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
