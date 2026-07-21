import { NotificationServer } from "../hybrid/websockets/notification-server";
import type { Server as HTTPServer } from "http";

// Singleton instance of NotificationServer
let notificationServer: NotificationServer | null = null;

export function getNotificationServer(
  httpServer?: HTTPServer,
): NotificationServer {
  if (!notificationServer) {
    if (httpServer) {
      // Production mode: attach to main HTTP server
      notificationServer = new NotificationServer(8082, httpServer, "/ws/notifications");
    } else {
      // Local dev mode: standalone port
      notificationServer = new NotificationServer(8082);
    }
  }
  return notificationServer;
}

export function closeNotificationServer(): void {
  if (notificationServer) {
    notificationServer.close();
    notificationServer = null;
  }
}
