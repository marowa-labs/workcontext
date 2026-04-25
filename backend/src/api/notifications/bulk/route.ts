import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  dismissNotification,
  snoozeNotification,
} from "../../../services/notificationService";
import { getSupabaseClient } from "../../../lib/supabase/client";

// POST /api/notifications/bulk/read - Mark multiple notifications as read
export async function POST_READ(request: Request) {
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
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "notificationIds array is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mark each notification as read
    const results = [];
    for (const notificationId of notificationIds) {
      try {
        const result = await markNotificationAsRead(notificationId);
        results.push({ notificationId, success: true, result });
      } catch (error: any) {
        results.push({
          notificationId,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bulk mark as read operation completed",
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bulk mark as read operation:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to perform bulk mark as read operation",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/notifications/bulk/delete - Delete multiple notifications
export async function POST_DELETE(request: Request) {
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
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "notificationIds array is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete each notification
    const results = [];
    for (const notificationId of notificationIds) {
      try {
        const result = await deleteNotification(notificationId);
        results.push({ notificationId, success: true, result });
      } catch (error: any) {
        results.push({
          notificationId,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bulk delete operation completed",
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bulk delete operation:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to perform bulk delete operation",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/notifications/bulk/dismiss - Dismiss multiple notifications
export async function POST_DISMISS(request: Request) {
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
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "notificationIds array is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Dismiss each notification
    const results = [];
    for (const notificationId of notificationIds) {
      try {
        const result = await dismissNotification(notificationId);
        results.push({ notificationId, success: true, result });
      } catch (error: any) {
        results.push({
          notificationId,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bulk dismiss operation completed",
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bulk dismiss operation:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to perform bulk dismiss operation",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/notifications/bulk/snooze - Snooze multiple notifications
export async function POST_SNOOZE(request: Request) {
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
    const { notificationIds, snoozeUntil } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "notificationIds array is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!snoozeUntil) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "snoozeUntil is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const snoozeDate = new Date(snoozeUntil);

    // Snooze each notification
    const results = [];
    for (const notificationId of notificationIds) {
      try {
        const result = await snoozeNotification(notificationId, snoozeDate);
        results.push({ notificationId, success: true, result });
      } catch (error: any) {
        results.push({
          notificationId,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bulk snooze operation completed",
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bulk snooze operation:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to perform bulk snooze operation",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
