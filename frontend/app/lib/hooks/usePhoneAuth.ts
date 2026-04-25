import { useState, useEffect } from "react";
import {
  sendOTP as sendOTPApi,
  verifyOTP as verifyOTPApi,
} from "../utils/supabaseAuth";
interface UsePhoneAuthReturn {
  confirmationResult: any | null;
  isRecaptchaReady: boolean;
  error: string | null;
  sendOTP: (phoneNumber: string, userId: string) => Promise<any>;
  verifyOTP: (userId: string, code: string) => Promise<any | null>;
  clearError: () => void;
}

export const usePhoneAuth = (): UsePhoneAuthReturn => {
  const [confirmationResult] = useState<any | null>(null);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDomReady, setIsDomReady] = useState(false);

  // Check if DOM is ready and recaptcha container exists
  useEffect(() => {
    const checkDomReady = () => {
      if (
        typeof window !== "undefined" &&
        document.getElementById("recaptcha-container")
      ) {
        setIsDomReady(true);
      } else if (typeof window !== "undefined") {
        // Retry after a short delay
        setTimeout(checkDomReady, 100);
      }
    };

    checkDomReady();
  }, []);

  // Initialize reCAPTCHA verifier
  useEffect(() => {
    // For Supabase, phone authentication is not directly supported
    // We'll set up a mock implementation that indicates phone auth is not available
    console.log("Phone authentication is not directly supported with Supabase");
    setIsRecaptchaReady(false);
  }, [isDomReady]);

  const clearError = () => {
    setError(null);
  };

  const sendOTP = async (phoneNumber: string, userId: string) => {
    try {
      clearError();

      // Use the updated sendOTP function from supabaseAuth
      const result = await sendOTPApi(phoneNumber, userId);
      return result;
    } catch (err: any) {
      console.error("Failed to send OTP:", err);
      let errorMessage = err.message || "Failed to send OTP";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verifyOTP = async (userId: string, code: string) => {
    try {
      clearError();

      // Use the updated verifyOTP function from supabaseAuth
      const result = await verifyOTPApi(userId, code);
      return result;
    } catch (err: any) {
      console.error("Failed to verify OTP:", err);
      let errorMessage = err.message || "Failed to verify OTP";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    confirmationResult,
    isRecaptchaReady,
    error,
    sendOTP,
    verifyOTP,
    clearError,
  };
};
