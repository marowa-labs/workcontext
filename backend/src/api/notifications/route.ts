import {
  getUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

// GET /api/notifications - Get user notifications
export async function GET(request: Request & { user?: { id: string } }) {
  try {
    // Get user from authentication middleware (attached by main-server.ts)
    const userId = request.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const type = url.searchParams.get("type") || undefined;
    const priority = url.searchParams.get("priority") as
      | "high"
      | "medium"
      | "low"
      | undefined;
    const search = url.searchParams.get("search") || undefined;
    const read = url.searchParams.get("read");
    const readFilter = read !== null ? read === "true" : undefined;

    // Build filters object
    const filters = {
      type,
      priority,
      search,
      read: readFilter,
    };

    // Remove undefined values from filters
    Object.keys(filters).forEach(
      (key) =>
        filters[key as keyof typeof filters] === undefined &&
        delete filters[key as keyof typeof filters]
    );

    // Get notifications
    const notifications = await getUserNotifications(
      userId,
      limit,
      offset,
      filters
    );

    // Get unread count
    const unreadCount = await getUnreadNotificationCount(userId);

    return new Response(
      JSON.stringify({ success: true, notifications, unreadCount }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch notifications",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/notifications/read - Mark notification as read
export async function POST(request: Request & { user?: { id: string } }) {
  try {
    // Get user from authentication middleware (attached by main-server.ts)
    const userId = request.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch (parseError) {
      // If JSON parsing fails, use an empty object
      console.warn("Failed to parse request body as JSON, using empty object");
    }

    const { notificationId, markAllAsRead } = body as {
      notificationId?: string;
      markAllAsRead?: boolean;
    };

    if (markAllAsRead === true) {
      // Mark all notifications as read
      await markAllNotificationsAsRead(userId);
      return new Response(
        JSON.stringify({
          success: true,
          message: "All notifications marked as read",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else if (notificationId) {
      // Mark specific notification as read
      await markNotificationAsRead(notificationId);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notification marked as read",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing notificationId or markAllAsRead parameter",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to mark notification as read",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
