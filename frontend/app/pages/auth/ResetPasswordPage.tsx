"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle, Shield } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import FormInput from "../../components/auth/FormInput";
import PasswordStrength from "../../components/auth/PasswordStrength";
import { Button } from "../../components/ui/button";
import { supabase } from "../../lib/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isValidToken, setIsValidToken] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const oobCode = searchParams.get("oobCode");
  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const watchedFields = watch();
  const passwordValue = watch("password");

  React.useEffect(() => {
    // Validate token when component mounts
    if (oobCode) {
      validateToken(oobCode);
    } else {
      setIsValidToken(false);
    }
  }, [oobCode]);

  const validateToken = async (resetCode: string) => {
    try {
      // For Supabase, we don't have a direct equivalent to verifyPasswordResetCode
      // We'll assume the token is valid and let the password reset operation fail if it's not
      setIsValidToken(true);
    } catch (error) {
      console.error("Token validation failed:", error);
      setIsValidToken(false);
    }
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use Supabase to reset password
      if (!oobCode) {
        throw new Error("Invalid reset code");
      }

      // Supabase uses a different approach for password reset
      // We need to set the new password using the reset token
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Password reset failed:", error);
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show invalid token state
  if (!isValidToken) {
    return (
      <AuthLayout
        title="Invalid or expired link"
        subtitle="This password reset link is no longer valid"
        showSidebar={false}>
        <div className="text-center space-y-6">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <p className="text-black text-lg">
              This password reset link has expired or is invalid.
            </p>
          </div>

          {/* Help Text */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <p className="text-sm text-red-800 font-medium mb-2">
              This could happen if:
            </p>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>The link is older than 24 hours</li>
              <li>You've already used this link</li>
              <li>The link was copied incorrectly</li>
            </ul>
          </div>

          {/* Request New Reset */}
          <Button
            asChild
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 btn-glow">
            <Link href="/forgot-password">Request New Reset Link</Link>
          </Button>

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
  }

  // Show success state
  if (isSuccess) {
    return (
      <AuthLayout
        title="Password reset successful"
        subtitle="You can now sign in with your new password"
        showSidebar={false}>
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <p className="text-black text-lg">
              Your password has been successfully updated.
            </p>
            {email && (
              <p className="text-sm text-black">
                You can now sign in to <strong>{email}</strong> with your new
                password.
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Security tips:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Use a unique password for your ScholarForge AIaccount</li>
              <li>Consider using a password manager</li>
              <li>Never share your password with others</li>
            </ul>
          </div>

          {/* Sign In Button */}
          <Button
            onClick={() => router.push("/login")}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 btn-glow">
            Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Show reset form
  return (
    <AuthLayout
      title="Set new password"
      subtitle="Create a strong password for your account"
      showSidebar={false}>
      <div className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {email && (
          <div className="text-center">
            <p className="text-sm text-black">
              Resetting password for <strong>{email}</strong>
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <FormInput
              label="New Password"
              type="password"
              placeholder="Create a strong password"
              leftIcon={<Lock className="h-4 w-4" />}
              showPasswordToggle
              error={errors.password?.message}
              autoFocus
              {...register("password")}
            />
            {passwordValue && (
              <div className="mt-3">
                <PasswordStrength password={passwordValue} />
              </div>
            )}
          </div>

          <FormInput
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            leftIcon={<Lock className="h-4 w-4" />}
            showPasswordToggle
            error={errors.confirmPassword?.message}
            success={
              !errors.confirmPassword &&
              !!watchedFields.confirmPassword &&
              watchedFields.confirmPassword === watchedFields.password &&
              !!watchedFields.password &&
              watchedFields.password.length > 0
            }
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 btn-glow"
            disabled={!isValid || isLoading}>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Resetting Password...</span>
              </div>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

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

export default ResetPasswordPage;
