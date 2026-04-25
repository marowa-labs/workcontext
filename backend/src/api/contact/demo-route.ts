import { Request, Response } from "express";
import { DemoRequestService } from "../../services/demoRequestService";

export const handleDemoRequest = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, institution, role, date, time, message } = req.body;

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
      console.error(
        "Failed to send demo request to Discord webhook:",
        webhookError
      );
      // Don't fail the request if webhook fails, just log the error
    }

    return res.status(200).json({
      message: "Demo request submitted successfully",
      demoRequestId: demoRequest.id,
    });
  } catch (error) {
    console.error("Error handling demo request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default handleDemoRequest;
