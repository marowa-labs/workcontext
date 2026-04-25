"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "../../../hooks/use-toast";
import { Loader2, User, Upload, BadgeCheck } from "lucide-react";
import ProfileService, { ProfileData } from "../../../lib/utils/profileService";
import apiClient from "../../../lib/utils/apiClient";

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    username: "",
    bio: "",
    fieldOfStudy: "",
    academicLevel: "",
    institution: "",
    location: "",
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(
    null,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await ProfileService.getProfile();
      setProfile(data);
      setOriginalProfile({ ...data });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // First, request OTP for profile update
      const response = await apiClient.post("/api/users/request-otp", {
        action: "profile_update",
      });

      if (response.success) {
        // Store the profile data temporarily and show OTP modal
        setPendingProfileData(profile);
        setShowOTPModal(true);
      } else {
        throw new Error(response.message || "Failed to request OTP");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOTPSubmit = async () => {
    const otpValue = otp || "";
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
      // Submit the profile update with OTP
      const updateData = {
        ...pendingProfileData,
        otp: otpValue,
      };

      // Create a proper ProfileData object
      const profileData: ProfileData = {
        name: updateData.name,
        email: updateData.email,
        username: updateData.username,
        bio: updateData.bio,
        fieldOfStudy: updateData.fieldOfStudy,
        academicLevel: updateData.academicLevel,
        institution: updateData.institution,
        location: updateData.location,
      };

      // Add OTP to the backend data
      const backendData = {
        full_name: profileData.name,
        field_of_study: profileData.fieldOfStudy,
        user_type: profileData.academicLevel,
        bio: profileData.bio,
        institution: profileData.institution,
        location: profileData.location,
        otp: updateData.otp,
      };

      const response = await apiClient.put("/api/users", backendData);

      // Check if the response indicates success
      if (response.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });

        setOriginalProfile({ ...pendingProfileData });
        setShowOTPModal(false);
        setOtp("");
        setPendingProfileData(null);
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const hasChanges = () => {
    if (!originalProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    // Changed from max-w-4xl to w-full to fill the whole page
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information
        </p>
      </div>

      {/* Added dark mode support to the container */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          {/* Profile Picture */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Profile Picture
            </h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  // Added dark mode support to the default avatar
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <label className="absolute inset-0 w-24 h-24 rounded-full bg-white bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <div>
                <Button variant="outline" className="mb-2">
                  Change Photo
                </Button>
                {/* Added dark mode support to the text */}
                <p className="text-sm text-muted-foreground">
                  JPG, GIF or PNG. Max 1MB.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                {/* Added dark mode support to the input */}
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
                {/* Added dark mode support to the helper text */}
                <p className="mt-1 text-sm text-muted-foreground">
                  Min 2 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <div className="relative">
                  {/* Added dark mode support to the input */}
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-muted text-muted-foreground"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <BadgeCheck className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                {/* Added dark mode support to the verified text */}
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                  Verified
                </p>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-foreground mb-1">
                  Username
                </label>
                {/* Added dark mode support to the input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-muted-foreground">@</span>
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profile.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pl-8 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                </div>
                {/* Added dark mode support to the helper text */}
                <p className="mt-1 text-sm text-muted-foreground">
                  Used for @mentions
                </p>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-foreground mb-1">
                  Bio
                </label>
                {/* Added dark mode support to the textarea */}
                <textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
                <div className="flex justify-between mt-1">
                  {/* Added dark mode support to the helper text */}
                  <p className="text-sm text-muted-foreground">
                    Public in collaborations
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(profile.bio || "").length}/200
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-foreground mb-4">
              Professional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="fieldOfStudy"
                  className="block text-sm font-medium text-foreground mb-1">
                  Field of Study
                </label>
                {/* Added dark mode support to the input */}
                <input
                  type="text"
                  id="fieldOfStudy"
                  name="fieldOfStudy"
                  value={profile.fieldOfStudy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
              </div>

              <div>
                <label
                  htmlFor="academicLevel"
                  className="block text-sm font-medium text-foreground mb-1">
                  Academic Level
                </label>
                {/* Added dark mode support to the select */}
                <select
                  id="academicLevel"
                  name="academicLevel"
                  value={profile.academicLevel}
                  onChange={handleSelectChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground">
                  <option value="">Select level</option>
                  <option value="High School">High School</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="institution"
                  className="block text-sm font-medium text-foreground mb-1">
                  Institution
                </label>
                {/* Added dark mode support to the input */}
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  value={profile.institution}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-foreground mb-1">
                  Location
                </label>
                {/* Added dark mode support to the input */}
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profile.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!hasChanges() || saving}
              className="bg-primary hover:opacity-90 text-primary-foreground">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="bg-popover border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Verify Profile Update
            </h3>
            <p className="text-muted-foreground mb-4">
              We've sent a 6-digit verification code to your phone number.
              Please enter it below to confirm your profile update.
            </p>
            <div className="mb-4">
              <Label
                htmlFor="otp"
                className="block text-sm font-medium text-foreground mb-1">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                value={otp || ""}
                onChange={(e) => setOtp(e.target.value || "")}
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOTPModal(false);
                  setOtp("");
                  setPendingProfileData(null);
                }}>
                Cancel
              </Button>
              <Button
                onClick={handleOTPSubmit}
                disabled={otpLoading || !otp || otp.length !== 6}
                className="bg-primary hover:opacity-90 text-primary-foreground">
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
          </div>
        </div>
      )}
    </div>
  );
}
