import {
  getUserNotificationSettings,
  updateUserNotificationSettings,
} from "../../../services/notificationService";
import { getSupabaseClient } from "../../../lib/supabase/client";

// GET /api/notifications/settings - Get user notification settings
export async function GET(request: Request) {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token with Supabase
    const supabase = await getSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Get notification settings
    const settings = await getUserNotificationSettings(userId);

    return new Response(JSON.stringify({ success: true, settings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch notification settings",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT /api/notifications/settings - Update user notification settings
export async function PUT(request: Request) {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token with Supabase
    const supabase = await getSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const body = await request.json();

    // Update notification settings
    const settings = await updateUserNotificationSettings(userId, body);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification settings updated successfully",
        settings,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to update notification settings",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
