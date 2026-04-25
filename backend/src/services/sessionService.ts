import logger from "../monitoring/logger";
import { prisma } from "../lib/prisma";

export class SessionService {
  // Create a new user session
  static async createSession(
    userId: string,
    deviceInfo: string,
    ipAddress: string,
    location?: string
  ) {
    try {
      // Set session to expire in 30 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const session = await prisma.userSession.create({
        data: {
          user_id: userId,
          device_info: deviceInfo,
          ip_address: ipAddress,
          location: location || null,
          last_active: new Date(),
          is_current: true,
          expires_at: expiresAt,
        },
      });

      return session;
    } catch (error) {
      logger.error("Error creating user session:", error);
      throw new Error("Failed to create user session");
    }
  }

  // Update session last active time
  static async updateSessionActivity(sessionId: string) {
    try {
      const session = await prisma.userSession.update({
        where: { id: sessionId },
        data: { last_active: new Date() },
      });

      return session;
    } catch (error) {
      logger.error("Error updating session activity:", error);
      throw new Error("Failed to update session activity");
    }
  }

  // Get all active sessions for a user
  static async getUserSessions(userId: string) {
    try {
      const sessions = await prisma.userSession.findMany({
        where: {
          user_id: userId,
          expires_at: {
            gt: new Date(),
          },
        },
        orderBy: {
          last_active: "desc",
        },
      });

      return sessions;
    } catch (error) {
      logger.error("Error fetching user sessions:", error);
      throw new Error("Failed to fetch user sessions");
    }
  }

  // Get current session for a user
  static async getCurrentSession(userId: string) {
    try {
      const session = await prisma.userSession.findFirst({
        where: {
          user_id: userId,
          is_current: true,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      return session;
    } catch (error) {
      logger.error("Error fetching current session:", error);
      throw new Error("Failed to fetch current session");
    }
  }

  // End a session
  static async endSession(sessionId: string) {
    try {
      const session = await prisma.userSession.update({
        where: { id: sessionId },
        data: {
          is_current: false,
          expires_at: new Date(),
        },
      });

      return session;
    } catch (error) {
      logger.error("Error ending session:", error);
      throw new Error("Failed to end session");
    }
  }

  // Record a login attempt
  static async recordLoginAttempt(
    userId: string,
    ipAddress: string,
    deviceInfo: string,
    location: string | undefined,
    status: string,
    errorCode?: string
  ) {
    try {
      const loginHistory = await prisma.loginHistory.create({
        data: {
          user_id: userId,
          ip_address: ipAddress,
          device_info: deviceInfo,
          location: location || null,
          status,
          error_code: errorCode || null,
        },
      });

      return loginHistory;
    } catch (error) {
      logger.error("Error recording login attempt:", error);
      throw new Error("Failed to record login attempt");
    }
  }

  // Get login history for a user
  static async getLoginHistory(userId: string, limit = 10) {
    try {
      const loginHistory = await prisma.loginHistory.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          created_at: "desc",
        },
        take: limit,
      });

      return loginHistory;
    } catch (error) {
      logger.error("Error fetching login history:", error);
      throw new Error("Failed to fetch login history");
    }
  }
}
