"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  User,
  Phone,
  BookOpen,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
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
          : "Please check your phone for the verification code.",
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
                  className="block text-sm font-medium text-foreground mb-1">
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
                  className="block text-sm font-medium text-foreground mb-1">
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
                  className="block text-sm font-medium text-foreground mb-1">
                  User Type
                </label>
                <select
                  id="user_type"
                  name="user_type"
                  value={profileForm.user_type}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground shadow-sm border border-input focus:outline-none focus:ring-2 focus:ring-primary">
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
                  className="block text-sm font-medium text-foreground mb-1">
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
                  className="block text-sm font-medium text-foreground mb-1">
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center">
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
                  className="block text-sm font-medium text-foreground mb-1">
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center">
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
                  className="block text-sm font-medium text-foreground mb-1">
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center">
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

        {/* Two-Factor Authentication */}
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
        </div>

        {/* Connected Accounts */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Connected Accounts
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600 dark:text-red-400"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-foreground">Google</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button variant="outline">Disconnect</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6">
            <h2 className="text-lg font-medium text-destructive mb-4">
              Danger Zone
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Export Account Data
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download all your documents, citations, and data
                  </p>
                </div>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  disabled={exportLoading}>
                  {exportLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Your Data
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This action cannot be undone
                  </p>
                </div>
                <Button
                  onClick={handleDeleteAccount}
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
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
              onClick={cancelDelete}></div>

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
                        className="bg-red-600 hover:bg-red-700">
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
                        disabled={deleteVerification !== "DELETE"}>
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
                        disabled={deleteLoading}>
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
              onClick={cancelProfileOTP}></div>

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
                        xmlns="http://www.w3.org/2000/svg">
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
                            : "To confirm your profile update, we'll send a verification code to your registered phone number."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                      <Button onClick={cancelProfileOTP} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendProfileOTP}
                        disabled={otpLoading}>
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
                        xmlns="http://www.w3.org/2000/svg">
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
                            : "Please enter the 6-digit code sent to your phone."}
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
                        disabled={otpLoading || otpValue.length !== 6}>
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
                        xmlns="http://www.w3.org/2000/svg">
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
              onClick={cancelEmailChange}></div>

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
                        xmlns="http://www.w3.org/2000/svg">
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
                            className="block text-sm font-medium text-foreground mb-1 text-left">
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
                        }>
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
                        xmlns="http://www.w3.org/2000/svg">
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
                        disabled={otpLoading || otpValue.length !== 6}>
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
