"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CheckCircle, RefreshCw, Edit } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import { Button } from "../../components/ui/button";
import { supabase } from "../../lib/supabase/client";
import router from "next/router";

const VerifyEmailPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isAllowed, setIsAllowed] = React.useState(false);

  // Get email and source from URL params
  const email = searchParams.get("email");
  const source = searchParams.get("source");
  const oobCode = searchParams.get("oobCode");
  const redirect = searchParams.get("redirect");

  React.useEffect(() => {
    const allowedSources = new Set(["manual", "signup"]);
    if ((email && source && allowedSources.has(source)) || oobCode) {
      setIsAllowed(true);
    } else {
      router.push("/login");
    }
  }, [email, source, oobCode, router]);

  React.useEffect(() => {
    // If there's a code in the URL, automatically verify
    if (oobCode) {
      verifyEmail(oobCode);
    }
  }, [oobCode, source]);

  const verifyEmail = async (verificationCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setIsVerified(true);
    } catch (error: any) {
      console.error("Email verification failed:", error);
      setError(error.message || "Email verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In Supabase, we can resend verification email using the resend method
      if (email) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: email,
        });

        if (error) {
          throw error;
        }

        console.log("Verification email resent successfully");
      }
    } catch (error: any) {
      console.error("Resend verification failed:", error);
      setError(
        error.message ||
          "Failed to resend verification email. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show verification success state
  if (isVerified) {
    return (
      <AuthLayout
        title="Email verified!"
        subtitle="Your account is ready. Let's get started."
        showSidebar={false}>
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <p className="text-black text-lg">
              Welcome to ScholarForge AI! Your email has been successfully
              verified.
            </p>
          </div>

          {/* Success Features */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
            <p className="text-sm text-green-800 font-medium mb-2">
              You now have access to:
            </p>
            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
              <li>AI-powered writing assistance</li>
              <li>Advanced plagiarism detection</li>
              <li>Smart citation management</li>
              <li>Real-time collaboration tools</li>
            </ul>
          </div>

          {/* Go to Dashboard Button */}
          <Button
            onClick={() => {
              // For all sources, go to the redirect or dashboard
              router.push(redirect || "/dashboard");
            }}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 btn-glow">
            Complete Registration
          </Button>

          {/* Alternative Actions */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Sign in instead
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Guard: if not allowed yet, render nothing while redirecting
  if (!isAllowed) {
    return null;
  }

  // Show pending verification state
  return (
    <AuthLayout title="Verify your email" subtitle="" showSidebar={false}>
      <div className="text-center space-y-6">
        {/* Email Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            {isLoading ? (
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            ) : (
              <Mail className="h-8 w-8 text-blue-600" />
            )}
          </div>
        </div>

        {/* Regular email verification flow */}
        <>
          {/* Message */}
          <div className="space-y-2">
            <p className="text-black text-lg">
              We sent a verification link to
            </p>
            <p className="font-medium text-black break-all">{email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 font-medium mb-2">
              To complete your registration:
            </p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Check your email inbox</li>
              <li>Click the verification link</li>
              <li>You'll be redirected back here</li>
            </ol>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">Verifying your email...</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80">
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <p className="text-sm text-black">
              Didn't receive it? Check your spam folder
            </p>
          </div>
        </>

        {/* Update Email */}
        <div className="space-y-2">
          <p className="text-sm text-black">Wrong email address?</p>
          <Button
            asChild
            variant="ghost"
            className="text-blue-600 hover:text-blue-700 font-medium">
            <Link href="/signup">
              <Edit className="h-4 w-4 mr-2" />
              Update email address
            </Link>
          </Button>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Back to login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
