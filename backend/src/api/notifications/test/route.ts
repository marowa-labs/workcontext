import { createNotification } from "../../../services/notificationService";
import { getSupabaseClient } from "../../../lib/supabase/client";

// POST /api/notifications/test - Send a test notification
export async function POST(request: Request & { user?: { id: string } }) {
  try {
    // Get user from authentication middleware
    const userId = request.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const body = await request.json();
    const { type, title, message } = body;

    // Create test notification
    const notification = await createNotification(userId, type, title, message);

    return new Response(JSON.stringify({ success: true, notification }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to send test notification",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
