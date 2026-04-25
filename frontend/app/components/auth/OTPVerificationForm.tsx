"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";

interface OTPVerificationFormProps {
  email: string;
  userId: string;
  onVerified: () => void;
  onResend?: () => Promise<void>;
}

export function OTPVerificationForm({
  email,
  userId,
  onVerified,
  onResend,
}: OTPVerificationFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last digit
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (index === 5 && value) {
      const completeOtp = newOtp.join("");
      if (completeOtp.length === 6) {
        handleVerify(completeOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.split("").forEach((digit, index) => {
        if (index < 6) newOtp[index] = digit;
      });
      setOtp(newOtp);

      // Focus last filled input or first empty
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // Auto-submit if 6 digits pasted
      if (digits.length === 6) {
        handleVerify(digits);
      }
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join("");

    if (otpToVerify.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/social/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, otp: otpToVerify }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "✅ Verified!",
          description: "Your email has been verified successfully.",
        });
        onVerified();
      } else {
        setError(data.error || "Invalid or expired OTP");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setError("");

    try {
      if (onResend) {
        await onResend();
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/social/resend-otp`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to resend OTP");
        }
      }

      toast({
        title: "📧 OTP Resent",
        description: "A new code has been sent to your email.",
      });

      setCountdown(60); // 60 second cooldown
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast({
        title: "❌ Failed to Resend",
        description: "Could not resend OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Verify Your Email</h2>
        <p className="text-muted-foreground mt-2">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el: HTMLInputElement | null) => {
                inputRefs.current[index] = el;
                return undefined;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold"
              disabled={isVerifying}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button
          onClick={() => handleVerify()}
          disabled={isVerifying || otp.some((d) => !d)}
          className="w-full"
          size="lg">
          {isVerifying ? "Verifying..." : "Verify Email"}
        </Button>

        <div className="text-center text-sm">
          {countdown > 0 ? (
            <p className="text-muted-foreground">Resend OTP in {countdown}s</p>
          ) : (
            <Button
              variant="link"
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-sm">
              {isResending ? "Sending..." : "Didn't receive code? Resend"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
