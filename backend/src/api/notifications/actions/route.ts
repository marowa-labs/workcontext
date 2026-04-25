import { markNotificationAsRead } from "../../../services/notificationService";
import { getSupabaseClient } from "../../../lib/supabase/client";

// POST /api/notifications/actions - Handle notification actions (dismiss, snooze)
export async function POST(request: Request) {
  try {
    // Get user session from Supabase Auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const supabaseClient = await getSupabaseClient();
      if (!supabaseClient) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Supabase client not initialized",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(token);

      if (error || !user) {
        return new Response(
          JSON.stringify({ success: false, message: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Move the rest of the code inside this try block where 'user' is available
      const userId = user.id;
      const body = await request.json();
      const { notificationId, action, snoozeUntil } = body;

      if (!notificationId || !action) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Missing notificationId or action parameter",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      switch (action) {
        case "dismiss":
          // For now, just mark as read since we haven't implemented the dismissed field yet
          await markNotificationAsRead(notificationId);
          return new Response(
            JSON.stringify({
              success: true,
              message: "Notification dismissed",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );

        case "snooze":
          // For now, just mark as read since we haven't implemented the snooze functionality yet
          await markNotificationAsRead(notificationId);
          return new Response(
            JSON.stringify({
              success: true,
              message: "Notification snoozed",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );

        default:
          return new Response(
            JSON.stringify({
              success: false,
              message: "Invalid action",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error handling notification action:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to handle notification action",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
