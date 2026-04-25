import { prisma } from "../lib/prisma";
import { Request, Response } from "express";

export interface FeatureRequestData {
  featureTitle: string;
  featureDescription: string;
  useCase: string;
  category: string;
  priority: string;
  email?: string;
}

export interface FeatureRequestWithIP extends FeatureRequestData {
  ip_address?: string;
  user_agent?: string;
}

export class FeatureRequestService {
  /**
   * Creates a new feature request in the database
   */
  static async createFeatureRequest(data: FeatureRequestWithIP) {
    try {
      const featureRequest = await prisma.featureRequest.create({
        data: {
          featureTitle: data.featureTitle,
          featureDescription: data.featureDescription,
          useCase: data.useCase,
          category: data.category,
          priority: data.priority,
          email: data.email || null,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
        },
      });

      return featureRequest;
    } catch (error) {
      console.error("Error creating feature request:", error);
      throw new Error("Failed to create feature request");
    }
  }

  /**
   * Sends the feature request data to a Discord webhook
   */
  static async sendToDiscordWebhook(featureRequest: any) {
    try {
      const webhookUrl = process.env.FEATURE_REQUEST_DISCORD_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn("FEATURE_REQUEST_DISCORD_WEBHOOK_URL not configured, skipping Discord notification");
        return;
      }

      const categoryEmojis: Record<string, string> = {
        writing: "✍️",
        ai: "🤖",
        citations: "📝",
        collaboration: "👥",
        organization: "🗂️",
        integration: "🔗",
        other: "❓",
      };

      const priorityEmojis: Record<string, string> = {
        "nice-to-have": "👍",
        important: "⭐",
        critical: "⚠️",
      };

      const webhookData = {
        content: null,
        embeds: [
          {
            title: "New Feature Request",
            color: 16753920, // Orange color
            fields: [
              {
                name: "Feature Title",
                value: featureRequest.featureTitle,
                inline: false,
              },
              {
                name: "Category",
                value: `${categoryEmojis[featureRequest.category] || "❓"} ${this.formatCategory(featureRequest.category)}`,
                inline: true,
              },
              {
                name: "Priority",
                value: `${priorityEmojis[featureRequest.priority] || "❓"} ${this.formatPriority(featureRequest.priority)}`,
                inline: true,
              },
              {
                name: "Detailed Description",
                value:
                  featureRequest.featureDescription ||
                  "No description provided",
                inline: false,
              },
              {
                name: "Use Case",
                value: featureRequest.useCase || "No use case provided",
                inline: false,
              },
              {
                name: "Submitted By",
                value: featureRequest.email || "Anonymous",
                inline: true,
              },
              {
                name: "Submitted At",
                value: new Date(featureRequest.created_at).toLocaleString(),
                inline: true,
              },
            ],
            footer: {
              text: "ScholarForge AIFeature Request",
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
      throw new Error("Failed to send feature request to Discord");
    }
  }

  /**
   * Formats the category for better display
   */
  private static formatCategory(category: string): string {
    switch (category) {
      case "writing":
        return "Writing & Editing";
      case "ai":
        return "AI Features";
      case "citations":
        return "Citations & Plagiarism";
      case "collaboration":
        return "Collaboration";
      case "organization":
        return "Organization & Productivity";
      case "integration":
        return "Integrations";
      case "other":
        return "Other";
      default:
        return category;
    }
  }

  /**
   * Formats the priority for better display
   */
  private static formatPriority(priority: string): string {
    switch (priority) {
      case "nice-to-have":
        return "Nice to Have";
      case "important":
        return "Important";
      case "critical":
        return "Critical";
      default:
        return priority;
    }
  }

  /**
   * Gets all feature requests (for admin purposes)
   */
  static async getAllFeatureRequests() {
    try {
      const featureRequests = await prisma.featureRequest.findMany({
        orderBy: {
          created_at: "desc",
        },
      });

      return featureRequests;
    } catch (error) {
      console.error("Error fetching feature requests:", error);
      throw new Error("Failed to fetch feature requests");
    }
  }

  /**
   * Gets a specific feature request by ID
   */
  static async getFeatureRequestById(id: string) {
    try {
      const featureRequest = await prisma.featureRequest.findUnique({
        where: { id },
      });

      return featureRequest;
    } catch (error) {
      console.error("Error fetching feature request:", error);
      throw new Error("Failed to fetch feature request");
    }
  }
}
