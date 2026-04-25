import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import logger from "../../monitoring/logger";
import { AuthService } from "../../services/hybridAuthService";
import { SecretsService } from "../../services/secrets-service";
import { getUnreadNotificationCount } from "../../services/notificationService";

interface NotificationWebSocket extends WebSocket {
  userId?: string;
  isAuthenticated?: boolean;
}

export class NotificationServer {
  private wss: WebSocketServer;
  private port: number;
  private connectedClients: Map<string, Set<NotificationWebSocket>> = new Map(); // userId -> Set of connections
  private channelSubscriptions: Map<string, Set<NotificationWebSocket>> =
    new Map(); // channelName -> Set of connections

  constructor(port: number) {
    this.port = port;

    // Create HTTP server to upgrade to WebSocket connections with CORS support
    const server = http.createServer((req, res) => {
      // Handle preflight requests
      if (req.method === "OPTIONS") {
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": 2592000, // 30 days
        });
        res.end();
        return;
      }

      // For other requests, send 404
      res.writeHead(404);
      res.end();
    });

    this.wss = new WebSocketServer({
      server,
      // Add CORS handling
      verifyClient: async (info, callback) => {
        console.log(
          `[NotificationServer] Connection attempt from ${info.req.headers.origin} - URL: ${info.req.url}`,
        );
        try {
          const urlString = info.req.url || "";
          const host = info.req.headers.host || "localhost";
          const url = new URL(urlString, `http://${host}`);
          const tokenFromUrl = url.searchParams.get("token");
          const tokenFromHeader = info.req.headers.authorization?.replace(
            "Bearer ",
            "",
          );
          const tokenFromProtocol = info.req.headers["sec-websocket-protocol"];

          const token = tokenFromUrl || tokenFromHeader || tokenFromProtocol;

          logger.info("New notification WebSocket connection attempt", {
            url: urlString,
            hasToken: !!token,
            tokenSource: tokenFromUrl
              ? "url"
              : tokenFromHeader
                ? "header"
                : tokenFromProtocol
                  ? "protocol"
                  : "none",
            origin: info.req.headers.origin,
          });

          // Check origin for security
          const origin = info.req.headers.origin;
          const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://localhost:3000",
            "https://localhost:5173",
            await SecretsService.getAppUrl(),
            ...((await SecretsService.getAllowedOrigins())?.split(",") || []),
          ].filter(Boolean) as string[];

          if (origin && allowedOrigins.length > 0) {
            const isOriginAllowed = allowedOrigins.some((allowed) => {
              if (origin === allowed) return true;

              // Compare without protocol
              const cleanOrigin = origin
                .replace("https://", "")
                .replace("http://", "");
              const cleanAllowed = allowed
                .replace("https://", "")
                .replace("http://", "");

              return (
                cleanOrigin === cleanAllowed ||
                cleanOrigin.startsWith(cleanAllowed)
              );
            });

            if (!isOriginAllowed) {
              logger.warn(
                "WebSocket connection attempt from unauthorized origin",
                { origin, allowedOrigins },
              );
              callback(false, 403, "Forbidden: Unauthorized origin");
              return;
            }
          }

          if (!token) {
            console.log(
              `[NotificationServer] No token provided from ${origin}`,
            );
            logger.warn("WebSocket connection attempt without token", {
              url: urlString,
            });
            callback(false, 401, "Unauthorized: No token provided");
            return;
          }

          // Verify the token
          const isValid = await this.verifyAuthToken(token);
          if (!isValid) {
            logger.warn("WebSocket connection attempt with invalid token", {
              tokenPreview: token.substring(0, 10) + "...",
              tokenLength: token.length,
            });
            callback(false, 401, "Unauthorized: Invalid token");
            return;
          }

          callback(true);
        } catch (error) {
          logger.error("Error during WebSocket verifyClient", {
            error: error instanceof Error ? error.message : String(error),
          });
          callback(false, 401, "Unauthorized: Authentication failed");
        }
      },
    });

    this.setupWebSocketHandlers();

    // Start the HTTP server
    server.listen(this.port, () => {
      logger.info(
        `Notification WebSocket server starting on port ${this.port}`,
      );
    });

    // Handle server errors
    server.on("error", (error) => {
      logger.error("Notification WebSocket server error", { error });
    });
  }

  private async verifyAuthToken(token: string): Promise<boolean> {
    try {
      // Verify token with Supabase using AuthService
      const result = await AuthService.verifyTokenAndGetUser(token);
      if (!result) {
        logger.warn("AuthService returned null result for token verification");
        return false;
      }
      return true;
    } catch (error: any) {
      // Check if the error is a connection timeout
      if (error.cause && error.cause.code === "UND_ERR_CONNECT_TIMEOUT") {
        logger.warn(
          "Connection timeout during token verification (UND_ERR_CONNECT_TIMEOUT)",
          {
            error: error.cause,
          },
        );
        return false;
      }

      logger.error("AuthToken verification exception", {
        error: error.message || error,
        stack: error.stack,
      });
      return false;
    }
  }

  private setupWebSocketHandlers() {
    this.wss.on("connection", async (ws: NotificationWebSocket, req) => {
      logger.info("New notification WebSocket connection established", {
        url: req.url,
        headers: {
          origin: req.headers.origin,
          userAgent: req.headers["user-agent"],
        },
      });

      // Try to authenticate immediately if token is in URL
      try {
        const urlString = req.url || "http://localhost";
        const url = new URL(
          urlString,
          `http://${req.headers.host || "localhost"}`,
        );
        const token = url.searchParams.get("token");

        if (token) {
          logger.info("Attempting auto-authentication from connection URL");
          await this.authenticateUser(ws, token);
        }
      } catch (error) {
        logger.debug("Could not auto-authenticate from URL", { error });
      }

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString());
          logger.debug("Received WebSocket message", { type: message.type });
          await this.handleMessage(ws, message);
        } catch (error) {
          logger.error("Error parsing WebSocket message", { error });
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            }),
          );
        }
      });

      ws.on("close", () => {
        if (ws.userId) {
          this.removeClientConnection(ws.userId, ws);
          logger.info(`Client disconnected: ${ws.userId}`);
        }
        // Cleanup all channel subscriptions for this connection
        this.unsubscribeFromAllChannels(ws);
      });

      ws.on("error", (error) => {
        logger.error("WebSocket connection error", { error });
      });
    });

    this.wss.on("error", (error) => {
      logger.error("WebSocket server error", { error });
    });
  }

  private async handleMessage(ws: NotificationWebSocket, message: any) {
    const { type, token, channels } = message;

    switch (type) {
      case "authenticate":
        await this.authenticateUser(ws, token);
        break;
      case "subscribe":
        if (ws.isAuthenticated) {
          this.subscribeToChannels(ws, channels);
        } else {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Authentication required",
            }),
          );
        }
        break;
      case "unsubscribe":
        if (ws.isAuthenticated) {
          this.unsubscribeFromChannels(ws, channels);
        }
        break;
      case "channel_message":
        if (ws.isAuthenticated && message.channel && message.data) {
          this.broadcastToChannel(message.channel, message.data);
        }
        break;
      default:
        logger.warn("Unknown message type received", { type });
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
          }),
        );
    }
  }

  private async authenticateUser(ws: NotificationWebSocket, token: string) {
    try {
      if (!token) {
        // If already authenticated via URL, don't error
        if (ws.isAuthenticated) {
          logger.debug(
            "User already authenticated via URL, ignoring empty token message",
          );
          return;
        }
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Token required for authentication",
          }),
        );
        ws.close();
        return;
      }

      // If already authenticated with the SAME token, ignore
      if (ws.isAuthenticated && ws.userId) {
        const currentUserId = await this.getUserIdFromToken(token);
        if (currentUserId === ws.userId) {
          logger.debug("User already authenticated with same token, ignoring");
          return;
        }
      }

      // Verify the token
      const isValid = await this.verifyAuthToken(token);
      if (!isValid) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid authentication token",
          }),
        );
        ws.close();
        return;
      }

      // Get user ID from token (in a real implementation you'd decode the JWT)
      // For now, we'll assume the token contains user info or we need to look it up
      const userId = await this.getUserIdFromToken(token);
      if (!userId) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Could not retrieve user ID from token",
          }),
        );
        ws.close();
        return;
      }

      // Mark as authenticated
      ws.userId = userId;
      ws.isAuthenticated = true;

      // Add to connected clients
      this.addClientConnection(userId, ws);

      // Send authentication confirmation
      ws.send(
        JSON.stringify({
          type: "authenticated",
          userId,
        }),
      );

      // Push initial unread count to the user immediately after authentication
      try {
        const unreadCount = await getUnreadNotificationCount(userId);
        ws.send(
          JSON.stringify({
            type: "notification_count",
            count: unreadCount,
          }),
        );
        logger.info(
          `Pushed initial unread count (${unreadCount}) to user ${userId}`,
        );
      } catch (countError) {
        logger.error("Error pushing initial unread count", { countError });
      }

      logger.info(`User authenticated via WebSocket: ${userId}`);
    } catch (error) {
      logger.error("Authentication error", { error });
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Authentication failed",
        }),
      );
      ws.close();
    }
  }

  private async getUserIdFromToken(token: string): Promise<string | null> {
    try {
      // Verify token with Supabase using AuthService to get user info
      const result = await AuthService.verifyTokenAndGetUser(token);
      return result?.supabaseUser?.id || result?.dbUser?.id || null;
    } catch (error) {
      logger.error("Error getting user ID from token", { error });
      return null;
    }
  }

  private addClientConnection(userId: string, ws: NotificationWebSocket) {
    if (!this.connectedClients.has(userId)) {
      this.connectedClients.set(userId, new Set());
    }
    this.connectedClients.get(userId)!.add(ws);
    logger.debug(
      `Added connection for user ${userId}. Total connections: ${
        this.connectedClients.get(userId)!.size
      }`,
    );
  }

  private removeClientConnection(userId: string, ws: NotificationWebSocket) {
    const userConnections = this.connectedClients.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connectedClients.delete(userId);
      }
      logger.debug(
        `Removed connection for user ${userId}. Remaining connections: ${userConnections.size}`,
      );
    }
  }

  private subscribeToChannels(ws: NotificationWebSocket, channels: string[]) {
    if (!channels || !Array.isArray(channels)) return;

    channels.forEach((channel) => {
      if (!this.channelSubscriptions.has(channel)) {
        this.channelSubscriptions.set(channel, new Set());
      }
      this.channelSubscriptions.get(channel)!.add(ws);
    });

    ws.send(
      JSON.stringify({
        type: "subscribed",
        channels,
      }),
    );
    logger.debug(
      `User ${ws.userId} subscribed to channels: ${channels.join(", ")}`,
    );
  }

  private unsubscribeFromChannels(
    ws: NotificationWebSocket,
    channels: string[],
  ) {
    if (!channels || !Array.isArray(channels)) return;

    channels.forEach((channel) => {
      const subscribers = this.channelSubscriptions.get(channel);
      if (subscribers) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.channelSubscriptions.delete(channel);
        }
      }
    });

    ws.send(
      JSON.stringify({
        type: "unsubscribed",
        channels,
      }),
    );
    logger.debug(
      `User ${ws.userId} unsubscribed from channels: ${channels.join(", ")}`,
    );
  }

  private unsubscribeFromAllChannels(ws: NotificationWebSocket) {
    this.channelSubscriptions.forEach((subscribers, channel) => {
      if (subscribers.has(ws)) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.channelSubscriptions.delete(channel);
        }
      }
    });
  }

  // Method to send a message to all subscribers of a channel
  public broadcastToChannel(channel: string, data: any) {
    const subscribers = this.channelSubscriptions.get(channel);
    if (subscribers) {
      const message = JSON.stringify({
        type: "channel_message",
        channel,
        data,
      });

      let sentCount = 0;
      subscribers.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          sentCount++;
        }
      });

      logger.info(`Broadcast to channel ${channel} sent to ${sentCount} users`);
    }
  }

  // Method to send a notification to a specific user
  public sendNotificationToUser(userId: string, notification: any) {
    const userConnections = this.connectedClients.get(userId);
    if (userConnections) {
      const message = JSON.stringify({
        type: "notification",
        notification,
      });

      userConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      logger.info(`Sent notification to user ${userId}`, {
        notificationId: notification.id,
      });
    } else {
      logger.debug(
        `No active connections for user ${userId}, notification stored in database for later delivery`,
      );
    }
  }

  // Method to broadcast notification to all connected clients
  public broadcastNotification(notification: any) {
    let sentCount = 0;

    this.connectedClients.forEach((connections, userId) => {
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "notification",
              notification,
            }),
          );
          sentCount++;
        }
      });
    });

    logger.info(`Broadcast notification to ${sentCount} connections`, {
      notificationId: notification.id,
    });
  }

  // Gracefully close the server
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close all client connections
      this.connectedClients.forEach((connections) => {
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        });
      });

      // Clear the connections maps
      this.connectedClients.clear();
      this.channelSubscriptions.clear();

      // Close the WebSocket server
      this.wss.close((error) => {
        if (error) {
          logger.error("Error closing notification WebSocket server", {
            error,
          });
          reject(error);
        } else {
          logger.info("Notification WebSocket server closed");
          resolve();
        }
      });
    });
  }

  // Get current server stats
  public getStats() {
    const totalConnections = Array.from(this.connectedClients.values()).reduce(
      (sum, connections) => sum + connections.size,
      0,
    );

    return {
      port: this.port,
      totalConnections,
      uniqueUsers: this.connectedClients.size,
    };
  }
}
