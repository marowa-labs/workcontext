import { NotificationServer } from "../hybrid/websockets/notification-server";

// Singleton instance of NotificationServer
let notificationServer: NotificationServer | null = null;

export function getNotificationServer(): NotificationServer {
  if (!notificationServer) {
    // Create notification server on port 8082
    notificationServer = new NotificationServer(8082);
  }
  return notificationServer;
}

export function closeNotificationServer(): void {
  if (notificationServer) {
    notificationServer.close();
    notificationServer = null;
  }
}
