import { prisma } from "../lib/prisma";
import { Request, Response } from "express";

export interface DemoRequestData {
  name: string;
  email: string;
  institution: string;
  role?: string;
  date: string;
  time: string;
  message?: string;
}

export interface DemoRequestWithIP extends DemoRequestData {
  ip_address?: string;
  user_agent?: string;
}

export class DemoRequestService {
  /**
   * Creates a new demo request in the database
   */
  static async createDemoRequest(data: DemoRequestWithIP) {
    try {
      const demoRequest = await prisma.demoRequest.create({
        data: {
          name: data.name,
          email: data.email,
          institution: data.institution,
          role: data.role,
          date: new Date(data.date),
          time: data.time,
          message: data.message || "",
          ip_address: data.ip_address,
          user_agent: data.user_agent,
        },
      });

      return demoRequest;
    } catch (error) {
      console.error("Error creating demo request:", error);
      throw new Error("Failed to create demo request");
    }
  }

  /**
   * Sends the demo request data to a Discord webhook
   */
  static async sendToDiscordWebhook(demoRequest: any) {
    try {
      const webhookUrl = process.env.DEMO_REQUEST_DISCORD_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn("DEMO_REQUEST_DISCORD_WEBHOOK_URL not configured, skipping Discord notification");
        return;
      }

      const webhookData = {
        content: null,
        embeds: [
          {
            title: "New Demo Request",
            color: 33023,
            fields: [
              {
                name: "Name",
                value: demoRequest.name,
                inline: true,
              },
              {
                name: "Email",
                value: demoRequest.email,
                inline: true,
              },
              {
                name: "Institution",
                value: demoRequest.institution,
                inline: true,
              },
              {
                name: "Role",
                value: demoRequest.role || "Not specified",
                inline: true,
              },
              {
                name: "Preferred Date",
                value: new Date(demoRequest.date).toLocaleDateString(),
                inline: true,
              },
              {
                name: "Preferred Time",
                value: this.formatTimeSlot(demoRequest.time),
                inline: true,
              },
              {
                name: "Message",
                value: demoRequest.message || "No message provided",
                inline: false,
              },
              {
                name: "Submitted At",
                value: new Date(demoRequest.created_at).toLocaleString(),
                inline: false,
              },
            ],
            footer: {
              text: "ScholarForge AIDemo Request",
            },
            timestamp: new Date().toISOString(),
          },
        ],
        username: "ScholarForge AIBot",
        avatar_url: "https://scholarforgeai.com/logo.png",
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        throw new Error(
          `Discord webhook failed with status ${response.status}`,
        );
      }

      return response;
    } catch (error) {
      console.error("Error sending to Discord webhook:", error);
      throw new Error("Failed to send demo request to Discord");
    }
  }

  /**
   * Formats the time slot for better display
   */
  private static formatTimeSlot(timeSlot: string): string {
    switch (timeSlot) {
      case "morning":
        return "Morning (9:00 AM - 12:00 PM)";
      case "afternoon":
        return "Afternoon (12:00 PM - 5:00 PM)";
      case "evening":
        return "Evening (5:00 PM - 8:00 PM)";
      default:
        return timeSlot;
    }
  }

  /**
   * Gets all demo requests (for admin purposes)
   */
  static async getAllDemoRequests() {
    try {
      const demoRequests = await prisma.demoRequest.findMany({
        orderBy: {
          created_at: "desc",
        },
      });

      return demoRequests;
    } catch (error) {
      console.error("Error fetching demo requests:", error);
      throw new Error("Failed to fetch demo requests");
    }
  }

  /**
   * Gets a specific demo request by ID
   */
  static async getDemoRequestById(id: string) {
    try {
      const demoRequest = await prisma.demoRequest.findUnique({
        where: { id },
      });

      return demoRequest;
    } catch (error) {
      console.error("Error fetching demo request:", error);
      throw new Error("Failed to fetch demo request");
    }
  }
}
