import { supabase } from "../supabase/client";
import { apiClient } from "./apiClient";

interface ProfileData {
  name: string;
  email: string;
  username: string;
  bio: string;
  fieldOfStudy: string;
  academicLevel: string;
  institution: string;
  location: string;
}

class ProfileService {
  // Get user profile
  static async getProfile() {
    try {
      const response = await apiClient.get("/api/users");
      console.log("Profile service response:", response); // Debug log

      // Map backend fields to frontend interface
      if (response.user) {
        return {
          name: response.user.full_name || "",
          email: response.user.email || "",
          username: response.user.email?.split("@")[0] || "", // Generate username from email
          bio: response.user.bio || "",
          fieldOfStudy: response.user.field_of_study || "",
          academicLevel: response.user.user_type || "",
          institution: response.user.institution || "",
          location: response.user.location || "",
        };
      }

      return response.user;
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      // Check if the error is due to HTML response
      if (error.message && error.message.includes("JSON")) {
        console.error(
          "Received HTML instead of JSON - this indicates a server error"
        );
      }
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(profileData: ProfileData) {
    try {
      // Map the profile data to the format expected by the backend
      const backendData = {
        full_name: profileData.name,
        field_of_study: profileData.fieldOfStudy,
        user_type: profileData.academicLevel,
        bio: profileData.bio,
        institution: profileData.institution,
        location: profileData.location,
      };

      const response = await apiClient.put("/api/users", backendData);

      // Check if the response indicates success
      if (!response.success) {
        throw new Error(response.message || "Failed to update profile");
      }

      return response;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  // Upload avatar
  static async uploadAvatar(file: File) {
    try {
      // Get the authenticated user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      // Create FormData object for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload file to the collaboration upload endpoint which handles Supabase Storage
      const response = await fetch("/api/collaboration/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Check if the response is successful
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      // Parse the response data
      const data = await response.json();

      // Check if the upload was successful
      if (!data.success) {
        throw new Error(data.message || "Failed to upload avatar");
      }

      // Return the public URL of the uploaded avatar
      return data.fileUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  }
}

export type { ProfileData };
export default ProfileService;
