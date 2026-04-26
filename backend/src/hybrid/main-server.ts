import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import logger from "../monitoring/logger";
import { metrics, metricsMiddleware } from "../monitoring/metrics";
import { scheduleCleanupTask } from "../scheduledTasks/cleanupExpiredItems";
import { scheduleVersionCleanupTask } from "../scheduledTasks/versionCleanupTask";
import { scheduleVersionSchedulingTask } from "../scheduledTasks/versionSchedulingTask";
import { scheduleTaskReminderTask } from "../scheduledTasks/taskReminderTask";

// Load environment variables
dotenv.config();

// Initialize environment variables from secrets
let nodeEnv: string = "development"; // Default value

// Async function to initialize node environment from secrets
async function initializeNodeEnv() {
  try {
    const env = await SecretsService.getNodeEnv();
    nodeEnv = env || "development"; // Ensure we always have a string value
  } catch (error) {
    console.error("Error initializing NODE_ENV from secrets:", error);
    nodeEnv = "development"; // fallback to default
  }
}

// Initialize the node environment
initializeNodeEnv();

// Initialize app URL from secrets
let appUrl: string = "http://localhost:3000"; // Default value

// Async function to initialize app URL from secrets
async function initializeAppUrl() {
  try {
    const url = await SecretsService.getAppUrl();
    appUrl = url || "http://localhost:3000"; // Ensure we always have a string value
  } catch (error) {
    console.error("Error initializing APP_URL from secrets:", error);
    appUrl = "http://localhost:3000"; // fallback to default
  }
}

// Initialize the app URL
initializeAppUrl();

// Import hybrid components
import { AuthService } from "./supabase/auth-service";

import { supabase } from "./supabase/auth-service";
import { OTPService } from "../services/otpService";
import { getNotificationServer } from "../lib/notificationServer";
// Prisma client is imported dynamically in functions to avoid conflicts
// Import auth middleware
import { authenticateExpressRequest } from "../middleware/auth";
import { SecretsService } from "../services/secrets-service";

// Import collaboration server
import { HocuspocusCollaborationServer } from "./websockets/hocuspocus-server";

// Import routers
import aiRouter from "../api/ai/route";
import billingRouter from "../api/billing/route";
import recycleBinRouter from "../api/recyclebin/route";
import projectsRouter from "../api/projects/index";
import feedbackRouter from "../api/feedback/index";
import notificationsRouter from "../api/notifications/index";
import authRouter from "../api/auth/index";
import subscriptionRoutes from "../api/subscription/route";
import teamChatRouter from "../api/team-chat/route";
import docsRouter from "../api/docs/index";
import templatesRouter from "../api/templates/index";
import usersRouter from "../api/users/index";
import dataRouter from "../api/data/index";
import workspacesRouter from "../api/workspaces/index";
import backupRouter from "../api/backup/index";
import searchRouter from "../api/search/index";
// Additional utility imports

// Import AI routes
import aiSearchRouter from "../api/ai/search-route";

// Import new AI capability routes
import { setupGrammarRoute } from "../api/ai/grammar-route";
import { POST as summarizationPOST } from "../api/ai/summarization-route";
import { POST as documentQaPOST } from "../api/ai/document-qa-route";

// Import support ticket service
import { SupportTicketService } from "../services/SupportTicketService";

// Import feature request service
import { handleSimpleFeatureRequest } from "../api/feature-requests/simple-feature-request-route";
import { POST as writingProjectPOST } from "../api/ai/writing-project-route";

const app: Application = express();

// Initialize PORT using SecretsService
let PORT: number = 3001; // Default value

// Async function to initialize PORT from secrets
async function initializePort() {
  try {
    const portStr = await SecretsService.getBackendUrl();
    let newPort = 3001;
    if (portStr) {
      // If it's a URL, parse it
      if (portStr.startsWith("http")) {
        try {
          const url = new URL(portStr);
          newPort = parseInt(url.port || "3001", 10);
        } catch (e) {
          newPort = 3001;
        }
      } else {
        // Otherwise assume it's a number string
        newPort = parseInt(portStr, 10);
      }
    }
    if (isNaN(newPort)) newPort = 3001;
    PORT = newPort;
    console.log(`Starting server on port ${PORT}`);
  } catch (error) {
    console.error("Error initializing PORT from secrets:", error);
    PORT = 3001; // fallback to default
    console.log(`Starting server on default port ${PORT}`);
  }
}

// Initialize the port
initializePort();

// Authentication middleware for Express
const authMiddleware = authenticateExpressRequest;

// Start Scheduled Tasks
scheduleCleanupTask();
scheduleVersionCleanupTask();
scheduleVersionSchedulingTask();
scheduleTaskReminderTask();

// Middleware
let frontendUrl: string = "http://localhost:3000"; // Default value

// Async function to initialize frontend URL from secrets
async function initializeFrontendUrl() {
  try {
    const url = await SecretsService.getFrontendUrl();
    frontendUrl = url || "http://localhost:3000"; // Ensure we always have a string value
  } catch (error) {
    console.error("Error initializing FRONTEND_URL from secrets:", error);
    frontendUrl = "http://localhost:3000"; // fallback to default
  }
}

// Initialize the frontend URL
initializeFrontendUrl();

app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow any origin
      if (nodeEnv === "development") {
        callback(null, true);
      } else {
        // In production, only allow specific origins
        const allowedOrigins = [frontendUrl, "file://"];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
  }),
);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log("=== REQUEST DEBUG ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Original URL:", req.originalUrl);
  console.log("Path:", req.path);
  console.log("Headers:", req.headers);
  res.on("finish", () => {
    console.log("=== RESPONSE DEBUG ===");
    console.log("Status Code:", res.statusCode);
    console.log("Headers:", res.getHeaders());
  });
  next();
});
app.use(express.json({ limit: "50mb" }));
app.use(metricsMiddleware);

// Enhanced error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error", {
    error: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: nodeEnv === "development" ? err.message : undefined,
  });
  next(err);
});

// Register API routers
app.use("/api/projects", projectsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/recyclebin", recycleBinRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/auth", authRouter);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/team-chat", teamChatRouter);
app.use("/api/docs", docsRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/users", usersRouter);
app.use("/api/workspaces", workspacesRouter);
app.use("/api/backup", backupRouter);
app.use("/api/search", searchRouter);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    const { prisma } = await import("../lib/prisma");
    await prisma.$queryRaw`SELECT 1`;

    const healthData = {
      status: "OK",
      timestamp: new Date().toISOString(),
      services: {
        auth: "Supabase Auth",
        database: "PostgreSQL",
        otp: "Edge Functions",
        fileProcessing: "Serverless Functions",
        ai: "Microservices",
        collaboration: "WebSocket Server",
        notifications: "WebSocket Server",
      },
      metrics: metrics.getSummary(),
    };

    logger.info("Health check", healthData);
    res.json(healthData);
    return healthData;
  } catch (error: any) {
    logger.error("Health check failed", { error: error.message });

    const healthData = {
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        auth: "Supabase Auth",
        database: "PostgreSQL - ERROR",
        otp: "Edge Functions",
        fileProcessing: "Serverless Functions",
        ai: "Microservices",
        collaboration: "WebSocket Server",
        notifications: "WebSocket Server",
      },
      metrics: metrics.getSummary(),
    };

    res.status(500).json(healthData);
    return healthData;
  }
});

// Test endpoint to verify billing route functionality
app.get("/api/test-billing-functionality", async (req, res) => {
  try {
    // Import the subscription service directly
    const { SubscriptionService } =
      await import("../services/subscriptionService");

    // Use a known user ID to test
    const testUserId = "1c3e6b81-cf15-4cf8-a9e3-043649c4010c";

    // Call the getUserPlanInfo method directly
    const subscriptionInfo =
      await SubscriptionService.getUserPlanInfo(testUserId);

    res.json({ success: true, subscriptionInfo });
  } catch (error: any) {
    logger.error("Error testing billing functionality:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test endpoint to check subscription data
app.get("/api/test-subscription", async (req, res) => {
  try {
    // Import Prisma client
    const { prisma } = await import("../lib/prisma");

    // Get all subscriptions from the database
    const subscriptions = await prisma.subscription.findMany({
      take: 10,
    });

    res.json({ success: true, subscriptions });
  } catch (error: any) {
    logger.error("Error fetching subscriptions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test endpoint to verify authentication and subscription fetching
app.get("/api/test-auth-subscription", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    logger.info("Test auth subscription request", { userId });

    // Import the subscription service
    const { SubscriptionService } =
      await import("../services/subscriptionService");

    // Try to fetch subscription info
    const subscriptionInfo = await SubscriptionService.getUserPlanInfo(userId);

    logger.info("Successfully fetched subscription info", { userId });

    return res.json({
      success: true,
      message: "Authentication and subscription fetch successful",
      userId,
      subscriptionInfo,
    });
  } catch (error: any) {
    logger.error("Test auth subscription failed", {
      error: error.message,
      stack: error.stack,
      userId: (req as any).user?.id,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
      error: nodeEnv === "development" ? error.message : undefined,
    });
  }
});

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const body = req.body;

    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: "All fields are required: name, email, subject, message",
      });
    }

    // Import the ContactService
    const { ContactService } = await import("../services/contactService");

    // Process the contact form submission
    const result = await ContactService.handleContactSubmission({
      name,
      email,
      subject,
      message,
    });

    return res.status(200).json({
      message: "Your message has been sent successfully",
      result,
    });
  } catch (error: any) {
    logger.error("Error processing contact form:", error);

    return res.status(500).json({
      error: error.message || "Failed to process contact form submission",
    });
  }
});

// Demo request endpoint
app.post("/api/contact/demo", async (req, res) => {
  try {
    const body = req.body;

    const { name, email, institution, role, date, time, message } = body;

    // Validate required fields
    if (!name || !email || !institution || !date || !time) {
      return res.status(400).json({
        error:
          "Missing required fields: name, email, institution, date, and time are required",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Import the DemoRequestService
    const { DemoRequestService } =
      await import("../services/demoRequestService");

    // Get client IP and user agent
    const ip_address =
      req.ip ||
      (req.headers["x-forwarded-for"] as string) ||
      (req.headers["x-real-ip"] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).remoteAddress;

    const user_agent = req.headers["user-agent"] as string;

    // Create the demo request in the database
    const demoRequest = await DemoRequestService.createDemoRequest({
      name,
      email,
      institution,
      role,
      date,
      time,
      message,
      ip_address,
      user_agent,
    });

    // Send the demo request to Discord webhook
    try {
      await DemoRequestService.sendToDiscordWebhook(demoRequest);
    } catch (webhookError) {
      logger.error(
        "Failed to send demo request to Discord webhook:",
        webhookError,
      );
      // Don't fail the request if webhook fails, just log the error
    }

    return res.status(200).json({
      message: "Demo request submitted successfully",
      demoRequestId: demoRequest.id,
    });
  } catch (error: any) {
    logger.error("Error processing demo request:", error);

    return res.status(500).json({
      error: error.message || "Failed to process demo request",
    });
  }
});

// Feature request endpoint
app.post("/api/contact/feature-request", async (req, res) => {
  try {
    const body = req.body;

    const {
      featureTitle,
      featureDescription,
      useCase,
      category,
      priority,
      email,
    } = body;

    // Validate required fields
    if (
      !featureTitle ||
      !featureDescription ||
      !useCase ||
      !category ||
      !priority
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: featureTitle, featureDescription, useCase, category, and priority are required",
      });
    }

    // Validate category and priority values
    const validCategories = [
      "writing",
      "ai",
      "citations",
      "collaboration",
      "organization",
      "integration",
      "other",
    ];
    const validPriorities = ["nice-to-have", "important", "critical"];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    // Import the FeatureRequestService
    const { FeatureRequestService } =
      await import("../services/featureRequestService");

    // Get client IP and user agent
    const ip_address =
      req.ip ||
      (req.headers["x-forwarded-for"] as string) ||
      (req.headers["x-real-ip"] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).remoteAddress;

    const user_agent = req.headers["user-agent"] as string;

    // Create the feature request in the database
    const featureRequest = await FeatureRequestService.createFeatureRequest({
      featureTitle,
      featureDescription,
      useCase,
      category,
      priority,
      email,
      ip_address,
      user_agent,
    });

    // Send the feature request to Discord webhook
    try {
      await FeatureRequestService.sendToDiscordWebhook(featureRequest);
    } catch (webhookError) {
      logger.error(
        "Failed to send feature request to Discord webhook:",
        webhookError,
      );
      // Don't fail the request if webhook fails, just log the error
    }

    return res.status(200).json({
      message: "Feature request submitted successfully",
      featureRequestId: featureRequest.id,
    });
  } catch (error: any) {
    logger.error("Error processing feature request:", error);

    return res.status(500).json({
      error: error.message || "Failed to process feature request",
    });
  }
});

// Simple feature request endpoint for Help.tsx
app.post("/api/feature-request/simple", handleSimpleFeatureRequest);

// Support ticket endpoint
app.post("/api/support-ticket", async (req, res) => {
  try {
    const body = req.body;

    const {
      subject,
      message,
      priority,
      attachmentUrl,
      browserInfo,
      osInfo,
      screenSize,
      userPlan,
    } = body;

    // Validate required fields
    if (!subject || !message) {
      return res.status(400).json({
        error: "Subject and message are required",
      });
    }

    // Validate priority if provided
    const validPriorities = ["normal", "high", "urgent"];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }

    // Get client IP and user agent
    const ip_address =
      req.ip ||
      (req.headers["x-forwarded-for"] as string) ||
      (req.headers["x-real-ip"] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).remoteAddress;

    const user_agent = req.headers["user-agent"] as string;

    // Get authenticated user if available (user may be null if not authenticated)
    // This route can be accessed by both authenticated and non-authenticated users
    let userId = null;
    try {
      // Attempt to get user ID if request has been authenticated
      userId = (req as any).user?.id || null;
    } catch {
      // If user property doesn't exist, userId remains null
      userId = null;
    }

    // Create the support ticket in the database
    const supportTicket = await SupportTicketService.createSupportTicket({
      user_id: userId,
      subject,
      message,
      priority: priority || "normal",
      attachment_url: attachmentUrl || null,
      browser_info: browserInfo || null,
      os_info: osInfo || null,
      screen_size: screenSize || null,
      user_plan: userPlan || null,
      ip_address,
      user_agent,
    });

    return res.status(200).json({
      success: true,
      message: "Support ticket submitted successfully",
      ticketId: supportTicket.id,
    });
  } catch (error: any) {
    logger.error("Error processing support ticket:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process support ticket",
    });
  }
});

// Authentication endpoints
app.post("/api/auth/hybrid/signup", async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      phone_number,
      otp_method,
      user_type,
      field_of_study,
      selected_plan,
    } = req.body;

    logger.info("Signup request received:", {
      email,
      full_name,
      phone_number,
      otp_method,
      user_type,
      field_of_study,
      selected_plan,
    });

    // Sign up the user with Supabase Auth WITHOUT emailRedirectTo to prevent automatic email verification
    const client = await supabase;
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone_number,
          otp_method,
          user_type,
          field_of_study,
        },
        // Remove emailRedirectTo to prevent Supabase from sending its own verification email
      },
    });

    logger.info("Supabase signup response:", { data, error });

    if (error) {
      logger.error("Supabase signup error:", error);

      // Handle the specific case where user already exists
      if (error.code === "user_already_exists") {
        return res.status(400).json({
          success: false,
          message:
            "A user with this email is already registered. Please sign in instead.",
          code: "user_already_exists",
        });
      }

      return res.status(400).json({ success: false, message: error.message });
    }

    // If signup is successful, handle both cases:
    // 1. User created but needs confirmation (data.user exists)
    // 2. User already confirmed (data.session exists)
    if (data.user) {
      logger.info("User created, needs confirmation:", data.user);

      try {
        // Import Prisma and services
        const { prisma } = await import("../lib/prisma");
        const { SubscriptionService } =
          await import("../services/subscriptionService");

        // Determine the correct storage limit based on the selected plan
        let storageLimit = 0.1; // Default to 0.1GB (100MB) for free plan
        if (selected_plan === "student") {
          storageLimit = 5; // 5GB for student plan
        } else if (selected_plan === "researcher") {
          storageLimit = 100; // 100GB for researcher plan
        }

        // Store additional user data in the Prisma database with correct storage limit
        const prismaUser = await prisma.user.create({
          data: {
            id: data.user.id,
            email: email,
            full_name: full_name || null,
            phone_number: phone_number || null,
            otp_method: otp_method || null,
            user_type: user_type || null,
            field_of_study: field_of_study || null,
            selected_plan: selected_plan || null,
            storage_limit: storageLimit, // Set the correct storage limit based on plan
          },
        } as any); // Using 'as any' to bypass TypeScript error for now

        logger.info("User data stored in Prisma database:", prismaUser);

        // Create subscription if a plan was selected
        if (selected_plan && selected_plan !== "free") {
          try {
            const subscription = await SubscriptionService.syncSubscription({
              userId: data.user.id,
              planId: selected_plan,
              status: "active", // Default to active for new subscriptions
              currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
            });
            logger.info("Subscription created/updated:", subscription);
          } catch (subscriptionError: any) {
            logger.error("Error creating subscription:", subscriptionError);
          }
        } else if (selected_plan === "free" || !selected_plan) {
          // Ensure free users have a subscription record
          try {
            const subscription = await SubscriptionService.syncSubscription({
              userId: data.user.id,
              planId: "free",
              status: "active",
              currentPeriodEnd: undefined,
            });
            logger.info("Free subscription created/updated:", subscription);
          } catch (subscriptionError: any) {
            logger.error(
              "Error creating free subscription:",
              subscriptionError,
            );
          }
        }
      } catch (prismaError: any) {
        logger.error("Error storing user data in Prisma:", prismaError);
        // Don't fail the signup if Prisma storage fails, but log the error
      }

      // Send OTP using our custom service
      try {
        const { OTPService } = await import("../services/otpService");
        logger.info("Sending OTP for user:", data.user.id);
        const otpSent = await OTPService.sendOTP(
          data.user.id,
          email,
          phone_number || "", // Ensure string value
          otp_method,
          full_name,
        );
        logger.info("OTP send result:", otpSent);

        if (!otpSent) {
          logger.warn("Failed to send OTP, but user was created");
        }
      } catch (otpError: any) {
        logger.error("Error sending OTP:", otpError);
      }

      return res.json({
        success: true,
        message:
          "User created successfully. Please check your email or phone for the verification code.",
        user: data.user,
      });
    } else if (data.session) {
      logger.info("User already confirmed:", data.session.user);

      // This case shouldn't happen with proper email confirmation settings,
      // but we'll handle it just in case
      return res.json({
        success: true,
        message: "User already confirmed.",
        user: data.session.user,
      });
    } else {
      logger.log("Unexpected signup response:", data);
      return res.status(400).json({
        success: false,
        message: "Unexpected signup response",
      });
    }
  } catch (error: any) {
    logger.error("Signup error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// OAuth signup endpoint - registers OAuth users in database and sends OTP
app.post("/api/auth/hybrid/oauth-signup", async (req, res) => {
  try {
    const { id, email, fullName, provider } = req.body;

    logger.info("OAuth signup request received:", { id, email, provider });

    // Validate required fields
    if (!id || !email) {
      return res.status(400).json({
        success: false,
        message: "User ID and email are required",
      });
    }

    // Import services
    const { prisma } = await import("../lib/prisma");
    const { SubscriptionService } =
      await import("../services/subscriptionService");
    const { OTPService } = await import("../services/otpService");

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (existingUser) {
      // User already registered, check if survey completed
      if (existingUser.survey_completed) {
        logger.info("OAuth user already fully registered", { id });
        return res.json({
          success: true,
          message: "User already registered",
          alreadyRegistered: true,
        });
      }
      // User exists but hasn't completed survey, continue flow
      logger.info("OAuth user exists, continuing signup flow", { id });
    } else {
      // Create user in database
      const defaultPlan = "free"; // OAuth users default to free plan
      const storageLimit = 0.1; // 100MB for free plan

      const prismaUser = await prisma.user.create({
        data: {
          id: id,
          email: email,
          full_name: fullName || null,
          phone_number: null, // Will be collected if needed
          otp_method: "email", // OAuth users use email for OTP
          user_type: null, // Set during survey
          field_of_study: null, // Set during survey
          selected_plan: defaultPlan,
          storage_limit: storageLimit,
        },
      });

      logger.info("OAuth user created in database:", {
        id: prismaUser.id,
        email: prismaUser.email,
      });

      // Create subscription record
      try {
        const subscription = await SubscriptionService.syncSubscription({
          userId: id,
          planId: defaultPlan,
          status: "active",
          currentPeriodEnd: undefined, // No expiration for free plan
        });
        logger.info("Subscription created for OAuth user:", {
          userId: subscription.id,
          plan: subscription.defaultPlan,
        });
      } catch (subscriptionError: any) {
        logger.error("Error creating subscription:", subscriptionError);
        // Don't fail signup if subscription creation fails
      }
    }

    // Send OTP to email
    try {
      logger.info("Sending OTP for OAuth user:", id);
      await OTPService.sendOTP(
        id,
        email,
        "", // No phone number
        "email", // Always email for OAuth
        fullName,
      );
      logger.info("OTP sent successfully to OAuth user");
    } catch (otpError: any) {
      logger.error("Error sending OTP:", otpError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification code",
      });
    }

    return res.json({
      success: true,
      message:
        "OAuth user registered successfully. Please check your email for the verification code.",
    });
  } catch (error: any) {
    logger.error("OAuth signup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    logger.info("Signin request", { email: req.body.email });
    const { email, password } = req.body;

    // Sign in the user with Supabase Auth
    const result = await AuthService.signIn(email, password);

    logger.info("Signin successful", { userId: result.user?.id });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Signin failed", {
      error: error.message,
      email: req.body.email,
    });
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post("/api/auth/signout", async (req, res) => {
  try {
    logger.info("Signout request");
    await AuthService.signOut();
    logger.info("Signout successful");
    res.json({ success: true });
  } catch (error: any) {
    logger.error("Signout failed", { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
});

// User validation endpoint for real-time duplicate checking
app.post("/api/auth/validate", async (req, res) => {
  try {
    const { fullName, email, phoneNumber } = req.body;

    logger.info("User validation request received:", {
      fullName,
      email,
      phoneNumber,
    });

    // Import Prisma
    const { prisma } = await import("../lib/prisma");

    const validationResults: {
      fullNameExists?: boolean;
      emailExists?: boolean;
      phoneNumberExists?: boolean;
      message?: string;
    } = {};

    // Check for existing user with same full name
    if (fullName) {
      try {
        const existingUserByName = await prisma.user.findFirst({
          where: {
            full_name: {
              equals: fullName,
              mode: "insensitive", // Case insensitive comparison
            },
          },
        });

        if (existingUserByName) {
          validationResults.fullNameExists = true;
          validationResults.message =
            "A user with this name is already registered.";
        }
      } catch (dbError: any) {
        logger.error("Database error while checking full name:", dbError);
        // Don't fail the validation if database is unreachable, just log the error
        // The signup process will handle database errors later
      }
    }

    // Check for existing user with same email
    if (email) {
      try {
        const existingUserByEmail = await prisma.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive", // Case insensitive comparison
            },
          },
        });

        if (existingUserByEmail) {
          validationResults.emailExists = true;
          validationResults.message =
            "A user with this email is already registered.";
        }
      } catch (dbError: any) {
        logger.error("Database error while checking email:", dbError);
        // Don't fail the validation if database is unreachable, just log the error
        // The signup process will handle database errors later
      }
    }

    // Check for existing user with same phone number
    if (phoneNumber) {
      try {
        const existingUserByPhone = await prisma.user.findFirst({
          where: {
            phone_number: {
              equals: phoneNumber,
              mode: "insensitive", // Case insensitive comparison
            },
          },
        });

        if (existingUserByPhone) {
          validationResults.phoneNumberExists = true;
          validationResults.message =
            "A user with this phone number is already registered.";
        }
      } catch (dbError: any) {
        logger.error("Database error while checking phone number:", dbError);
        // Don't fail the validation if database is unreachable, just log the error
        // The signup process will handle database errors later
      }
    }

    logger.info("User validation completed:", validationResults);

    return res.json({
      success: true,
      validationResults,
    });
  } catch (error: any) {
    logger.error("Validation error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

app.get("/api/auth/verify-email", async (req, res) => {
  try {
    logger.info("Email verification request");
    const { token, type } = req.query;

    if (!token || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Missing token or type" });
    }

    // Handle email verification using Supabase's verifyOtp method
    if (type === "email") {
      const client = await supabase;
      const { error } = await client.auth.verifyOtp({
        token: token as string,
        type: "email",
      } as any);

      if (error) {
        logger.error("Email verification failed", { error: error.message });
        return res.status(400).json({ success: false, message: error.message });
      }

      logger.info("Email verified successfully");
      return res.json({
        success: true,
        message: "Email verified successfully",
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification type" });
    }
  } catch (error: any) {
    logger.error("Email verification failed", { error: error.message });
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    logger.info("Resend verification request", { email: req.body.email });
    const { email, type } = req.body;

    if (!email || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Missing email or type" });
    }

    // Resend verification using Supabase's resendOtp method
    const client = await supabase;
    const { error } = await client.auth.resend({
      email,
      type,
    } as any);

    if (error) {
      logger.error("Resend verification failed", { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }

    logger.info("Verification resent successfully");
    return res.json({
      success: true,
      message: "Verification resent successfully",
    });
  } catch (error: any) {
    logger.error("Resend verification failed", {
      error: error.message,
      email: req.body.email,
    });
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Authentication endpoints (alt versions)
app.post("/api/auth/signup-alt", async (req, res) => {
  try {
    logger.info("Signup request", { email: req.body.email });
    const { email, password, userData } = req.body;

    // Extract plan information from userData if available
    const selectedPlan = userData?.selected_plan || "free";

    // Determine the correct storage limit based on the selected plan
    let storageLimit = 0.1; // Default to 0.1GB (100MB) for free plan
    if (selectedPlan === "student") {
      storageLimit = 5; // 5GB for student plan
    } else if (selectedPlan === "researcher") {
      storageLimit = 100; // 100GB for researcher plan
    }

    // Add storage limit to userData
    const userDataWithStorage = {
      ...userData,
      storage_limit: storageLimit,
    };

    const result = await AuthService.signUp(
      email,
      password,
      userDataWithStorage,
    );
    logger.info("Signup successful", { userId: result.user?.id });

    // Create subscription record
    try {
      const { SubscriptionService } =
        await import("../services/subscriptionService");
      const subscription = await SubscriptionService.syncSubscription({
        userId: result.user!.id,
        planId: selectedPlan,
        status: "active",
        currentPeriodEnd:
          selectedPlan !== "free"
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            : undefined, // 14-day trial for paid plans
      });
      logger.info("Subscription created/updated:", subscription);
    } catch (subscriptionError: any) {
      logger.error("Error creating subscription:", subscriptionError);
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Signup failed", {
      error: error.message,
      email: req.body.email,
    });
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post("/api/auth/signin-alt", async (req, res) => {
  try {
    logger.info("Signin request", { email: req.body.email });
    const { email, password } = req.body;
    const result = await AuthService.signIn(email, password);
    logger.info("Signin successful", { userId: result.user?.id });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Signin failed", {
      error: error.message,
      email: req.body.email,
    });
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get("/api/auth/verify-email-alt", async (req, res) => {
  try {
    logger.info("Email verification request");
    const { token, type } = req.query;

    if (!token || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Missing token or type" });
    }

    // Handle email verification using Supabase's verifyOtp method
    if (type === "email") {
      const client = await supabase;
      const { error } = await client.auth.verifyOtp({
        token: token as string,
        type: "email",
      } as any);

      if (error) {
        logger.error("Email verification failed", { error: error.message });
        return res.status(400).json({ success: false, message: error.message });
      }

      logger.info("Email verified successfully");
      return res.json({
        success: true,
        message: "Email verified successfully",
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification type" });
    }
  } catch (error: any) {
    logger.error("Email verification failed", { error: error.message });
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.post("/api/auth/verify-otp-alt", async (req, res) => {
  try {
    logger.info("Verify OTP request");
    const { userId, otp } = req.body;

    // Verify OTP using the OTP service
    const isValid = await OTPService.verifyOTP(userId, otp);

    if (isValid) {
      logger.info("OTP verified successfully", { userId });
      return res.json({ success: true, message: "OTP verified successfully" });
    } else {
      logger.warn("Invalid OTP", { userId });
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error: any) {
    logger.error("Verify OTP failed", { error: error.message });
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Forgot password endpoint
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    logger.info("Forgot password request", { email: req.body.email });
    const { email } = req.body;

    // Use Supabase's built-in password reset functionality
    const result = await AuthService.resetPassword(email);
    logger.info("Password reset email sent", { email });

    return res.json({
      success: true,
      message: "Password reset instructions sent to your email",
      data: result,
    });
  } catch (error: any) {
    logger.error("Forgot password failed", {
      error: error.message,
      email: req.body.email,
    });
    return res.status(400).json({ success: false, message: error.message });
  }
});

// LemonSqueezy webhook endpoint
app.post("/api/webhooks/lemonsqueezy", async (req, res) => {
  try {
    logger.info("LemonSqueezy webhook request received");

    // Import the webhook handler
    const webhookRouter = (await import("../api/webhooks/lemonsqueezy/route"))
      .default;

    // Call the webhook handler directly
    return webhookRouter(req, res, () => { });
  } catch (error: any) {
    logger.error("LemonSqueezy webhook processing failed", {
      error: error.message,
    });
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

// LemonSqueezy webhook test endpoint (ONLY for development/testing)
app.post("/api/webhooks/lemonsqueezy/test/:eventType", async (req, res) => {
  try {
    if (nodeEnv === "production") {
      return res
        .status(403)
        .json({ error: "Test endpoint not available in production" });
    }

    logger.info("LemonSqueezy webhook TEST request received", {
      eventType: req.params.eventType,
      body: req.body,
    });

    // Import the test webhook handler
    const testWebhookRouter = (
      await import("../api/webhooks/lemonsqueezy/test-route")
    ).default;

    // Call the test webhook handler directly with type assertion to bypass type checking
    const mockReq = {
      ...req,
      params: { eventType: req.params.eventType, body: req.body },
    };
    return testWebhookRouter(mockReq as any, res, () => { });
  } catch (error: any) {
    logger.error("LemonSqueezy webhook TEST processing failed", {
      error: error.message,
    });
    return res.status(500).json({ error: "Webhook TEST processing failed" });
  }
});

// Endpoint to handle post-checkout user creation
app.post("/api/auth/create-user-post-checkout", async (req, res) => {
  try {
    logger.info("Post-checkout user creation request received");

    const { email, fullName, phoneNumber, planId } = req.body;

    // Validate required fields
    if (!email || !fullName || !planId) {
      return res.status(400).json({
        success: false,
        message: "Email, full name, and plan ID are required",
      });
    }

    // Check if user already exists
    const { prisma } = await import("../lib/prisma");
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Import AuthService
    const { AuthService } = await import("../services/hybridAuthService");

    // Create user in Supabase Auth with a temporary password
    // The user will set their own password via the password reset flow
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";

    const authResult = await AuthService.createUser({
      email,
      password: tempPassword, // Temporary password that will be replaced
      fullName,
      phoneNumber,
      userType: "student", // Default to student
      fieldOfStudy: "General", // Default field of study
    });

    if (!authResult.supabaseUser) {
      throw new Error("Failed to create user in authentication system");
    }

    const userId = authResult.supabaseUser.id;

    // Create subscription record
    try {
      const { SubscriptionService } =
        await import("../services/subscriptionService");
      const subscription = await SubscriptionService.syncSubscription({
        userId,
        planId,
        status: "active",
        currentPeriodEnd:
          planId !== "free"
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14-day trial for paid plans
            : undefined,
      });
      logger.info("Subscription created/updated:", subscription);
    } catch (subscriptionError: any) {
      logger.error("Error creating subscription:", subscriptionError);
    }

    // Send welcome email
    try {
      const { EmailService } = await import("../services/emailService");
      await EmailService.sendWelcomeEmail(email, fullName);
    } catch (emailError: any) {
      logger.error("Error sending welcome email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message:
        "User created successfully. Please check your email to set your password.",
      userId,
    });
  } catch (error: any) {
    logger.error("Post-checkout user creation failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create user",
    });
  }
});

// Editor endpoints
app.post("/api/editor", async (req, res) => {
  try {
    logger.info("Add comment request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { POST_COMMENT } = await import("../api/editor/route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => requestBody,
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await POST_COMMENT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Add comment failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Apply auth middleware to citations routes

// Mount auth router
app.use("/api/auth", authRouter);

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Reset password endpoint
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    logger.info("Reset password request");
    const { token, password } = req.body;

    // For Supabase, we need to use the token to update the password
    // This requires the user to have clicked the reset link and be in the reset flow
    const client = await supabase;
    const { error } = await client.auth.updateUser({
      password: password,
    });

    if (error) {
      logger.error("Reset password failed", { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }

    logger.info("Password reset successfully");
    return res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    logger.error("Reset password failed", { error: error.message });
    return res.status(400).json({ success: false, message: error.message });
  }
});

// OTP endpoints
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    logger.info("Send OTP request received", {
      userId: req.body.userId,
      method: req.body.method,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      fullName: req.body.fullName,
    });

    const { userId, method, email, phoneNumber, fullName } = req.body;

    // Validate required fields
    if (!userId || !method) {
      logger.warn("Missing required fields for OTP send", { userId, method });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId and method are required",
      });
    }

    const result = await OTPService.sendOTP(
      userId,
      email,
      phoneNumber || "", // Ensure string value
      method,
      fullName,
    );

    if (result) {
      logger.info("OTP sent successfully", {
        method,
        sentTo: method === "email" ? email : phoneNumber,
        userId,
      });
      return res.json({ success: true, message: "OTP sent successfully" });
    } else {
      logger.error("Failed to send OTP", { userId, method });
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP" });
    }
  } catch (error: any) {
    logger.error("Send OTP failed", {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Send OTP for profile update
app.post("/api/auth/send-profile-otp", authMiddleware, async (req, res) => {
  try {
    logger.info("Send profile update OTP request received");

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get the profile data that will be updated
    const { profileData } = req.body;

    // Get user details from Prisma
    const { prisma } = await import("../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        full_name: true,
        phone_number: true,
        otp_method: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let method, email, phoneNumber, fullName;

    // If we're changing the email, send OTP to the NEW email address
    if (profileData && profileData.email) {
      method = "email";
      email = profileData.email; // Send to new email
      phoneNumber = user.phone_number || "";
      fullName = user.full_name || "";
    }
    // If we're changing other fields, send OTP to existing phone number
    else if (
      profileData &&
      (profileData.full_name ||
        profileData.phone_number ||
        profileData.user_type ||
        profileData.field_of_study)
    ) {
      method = "sms";
      email = user.email || "";
      phoneNumber = user.phone_number || ""; // Send to existing phone
      fullName = user.full_name || "";
    }
    // Default behavior - use user's preferred method
    else {
      method = user.otp_method || "email";
      email = user.email || "";
      phoneNumber = user.phone_number || "";
      fullName = user.full_name || "";
    }

    // Validate that we have the required information
    if (method === "email" && !email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required for email OTP",
      });
    }

    if (method === "sms" && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required for SMS OTP",
      });
    }

    logger.info("Sending profile update OTP", {
      userId,
      method,
      email,
      phoneNumber,
      profileData,
    });

    const result = await OTPService.sendOTP(
      userId,
      email,
      phoneNumber,
      method,
      fullName,
      true, // isProfileUpdate
      !!(profileData && profileData.email), // isEmailChange
    );

    if (result) {
      logger.info("Profile update OTP sent successfully", {
        method,
        sentTo: method === "email" ? email : phoneNumber,
        userId,
      });
      return res.json({ success: true, message: "OTP sent successfully" });
    } else {
      logger.error("Failed to send profile update OTP", { userId, method });
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP" });
    }
  } catch (error: any) {
    logger.error("Send profile update OTP failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP for profile update
app.post("/api/auth/verify-profile-otp", authMiddleware, async (req, res) => {
  try {
    logger.info("Verify profile update OTP request received");

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { otp } = req.body;

    // Validate required fields
    if (!otp) {
      logger.warn("Missing OTP for profile update verification", { userId });
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    // Verify OTP using the OTP service
    const isValid = await OTPService.verifyOTP(userId, otp);

    if (isValid) {
      logger.info("Profile update OTP verified successfully", { userId });
      return res.json({
        success: true,
        message: "OTP verified successfully",
        verified: true,
      });
    } else {
      logger.warn("Invalid profile update OTP provided", { userId });
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        verified: false,
      });
    }
  } catch (error: any) {
    logger.error("Verify profile update OTP failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    logger.info("Verify OTP request received", {
      userId: req.body.userId,
      otp: req.body.otp ? "[PROVIDED]" : "[MISSING]",
    });

    const { userId, otp } = req.body;

    // Validate required fields
    if (!userId || !otp) {
      logger.warn("Missing required fields for OTP verification", {
        userId,
        otpProvided: !!otp,
      });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId and otp are required",
      });
    }

    // Verify OTP using the OTP service
    const isValid = await OTPService.verifyOTP(userId, otp);

    if (isValid) {
      // Update user as verified in Prisma database
      try {
        // Import Prisma client
        const { prisma } = await import("../lib/prisma");

        await prisma.user.update({
          where: { id: userId },
          data: {
            updated_at: new Date(),
          },
        });
      } catch (prismaError) {
        logger.error("Error updating user in Prisma:", prismaError);
      }

      logger.info("OTP verified successfully", { userId });
      return res.json({ success: true, message: "OTP verified successfully" });
    } else {
      logger.warn("Invalid OTP provided", { userId });
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error: any) {
    logger.error("Verify OTP failed", {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Test endpoint to check auth token validation
app.get("/api/test-auth-token", async (req, res) => {
  try {
    logger.info("Test auth token request received");

    // Get the authorization header
    const authHeader = req.headers.authorization;
    logger.info("Authorization header:", { authHeader });

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("No valid authorization header found");
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid",
        authHeader: authHeader ? "Present" : "Missing",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    logger.info("Extracted token", {
      tokenLength: token.length,
      tokenStart: token.substring(0, Math.min(10, token.length)) + "...",
    });

    // Try to validate the token with Supabase
    const client = await supabase;
    const { data, error } = await client.auth.getUser(token);

    logger.info("Supabase getUser result", {
      hasData: !!data,
      hasUser: !!data?.user,
      hasError: !!error,
      error: error?.message,
    });

    if (error || !data?.user) {
      logger.warn("Token validation failed", {
        error: error?.message,
        userId: data?.user?.id,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        error: error?.message,
        userId: data?.user?.id,
      });
    }

    logger.info("Token validation successful", {
      userId: data.user.id,
      userEmail: data.user.email,
    });

    return res.json({
      success: true,
      message: "Token is valid",
      userId: data.user.id,
      userEmail: data.user.email,
    });
  } catch (error: any) {
    logger.error("Test auth token failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message,
      error: "Internal server error",
    });
  }
});

// Debug endpoint to check session info
app.get("/api/debug-session", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    logger.info("Debug session request", { userId, userEmail });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    return res.json({
      success: true,
      userId,
      userEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Debug session failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message,
      error: "Internal server error",
    });
  }
});

// Test endpoint to check citation auth
app.get("/api/test-citation-auth", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    logger.info("Test citation auth request", { userId, userEmail });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    return res.json({
      success: true,
      message: "Citation authentication successful",
      userId,
      userEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Test citation auth failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message,
      error: "Internal server error",
    });
  }
});

// Apply auth middleware to notification routes
app.use("/api/notifications", authMiddleware);

// Mount the notifications router
app.use("/api/notifications", notificationsRouter);

// Apply auth middleware to citations routes (excluding public routes)
app.use("/api/citations", authMiddleware);

// User account management endpoints

// Route to request OTP for profile updates
app.post("/api/users/request-otp", async (req, res) => {
  try {
    logger.info("Request OTP for profile update");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real user API handler
    const { POST_REQUEST_OTP: POST } = await import("../api/users/route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === "authorization") {
            return authHeader;
          }
          return null;
        },
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Request OTP failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Project stats endpoint (removed duplicate route registration without authMiddleware)
// The correct route with authMiddleware is registered later in the file

// Route to handle user account updates

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

app.post("/api/users/export", async (req, res) => {
  try {
    logger.info("Export user data request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import Prisma client
    const { prisma } = await import("../lib/prisma");

    // Get all user data for export
    const userData = {
      user: await prisma.user.findUnique({
        where: { id: userId },
      }),
      projects: await prisma.project.findMany({
        where: { user_id: userId },
      }),
      citations: await prisma.citation.findMany({
        where: { project: { user_id: userId } },
      }),
      subscriptions: await prisma.subscription.findMany({
        where: { user_id: userId },
      }),
      aiUsage: await prisma.aIUsage.findMany({
        where: { user_id: userId },
      }),
    };

    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    logger.error("Export user data failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/test", async (req, res) => {
  try {
    logger.info("Send test notification request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import the notification service directly
    const { createNotification } =
      await import("../services/notificationService");

    const { type, title, message } = req.body;

    // Create test notification
    const notification = await createNotification(
      userId,
      type as any,
      title,
      message,
    );

    return res.status(200).json({ success: true, notification });
  } catch (error: any) {
    logger.error("Send test notification failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Apply auth middleware to editor routes
app.use("/api/editor", authMiddleware);

// Apply auth middleware to privacy routes
app.use("/api/privacy", authMiddleware);

// Import privacy settings router
import privacySettingsRouter from "../api/privacy/route";
// Import sessions router
import sessionsRouter from "../api/sessions-route";

// Mount privacy settings router
app.use("/api/privacy", authMiddleware, privacySettingsRouter);
// Mount sessions router
app.use("/api/sessions", sessionsRouter);

// Register AI routes
app.use("/api/ai", aiRouter);
app.use("/api/ai/search", aiSearchRouter);

// Register speech-to-text routes - speechRouter not found, skipping

// Register new AI capability routes
setupGrammarRoute(app);
app.post("/api/ai/summarization", summarizationPOST);
app.post("/api/ai/document-qa", documentQaPOST);
app.post("/api/ai/writing-project", writingProjectPOST);

// Apply auth middleware to templates routes
app.use("/api/templates", authMiddleware);
app.use("/api/templates", templatesRouter);

// API Routes
app.use("/api/auth", authRouter);

app.use("/api/billing", authMiddleware);
app.use("/api/billing", billingRouter);

app.use("/api/subscriptions", authMiddleware);
app.use("/api/subscriptions", subscriptionRoutes);

// Apply auth middleware to projects routes
app.use("/api/projects", authMiddleware);
app.use("/api/projects", projectsRouter);

// Apply auth middleware to data routes
app.use("/api/data", authMiddleware);

// Mount the data router
app.use("/api/data", dataRouter);

// Apply auth middleware to billing routes and mount the router
app.use("/api/billing", authMiddleware);
app.use("/api/billing", billingRouter);

// Apply auth middleware to user routes and mount the router
app.use("/api/users", authMiddleware, usersRouter);

// Apply auth middleware to affiliate routes
app.use("/api/affiliate", authMiddleware);

// Instead of individual affiliate endpoints, mount the affiliate router directly - affiliateRouter not found, skipping

// Apply auth middleware to notification routes
app.use("/api/notifications", authMiddleware);

// Notification endpoints
app.get("/api/notifications", async (req, res) => {
  try {
    logger.info("Get notifications request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import the notification service directly
    const { getUserNotifications, getUnreadNotificationCount } =
      await import("../services/notificationService");

    // Get query parameters
    const limit = parseInt((req.query.limit as string) || "20");
    const offset = parseInt((req.query.offset as string) || "0");
    const type = (req.query.type as string) || undefined;
    const priority = req.query.priority as
      | "high"
      | "medium"
      | "low"
      | undefined;
    const search = (req.query.search as string) || undefined;
    const read = req.query.read as string;
    const readFilter = read !== undefined ? read === "true" : undefined;

    // Build filters object
    const filters = {
      type,
      priority,
      search,
      read: readFilter,
    };

    // Remove undefined values from filters

    // Removed duplicate DELETE route for projects

    Object.keys(filters).forEach(
      (key) =>
        (filters as any)[key] === undefined && delete (filters as any)[key],
    );

    // Get notifications
    const notifications = await getUserNotifications(
      userId,
      limit,
      offset,
      filters,
    );

    // Get unread count
    const unreadCount = await getUnreadNotificationCount(userId);

    return res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error: any) {
    logger.error("Get notifications failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/read", async (req, res) => {
  try {
    logger.info("Mark notification as read request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import the notification service directly
    const { markNotificationAsRead } =
      await import("../services/notificationService");

    // Get notification ID from request body
    const notificationId = req.body.notificationId;
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
    }

    // Mark notification as read
    await markNotificationAsRead(notificationId);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error("Mark notification as read failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/dismiss", async (req, res) => {
  try {
    logger.info("Dismiss notification request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import the notification service directly
    const { dismissNotification } =
      await import("../services/notificationService");

    // Get notification ID from request body
    const notificationId = req.body.notificationId;
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
    }

    // Dismiss notification
    await dismissNotification(notificationId);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error("Dismiss notification failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/clear", async (req, res) => {
  try {
    logger.info("Clear notifications request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import the notification service directly
    const { markAllNotificationsAsRead } =
      await import("../services/notificationService");

    // Mark all notifications as read (since there's no clear method)
    await markAllNotificationsAsRead(userId);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error("Clear notifications failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/notifications/settings", async (req, res) => {
  try {
    logger.info("Get notification settings request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import the notification service directly
    const { getUserNotificationSettings } =
      await import("../services/notificationService");

    // Get notification settings
    const settings = await getUserNotificationSettings(userId);

    return res.status(200).json({ success: true, settings });
  } catch (error: any) {
    logger.error("Get notification settings failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/notifications/settings", async (req, res) => {
  try {
    logger.info("Update notification settings request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import the notification service directly
    const { updateUserNotificationSettings } =
      await import("../services/notificationService");

    // Update notification settings
    const settings = await updateUserNotificationSettings(userId, req.body);

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      settings,
    });
  } catch (error: any) {
    logger.error("Update notification settings failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/test", async (req, res) => {
  try {
    logger.info("Send test notification request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import the notification service directly
    const { createNotification } =
      await import("../services/notificationService");

    const { type, title, message } = req.body;

    // Create test notification
    const notification = await createNotification(
      userId,
      type as any,
      title,
      message,
    );

    return res.status(200).json({ success: true, notification });
  } catch (error: any) {
    logger.error("Send test notification failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Push notification endpoints
app.post("/api/notifications/push/register", async (req, res) => {
  try {
    logger.info("Register push notification token request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real push notification API handler
    const { POST_REGISTER } = await import("../api/notifications/push/route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST_REGISTER(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Register push notification token failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/push/unregister", async (req, res) => {
  try {
    logger.info("Unregister push notification token request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real push notification API handler
    const { POST_UNREGISTER } = await import("../api/notifications/push/route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST_UNREGISTER(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Unregister push notification token failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/push/test", async (req, res) => {
  try {
    logger.info("Send test push notification request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real push notification API handler
    const { POST_TEST } = await import("../api/notifications/push/route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST_TEST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Send test push notification failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk notification operations endpoints
app.post("/api/notifications/bulk/read", async (req, res) => {
  try {
    logger.info("Bulk mark notifications as read request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real bulk notification API handler
    const { POST_READ } = await import("../api/notifications/bulk/route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST_READ(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Bulk mark notifications as read failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/bulk/delete", async (req, res) => {
  try {
    logger.info("Bulk delete notifications request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real bulk notification API handler
    const { POST_DELETE } = await import("../api/notifications/bulk/route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST_DELETE(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Bulk delete notifications failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/bulk/dismiss", async (req, res) => {
  try {
    logger.info("Bulk dismiss notifications request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real bulk notification API handler
    const { POST_DISMISS } = await import("../api/notifications/bulk/route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST_DISMISS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Bulk dismiss notifications failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/notifications/bulk/snooze", async (req, res) => {
  try {
    logger.info("Bulk snooze notifications request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real bulk notification API handler
    const { POST_SNOOZE } = await import("../api/notifications/bulk/route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST_SNOOZE(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Bulk snooze notifications failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Notification settings reset endpoint
app.post("/api/notifications/settings/reset", async (req, res) => {
  try {
    logger.info("Reset notification settings request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real notification settings reset API handler
    const { POST } = await import("../api/notifications/settings/reset/route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Reset notification settings failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// AI Grammar Checking endpoint
app.post("/api/ai/grammar-check", async (req, res) => {
  try {
    logger.info("AI grammar check request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real AI grammar API handler
    const { POST } = await import("../api/ai/grammar-route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("AI grammar check failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// AI Document Summarization endpoint
app.post("/api/ai/summarize", async (req, res) => {
  try {
    logger.info("AI document summarization request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real AI summarization API handler
    const { POST } = await import("../api/ai/summarization-route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("AI document summarization failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// AI Document Q&A endpoint
app.post("/api/ai/document-qa", async (req, res) => {
  try {
    logger.info("AI document Q&A request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real AI document Q&A API handler
    const { POST } = await import("../api/ai/document-qa-route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("AI document Q&A failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// AI Writing Project Assistant endpoint
app.post("/api/ai/writing-project", async (req, res) => {
  try {
    logger.info("AI writing project assistant request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real AI writing project API handler
    const { POST } = await import("../api/ai/writing-project-route");

    // Get authorization header from original request
    const authHeader = req.headers.authorization;

    // Create a mock request object
    const mockRequest = {
      json: async () => req.body,
      headers: {
        authorization: authHeader,
      },
      user: { id: userId },
    };

    const response = await POST(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("AI writing project assistant failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Apply auth middleware to editor routes
app.use("/api/editor", authMiddleware);

// Editor endpoints
app.get("/api/editor/content", async (req, res) => {
  try {
    logger.info("Get editor content request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { GET } = await import("../api/editor/route");

    // Create a mock request object with query parameters
    const url = new URL(`http://localhost:3001/api/editor/content`);
    const queryParams = req.query as Record<string, string>;
    for (const key in queryParams) {
      url.searchParams.append(key, queryParams[key]);
    }

    const mockRequest = {
      url: url.toString(),
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await GET(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Get editor content failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Add PUT route for /api/editor to match frontend expectations
app.put("/api/editor", async (req, res) => {
  try {
    logger.info("Save editor content request (/api/editor)");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { PUT } = await import("../api/editor/route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => requestBody,
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await PUT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Save editor content failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/editor/content", async (req, res) => {
  try {
    logger.info("Save editor content request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { PUT } = await import("../api/editor/route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => requestBody,
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await PUT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Save editor content failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Beacon endpoint for draft recovery
app.post("/api/projects/:projectId/beacon-draft", async (req, res) => {
  try {
    logger.info("Draft beacon request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get project ID from URL params
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    // Import and use the real editor API handler
    const { POST_BEACON_DRAFT } = await import("../api/editor/route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => ({ ...requestBody, id: projectId }),
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await POST_BEACON_DRAFT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Draft beacon failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/editor/versions", async (req, res) => {
  try {
    logger.info("Get document versions request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { GET_VERSIONS } = await import("../api/editor/route");

    // Create a mock request object with query parameters
    const url = new URL(`http://localhost:3001/api/editor/versions`);
    const queryParams = req.query as Record<string, string>;
    for (const key in queryParams) {
      url.searchParams.append(key, queryParams[key]);
    }

    const mockRequest = {
      url: url.toString(),
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await GET_VERSIONS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Get document versions failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Test endpoint to verify authenticated billing request
app.get("/api/test-auth-billing", async (req, res) => {
  try {
    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Create a mock request object that mimics what the billing route expects
    const mockReq: any = {
      user: {
        id: userId,
      },
    };

    // Import the billing router
    // REMOVED: const billingRouter = (await import("../api/billing/route")).default;

    // Instead of trying to manually call the route handler, let's just directly call the service
    const { SubscriptionService } =
      await import("../services/subscriptionService");

    // Call the service method directly
    const subscriptionInfo = await SubscriptionService.getUserPlanInfo(userId);

    return res
      .status(200)
      .json({ success: true, subscription: subscriptionInfo });
  } catch (error: any) {
    logger.error("Error testing authenticated billing request:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/editor/comments", async (req, res) => {
  try {
    logger.info("Add comment request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { POST_COMMENT } = await import("../api/editor/route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => requestBody,
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await POST_COMMENT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Add comment failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/editor/comments", async (req, res) => {
  try {
    logger.info("Get comments request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { GET_COMMENTS } = await import("../api/editor/route");

    // Create a mock request object with query parameters
    const url = new URL(`http://localhost:3001/api/editor/comments`);
    const queryParams = req.query as Record<string, string>;
    for (const key in queryParams) {
      url.searchParams.append(key, queryParams[key]);
    }

    const mockRequest = {
      url: url.toString(),
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await GET_COMMENTS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Get comments failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/editor/restore-version", async (req, res) => {
  try {
    logger.info("Restore document version request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { POST_RESTORE_VERSION } = await import("../api/editor/route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => requestBody,
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await POST_RESTORE_VERSION(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Restore document version failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Editor version endpoints
app.post("/api/editor/version", async (req, res) => {
  try {
    logger.info("Create document version request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor version API handler
    const { POST_VERSION } = await import("../api/editor/version-route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => requestBody,
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await POST_VERSION(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Create document version failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/editor/versions", async (req, res) => {
  try {
    logger.info("Get document versions request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor version API handler
    const { GET_VERSIONS } = await import("../api/editor/version-route");

    // Create a mock request object with query params
    // Sanitize the host header to prevent XSS
    const hostHeader = req.headers.host
      ? req.headers.host.toString()
      : "localhost";
    // Validate host to contain only safe characters (alphanumeric, dots, hyphens, colons for ports)
    const isValidHost = /^([a-zA-Z0-9\-_.:])+$/g.test(hostHeader);
    const host = isValidHost ? hostHeader : "localhost";
    const url = new URL(req.url, `http://${host}`);
    const mockRequest = {
      url: url.toString(),
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await GET_VERSIONS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Get document versions failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Editor settings endpoints
app.get("/api/editor/settings", async (req, res) => {
  try {
    logger.info("Get editor settings request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { GET_SETTINGS } = await import("../api/editor/route");

    // Create a mock request object
    const mockRequest = {
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await GET_SETTINGS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Get editor settings failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/editor/settings", async (req, res) => {
  try {
    logger.info("Update editor settings request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { PUT_SETTINGS } = await import("../api/editor/route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => requestBody,
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await PUT_SETTINGS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Update editor settings failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Editor analytics endpoints
app.get("/api/editor/analytics", async (req, res) => {
  try {
    logger.info("Get editor analytics request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { GET_ANALYTICS } = await import("../api/editor/route");

    // Create a mock request object
    const mockRequest = {
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await GET_ANALYTICS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Get editor analytics failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics endpoints for editor data (to match frontend expectations)
app.get("/api/analytics/editor/:projectId", async (req, res) => {
  try {
    logger.info("Get analytics editor data request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { projectId } = req.params;

    // Import EditorService to get analytics
    const { EditorService } = await import("../services/editorService");

    // Get editor analytics for the project
    const analytics = await EditorService.getEditorActivity(userId);

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    logger.error("Get analytics editor data failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/analytics/editor/typing-patterns/:userId", async (req, res) => {
  try {
    logger.info("Get typing patterns request");

    // Get user from authentication middleware
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { userId } = req.params;
    const { days = "30" } = req.query;

    // Verify that the authenticated user is requesting their own data
    if (authUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get typing patterns from editor events
    // For now, return empty array as we don't have a direct method in EditorService
    const typingPatterns: Record<string, any>[] = [];

    return res.status(200).json({
      success: true,
      patterns: typingPatterns,
    });
  } catch (error: any) {
    logger.error("Get typing patterns failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/analytics/editor/command-usage/:userId", async (req, res) => {
  try {
    logger.info("Get command usage request");

    // Get user from authentication middleware
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { userId } = req.params;
    const { days = "30" } = req.query;

    // Verify that the authenticated user is requesting their own data
    if (authUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get command usage from editor events
    // For now, return empty array as we don't have a direct method in EditorService
    const commandUsage: Record<string, any>[] = [];

    return res.status(200).json({
      success: true,
      usage: commandUsage,
    });
  } catch (error: any) {
    logger.error("Get command usage failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get(
  "/api/analytics/editor/feature-interactions/:userId",
  async (req, res) => {
    try {
      logger.info("Get feature interactions request");

      // Get user from authentication middleware
      const authUserId = (req as any).user?.id;
      if (!authUserId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { userId } = req.params;
      const { days = "30" } = req.query;

      // Verify that the authenticated user is requesting their own data
      if (authUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Get feature interactions from editor events
      // For now, return empty object as we don't have a direct method in EditorService
      const interactions: Record<string, number> = {};

      return res.status(200).json({
        success: true,
        interactions,
      });
    } catch (error: any) {
      logger.error("Get feature interactions failed", { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Editor events endpoint for analytics
app.post("/api/editor/events", async (req, res) => {
  try {
    logger.info("Post editor events request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { POST_EVENTS } = await import("../api/editor/route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => requestBody,
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await POST_EVENTS(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Post editor events failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics endpoint for editor events (to match frontend expectations)
app.post("/api/analytics/editor/events", async (req, res) => {
  try {
    logger.info("Post analytics editor events request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get events from request body
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        message: "Invalid events data",
      });
    }

    // Process each event
    for (const event of events) {
      try {
        // Import EditorService to track events
        const { EditorService } = await import("../services/editorService");

        // Track the event using EditorService
        await EditorService.trackEditorEvent(
          userId,
          event.projectId || null,
          event.eventType,
          event.metadata || {},
        );
      } catch (eventError: any) {
        logger.error("Failed to process individual event", {
          error: eventError.message,
          event,
        });
        // Continue processing other events even if one fails
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${events.length} events`,
    });
  } catch (error: any) {
    logger.error("Post analytics editor events failed", {
      error: error.message,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Editor import endpoints
app.post("/api/editor/import", async (req, res) => {
  try {
    logger.info("Import document request");

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Import and use the real editor API handler
    const { POST_IMPORT } = await import("../api/editor/route");

    const requestBody = req.body;

    // Create a mock request object with the user ID and body
    const mockRequest = {
      json: async () => requestBody,
      user: { id: userId }, // Updated to match new pattern
    };

    const response = await POST_IMPORT(mockRequest as any);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error: any) {
    logger.error("Import document failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Serve favicon
app.get("/favicon.ico", (req, res) => {
  // Send a simple empty response for favicon
  res.status(204).end();
});

// Serve reports
app.use(
  "/reports",
  express.static(path.join(__dirname, "..", "..", "reports")),
);

// Apply auth middleware to recycle bin routes
app.use("/api/recyclebin", authMiddleware);

// Instead of individual recycle bin endpoints, mount the recycle bin router directly
app.use("/api/recyclebin", recycleBinRouter);

// General file upload endpoint
app.post("/_create/api/upload/", authMiddleware, async (req, res) => {
  try {
    logger.info("File upload request");
    console.log("=== _CREATE UPLOAD ENDPOINT HIT ===");
    console.log("Request URL:", req.url);
    console.log("Request method:", req.method);
    console.log("Request headers:", req.headers);

    // Get user from authentication middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if this is a multipart form data request
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // For file uploads, we need to handle this differently
      // This endpoint is primarily for the frontend useUpload hook
      return res.status(400).json({
        success: false,
        message: "Use the dedicated upload endpoints for file uploads",
      });
    }

    // Import required services
    const { SubscriptionService } =
      await import("../services/subscriptionService");

    // Check if user can upload based on their subscription
    const canUpload = await SubscriptionService.canPerformAction(
      userId,
      "collaboration_chat_upload",
    );

    if (!canUpload.allowed) {
      return res.status(429).json({
        success: false,
        message: canUpload.reason || "Upload limit reached. Upgrade for more.",
        limitReached: true,
      });
    }

    // If we reach here, the user is authenticated and has permission
    // but this endpoint is just for validation - actual upload happens elsewhere
    return res.status(200).json({
      success: true,
      message: "User authorized for uploads",
    });
  } catch (error: any) {
    logger.error("File upload failed", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to get file extension from MIME type
function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/json": "json",
    "application/zip": "zip",
    "application/x-tar": "tar",
    "application/gzip": "gz",
    "audio/mpeg": "mp3",
    "video/mp4": "mp4",
    "application/octet-stream": "bin",
  };

  return mimeToExt[mimeType] || "bin";
}


// Public feedback endpoint (no auth required for submission)
app.post("/api/feedback/public", async (req, res) => {
  try {
    // Import the feedback service
    const { FeedbackService } = await import("../services/feedbackService");

    // Get feedback data from request body
    const feedbackData = req.body;

    // Validate required fields
    if (
      !feedbackData.type ||
      !feedbackData.title ||
      !feedbackData.description
    ) {
      return res.status(400).json({
        success: false,
        message: "Type, title, and description are required",
      });
    }

    const validTypes = ["feedback", "bug_report", "feature_request"];
    if (!validTypes.includes(feedbackData.type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback type",
      });
    }

    const validPriorities = ["low", "medium", "high", "critical"];
    if (
      feedbackData.priority &&
      !validPriorities.includes(feedbackData.priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority level",
      });
    }

    // Create feedback with null user_id for anonymous submissions
    const feedback = await FeedbackService.createFeedback({
      user_id: null, // Anonymous submission
      type: feedbackData.type,
      category: feedbackData.category || null,
      priority: feedbackData.priority || "medium",
      title: feedbackData.title,
      description: feedbackData.description,
      status: "open",
      attachment_urls: feedbackData.attachment_urls || [],
      browser_info: feedbackData.browser_info || null,
      os_info: feedbackData.os_info || null,
      screen_size: feedbackData.screen_size || null,
      user_plan: feedbackData.user_plan || null,
      admin_notes: feedbackData.admin_notes || null,
    });

    return res.json({ success: true, feedback });
  } catch (error) {
    console.error("Error creating public feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create feedback",
    });
  }
});

// Apply auth middleware to feedback routes
app.use("/api/feedback", authMiddleware);
app.use("/api/feedback", feedbackRouter);

// Apply auth middleware to notification routes
app.use("/api/notifications", authMiddleware);

// Mount the notifications router
app.use("/api/notifications", notificationsRouter);

// Research routes already have per-route authentication defined in the router

// Documentation routes (no auth required)
app.use("/api/docs", docsRouter);

// Test endpoint to check auth middleware
app.get("/api/test-auth", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    res.json({ success: true, userId, user: (req as any).user });
  } catch (error: any) {
    logger.error("Error testing auth middleware:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test endpoint to check if auth middleware works with billing routes
app.get("/api/test-auth-billing-simple", authMiddleware, async (req, res) => {
  try {
    // This route uses the same auth middleware as the billing routes
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // If we get here, the auth middleware is working correctly
    return res.json({
      success: true,
      message: "Auth middleware working correctly",
      userId: userId,
    });
  } catch (error: any) {
    logger.error("Error testing auth middleware:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Test endpoint to simulate exact billing route flow
app.get("/api/test-exact-billing-flow", async (req, res) => {
  try {
    console.log("=== Testing Exact Billing Route Flow ===");

    // Simulate the exact request object structure that would come from auth middleware
    const mockReq: any = {
      user: {
        id: "1c3e6b81-cf15-4cf8-a9e3-043649c4010c",
        email: "test@example.com",
      },
    };

    console.log("Mock request user:", mockReq.user);
    console.log("User ID:", mockReq.user?.id);

    // Extract user ID exactly as the billing route does
    const userId = (mockReq as any).user?.id;
    console.log("Extracted user ID:", userId);

    if (!userId) {
      console.log("ERROR: No user ID found");
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    console.log(
      "Calling SubscriptionService.getUserPlanInfo with user ID:",
      userId,
    );

    // Import and call the subscription service exactly as the billing route does
    const { SubscriptionService } =
      await import("../services/subscriptionService");
    const subscriptionInfo = await SubscriptionService.getUserPlanInfo(userId);

    console.log("Successfully got subscription info");

    return res.json({ success: true, subscription: subscriptionInfo });
  } catch (error: any) {
    logger.error("Error testing exact billing route flow:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
const server = app.listen(Number(PORT), "0.0.0.0", async () => {
  logger.info(`ScholarForge AIhybrid backend server running on port ${PORT}`);
  logger.info(`WebSocket collaboration server running on port 9081`);
  logger.info(`WebSocket notification server running on port 8082`);
  metrics.setGauge("server_status", 1);

  // Schedule the cleanup task for expired recycle bin items
  scheduleCleanupTask();

  // Schedule the version cleanup task based on subscription plans
  scheduleVersionCleanupTask(); // Added import and function call

  // Initialize the task scheduler for leaderboard updates
  try {
    const scheduler = await import("../tasks/scheduler");
    logger.info("Task scheduler initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize task scheduler:", error);
  }

  // Initialize the version scheduler
  try {
    const versionScheduler =
      await import("../services/versionSchedulerService");
    versionScheduler.default.start();
    logger.info("Version scheduler initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize version scheduler:", error);
  }

  // Initialize notification WebSocket server
  try {
    const notificationServer = getNotificationServer();
    await notificationServer;
    logger.info("Notification WebSocket server initialized on port 8082");
  } catch (error) {
    logger.error("Failed to initialize notification WebSocket server:", error);
  }

  // Initialize collaboration WebSocket server (Hocuspocus)
  try {
    const collaborationServer = new HocuspocusCollaborationServer(9081);
    await collaborationServer.start();
    logger.info("WebSocket collaboration server initialized on port 9081");
  } catch (error) {
    logger.error("Failed to initialize WebSocket collaboration server:", error);
  }
});

// Enhanced 404 handler - This should be at the VERY END
app.use((req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log("=== 404 Handler EXECUTED ===");
  console.log("Method:", req.method);
  console.log("Original URL:", req.originalUrl);
  console.log("Full URL:", fullUrl);
  console.log("Base URL:", req.baseUrl);
  console.log("Path:", req.path);

  logger.warn("Endpoint not found", {
    url: req.originalUrl,
    method: req.method,
    baseUrl: req.baseUrl,
    path: req.path,
  });

  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down servers...");
  metrics.setGauge("server_status", 0);

  // Close the HTTP server
  server.close(() => {
    logger.info("HTTP server closed");
  });

  // Exit the process
  process.exit(0);
});

// Add process-level error handlers to prevent crashes
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { reason: reason, promise: promise });
  console.error("Unhandled Rejection at:", reason);
  // Don't exit the process, just log the error
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  console.error("Uncaught Exception:", error);
  // Don't exit the process, just log the error
});

export default app;
