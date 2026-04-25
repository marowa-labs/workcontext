import { Request, Response } from "express";
import { FeatureRequestService } from "../../services/featureRequestService";

export const handleFeatureRequest = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      featureTitle,
      featureDescription,
      useCase,
      category,
      priority,
      email,
    } = req.body;

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
      console.error(
        "Failed to send feature request to Discord webhook:",
        webhookError
      );
      // Don't fail the request if webhook fails, just log the error
    }

    return res.status(200).json({
      message: "Feature request submitted successfully",
      featureRequestId: featureRequest.id,
    });
  } catch (error) {
    console.error("Error handling feature request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handleFeatureRequest;
