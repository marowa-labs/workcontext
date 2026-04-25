// Supabase Edge Function for OTP Verification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    // Extract data from request
    const { userId, otp } = await req.json();

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing Supabase environment variables",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers":
              "authorization, x-client-info, apikey, content-type",
          },
        }
      );
    }

    // Dynamically import Supabase client using the import map
    const module = await import("@supabase/supabase-js");
    const supabase = module.createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify OTP against stored value in Supabase
    // First, check if the OTP exists and hasn't expired
    const { data: otpRecord, error: otpError } = await supabase
      .from("OTPCode")
      .select("*")
      .eq("user_id", userId)
      .eq("otp_code", otp)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (otpError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Database error while verifying OTP",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers":
              "authorization, x-client-info, apikey, content-type",
          },
        }
      );
    }

    // Check if OTP record exists
    const isValid = !!otpRecord;

    // If OTP is valid, delete it to prevent reuse
    if (isValid) {
      await supabase.from("OTPCode").delete().eq("id", otpRecord.id);
    }

    if (isValid) {
      // Update user verification status in Supabase
      const { error } = await supabase
        .from("users")
        .update({ isVerified: true })
        .eq("id", userId);

      if (error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to update user verification status",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers":
                "authorization, x-client-info, apikey, content-type",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "OTP verified successfully",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers":
              "authorization, x-client-info, apikey, content-type",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid OTP",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers":
              "authorization, x-client-info, apikey, content-type",
          },
        }
      );
    }
  } catch (error: unknown) {
    const errorMessage = (error as Error)?.message || "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: errorMessage || "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      }
    );
  }
});
