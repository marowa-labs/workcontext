"use client";

import React, { useState, useEffect } from "react";
import {
  XCircle,
  MapPin,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  User,
  CheckCircle,
  Phone,
  BookOpen,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import PrivacySettingsService, {
  PrivacySettings,
} from "../../../lib/utils/privacySettingsService";
import AccountService from "../../../lib/utils/accountService";
import { useToast } from "../../../hooks/use-toast";
import { supabase } from "../../../lib/supabase/client";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  user_type: string | null;
  field_of_study: string | null;
  selected_plan: string | null;
  retention_period: number | null;
  affiliate_ref: string | null;
  created_at: string;
  updated_at: string;
  subscription?: {
    plan: string;
    status: string;
  };
}

interface Session {
  id: string;
  user_id: string;
  device_info: string;
  ip_address: string;
  location: string | null;
  last_active: string;
  is_current: boolean;
  created_at: string;
  expires_at: string;
  browser: string;
  device: string;
  lastActive: Date;
  current: boolean;
}

interface LoginHistoryItem {
  id: string;
  user_id: string;
  ip_address: string;
  device_info: string;
  location: string | null;
  status: string;
  error_code: string | null;
  created_at: string;
  date: Date;
  device: string;
  browser: string;
  ip: string;
}

const AccountSettingsPage: React.FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone_number: "",
    user_type: "",
    field_of_study: "",
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteVerification, setDeleteVerification] = useState("");
  const [deleteStep, setDeleteStep] = useState(1); // 1: confirm, 2: verify, 3: final confirm

  // Real data for sessions and login history
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(true);
  const [sessionOperationLoading, setSessionOperationLoading] = useState(false);

  // OTP states for profile update
  const [showProfileOTP, setShowProfileOTP] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1: send OTP, 2: enter OTP
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState<any>(null);

  // Email change states
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeStep, setEmailChangeStep] = useState(1); // 1: enter new email, 2: verify OTP
  const [pendingEmailChange, setPendingEmailChange] = useState("");

  const { toast } = useToast();

  // Privacy settings state
  const [privacySettings, setPrivacySettings] =
    useState<PrivacySettings | null>(null);
  const [privacySettingsLoading, setPrivacySettingsLoading] = useState(true);

  // State for tracking when settings are being updated
  const [updatingSettings, setUpdatingSetting] = useState<string | null>(null);

  // Fetch privacy settings on mount
  useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        setPrivacySettingsLoading(true);
        const settings = await PrivacySettingsService.getSettings();
        setPrivacySettings(settings);
      } catch (error: any) {
        console.error("Error fetching privacy settings:", error);
        toast({
          title: "Error",
          description: "Failed to load privacy settings.",
          variant: "destructive",
        });
      } finally {
        setPrivacySettingsLoading(false);
      }
    };

    fetchPrivacySettings();
  }, [toast]);

  // Update a single privacy setting
  const updateSettingWithFeedback = async (
    key: keyof PrivacySettings,
    value: boolean | string,
  ) => {
    if (!privacySettings) return;

    const previousValue = privacySettings[key];
    setUpdatingSetting(key);

    // Optimistic update
    setPrivacySettings((prev) => (prev ? { ...prev, [key]: value } : prev));

    try {
      const updatedSettings = await PrivacySettingsService.updateSettings({
        [key]: value,
      });
      setPrivacySettings(updatedSettings);

      toast({
        title: "Setting Updated",
        description: "Your privacy settings have been updated successfully.",
      });
    } catch (error: any) {
      // Revert on error
      setPrivacySettings((prev) =>
        prev ? { ...prev, [key]: previousValue } : prev,
      );

      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error updating privacy settings:", error);
    } finally {
      setUpdatingSetting(null);
    }
  };

  // Helper function to render status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" /> Success
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            {status}
          </span>
        );
    }
  };

  // Fetch user account details
  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        // Get user ID from Supabase auth
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }
        const userData = await AccountService.getUserAccount();
        setUser(userData);
        // Initialize profile form with user data
        setProfileForm({
          full_name: userData.full_name || "",
          phone_number: userData.phone_number || "",
          user_type: userData.user_type || "",
          field_of_study: userData.field_of_study || "",
        });
      } catch (error: any) {
        console.error("Error fetching account details:", error);
        toast({
          title: "Error",
          description:
            error.message ||
            "Failed to load account details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [toast]);

  // Fetch real session data
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessionsLoading(true);
        const sessionData = await PrivacySettingsService.getUserSessions();

        // Check if sessionData is valid before mapping
        if (Array.isArray(sessionData)) {
          // Transform backend data to match our interface
          // Backend now stores formatted device_info like "Chrome - Windows 10/11"
          const transformedSessions: Session[] = sessionData.map((session) => {
            const parts = session.device_info.split(" - ");
            return {
              ...session,
              device: parts[0] || "Unknown Device",
              browser: parts[1] || "Unknown OS",
              lastActive: new Date(session.last_active),
              current: session.is_current,
            };
          });

          setSessions(transformedSessions);
        } else {
          // Set empty array if no data or invalid data
          setSessions([]);
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        // Set empty array on error
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    const fetchLoginHistory = async () => {
      try {
        setLoginHistoryLoading(true);
        const loginData = await PrivacySettingsService.getLoginHistory();

        // Check if loginData is valid before mapping
        if (Array.isArray(loginData)) {
          // Transform backend data to match our interface
          const transformedLoginHistory: LoginHistoryItem[] = loginData.map(
            (login) => ({
              ...login,
              date: new Date(login.created_at),
              device: login.device_info.split(" - ")[0] || "Unknown Device",
              browser: login.device_info.split(" - ")[1] || "Unknown OS",
              ip: login.ip_address,
            }),
          );

          setLoginHistory(transformedLoginHistory);
        } else {
          // Set empty array if no data or invalid data
          setLoginHistory([]);
        }
      } catch (err) {
        console.error("Failed to fetch login history:", err);
        // Set empty array on error
        setLoginHistory([]);
      } finally {
        setLoginHistoryLoading(false);
      }
    };

    fetchSessions();
    fetchLoginHistory();
  }, []);

  const handleSignOutSession = async (id: string) => {
    setSessionOperationLoading(true);
    try {
      await PrivacySettingsService.endSession(id);
      setSessions(sessions.filter((session) => session.id !== id));
      toast({
        title: "Session Ended",
        description: "The session has been successfully ended.",
      });
    } catch (err) {
      console.error("Failed to end session:", err);
      toast({
        title: "Session End Failed",
        description: "Failed to end the session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSessionOperationLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    setSessionOperationLoading(true);
    try {
      // End all non-current sessions
      const nonCurrentSessions = sessions.filter((session) => !session.current);
      await Promise.all(
        nonCurrentSessions.map((session) =>
          PrivacySettingsService.endSession(session.id),
        ),
      );
      setSessions(sessions.filter((session) => session.current));
      toast({
        title: "Sessions Ended",
        description: "All other sessions have been successfully ended.",
      });
    } catch (err) {
      console.error("Failed to end all sessions:", err);
      toast({
        title: "Session End Failed",
        description: "Failed to end all sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSessionOperationLoading(false);
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async () => {
    setProfileLoading(true);
    try {
      // Show OTP verification modal instead of directly updating
      setPendingProfileUpdate(profileForm);
      setShowProfileOTP(true);
      setOtpStep(1); // Start with sending OTP
      setOtpValue("");
      setOtpSuccess(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to initiate profile update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Send OTP for profile update
  const handleSendProfileOTP = async () => {
    setOtpLoading(true);
    try {
      await AccountService.sendProfileOTP(pendingProfileUpdate);
      setOtpStep(2); // Move to enter OTP step
      toast({
        title: "OTP Sent",
        description: pendingProfileUpdate.email
          ? "Please check your new email address for the verification code."
          : "Please check your email for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP for profile update
  const handleVerifyProfileOTP = async () => {
    setOtpLoading(true);
    try {
      // Instead of verifying OTP separately, directly update the profile with OTP included
      // This matches how the Profile page works
      await AccountService.updateProfile({
        ...pendingProfileUpdate,
        otp: otpValue,
      });

      // Update local user state
      if (user) {
        setUser({
          ...user,
          ...pendingProfileUpdate,
        });
      }

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });

      // Close OTP modal after a short delay
      setTimeout(() => {
        setShowProfileOTP(false);
        setOtpValue("");
        setPendingProfileUpdate(null);
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      await AccountService.updatePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );

      toast({
        title: "Success",
        description: "Password updated successfully.",
      });

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      await AccountService.enable2FA();

      toast({
        title: "Success",
        description:
          "2FA enabled successfully. Follow the instructions sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enable 2FA. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      await AccountService.exportAccountData();

      toast({
        title: "Success",
        description:
          "Account data exported successfully. Check your downloads folder.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to export account data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirmation(true);
    setDeleteStep(1);
    setDeleteVerification("");
  };

  const handleDeleteVerification = async () => {
    if (deleteStep === 1) {
      // Move to verification step
      setDeleteStep(2);
      return;
    }

    if (deleteStep === 2) {
      // Verify the user typed "DELETE" correctly
      if (deleteVerification !== "DELETE") {
        toast({
          title: "Error",
          description: 'Please type "DELETE" to confirm account deletion.',
          variant: "destructive",
        });
        return;
      }

      // Move to final confirmation step
      setDeleteStep(3);
      return;
    }

    if (deleteStep === 3) {
      // Final confirmation - ask for password
      const password = prompt(
        "Please enter your password to permanently delete your account:",
      );

      if (!password) {
        toast({
          title: "Cancelled",
          description: "Account deletion cancelled.",
        });
        setShowDeleteConfirmation(false);
        return;
      }

      setDeleteLoading(true);
      try {
        await AccountService.deleteAccount(password);

        toast({
          title: "Success",
          description:
            "Account deleted successfully. You will be logged out shortly.",
        });

        // Sign out user after account deletion
        setTimeout(async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }, 3000);
      } catch (error: any) {
        toast({
          title: "Error",
          description:
            error.message || "Failed to delete account. Please try again.",
          variant: "destructive",
        });
      } finally {
        setDeleteLoading(false);
        setShowDeleteConfirmation(false);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteStep(1);
    setDeleteVerification("");
  };

  const cancelProfileOTP = () => {
    setShowProfileOTP(false);
    setOtpValue("");
    setPendingProfileUpdate(null);
    setOtpStep(1);
    setOtpSuccess(false);
  };

  // Handle email change button click
  const handleChangeEmail = () => {
    setShowEmailChangeModal(true);
    setEmailChangeStep(1);
    setNewEmail(user?.email || "");
  };

  // Handle new email input change
  const handleNewEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEmail(e.target.value);
  };

  // Send OTP for email change
  const handleSendEmailChangeOTP = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast({
        title: "Error",
        description: "Please enter a new email address.",
        variant: "destructive",
      });
      return;
    }

    setOtpLoading(true);
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        toast({
          title: "Error",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      // Send OTP for email change
      await AccountService.sendProfileOTP({ email: newEmail });
      setPendingEmailChange(newEmail);
      setEmailChangeStep(2); // Move to OTP verification step
      setOtpValue("");

      toast({
        title: "OTP Sent",
        description: `Please check your new email address (${newEmail}) for the verification code.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP for email change
  const handleVerifyEmailChangeOTP = async () => {
    console.log("OTP Value:", otpValue); // Debug log
    if (!otpValue || otpValue.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setOtpLoading(true);
    try {
      console.log("Sending profile update with OTP:", {
        email: pendingEmailChange,
        otp: otpValue,
      }); // Debug log

      // Instead of verifying OTP separately, directly update the profile with OTP included
      // This matches how the Profile page works
      await AccountService.updateProfile({
        email: pendingEmailChange,
        otp: otpValue,
      });

      // Update local user state
      if (user) {
        setUser({
          ...user,
          email: pendingEmailChange,
        });
      }

      toast({
        title: "Success",
        description: "Email address updated successfully.",
      });

      // Close modal after a short delay
      setTimeout(() => {
        setShowEmailChangeModal(false);
        setNewEmail("");
        setPendingEmailChange("");
        setOtpValue("");
      }, 2000);
    } catch (error: any) {
      console.error("Error updating email:", error); // Debug log
      toast({
        title: "Error",
        description:
          error.message || "Failed to update email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // Cancel email change process
  const cancelEmailChange = () => {
    setShowEmailChangeModal(false);
    setNewEmail("");
    setPendingEmailChange("");
    setOtpValue("");
    setEmailChangeStep(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account details and security
        </p>
      </div>

      <div className="space-y-6 p-6 rounded-2xl bg-card border border-border">
        {/* Profile Information */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Profile Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profileForm.full_name}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone_number"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    value={profileForm.phone_number}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="user_type"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  User Type
                </label>
                <select
                  id="user_type"
                  name="user_type"
                  value={profileForm.user_type}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select your type</option>
                  <option value="Undergraduate Student">
                    Undergraduate Student
                  </option>
                  <option value="Graduate Student">Graduate Student</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Professor">Professor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="field_of_study"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Field of Study
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    id="field_of_study"
                    name="field_of_study"
                    value={profileForm.field_of_study}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleUpdateProfile} disabled={profileLoading}>
                {profileLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Email Management */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Email Management
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    Verified
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleChangeEmail}>
                Change Email
              </Button>
            </div>
          </div>
        </div>

        {/* Password Management */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Password Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div></div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    Password requirements:
                  </p>
                  <ul className="mt-1 space-y-1">
                    <li className="flex items-center text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                      At least 8 characters
                    </li>
                    <li className="flex items-center text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                      One uppercase letter
                    </li>
                    <li className="flex items-center text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                      One number
                    </li>
                    <li className="flex items-center text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 mr-2"></span>
                      One special character
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleUpdatePassword} disabled={passwordLoading}>
                {passwordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication 
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Two-Factor Authentication
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button onClick={handleEnable2FA} variant="outline">
                Enable 2FA
              </Button>
            </div>
          </div>
        </div>*/}

        {/* Security Settings */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              Security Settings
            </h2>
            {updatingSettings && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Session Management */}
            <div>
              <h3 className="font-medium text-foreground mb-3">
                Active Sessions
              </h3>
              {sessionsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-foreground">
                              {session.device} - {session.browser}
                            </span>
                            {session.current && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                This Device
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {session.location}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Last active: {session.lastActive.toLocaleString()}
                          </p>
                        </div>
                        {!session.current && (
                          <button
                            onClick={() => handleSignOutSession(session.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center"
                            disabled={sessionOperationLoading}
                          >
                            {sessionOperationLoading && (
                              <div className="animate-spin h-3 w-3 border border-red-600 border-t-transparent rounded-full mr-1"></div>
                            )}
                            Sign Out
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleSignOutAll}
                      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center"
                      disabled={sessionsLoading || sessionOperationLoading}
                    >
                      {sessionOperationLoading && (
                        <div className="animate-spin h-3 w-3 border border-red-600 border-t-transparent rounded-full mr-1"></div>
                      )}
                      Sign Out All Other Devices
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Login History */}
            <div>
              <h3 className="font-medium text-black mb-3">Login History</h3>
              {loginHistoryLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                        >
                          Date/Time
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                        >
                          Device/Browser
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                        >
                          Location
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                        >
                          IP Address
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loginHistory.map((login) => (
                        <tr key={login.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {login.date.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {login.device} - {login.browser}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {login.location || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {login.ip}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {getStatusBadge(
                              login.status as "success" | "failed",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Security Alerts */}
            <div>
              <h3 className="font-medium text-foreground mb-3">
                Security Alerts
              </h3>
              {privacySettingsLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : privacySettings ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-foreground">
                        Email me about unusual login attempts
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when we detect suspicious activity
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateSettingWithFeedback(
                          "email_unusual_logins",
                          !privacySettings.email_unusual_logins,
                        )
                      }
                      disabled={updatingSettings === "email_unusual_logins"}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacySettings.email_unusual_logins
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      } ${updatingSettings === "email_unusual_logins" ? "opacity-50" : ""}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          privacySettings.email_unusual_logins
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-foreground">
                        Notify me of new device logins
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you sign in from a new device
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateSettingWithFeedback(
                          "notify_new_devices",
                          !privacySettings.notify_new_devices,
                        )
                      }
                      disabled={updatingSettings === "notify_new_devices"}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacySettings.notify_new_devices
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      } ${updatingSettings === "notify_new_devices" ? "opacity-50" : ""}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          privacySettings.notify_new_devices
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Failed to load privacy settings.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-white bg-opacity-50 transition-opacity"
              onClick={cancelDelete}
            ></div>

            {/* Modal */}
            <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-auto border border-border">
              <div className="p-6">
                {deleteStep === 1 && (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium text-foreground">
                        Delete Account
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Are you sure you want to delete your account? This
                          action cannot be undone.
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          All your data will be permanently deleted.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button onClick={cancelDelete} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeleteVerification}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Continue
                      </Button>
                    </div>
                  </>
                )}

                {deleteStep === 2 && (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium text-foreground">
                        Confirm Account Deletion
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          To confirm, please type{" "}
                          <span className="font-bold">DELETE</span> in the box
                          below:
                        </p>
                        <input
                          type="text"
                          value={deleteVerification}
                          onChange={(e) =>
                            setDeleteVerification(e.target.value)
                          }
                          className="mt-3 w-full px-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-destructive"
                          placeholder="Type DELETE"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button onClick={cancelDelete} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeleteVerification}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteVerification !== "DELETE"}
                      >
                        Confirm
                      </Button>
                    </div>
                  </>
                )}

                {deleteStep === 3 && (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium text-foreground">
                        Final Confirmation
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          This is your final confirmation. After this step, your
                          account will be permanently deleted.
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Click "Delete Account" below to proceed.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button onClick={cancelDelete} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeleteVerification}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Account"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Update OTP Modal */}
      {showProfileOTP && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-white bg-opacity-50 transition-opacity"
              onClick={cancelProfileOTP}
            ></div>

            {/* Modal */}
            <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-auto border border-border">
              <div className="p-6">
                {otpStep === 1 && (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <svg
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium text-foreground">
                        Verify Profile Update
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          {pendingProfileUpdate?.email
                            ? "To confirm your email change, we'll send a verification code to your new email address."
                            : "To confirm your profile update, we'll send a verification code to your registered email."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button onClick={cancelProfileOTP} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendProfileOTP}
                        disabled={otpLoading}
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Verification Code"
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {otpStep === 2 && !otpSuccess && (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <svg
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium text-foreground">
                        Enter Verification Code
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          {pendingProfileUpdate?.email
                            ? "Please enter the 6-digit code sent to your new email address."
                            : "Please enter the 6-digit code sent to your email."}
                        </p>
                        <input
                          type="text"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          className="mt-3 w-full px-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                          placeholder="000000"
                          maxLength={6}
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button onClick={cancelProfileOTP} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleVerifyProfileOTP}
                        disabled={otpLoading || otpValue.length !== 6}
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {otpSuccess && (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full">
                      <svg
                        className="w-6 h-6 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium text-foreground">
                        Profile Updated Successfully
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Your profile has been updated successfully.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button onClick={cancelProfileOTP} className="w-full">
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailChangeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-white bg-opacity-50 transition-opacity"
              onClick={cancelEmailChange}
            ></div>

            {/* Modal */}
            <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-auto border border-border">
              <div className="p-6">
                {emailChangeStep === 1 && (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <svg
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium text-foreground">
                        Change Email Address
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Enter your new email address below. We'll send a
                          verification code to confirm the change.
                        </p>
                        <div className="mt-4">
                          <label
                            htmlFor="newEmail"
                            className="block text-sm font-medium text-foreground mb-1 text-left"
                          >
                            New Email Address
                          </label>
                          <input
                            type="email"
                            id="newEmail"
                            value={newEmail}
                            onChange={handleNewEmailChange}
                            className="w-full px-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter new email address"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button onClick={cancelEmailChange} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendEmailChangeOTP}
                        disabled={
                          otpLoading || !newEmail || newEmail === user?.email
                        }
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Verification Code"
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {emailChangeStep === 2 && (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <svg
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium text-foreground">
                        Enter Verification Code
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Please enter the 6-digit code sent to your new email
                          address ({pendingEmailChange}).
                        </p>
                        <input
                          type="text"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          className="mt-3 w-full px-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                          placeholder="000000"
                          maxLength={6}
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button onClick={cancelEmailChange} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleVerifyEmailChangeOTP}
                        disabled={otpLoading || otpValue.length !== 6}
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage;
