import logger from "../monitoring/logger";
import { prisma } from "../lib/prisma";

export class SessionService {
  // Parse user agent string to extract browser and OS info
  static parseUserAgent(userAgent: string): {
    browser: string;
    os: string;
    device: string;
  } {
    let browser = "Unknown Browser";
    let os = "Unknown OS";
    const device = "Desktop";

    // Detect browser - order matters! Check Chrome before Safari since Chrome UA contains "Safari"
    if (userAgent.includes("Edg/")) {
      browser = "Microsoft Edge";
    } else if (userAgent.includes("OPR/") || userAgent.includes("Opera/")) {
      browser = "Opera";
    } else if (userAgent.includes("Firefox/")) {
      browser = "Firefox";
    } else if (userAgent.includes("Chrome/")) {
      browser = "Chrome";
    } else if (userAgent.includes("Safari/")) {
      browser = "Safari";
    } else if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) {
      browser = "Internet Explorer";
    }

    // Detect OS
    if (userAgent.includes("Windows NT 10.0")) {
      os = "Windows 10/11";
    } else if (userAgent.includes("Windows NT 6.3")) {
      os = "Windows 8.1";
    } else if (userAgent.includes("Windows NT 6.2")) {
      os = "Windows 8";
    } else if (userAgent.includes("Windows NT 6.1")) {
      os = "Windows 7";
    } else if (userAgent.includes("Mac OS X")) {
      os = "macOS";
    } else if (userAgent.includes("Linux")) {
      os = "Linux";
    } else if (userAgent.includes("Android")) {
      os = "Android";
    } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      os = "iOS";
    }

    return { browser, os, device };
  }

  // Format IP address for display
  static formatIpAddress(ip: string): string {
    if (!ip || ip === "::1" || ip === "::ffff:127.0.0.1") {
      return "Localhost";
    }
    if (ip.startsWith("::ffff:")) {
      return ip.substring(7); // Convert IPv4-mapped IPv6 to IPv4
    }
    return ip;
  }

  // Get location from IP address using OpenStreetMap Nominatim API
  static async getLocationFromIp(ip: string): Promise<string | null> {
    try {
      // Skip localhost/private IPs
      if (
        ip === "Localhost" ||
        ip === "127.0.0.1" ||
        ip.startsWith("192.168.") ||
        ip.startsWith("10.") ||
        ip.startsWith("172.16.") ||
        ip === "Unknown"
      ) {
        return "Local Network";
      }

      // Use ip-api.com for geolocation (free, no key required)
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,city,regionName,country`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.status === "success") {
        const parts = [data.city, data.regionName, data.country].filter(
          Boolean,
        );
        return parts.join(", ");
      }

      return null;
    } catch (error) {
      logger.warn("Failed to get location from IP:", { ip, error });
      return null;
    }
  }

  // Create a new user session
  static async createSession(
    userId: string,
    deviceInfo: string,
    ipAddress: string,
    location?: string,
  ) {
    try {
      // Parse user agent for better display
      const parsed = this.parseUserAgent(deviceInfo);
      const displayInfo = `${parsed.browser} - ${parsed.os}`;

      // Format IP address
      const formattedIp = this.formatIpAddress(ipAddress);

      // Get location from IP if not provided
      const resolvedLocation =
        location || (await this.getLocationFromIp(formattedIp));

      // Set session to expire in 30 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const session = await prisma.userSession.create({
        data: {
          user_id: userId,
          device_info: displayInfo,
          ip_address: formattedIp,
          location: resolvedLocation,
          last_active: new Date(),
          is_current: true,
          expires_at: expiresAt,
        },
      });

      return session;
    } catch (error) {
      logger.error("Error creating user session:", error);
      throw new Error("Failed");
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
    errorCode?: string,
  ) {
    try {
      // Parse user agent for better display
      const parsed = this.parseUserAgent(deviceInfo);
      const displayInfo = `${parsed.browser} - ${parsed.os}`;

      // Format IP address
      const formattedIp = this.formatIpAddress(ipAddress);

      // Get location from IP if not provided
      const resolvedLocation =
        location || (await this.getLocationFromIp(formattedIp));

      const loginHistory = await prisma.loginHistory.create({
        data: {
          user_id: userId,
          ip_address: formattedIp,
          device_info: displayInfo,
          location: resolvedLocation,
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
