"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import FormInput from "../../components/auth/FormInput";
import PasswordStrength from "../../components/auth/PasswordStrength";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import OTPInput from "../../components/auth/OTPInput";
import { supabase } from "../../lib/supabase/client";
import {
  signUpWithEmail as hybridSignUpWithEmail,
  verifyOTP as hybridVerifyOTP,
  signUpWithGoogle,
} from "../../lib/utils/hybridAuth";
import BillingService from "../../lib/utils/billingService";
import axios from "axios";
import { useToast } from "../../hooks/use-toast";

// Log the supabase object for debugging
console.log("Supabase object in SignupPage:", {
  supabase,
  hasSupabase: typeof supabase !== "undefined" && supabase !== null,
});

// API base URL - adjust this to match your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Function to send Discord webhook notification
const sendDiscordWebhookNotification = async (
  userId: string,
  surveyData: any,
  selectedPlan: string | null,
) => {
  try {
    const discordWebhookUrl =
      process.env.NEXT_PUBLIC_SIGNUP_SURVEY_DISCORD_WEBHOOK_URL ||
      "https://discord.com/api/webhooks/1445798910298816645/jwQCSXU42Z_8yH0mQHRWwsO6EjkkbeY2pJIWaDs9jQk-aazPUETdLfgEeY6GuzFU8jS7";

    // Format the survey data for Discord
    const embed = {
      title: "New User Survey Submission",
      color: 0x00ff00, // Green color
      fields: [
        {
          name: "User ID",
          value: userId || "Unknown",
          inline: true,
        },
        {
          name: "Selected Plan",
          value: selectedPlan || "None",
          inline: true,
        },
        {
          name: "User Role",
          value: surveyData.userRole || "Not provided",
          inline: true,
        },
        {
          name: "Heard About Platform",
          value: surveyData.heardAboutPlatform || "Not provided",
          inline: true,
        },
        {
          name: "User Goal",
          value: surveyData.userGoal || "Not provided",
          inline: false,
        },
        {
          name: "Main Job",
          value: surveyData.mainJob || "Not provided",
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await axios.post(discordWebhookUrl, {
      embeds: [embed],
    });

    console.log("Discord webhook notification sent successfully");
  } catch (error) {
    console.error("Failed to send Discord webhook notification:", error);
    // Don't throw error as this is a non-critical notification
  }
};

// List of allowed email domains
const ALLOWED_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "live.com",
  "msn.com",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "sohu.com",
  "edu.cn", // Educational institutions
  "ac.in", // Indian educational institutions
  "ac.uk", // UK educational institutions
  "edu.au", // Australian educational institutions
  "edu.ca", // Canadian educational institutions
  // Add more domains as needed
];

// List of country codes with unique keys
const countryCodes = [
  { key: "us", code: "+1", name: "United States" },
  { key: "ca", code: "+1", name: "Canada" },
  { key: "uk", code: "+44", name: "United Kingdom" },
  { key: "au", code: "+61", name: "Australia" },
  { key: "in", code: "+91", name: "India" },
  { key: "jp", code: "+81", name: "Japan" },
  { key: "de", code: "+49", name: "Germany" },
  { key: "fr", code: "+33", name: "France" },
  { key: "cn", code: "+86", name: "China" },
  { key: "mx", code: "+52", name: "Mexico" },
  { key: "it", code: "+39", name: "Italy" },
  { key: "es", code: "+34", name: "Spain" },
  { key: "br", code: "+55", name: "Brazil" },
  { key: "ru", code: "+7", name: "Russia" },
  { key: "kr", code: "+82", name: "South Korea" },
  { key: "sg", code: "+65", name: "Singapore" },
  { key: "my", code: "+60", name: "Malaysia" },
  { key: "za", code: "+27", name: "South Africa" },
  { key: "nl", code: "+31", name: "Netherlands" },
  { key: "se", code: "+46", name: "Sweden" },
  { key: "no", code: "+47", name: "Norway" },
  { key: "dk", code: "+45", name: "Denmark" },
  { key: "fi", code: "+358", name: "Finland" },
  { key: "pl", code: "+48", name: "Poland" },
];

// Timeout wrapper for fetch requests
const fetchWithTimeout = (
  url: string,
  options: RequestInit = {},
  timeout = 15000,
): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(
        () => reject(new Error("Request timeout after " + timeout + "ms")),
        timeout,
      ),
    ),
  ]) as Promise<Response>;
};

// Function to validate email domain
const isValidEmailDomain = (email: string): boolean => {
  try {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;

    // Check if domain is in allowed list
    return ALLOWED_DOMAINS.some(
      (allowedDomain) =>
        domain === allowedDomain || domain.endsWith("." + allowedDomain),
    );
  } catch (error) {
    console.error("Error validating email domain:", error);
    return false; // Return false instead of true to properly reject invalid emails
  }
};

const heardAboutOptions = [
  "Facebook",
  "Instagram",
  "YouTube",
  "Reddit",
  "Twitter",
  "LinkedIn",
  "TikTok",
  "Search Engine",
  "Friend/Colleague",
  "University/Institution",
  "Advertisement",
  "Blog/Article",
  "Other",
];

const userRoles = [
  "Student",
  "Researcher",
  "Professor/Faculty",
  "Academic Administrator",
  "Other",
];

const signupSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Please enter a valid email address"),
    countryCode: z.string().optional(),
    phoneNumber: z.string().min(1, "Phone number is required"),
    otpMethod: z.enum(["sms", "email"]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character",
      ), // Add this line for special characters (adjust as needed)
    confirmPassword: z.string(),
    userType: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
    // OTP fields
    otp: z.string().optional(), // Make otp optional since it's only used in OTP step
    otpVerified: z.boolean().optional(),
    // Survey fields
    heardAboutPlatform: z.string().optional(),
    userGoal: z.string().optional(),
    userRole: z.string().optional(),
    mainJob: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate phone number format based on selected country code
      if (data.otpMethod === "sms") {
        // Remove all non-digit characters
        const cleanNumber = data.phoneNumber.replace(/\D/g, "");
        // Check if it's a valid length (typically 7-15 digits)
        return cleanNumber.length >= 7 && cleanNumber.length <= 15;
      }
      return true; // No validation needed for email method
    },
    {
      message: "Please enter a valid phone number (7-15 digits)",
      path: ["phoneNumber"],
    },
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // Only validate domain if email exists
      if (!data.email) return true;
      try {
        return isValidEmailDomain(data.email);
      } catch (error) {
        console.error("Error in email domain validation:", error);
        return false; // Properly reject if there's an error
      }
    },
    {
      message:
        "Please use a valid email domain (gmail.com, outlook.com, yahoo.com, etc.)",
      path: ["email"],
    },
  );

type SignupFormData = z.infer<typeof signupSchema>;

const SignupPage: React.FC = () => {
  const { toast } = useToast();
  // Log the supabase object for debugging
  console.log("Supabase object in SignupPage component:", {
    supabase,
    hasSupabase: typeof supabase !== "undefined" && supabase !== null,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);

  const [showOtpStep, setShowOtpStep] = React.useState(false);
  const [, setOtpSent] = React.useState(false);
  const [surveyStep, setSurveyStep] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = React.useState("+1");
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
  const [redirectPath, setRedirectPath] = React.useState<string | null>(null);
  const [requiresEmailVerification, setRequiresEmailVerification] =
    React.useState(false);
  // Add state for validation errors
  const [validationErrors, setValidationErrors] = React.useState<{
    fullName?: string;
    email?: string;
    phoneNumber?: string;
  }>({});
  // Add state for validation loading
  const [validating, setValidating] = React.useState<{
    fullName?: boolean;
    email?: boolean;
    phoneNumber?: boolean;
  }>({});

  // Add state for social signup
  const [socialLoading, setSocialLoading] = React.useState(false);
  // Add debounce timer ref
  const validationTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check for OAuth callback data when component mounts
  React.useEffect(() => {
    const oauthParam = searchParams.get("oauth");
    const oauthUserDataStr = sessionStorage.getItem("oauthUserData");

    if (oauthParam === "true" && oauthUserDataStr) {
      try {
        const oauthUserData = JSON.parse(oauthUserDataStr);

        // Set the user ID from OAuth data
        setUserId(oauthUserData.id);

        // Now we need to register the OAuth user in the database and send OTP
        // This ensures the user is registered in both Supabase Auth and our database
        const registerOAuthUser = async () => {
          try {
            setIsLoading(true);

            const response = await fetch(
              `${API_BASE_URL}/api/auth/hybrid/oauth-signup`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: oauthUserData.id,
                  email: oauthUserData.email,
                  fullName: oauthUserData.fullName,
                  provider: oauthUserData.provider,
                }),
              },
            );

            const result = await response.json();

            if (response.ok && result.success) {
              console.log("OAuth user registered successfully, OTP sent");
              // Set the user ID and proceed to OTP verification
              setUserId(oauthUserData.id);
              setShowOtpStep(true);
            } else {
              throw new Error(
                result.message || "Failed to register OAuth user",
              );
            }
          } catch (error: any) {
            console.error("Error registering OAuth user:", error);
            // Set an error that can be displayed to the user
            setError("root", {
              message:
                error.message ||
                "Failed to complete OAuth signup. Please try again.",
            });
          } finally {
            setIsLoading(false);
          }
        };

        registerOAuthUser();

        // Clear the session storage to prevent reuse
        sessionStorage.removeItem("oauthUserData");

        console.log("OAuth user data detected, proceeding to OTP verification");
      } catch (error) {
        console.error("Error parsing OAuth user data:", error);
      }
    }
  }, [searchParams]);

  // Check if user has a session but needs to complete signup (for OAuth users)
  React.useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // If user has a session but we don't have userId set and we're not in an OAuth flow
        if (session && !userId && !searchParams.get("oauth")) {
          // Check if user exists in our database
          const response = await fetch(
            `${API_BASE_URL}/api/auth/hybrid/check-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: session.user.email }),
            },
          );

          const result = await response.json();

          if (result.success && result.exists && result.confirmed) {
            // User exists in database and is confirmed, redirect to dashboard
            const redirectPath = searchParams.get("redirect") || "/dashboard";
            router.push(redirectPath);
          } else {
            // User exists in auth but not in database or not confirmed
            // This might be an OAuth signup that needs to complete the flow
            // Set the userId and potentially show OTP step
            setUserId(session.user.id);

            // For OAuth users who have auth session but need to complete signup,
            // we should show the OTP verification step
            if (!showOtpStep && !surveyStep) {
              setShowOtpStep(true);
            }
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkSessionAndRedirect();
  }, [userId, showOtpStep, surveyStep, searchParams, router]);

  // Get parameters from URL
  React.useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan) {
      setSelectedPlan(plan);
    }

    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectPath(redirect);
    }

    // Check if this is a checkout flow
    const checkout = searchParams.get("checkout");
    if (checkout === "true") {
      // This will be handled in the form submission
    }

    // Check if this is a survey step
    const surveyParam = searchParams.get("survey");
    if (surveyParam === "1") {
      setSurveyStep(true);
    }
  }, [searchParams]);

  // Initialize recaptcha verifier
  React.useEffect(() => {
    console.log("Initializing recaptcha verifier, Supabase status:", {
      hasSupabase: typeof supabase !== "undefined" && supabase !== null,
    });

    // For Supabase, phone authentication is not directly supported
    // We'll skip recaptcha verifier initialization
    console.log(
      "Supabase does not support phone authentication directly, skipping recaptcha verifier initialization",
    );
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched", // Change from "onChange" to "onTouched" to only validate after user interacts with field
    defaultValues: {
      agreeToTerms: false,
      otpMethod: "email",
      countryCode: "+1",
    },
  });

  const watchedFields = watch();

  // Custom register function that clears validation errors when field changes
  const registerWithValidationClear = (name: any) => {
    const fieldRegistration = register(name);

    return {
      ...fieldRegistration,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        // Call the original onChange if it exists
        fieldRegistration.onChange(e);

        // Clear validation errors for this field
        clearErrors(name);

        // Also trigger validation if needed
        validateUserDetails(name, e.target.value);
      },
    };
  };

  // Function to validate user details in real-time
  const validateUserDetails = React.useCallback(
    async (field: string, value: string) => {
      // Clear any existing timer
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }

      // Don't validate empty fields
      if (!value) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as keyof typeof newErrors];
          return newErrors;
        });
        return;
      }

      // Set validating state
      setValidating((prev) => ({ ...prev, [field]: true }));

      try {
        // Prepare validation data
        const validationData: { [key: string]: string } = {};
        if (field === "fullName") validationData.fullName = value;
        if (field === "email") validationData.email = value;
        if (field === "phoneNumber") {
          // Combine with country code for phone number validation
          const fullPhoneNumber = value.startsWith("+")
            ? value
            : `${selectedCountryCode}${value}`;
          validationData.phoneNumber = fullPhoneNumber;
        }

        // Call validation API with timeout
        const response = await fetchWithTimeout(
          `${API_BASE_URL}/api/auth/validate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(validationData),
          },
        );

        const result = await response.json();

        if (response.ok && result.success && result.validationResults) {
          const { validationResults } = result;

          // Update validation errors based on results
          setValidationErrors((prev) => {
            const newErrors = { ...prev };

            if (field === "fullName" && validationResults.fullNameExists) {
              newErrors.fullName =
                validationResults.message || "This name is already registered";
            } else if (
              field === "fullName" &&
              !validationResults.fullNameExists
            ) {
              delete newErrors.fullName;
            }

            if (field === "email" && validationResults.emailExists) {
              newErrors.email =
                validationResults.message || "This email is already registered";
            } else if (field === "email" && !validationResults.emailExists) {
              delete newErrors.email;
            }

            if (
              field === "phoneNumber" &&
              validationResults.phoneNumberExists
            ) {
              newErrors.phoneNumber =
                validationResults.message ||
                "This phone number is already registered";
            } else if (
              field === "phoneNumber" &&
              !validationResults.phoneNumberExists
            ) {
              delete newErrors.phoneNumber;
            }

            return newErrors;
          });
        } else if (!response.ok) {
          // Handle HTTP errors (like 500 Internal Server Error)
          console.error("Validation API error:", {
            status: response.status,
            statusText: response.statusText,
            result,
          });
          // Clear validation error for this field on server error
          setValidationErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field as keyof typeof newErrors];
            return newErrors;
          });
        }
      } catch (error: unknown) {
        console.error("Validation error:", error);
        // Clear validation error for this field on error
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as keyof typeof newErrors];
          return newErrors;
        });
      } finally {
        setValidating((prev) => ({ ...prev, [field]: false }));
      }
    },
    [selectedCountryCode],
  ); // Remove API_BASE_URL as it's a constant

  // Debounced validation effect
  React.useEffect(() => {
    // Clear any existing timer
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }

    // Set a new timer to debounce validation
    validationTimerRef.current = setTimeout(() => {
      // Validate fields that have values
      if (watchedFields.fullName) {
        validateUserDetails("fullName", watchedFields.fullName);
      }

      if (watchedFields.email) {
        validateUserDetails("email", watchedFields.email);
      }

      if (watchedFields.phoneNumber) {
        validateUserDetails("phoneNumber", watchedFields.phoneNumber);
      }
    }, 500); // 500ms debounce

    // Return cleanup function
    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, [
    watchedFields.fullName,
    watchedFields.email,
    watchedFields.phoneNumber,
    selectedCountryCode,
    // The function reference changes when selectedCountryCode changes,
    // which would cause infinite loop. Instead, call it directly inside useCallback.
  ]);

  const passwordValue = watch("password");
  const otpMethod = watch("otpMethod");

  // Function to complete signup
  const completeSignup = async (data: SignupFormData) => {
    // Log the supabase object for debugging
    console.log("Supabase object in completeSignup:", {
      supabase,
      hasSupabase: typeof supabase !== "undefined" && supabase !== null,
    });
    try {
      // Combine country code and phone number
      const fullPhoneNumber =
        data.countryCode &&
        data.phoneNumber &&
        !data.phoneNumber.startsWith("+")
          ? `${data.countryCode}${data.phoneNumber}`
          : data.phoneNumber || "";

      console.log("Attempting signup with data:", {
        email: data.email,
        fullName: data.fullName,
        phoneNumber: fullPhoneNumber,
        otpMethod: data.otpMethod,
        selectedPlan: selectedPlan,
      });

      // Check if Supabase is configured and use hybrid approach
      console.log("Supabase configuration check:", {
        hasSupabase: typeof supabase !== "undefined" && supabase !== null,
      });

      // Check if this is a checkout flow
      const isCheckoutFlow = searchParams.get("checkout") === "true";

      if (isCheckoutFlow && selectedPlan) {
        // For checkout flow, first create a checkout session
        try {
          const checkoutResponse =
            await BillingService.createUnauthCheckoutSession({
              planId: selectedPlan as string,
              email: data.email,
              fullName: data.fullName,
              phoneNumber: fullPhoneNumber,
            });

          if (checkoutResponse.success && checkoutResponse.checkoutUrl) {
            // Store user data in localStorage for post-checkout processing
            localStorage.setItem(
              "pendingCheckoutUser",
              JSON.stringify({
                email: data.email,
                fullName: data.fullName,
                phoneNumber: fullPhoneNumber,
                selectedPlan: selectedPlan,
                tempUserId: checkoutResponse.tempUserId,
                userData: checkoutResponse.userData,
              }),
            );

            // Redirect to checkout
            window.location.href = checkoutResponse.checkoutUrl;
            return;
          } else {
            throw new Error(
              checkoutResponse.message || "Failed to create checkout session",
            );
          }
        } catch (checkoutError: any) {
          console.error("Checkout creation failed:", checkoutError);
          throw new Error(
            `Checkout failed: ${checkoutError.message || "Unknown error"}`,
          );
        }
      }

      // Instead of using Supabase's signup directly, we'll use hybrid approach
      // For both email and phone signup, we'll use the same approach
      try {
        // First, create user in Supabase Authentication
        const result = await hybridSignUpWithEmail(data.email, data.password, {
          full_name: data.fullName,
          phone_number: fullPhoneNumber,
          otp_method: data.otpMethod,
          selected_plan: selectedPlan || "free",
        });

        // Store the user ID for OTP verification
        const newUserId = result.user ? result.user.id : null;
        if (newUserId) {
          setUserId(newUserId);
          const otpSent = (result as any).otpSent || false;
          const needsVerification = (result as any).needsVerification || false;

          // Update state
          setOtpSent(otpSent);

          return {
            success: true,
            userId: newUserId,
            otpSent: otpSent,
            needsVerification: needsVerification,
          };
        } else {
          throw new Error("Failed to get user ID from signup result");
        }
      } catch (error: any) {
        console.error("Signup failed:", error);
        throw new Error(`Signup failed: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create account:", error);
      throw error;
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    console.log("onSubmit called with step:", {
      showOtpStep,
      surveyStep,
      data,
      userId,
    });

    // Check for validation errors before proceeding
    if (Object.keys(validationErrors).length > 0) {
      setError("root", {
        message: "Please fix the highlighted errors before continuing.",
      });
      return;
    }

    // Handle each step separately
    if (!showOtpStep && !surveyStep) {
      // First step: Create user account
      console.log("Processing signup step");
      setIsLoading(true);
      try {
        // Create user account first
        const signupResult = await completeSignup(data);
        console.log("Signup completed:", signupResult);

        // Ensure userId is set before proceeding
        let finalUserId = (signupResult as any).userId;
        if (!finalUserId) {
          // If we don't have a userId but the signup was successful,
          // check if we can get it from the data
          let userIdFromData = null;

          // Try different possible locations for userId
          if (data && typeof data === "object") {
            if ("id" in data) userIdFromData = data.id;
            else if (
              "user" in data &&
              data.user &&
              typeof data.user === "object" &&
              "id" in data.user
            ) {
              userIdFromData = data.user.id;
            }
          }

          if (userIdFromData) {
            finalUserId = userIdFromData;
            setUserId(finalUserId);
          } else {
            throw new Error("User ID not received from signup");
          }
        } else {
          // Update userId state if it's different
          if (finalUserId !== userId) {
            setUserId(finalUserId);
          }
        }

        // Check if OTP was already sent by the backend during signup
        const otpAlreadySent = (signupResult as any).otpSent || false;
        const needsVerification =
          (signupResult as any).needsVerification || false;
        setRequiresEmailVerification(!!needsVerification);

        // Always go to OTP verification step if OTP was sent or if verification is needed
        if (otpAlreadySent || needsVerification) {
          console.log(
            "OTP sent or verification needed, moving to OTP verification step",
          );
          setShowOtpStep(true);
        } else {
          // If not, we need to send it now
          console.log("Sending OTP after signup");
          try {
            // Pass the user ID directly from the signup result instead of relying on state
            await sendOTP(data, finalUserId);
            console.log(
              "OTP sent successfully, moving to OTP verification step",
            );
            setShowOtpStep(true);
          } catch (otpError: any) {
            console.error("Failed to send OTP after signup:", otpError);
            throw new Error(
              `Failed to send verification code: ${otpError.message || "Unknown error"}`,
            );
          }
        }
      } catch (error: unknown) {
        console.error("Signup failed:", error);
        // Check if it's the "already registered" error
        if (
          error instanceof Error &&
          (error.message.includes("already registered") ||
            error.message.includes("already exists") ||
            error.message.includes("already signed up") ||
            error.message.includes("already in use") ||
            error.message.includes("A user with this"))
        ) {
          // This is an informational message, not an error
          toast({
            title: "Account Already Exists",
            description:
              error.message +
              "\n\nIf you already have an account, please sign in instead.",
          });
          // Optionally, you could redirect to login or handle differently
        } else {
          setError("root", {
            message:
              error instanceof Error
                ? error.message
                : "Failed to create account. Please try again or contact support if the problem persists.",
          });
        }
      } finally {
        setIsLoading(false);
      }
      return; // Important: return here to prevent executing the next steps
    }

    if (showOtpStep && !surveyStep) {
      // Second step: Verify OTP
      console.log("Processing OTP verification step");
      setIsLoading(true);
      try {
        // The verifyOTP function returns true on success or throws on error
        await verifyOTP(data.otp || "");
        console.log("OTP verified, moving to survey step");
        // Move to survey step
        setValue("otpVerified", true);
        setSurveyStep(true);
        setShowOtpStep(false); // Hide OTP step
      } catch (error: unknown) {
        console.error("Failed to verify OTP:", error);
        setError("otp", {
          message: error instanceof Error ? error.message : "Invalid OTP code",
        });
      } finally {
        setIsLoading(false);
      }
      return; // Important: return here to prevent executing the next steps
    }

    if (surveyStep) {
      // Final step: Handle survey completion
      console.log(
        "Survey completed, creating user profile and redirecting to login",
      );
      setIsLoading(true);

      try {
        // Get the survey data from the form
        const surveyData = {
          userRole: data.userRole,
          heardAboutPlatform: data.heardAboutPlatform,
          userGoal: data.userGoal,
          mainJob: data.mainJob,
          userType: data.userType,
          fieldOfStudy: data.fieldOfStudy,
        };

        console.log("Sending survey data to backend:", surveyData);

        // Send survey data to backend to update user profile
        const response = await fetch(
          `${API_BASE_URL}/api/auth/hybrid/complete-signup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: userId,
              surveyData: surveyData,
              selectedPlan: selectedPlan,
            }),
          },
        );

        const result = await response.json();
        console.log("Survey completion response:", result);

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to complete signup");
        }

        console.log("Survey data submitted successfully");

        // Send Discord webhook notification
        try {
          await sendDiscordWebhookNotification(
            userId || "",
            surveyData,
            selectedPlan,
          );
        } catch (webhookError) {
          console.error(
            "Failed to send Discord webhook notification:",
            webhookError,
          );
        }
      } catch (error: any) {
        console.error("Error submitting survey data:", error);
        setError("root", {
          message:
            error.message || "Failed to complete signup. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      // After survey completion, redirect based on verification requirement
      if (requiresEmailVerification) {
        let verifyUrl = `/verify-email?email=${encodeURIComponent(watchedFields.email || "")}&source=signup`;
        // Preserve redirect parameter if it exists
        if (redirectPath) {
          verifyUrl += `&redirect=${encodeURIComponent(redirectPath)}`;
        }
        router.push(verifyUrl);
      } else {
        // If no verification required, redirect to the intended destination
        const finalRedirectPath = redirectPath || "/dashboard";
        router.push(finalRedirectPath);
      }
      return;
    }
  };

  const handleBackToSignup = () => {
    setShowOtpStep(false);
    setSurveyStep(false);
  };

  // Function to resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      // Get the current form data
      const currentData = {
        fullName: watchedFields.fullName || "",
        email: watchedFields.email || "",
        countryCode: watchedFields.countryCode || selectedCountryCode,
        phoneNumber: watchedFields.phoneNumber || "",
        otpMethod: watchedFields.otpMethod || "email",
        password: watchedFields.password || "",
        confirmPassword: watchedFields.confirmPassword || "",
        agreeToTerms: watchedFields.agreeToTerms || false,
        userType: watchedFields.userType || "",
        fieldOfStudy: watchedFields.fieldOfStudy || "",
      } as SignupFormData;

      // Combine country code and phone number for SMS
      // Only add country code if phone number doesn't already start with +
      const fullPhoneNumber =
        currentData.countryCode &&
        currentData.phoneNumber &&
        !currentData.phoneNumber.startsWith("+")
          ? `${currentData.countryCode}${currentData.phoneNumber}`
          : currentData.phoneNumber;

      // Make sure we have a userId
      if (!userId) {
        throw new Error(
          "User ID not available. Please restart the signup process.",
        );
      }

      await sendOTP(
        {
          ...currentData,
          phoneNumber: fullPhoneNumber,
        } as SignupFormData,
        userId,
      );
      console.log("OTP resent successfully");
    } catch (error: unknown) {
      console.error("Failed to resend OTP:", error);
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to resend OTP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send OTP
  const sendOTP = async (data: SignupFormData, userIdParam?: string) => {
    try {
      // Use the passed userIdParam if provided, otherwise use the state userId
      const effectiveUserId = userIdParam || userId;

      if (!effectiveUserId) {
        const error = new Error(
          "User ID is required to send OTP. Please complete signup first.",
        );
        console.error("OTP send error:", error.message);
        throw error;
      }

      console.log("Sending OTP with data:", {
        userId: effectiveUserId,
        method: data.otpMethod,
        email: data.email,
        phoneNumber: data.phoneNumber,
        fullName: data.fullName,
      });

      // Combine country code and phone number for SMS
      // Only add country code if phone number doesn't already start with +
      const fullPhoneNumber =
        data.countryCode &&
        data.phoneNumber &&
        !data.phoneNumber.startsWith("+")
          ? `${data.countryCode}${data.phoneNumber}`
          : data.phoneNumber || "";

      // For Supabase, we'll send OTP through the hybrid backend API for both email and SMS
      // Send email OTP through hybrid system (like SMS flow)
      console.log("OTP send request:", {
        userId: effectiveUserId,
        method: data.otpMethod,
        email: data.email,
        fullName: data.fullName,
        phoneNumber: fullPhoneNumber,
      });

      const response = await fetch(`${API_BASE_URL}/api/auth/hybrid/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          method: data.otpMethod,
          email: data.email,
          fullName: data.fullName,
          phoneNumber: fullPhoneNumber,
        }),
      });

      const result = await response.json();
      console.log("OTP send response:", {
        status: response.status,
        result,
      });

      if (response.ok && (result.success || result.message)) {
        console.log("OTP sent successfully via hybrid system");
        return true;
      } else {
        const errorMessage =
          result.message || result.error || "Failed to send OTP";
        console.error("OTP send failed:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      console.error("Failed to send OTP:", error);
      // Re-throw the error so it can be handled by the calling function
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

  // Function to verify OTP
  const verifyOTP = async (otp: string) => {
    try {
      if (!userId) {
        const error = new Error("User ID is required to verify OTP");
        console.error("OTP verify error:", error.message);
        throw error;
      }

      if (!otp) {
        const error = new Error("OTP is required");
        console.error("OTP verify error:", error.message);
        throw error;
      }

      console.log("Verifying OTP:", { userId: userId, otp });

      // Use the hybrid OTP verification function
      const result = await hybridVerifyOTP(userId, otp);

      if (result.success) {
        console.log("OTP verified successfully");
        return true;
      } else {
        const errorMessage = result.message || "Failed to verify OTP";
        console.error("OTP verify failed:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      console.error("Failed to verify OTP:", error);
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to verify OTP. Please try again.",
      });
      // Re-throw the error so the calling function can handle it properly
      throw error;
    }
  };

  // Function to handle Google signup
  const handleGoogleSignup = async () => {
    setSocialLoading(true);
    try {
      // Prepare redirect parameters if needed
      const redirectParams = {
        plan: selectedPlan || undefined,
        redirect: redirectPath || undefined,
      };

      // Call the hybrid auth function to initiate Google signup
      await signUpWithGoogle(redirectParams);

      // The function will redirect to Google OAuth, so no further action needed here
      console.log("Google signup initiated");
    } catch (error: any) {
      console.error("Google signup failed:", error);
      setError("root", {
        message: error.message || "Google signup failed. Please try again.",
      });
      setSocialLoading(false);
    }
  };

  return (
    <AuthLayout
      title={
        surveyStep
          ? "One Last Step - Tell Us About Yourself"
          : showOtpStep
            ? "Verify Your Account"
            : selectedPlan
              ? `Sign up for ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`
              : "Create your account"
      }
      subtitle={
        surveyStep
          ? "Help us understand how we can better serve you"
          : showOtpStep
            ? `We've sent a code to your ${otpMethod === "sms" ? "phone number" : "email"}`
            : selectedPlan
              ? `Start your 14-day free trial of the ${selectedPlan} plan`
              : "Start writing better papers today"
      }>
      {/* Recaptcha container - invisible */}
      <div
        id="recaptcha-container"
        className="hidden"
        style={{ position: "absolute", top: "-100px" }}></div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Error message */}
        {errors.root && (
          <div className="text-red-400 text-sm py-2">{errors.root.message}</div>
        )}

        {!showOtpStep && !surveyStep && (
          <>
            {/* Social Signup Buttons - Re-enabled */}
            <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignup}
                disabled={socialLoading || isLoading}
                className="flex items-center justify-center gap-2 h-12 bg-white text-gray-600 border-white hover:bg-gray-100">
                {socialLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.58 22.56 12.25Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.96C4 20.53 7.7 23 12 23Z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09C5.62 13.44 5.49 12.74 5.49 12C5.49 11.26 5.62 10.56 5.84 9.91V7.04H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.96L5.84 14.09Z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.04L19.36 4.04C17.45 2.24 14.97 1 12 1C7.7 1 4 3.47 2.18 7.04L5.84 9.91C6.71 7.31 9.14 5.36 12 5.36Z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="text-gray-700">Google</span>
                  </>
                )}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-700 bg-white rounded-full">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Full Name Input */}
            <FormInput
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              leftIcon={<User className="h-4 w-4" />}
              error={
                watchedFields.fullName !== undefined &&
                watchedFields.fullName !== ""
                  ? errors.fullName?.message || validationErrors.fullName
                  : undefined
              }
              success={
                !errors.fullName &&
                !validationErrors.fullName &&
                !!watchedFields.fullName &&
                watchedFields.fullName.length > 0
              }
              loading={validating.fullName}
              {...registerWithValidationClear("fullName")}
              className="bg-white border-white text-gray-600 placeholder-gray-500"
            />

            <FormInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={
                watchedFields.email !== undefined && watchedFields.email !== ""
                  ? errors.email?.message || validationErrors.email
                  : undefined
              }
              success={
                !errors.email &&
                !validationErrors.email &&
                !!watchedFields.email &&
                watchedFields.email.length > 0
              }
              loading={validating.email}
              {...registerWithValidationClear("email")}
              className="bg-white border-white text-gray-600 placeholder-gray-500"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 block">
                Phone Number *
              </label>
              <div className="flex gap-2 items-start">
                <div className="w-24 mt-4">
                  <Select
                    onValueChange={(value) => {
                      // Find the selected country by key
                      const selectedCountry = countryCodes.find(
                        (c) => c.key === value,
                      );
                      if (selectedCountry) {
                        setSelectedCountryCode(selectedCountry.code);
                        setValue("countryCode", selectedCountry.code, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                    value={
                      countryCodes.find((c) => c.code === selectedCountryCode)
                        ?.key || "us"
                    }>
                    <SelectTrigger className="h-12 rounded-xl bg-white border-white focus:ring-2 focus:ring-blue-500 text-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-white text-gray-600">
                      {countryCodes.map((country) => (
                        <SelectItem
                          key={country.key}
                          value={country.key}
                          className="text-gray-600">
                          {country.name} ({country.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <FormInput
                    type="tel"
                    placeholder="Enter your phone number"
                    leftIcon={<User className="h-4 w-4" />}
                    error={
                      watchedFields.phoneNumber !== undefined &&
                      watchedFields.phoneNumber !== ""
                        ? errors.phoneNumber?.message ||
                          validationErrors.phoneNumber
                        : undefined
                    }
                    success={
                      !errors.phoneNumber &&
                      !validationErrors.phoneNumber &&
                      !!watchedFields.phoneNumber &&
                      watchedFields.phoneNumber.length > 0
                    }
                    loading={validating.phoneNumber}
                    {...registerWithValidationClear("phoneNumber")}
                    className="h-12 bg-white border-white text-gray-600 placeholder-gray-500"
                  />
                </div>
              </div>
              {watchedFields.phoneNumber !== undefined &&
                watchedFields.phoneNumber !== "" &&
                (errors.phoneNumber || validationErrors.phoneNumber) && (
                  <p className="text-sm text-red-400">
                    {errors.phoneNumber?.message ||
                      validationErrors.phoneNumber}
                  </p>
                )}
            </div>

            {/* OTP Method Selection */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">
                How would you like to receive your verification code? *
              </label>
              <Select
                onValueChange={(value) => {
                  // Allow both email and SMS selection
                  if (value === "email" || value === "sms") {
                    setValue("otpMethod", value as "sms" | "email", {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
                value={watchedFields.otpMethod || "email"}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-white focus:ring-2 focus:ring-blue-500 text-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-white text-gray-600">
                  <SelectItem value="email" className="text-gray-700">
                    Email
                  </SelectItem>
                  <SelectItem value="sms" className="text-gray-700">
                    SMS
                  </SelectItem>
                </SelectContent>
              </Select>
              {watchedFields.otpMethod !== undefined && errors.otpMethod && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.otpMethod.message}
                </p>
              )}
            </div>

            <div>
              <FormInput
                label="Password"
                type="password"
                placeholder="Create a strong password"
                leftIcon={<Lock className="h-4 w-4" />}
                showPasswordToggle
                error={
                  watchedFields.password !== undefined &&
                  watchedFields.password !== ""
                    ? errors.password?.message
                    : undefined
                }
                {...register("password")}
                className="bg-white border-white text-gray-600 placeholder-gray-500"
              />
              {passwordValue && (
                <div className="mt-3">
                  <PasswordStrength password={passwordValue} />
                </div>
              )}
            </div>

            <FormInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              leftIcon={<Lock className="h-4 w-4" />}
              showPasswordToggle
              error={
                watchedFields.confirmPassword !== undefined &&
                watchedFields.confirmPassword !== ""
                  ? errors.confirmPassword?.message
                  : undefined
              }
              success={
                !errors.confirmPassword &&
                !!watchedFields.confirmPassword &&
                watchedFields.confirmPassword === watchedFields.password &&
                !!watchedFields.password &&
                watchedFields.password.length > 0
              }
              {...register("confirmPassword")}
              className="bg-white border-white text-gray-600 placeholder-gray-500"
            />

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="agreeToTerms"
                checked={watchedFields.agreeToTerms || false}
                onCheckedChange={(checked) => {
                  setValue("agreeToTerms", checked as boolean, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });

                  // Clear the error when the checkbox is checked
                  if (checked) {
                    clearErrors("agreeToTerms");
                  }
                }}
                className="mt-1 border-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label
                htmlFor="agreeToTerms"
                className="text-sm text-gray-600 cursor-pointer">
                I agree to the{" "}
                <Link
                  href="/docs/terms"
                  className="text-blue-400 hover:underline font-medium">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/docs/privacy"
                  className="text-blue-400 hover:underline font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {watchedFields.agreeToTerms !== undefined &&
              watchedFields.agreeToTerms === false &&
              errors.agreeToTerms && (
                <p className="text-sm text-red-400">
                  {errors.agreeToTerms.message}
                </p>
              )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-gray-600 font-medium rounded-xl transition-all duration-200 btn-glow"
              disabled={
                !isValid ||
                isLoading ||
                Object.keys(validationErrors).length > 0
              }>
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </>
        )}

        {/* OTP Verification Step */}
        {showOtpStep && !surveyStep && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-600 mb-2">
                Enter the 6-digit code we sent to your{" "}
                {otpMethod === "sms" ? "phone number" : "email"}
              </p>
              <p className="text-sm text-gray-600">
                Didn't receive it?{" "}
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                  onClick={handleResendOTP}
                  disabled={isLoading}>
                  Resend code
                </button>
              </p>
            </div>

            <OTPInput
              length={6}
              onChange={(value) =>
                setValue("otp", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              onAutoVerify={async (value) => {
                // Auto-submit the form when all digits are entered
                try {
                  await handleSubmit(onSubmit)();
                } catch (error) {
                  // Error is already handled in onSubmit, no need to do anything here
                  console.log("Auto-verify error handled in onSubmit");
                }
              }}
              error={errors.otp?.message}
            />

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToSignup}
                className="flex-1 bg-white border-white text-gray-600 hover:bg-white">
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-gray-600 font-medium rounded-xl transition-all duration-200 btn-glow"
                disabled={true} // Hidden but kept for form structure
                style={{ display: "none" }} // Hide the button
              >
                Verify
              </Button>
            </div>
          </div>
        )}

        {/* Survey Step */}
        {surveyStep && (
          <div className="space-y-6">
            {/* Moved Optional Fields */}
            <div className="space-y-4 pt-2">
              <FormInput
                label="Field of study (optional)"
                type="text"
                placeholder="e.g. Computer Science, Psychology, etc."
                {...register("fieldOfStudy")}
                className="bg-white border-white text-gray-600 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">
                How did you hear about us? *
              </label>
              <Select
                onValueChange={(value) => setValue("heardAboutPlatform", value)}
                required>
                <SelectTrigger className="h-12 rounded-xl bg-white border-white focus:ring-2 focus:ring-blue-500 text-gray-600">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="bg-white border-white text-gray-600">
                  {heardAboutOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className="text-gray-600">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.heardAboutPlatform && (
                <p className="text-sm text-red-400 mt-1">
                  This field is required
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">
                What's the main goal you hope to achieve with our product? *
              </label>
              <textarea
                placeholder="Tell us about your goals..."
                className="w-full px-4 py-3 bg-white border border-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 resize-none text-gray-600 placeholder-gray-500"
                rows={3}
                {...register("userGoal", { required: true })}
              />
              {errors.userGoal && (
                <p className="text-sm text-red-400 mt-1">
                  This field is required
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">
                What best describes your role? *
              </label>
              <Select
                onValueChange={(value) => setValue("userRole", value)}
                required>
                <SelectTrigger className="h-12 rounded-xl bg-white border-white focus:ring-2 focus:ring-blue-500 text-gray-600">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-white border-white text-gray-600">
                  {userRoles.map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                      className="text-gray-600">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userRole && (
                <p className="text-sm text-red-400 mt-1">
                  This field is required
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">
                What 'job' are you primarily 'hiring' our product to do for you?
                *
              </label>
              <textarea
                placeholder="Describe the main task or problem you want to solve..."
                className="w-full px-4 py-3 bg-white border border-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 resize-none text-gray-600 placeholder-gray-500"
                rows={3}
                {...register("mainJob", { required: true })}
              />
              {errors.mainJob && (
                <p className="text-sm text-red-400 mt-1">
                  This field is required
                </p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOtpStep(true)}
                className="flex-1 bg-white border-white text-gray-600 hover:bg-white">
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-gray-600 font-medium rounded-xl transition-all duration-200 btn-glow"
                disabled={isLoading}>
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Complete Signup"
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <Link
            href={selectedPlan ? `/login?plan=${selectedPlan}` : "/login"}
            className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
