import {
  getSupabaseClient,
  getSupabaseAdminClient,
} from "../../lib/supabase/client";
import { prisma } from "../../lib/prisma";

// Request OTP for profile update
export async function POST_REQUEST_OTP(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action !== "profile_update") {
      return new Response(
        JSON.stringify({ error: "Invalid action parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token with Supabase Auth
    let user;
    try {
      const client = await getSupabaseClient();
      if (!client) {
        return new Response(
          JSON.stringify({ error: "Supabase client not initialized" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      const {
        data: { user: userData },
        error,
      } = await client.auth.getUser(token);

      if (error || !userData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      user = userData;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user details
    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        phone_number: true,
        full_name: true,
        user_type: true,
      },
    });

    if (!prismaUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine OTP method (email or SMS)
    let method = "email";
    if (prismaUser.phone_number) {
      method = "sms";
    }

    // Import OTP service
    const { OTPService } = await import("../../services/otpService");

    // Send OTP for profile update
    const result = await OTPService.sendOTP(
      user.id,
      prismaUser.email,
      prismaUser.phone_number || "",
      method,
      prismaUser.full_name || "",
      true // isProfileUpdate
    );

    if (!result) {
      return new Response(JSON.stringify({ error: "Failed to send OTP" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `OTP sent successfully to your ${method}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error requesting OTP:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Get user account details
export async function GET(request: Request) {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token with Supabase Auth
    let user;
    try {
      const client = await getSupabaseClient();
      if (!client) {
        return new Response(
          JSON.stringify({ error: "Supabase client not initialized" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      const {
        data: { user: userData },
        error,
      } = await client.auth.getUser(token);

      if (error || !userData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      user = userData;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user details from Prisma
    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        user_type: true,
        field_of_study: true,
        bio: true,
        institution: true,
        location: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!prismaUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user subscription info
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: user.id },
      select: {
        plan: true,
        status: true,
      },
    });

    return new Response(
      JSON.stringify({
        user: {
          ...prismaUser,
          subscription: subscription || null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error getting user details:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Update user profile
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      full_name,
      phone_number,
      user_type,
      field_of_study,
      bio,
      institution,
      location,
    } = body;

    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the token with Supabase Auth
    let user;
    try {
      const client = await getSupabaseClient();
      if (!client) {
        return new Response(
          JSON.stringify({ error: "Supabase client not initialized" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      const {
        data: { user: userData },
        error,
      } = await client.auth.getUser(token);

      if (error || !userData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      user = userData;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        full_name,
        phone_number,
        user_type,
        field_of_study,
        bio,
        institution,
        location,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        user_type: true,
        field_of_study: true,
        bio: true,
        institution: true,
        location: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Also update user metadata in Supabase Auth
    const client = await getSupabaseClient();
    if (!client) {
      console.error("Supabase client not initialized");
      return new Response(
        JSON.stringify({ error: "Supabase client not initialized" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const { error: updateError } = await client.auth.updateUser({
      data: {
        full_name,
        phone_number,
        user_type,
        field_of_study,
      },
    });

    if (updateError) {
      console.error(
        "Error updating user metadata in Supabase Auth:",
        updateError
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Delete user account
export async function DELETE(request: Request & { user?: { id: string } }) {
  try {
    let user;

    // Check if user is passed directly from router context
    if (request.user && request.user.id) {
      user = { id: request.user.id };
    } else {
      // Get user from authorization header (fallback for direct API calls)
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Missing or invalid authorization header" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      // Verify the token with Supabase Auth
      try {
        const client = await getSupabaseClient();
        if (!client) {
          return new Response(
            JSON.stringify({ error: "Supabase client not initialized" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        const {
          data: { user: userData },
          error,
        } = await client.auth.getUser(token);

        if (error || !userData) {
          return new Response(
            JSON.stringify({ error: "Invalid or expired token" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        user = userData;
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get password from request body for verification
    let body;
    try {
      body = await request.json();
    } catch (error) {
      body = {};
    }

    const { confirmPassword } = body || {};

    // Verify password before deleting account
    if (confirmPassword) {
      const client = await getSupabaseClient();
      if (!client) {
        return new Response(
          JSON.stringify({ error: "Supabase client not initialized" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      const { data, error } = await client.auth.signInWithPassword({
        email: user.email || "",
        password: confirmPassword,
      });

      if (error || !data?.user) {
        return new Response(JSON.stringify({ error: "Invalid password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Delete user from database
    await prisma.user.delete({
      where: { id: user.id },
    });

    // Delete user from Supabase Auth
    const adminClient = await getSupabaseAdminClient();
    if (adminClient) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(
        user.id
      );

      if (deleteError) {
        console.error("Error deleting user from Supabase Auth:", deleteError);
        // Don't return error here as the database deletion was successful
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting user account:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
