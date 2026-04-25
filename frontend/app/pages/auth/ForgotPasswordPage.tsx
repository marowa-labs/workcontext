"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Mail, KeyRound, CheckCircle, ArrowLeft } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import FormInput from "../../components/auth/FormInput";
import { Button } from "../../components/ui/button";
import { resetPassword } from "../../lib/utils/supabaseAuth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const watchedFields = watch();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use Supabase to send reset email
      await resetPassword(data.email);

      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Password reset failed:", error);
      setError(
        error.message || "Failed to send reset email. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use Supabase to resend reset email
      await resetPassword(submittedEmail);
      console.log("Reset email resent successfully");
    } catch (error: any) {
      console.error("Resend email failed:", error);
      setError(
        error.message || "Failed to resend reset email. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Check your email" subtitle="" showSidebar={false}>
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
              We've sent password reset instructions to
            </p>
            <p className="font-medium text-black break-all">
              {submittedEmail}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800">
              <strong>Next steps:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Check your email inbox</li>
              <li>Click the reset link in the email</li>
              <li>Create a new password</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Resend Button */}
          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80">
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-gray-700 rounded-full animate-spin" />
              ) : (
                "Resend Email"
              )}
            </Button>

            <p className="text-sm text-black">
              Didn't receive it? Check your spam folder or try resending
            </p>
          </div>

          {/* Back to Login */}
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to login</span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="No worries! Enter your email and we'll send you reset instructions."
      showSidebar={false}>
      <div className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Email"
            type="email"
            placeholder="Enter your email address"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            success={
              !errors.email &&
              !!watchedFields.email &&
              watchedFields.email.length > 0
            }
            autoFocus
            {...register("email")}
          />

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 btn-glow"
            disabled={!isValid || isLoading}>
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to login</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
