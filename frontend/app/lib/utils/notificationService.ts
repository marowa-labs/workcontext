import { apiClient } from "./apiClient";
import { getAuthToken } from "./auth";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  project_activity_enabled: boolean;
  project_activity_comments: boolean;
  project_activity_mentions: boolean;
  project_activity_changes: boolean;
  project_activity_shared: boolean;
  collaboration_enabled: boolean;
  collaboration_new_collaborator: boolean;
  collaboration_permission_changes: boolean;
  collaboration_comments_resolved: boolean;
  collaboration_real_time: boolean;
  ai_features_enabled: boolean;
  ai_features_plagiarism_complete: boolean;
  ai_features_ai_limit: boolean;
  ai_features_new_features: boolean;
  ai_features_weekly_summary: boolean;
  account_billing_enabled: boolean;
  account_billing_payment_success: boolean;
  account_billing_payment_failed: boolean;
  account_billing_subscription_renewed: boolean;
  account_billing_subscription_expiring: boolean;
  account_billing_security_alerts: boolean;
  // Additional billing notification settings
  account_billing_subscription_created: boolean;
  account_billing_subscription_updated: boolean;
  account_billing_subscription_cancelled: boolean;
  account_billing_subscription_resumed: boolean;
  account_billing_subscription_expired: boolean;
  account_billing_payment_refunded: boolean;
  account_billing_invoice_available: boolean;
  product_updates_enabled: boolean;
  product_updates_new_features: boolean;
  product_updates_tips: boolean;
  product_updates_newsletter: boolean;
  product_updates_special_offers: boolean;
  // New notification settings
  writing_progress_enabled: boolean;
  writing_progress_document_deadline: boolean;
  writing_progress_writing_streak: boolean;
  writing_progress_goal_achieved: boolean;
  research_updates_enabled: boolean;
  research_updates_ai_suggestion: boolean;
  research_updates_citation_reminder: boolean;
  research_updates_research_update: boolean;
  document_management_enabled: boolean;
  document_management_backup_available: boolean;
  document_management_template_update: boolean;
  document_management_document_version: boolean;
  collaboration_request_enabled: boolean;
  collaboration_request_collaborator_request: boolean;
  // SMS notification settings
  sms_notifications_enabled: boolean;
  sms_notifications_high_priority_only: boolean;
  frequency: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start_time: string;
  quiet_hours_end_time: string;
  push_notifications_enabled: boolean;
  push_notifications_mentions: boolean;
  push_notifications_comments: boolean;
  push_notifications_direct_messages: boolean;
  push_notifications_marketing: boolean;
  in_app_notifications_enabled: boolean;
  in_app_notifications_sound: boolean;
  in_app_notifications_desktop: boolean;
  created_at: string;
  updated_at: string;
}

// Define notification types
type NotificationType =
  | "comment"
  | "mention"
  | "document_change"
  | "document_shared"
  | "new_collaborator"
  | "permission_change"
  | "comment_resolved"
  | "real_time_edit"
  | "plagiarism_complete"
  | "ai_limit"
  | "new_feature"
  | "weekly_summary"
  | "payment_success"
  | "payment_failed"
  | "subscription_renewed"
  | "subscription_expiring"
  | "security_alert"
  | "new_feature_announcement"
  | "product_tip"
  | "newsletter"
  | "special_offer"
  // New notification types
  | "document_deadline"
  | "writing_streak"
  | "goal_achieved"
  | "ai_suggestion"
  | "citation_reminder"
  | "backup_available"
  | "collaborator_request"
  | "document_version"
  | "research_update"
  | "template_update"
  // Collaboration notification types
  | "collaboration_invite"
  | "collaboration_invite_accepted"
  | "collaboration_invite_declined"
  | "collaboration_removed"
  | "collaboration_session_started"
  | "collaboration_session_ended"
  // Editor notification types
  | "editor_activity"
  | "comment_added"
  | "document_exported";

class NotificationService {
  // Notification event listeners
  private static listeners: Map<string, Function[]> = new Map();

  // WebSocket connection for real-time notifications
  private static ws: WebSocket | null = null;
  private static wsReconnectAttempts: number = 0;
  private static maxReconnectAttempts: number = 5;
  private static reconnectDelay: number = 1000;
  private static isAuthenticated: boolean = false;
  private static isConnecting: boolean = false;

  // User subscription plan
  private static userPlan: string | null = null;

  // Connect to notification WebSocket server
  static async connectWebSocket() {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) return;
      if (this.ws.readyState === WebSocket.CONNECTING) return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    // Get authentication token
    const token = await getAuthToken();

    if (!token) {
      console.error(
        "No authentication token available for WebSocket connection",
      );
      return;
    }

    // Get WebSocket URL (use wss:// in production) with token as query parameter
    // Use window.location.hostname to ensure it works even if accessing via IP
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = window.location.hostname;
    // In production, we might use a different port or path, but for now assuming 8081 for separate WS server
    // or reusing the same port if proxied.
    // For local dev, explicit 8081 is set.
    const wsPort = process.env.NODE_ENV === "production" ? "8082" : "8082";

    const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}?token=${encodeURIComponent(token)}`;

    console.log(
      `[NotificationService] Attempting connection to: ${wsUrl.split("?")[0]} (token hidden)`,
    );

    try {
      this.ws = new WebSocket(wsUrl);

      // Add connection timeout handling
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.warn("WebSocket connection timeout after 5 seconds");
          console.warn("Current readyState:", this.ws.readyState);
          this.isConnecting = false;
          this.ws.close();
          this.handleReconnect();
        }
      }, 5000); // 5 second timeout

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log("Connected to notification server");
        this.wsReconnectAttempts = 0;

        // Authenticate with the server
        this.authenticateWebSocket();
      };

      // Set up other WebSocket event handlers
      this.setupWebSocket();
    } catch (error) {
      console.error(
        "Failed to connect to notification WebSocket server:",
        error,
      );
      this.handleReconnect();
    }
  }

  static isConnected() {
    return (
      this.ws && this.ws.readyState === WebSocket.OPEN && this.isAuthenticated
    );
  }

  private static setupWebSocket() {
    if (!this.ws) return;

    console.log("Setting up WebSocket event handlers");

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("Disconnected from notification server");
      this.isAuthenticated = false;
      this.isConnecting = false;
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("Notification WebSocket error:", error);
      console.error("WebSocket readyState:", this.ws?.readyState);
      this.isAuthenticated = false;
      this.isConnecting = false;

      // Emit error event for components to handle
      this.emit("websocket_error", {
        message: "WebSocket connection error",
        error: error,
        timestamp: new Date().toISOString(),
        readyState: this.ws?.readyState,
      });
    };
  }

  private static async authenticateWebSocket() {
    try {
      // Get the real auth token from Supabase
      const token = await getAuthToken();

      if (!token) {
        console.error(
          "No authentication token available for WebSocket connection",
        );
        return;
      }

      // Send authentication message with real token
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "authenticate",
            token: token,
          }),
        );
        console.log("Sent authentication token to notification server");
      }
    } catch (error) {
      console.error("Error getting authentication token:", error);
    }
  }

  private static handleReconnect() {
    if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
      this.wsReconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.wsReconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      // Exponential backoff with max delay of 30 seconds
      const delay = Math.min(
        this.reconnectDelay * this.wsReconnectAttempts,
        30000,
      );

      console.log(`Reconnecting in ${delay}ms`);

      setTimeout(() => {
        void this.connectWebSocket();
      }, delay);
    } else {
      console.error("Max reconnection attempts reached. Giving up.");
      this.emit("connection_error", {
        message: "Unable to establish connection to notification server",
        timestamp: new Date().toISOString(),
        attempts: this.wsReconnectAttempts,
      });
    }
  }

  private static handleWebSocketMessage(data: any) {
    const { type } = data;

    // Handle authentication confirmation
    if (type === "authenticated") {
      console.log("Authenticated with notification server");
      this.isAuthenticated = true;
      this.emit("authenticated", { userId: data.userId });
      return;
    }

    // Handle real-time notifications
    if (type === "notification") {
      const { notification } = data;
      console.log("Received real-time notification:", notification);

      // Handle notification with subscription filtering
      this.handleNotification(notification);
      return;
    }

    // Handle real-time notification count updates
    if (type === "notification_count") {
      const { count } = data;
      console.log("Received real-time unread count:", count);
      this.emit("notification_count", count);
      return;
    }

    // Handle channel-based messages (e.g., Kanban updates)
    if (type === "channel_message") {
      const { channel, data: messageData } = data;
      console.log(`Received message for channel ${channel}:`, messageData);
      this.emit(`channel:${channel}`, messageData);
      return;
    }

    // Handle subscription confirmation
    if (type === "subscribed") {
      console.log("Subscribed to channels:", data.channels);
      this.emit("subscribed", { channels: data.channels });
      return;
    }

    // Handle unsubscription confirmation
    if (type === "unsubscribed") {
      console.log("Unsubscribed from channels:", data.channels);
      this.emit("unsubscribed", { channels: data.channels });
      return;
    }

    // Handle errors
    if (type === "error") {
      console.error("Notification WebSocket error:", data.message);
      this.emit("error", { message: data.message });
      return;
    }

    // Handle unknown message types
    console.warn("Unknown WebSocket message type:", type);
  }

  // Subscribe to notification channels
  static subscribeToChannels(channels: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(
        JSON.stringify({
          type: "subscribe",
          channels,
        }),
      );
    } else {
      console.warn(
        "Cannot subscribe: WebSocket not connected or not authenticated",
      );
    }
  }

  // Unsubscribe from notification channels
  static unsubscribeFromChannels(channels: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(
        JSON.stringify({
          type: "unsubscribe",
          channels,
        }),
      );
    } else {
      console.warn(
        "Cannot unsubscribe: WebSocket not connected or not authenticated",
      );
    }
  }

  // Broadcast message to a channel
  static broadcast(channel: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(
        JSON.stringify({
          type: "channel_message",
          channel,
          data,
        }),
      );
    } else {
      console.warn(
        "Cannot broadcast: WebSocket not connected or not authenticated",
      );
      // Fallback: emit locally so the current user's UI updates even if offline
      this.emit(`channel:${channel}`, data);
    }
  }

  // Event listener methods
  static on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  static off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private static emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => callback(data));
    }
  }

  // Register push notification token
  static async registerPushToken(token: string): Promise<void> {
    try {
      const response = await apiClient.post(
        "/api/notifications/push/register",
        {
          token,
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to register push token");
      }
    } catch (error) {
      console.error("Error registering push token:", error);
      throw error;
    }
  }

  // Unregister push notification token
  static async unregisterPushToken(token: string): Promise<void> {
    try {
      const response = await apiClient.post(
        "/api/notifications/push/unregister",
        {
          token,
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to unregister push token");
      }
    } catch (error) {
      console.error("Error unregistering push token:", error);
      throw error;
    }
  }

  // Send test push notification
  static async sendTestPush(
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      const response = await apiClient.post("/api/notifications/push/test", {
        title,
        message,
        data,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to send test push notification",
        );
      }
    } catch (error) {
      console.error("Error sending test push notification:", error);
      throw error;
    }
  }

  // Bulk operations
  static async bulkMarkAsRead(notificationIds: string[]): Promise<void> {
    try {
      const response = await apiClient.post("/api/notifications/bulk/read", {
        notificationIds,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to bulk mark notifications as read",
        );
      }
    } catch (error) {
      console.error("Error bulk marking notifications as read:", error);
      throw error;
    }
  }

  static async bulkDelete(notificationIds: string[]): Promise<void> {
    try {
      const response = await apiClient.post("/api/notifications/bulk/delete", {
        notificationIds,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to bulk delete notifications",
        );
      }
    } catch (error) {
      console.error("Error bulk deleting notifications:", error);
      throw error;
    }
  }

  static async bulkDismiss(notificationIds: string[]): Promise<void> {
    try {
      const response = await apiClient.post("/api/notifications/bulk/dismiss", {
        notificationIds,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to bulk dismiss notifications",
        );
      }
    } catch (error) {
      console.error("Error bulk dismissing notifications:", error);
      throw error;
    }
  }

  static async bulkSnooze(
    notificationIds: string[],
    hours: number = 1,
  ): Promise<void> {
    try {
      // Calculate snooze until time
      const snoozeUntil = new Date();
      snoozeUntil.setHours(snoozeUntil.getHours() + hours);

      const response = await apiClient.post("/api/notifications/bulk/snooze", {
        notificationIds,
        snoozeUntil,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to bulk snooze notifications",
        );
      }
    } catch (error) {
      console.error("Error bulk snoozing notifications:", error);
      throw error;
    }
  }

  // Get notifications with optional filters
  static async getNotifications(
    limit: number = 20,
    offset: number = 0,
    filters?: {
      type?: string;
      priority?: "high" | "medium" | "low";
      search?: string;
      read?: boolean;
    },
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      // Add filter parameters
      if (filters?.type) params.append("type", filters.type);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.read !== undefined)
        params.append("read", filters.read.toString());

      const response = await apiClient.get(
        `/api/notifications?${params.toString()}`,
      );

      if (response.success) {
        return {
          notifications: response.notifications,
          unreadCount: response.unreadCount,
        };
      } else {
        throw new Error(response.message || "Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  // Get unread notification count
  static async getUnreadCount(): Promise<number> {
    try {
      // Request only unread notifications to get the count
      const response = await apiClient.get("/api/notifications?read=false");

      if (response.success) {
        return response.unreadCount;
      } else {
        throw new Error(response.message || "Failed to fetch unread count");
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await apiClient.post("/api/notifications/read", {
        notificationId,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to mark notification as read",
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(): Promise<void> {
    try {
      const response = await apiClient.post("/api/notifications/read", {
        markAllAsRead: true,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to mark all notifications as read",
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Dismiss a notification
  static async dismissNotification(notificationId: string): Promise<void> {
    try {
      const response = await apiClient.post("/api/notifications/actions", {
        notificationId,
        action: "dismiss",
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to dismiss notification");
      }
    } catch (error) {
      console.error("Error dismissing notification:", error);
      throw error;
    }
  }

  // Snooze a notification
  static async snoozeNotification(
    notificationId: string,
    hours: number = 1,
  ): Promise<void> {
    try {
      // Calculate snooze until time
      const snoozeUntil = new Date();
      snoozeUntil.setHours(snoozeUntil.getHours() + hours);

      const response = await apiClient.post("/api/notifications/actions", {
        notificationId,
        action: "snooze",
        snoozeUntil,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to snooze notification");
      }
    } catch (error) {
      console.error("Error snoozing notification:", error);
      throw error;
    }
  }

  // Get notification settings
  static async getSettings(): Promise<NotificationSettings> {
    try {
      const response = await apiClient.get("/api/notifications/settings");

      if (response.success) {
        return response.settings;
      } else {
        throw new Error(
          response.message || "Failed to fetch notification settings",
        );
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      throw error;
    }
  }

  // Update notification settings
  static async updateSettings(
    settings: Partial<NotificationSettings>,
  ): Promise<{
    success: boolean;
    message: string;
    settings: NotificationSettings;
  }> {
    try {
      const response = await apiClient.put(
        "/api/notifications/settings",
        settings,
      );

      if (response.success) {
        return {
          success: true,
          message: response.message,
          settings: response.settings,
        };
      } else {
        throw new Error(
          response.message || "Failed to update notification settings",
        );
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      throw error;
    }
  }

  // Set user's subscription plan
  static setUserPlan(plan: string) {
    this.userPlan = plan;
  }

  // Check if user can receive a notification based on their subscription
  static canUserReceiveNotification(type: NotificationType): boolean {
    // If we don't know the user's plan, allow all notifications
    if (!this.userPlan) {
      return true;
    }

    // Define which notification types require which subscription features
    const notificationRequirements: Record<NotificationType, string | null> = {
      // Collaboration notifications - require collaboration features
      comment: "collaboration",
      mention: "collaboration",
      document_change: "collaboration",
      document_shared: "collaboration",
      new_collaborator: "collaboration",
      permission_change: "collaboration",
      comment_resolved: "collaboration",
      real_time_edit: "collaboration",
      collaboration_invite: "collaboration",
      collaboration_invite_accepted: "collaboration",
      collaboration_invite_declined: "collaboration",
      collaboration_removed: "collaboration",
      collaboration_session_started: "collaboration",
      collaboration_session_ended: "collaboration",
      editor_activity: "collaboration",
      comment_added: "collaboration",

      // AI notifications - available to all users but with limits
      plagiarism_complete: null,
      ai_limit: null,
      ai_suggestion: null,

      // Account/Billing notifications - available to all users
      payment_success: null,
      payment_failed: null,
      subscription_renewed: null,
      subscription_expiring: null,
      security_alert: null,

      // Product update notifications - available to all users
      new_feature: null,
      weekly_summary: null,
      new_feature_announcement: null,
      product_tip: null,
      newsletter: null,
      special_offer: null,

      // Writing progress notifications - available to all users
      document_deadline: null,
      writing_streak: null,
      goal_achieved: null,

      // Research notifications
      citation_reminder: null, // Available to all users
      research_update: "research",

      // Document management notifications - available to all users
      backup_available: null,
      document_version: null,
      document_exported: null,

      // Other notifications
      collaborator_request: "collaboration",
      template_update: null,
    };

    // Get the required feature for this notification type
    const requiredFeature = notificationRequirements[type];

    // If no feature is required, user can receive the notification
    if (!requiredFeature) {
      return true;
    }

    // Check if user's plan supports the required feature
    switch (requiredFeature) {
      case "collaboration":
        // Collaboration features require at least Student plan
        return this.userPlan === "student" || this.userPlan === "researcher";

      case "research":
        // Research features require at least Student plan
        return this.userPlan === "student" || this.userPlan === "researcher";

      // Default case - if we don't know the feature, allow the notification
      default:
        return true;
    }
  }

  // Handle incoming notifications and filter based on subscription
  private static handleNotification(notification: Notification) {
    // Check if user can receive this notification based on their subscription
    if (
      !this.canUserReceiveNotification(notification.type as NotificationType)
    ) {
      console.log(
        `User cannot receive ${notification.type} notification due to subscription limitations`,
      );
      return;
    }

    // Emit notification event
    this.emit("notification", notification);
  }
}

export default NotificationService;
