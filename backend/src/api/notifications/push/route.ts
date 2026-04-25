import { PushNotificationService } from "../../../services/pushNotificationService";
import { getSupabaseClient } from "../../../lib/supabase/client";

// POST /api/notifications/push/register - Register a push notification token
export async function POST_REGISTER(request: Request) {
  try {
    // Get user session
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
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session || !session.user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, message: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Register the token
    await PushNotificationService.registerToken(userId, token);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Push notification token registered successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error registering push notification token:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to register push notification token",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/notifications/push/unregister - Unregister a push notification token
export async function POST_UNREGISTER(request: Request) {
  try {
    // Get user session
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
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session || !session.user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, message: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Unregister the token
    await PushNotificationService.unregisterToken(userId, token);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Push notification token unregistered successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error unregistering push notification token:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to unregister push notification token",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/notifications/push/test - Send a test push notification
export async function POST_TEST(request: Request) {
  try {
    // Get user session
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
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session || !session.user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { title, message, data } = body;

    // Send test push notification
    await PushNotificationService.sendToUser(
      userId,
      title || "Test Notification",
      message || "This is a test push notification",
      data
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test push notification sent successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending test push notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to send test push notification",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
