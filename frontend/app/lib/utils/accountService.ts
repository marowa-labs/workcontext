/**
 * Account service for managing user account operations
 */

import { apiClient } from "./apiClient";

// Define the actual user account interface that matches what Account.tsx expects
export interface ActualUserAccount {
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

export interface UpdateAccountData {
  full_name?: string;
  phone_number?: string;
  user_type?: string;
  field_of_study?: string;
  email?: string;
  otp?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Get current user account information
 * @returns Promise resolving to user account information
 */
export const getUserAccount = async (): Promise<ActualUserAccount> => {
  const response = await apiClient.get(`/api/users`);

  // The API returns { user: {...} } directly on success, not { success: true, user: {...} }
  if (response && response.user) {
    return response.user;
  } else {
    throw new Error(
      response?.message || "Failed to fetch user account details"
    );
  }
};

/**
 * Update user account information
 * @param userId The user ID
 * @param data The account data to update
 * @returns Promise resolving when update is complete
 */
export const updateAccount = async (
  userId: string,
  data: UpdateAccountData
): Promise<ActualUserAccount> => {
  try {
    // Send a request to update the account via API
    const response = await apiClient.put(`/api/users/${userId}`, data);

    // Return the updated user account
    if (response && response.user) {
      return response.user;
    } else {
      throw new Error(response?.message || "Failed to update user account");
    }
  } catch (error) {
    console.error(`Error updating account for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Change user password
 * @param userId The user ID
 * @param data The password change data
 * @returns Promise resolving when password change is complete
 */
export const changePassword = async (
  userId: string,
  data: ChangePasswordData
): Promise<boolean> => {
  try {
    // Validate that new passwords match
    if (data.newPassword !== data.confirmPassword) {
      throw new Error("New passwords do not match");
    }

    // Send a request to change the password via API
    const response = await apiClient.post(
      `/api/users/${userId}/change-password`,
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }
    );

    return response.success || false;
  } catch (error) {
    console.error(`Error changing password for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Delete user account
 * @param password The user's password for confirmation
 * @returns Promise resolving when account deletion is complete
 */
export const deleteAccount = async (password: string): Promise<boolean> => {
  try {
    // Send a request to delete the account via API
    const response = await apiClient.delete("/api/users", {
      password,
    });

    return response.success || false;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

/**
 * Get account usage statistics
 * @param userId The user ID
 * @returns Promise resolving to usage statistics
 */
export const getAccountUsage = async (
  userId: string
): Promise<{
  projects: number;
  storage: number;
  collaborators: number;
  aiRequests: number;
}> => {
  try {
    // Fetch usage from the API
    const response = await apiClient.get(`/api/users/${userId}/usage`);

    // Return the usage statistics from the response
    return {
      projects: response.projects || 0,
      storage: response.storage || 0,
      collaborators: response.collaborators || 0,
      aiRequests: response.aiRequests || 0,
    };
  } catch (error) {
    console.error(`Error fetching account usage for user ${userId}:`, error);
    // Return default values in case of error
    return {
      projects: 0,
      storage: 0,
      collaborators: 0,
      aiRequests: 0,
    };
  }
};

/**
 * Update account preferences
 * @param userId The user ID
 * @param preferences The preferences to update
 * @returns Promise resolving when preferences are updated
 */
export const updateAccountPreferences = async (
  userId: string,
  preferences: Partial<{
    theme: "light" | "dark" | "system";
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  }>
): Promise<any> => {
  try {
    // Send a request to update preferences via API
    const response = await apiClient.put(`/api/users/${userId}/preferences`, {
      preferences,
    });

    return response.preferences || preferences;
  } catch (error) {
    console.error(`Error updating preferences for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get user's current plan information
 * @returns Promise resolving to plan information
 */
export const getUserPlan = async (): Promise<string> => {
  const account = await getUserAccount();
  return account.selected_plan || "free";
};

/**
 * Check if user has a specific feature available based on their plan
 * @param userId The user ID
 * @param feature The feature to check
 * @returns Boolean indicating if feature is available
 */
export const hasFeatureAccess = async (
  userId: string,
  feature: string
): Promise<boolean> => {
  try {
    // Check against plan-specific features via API
    const response = await apiClient.get(
      `/api/users/${userId}/features/${feature}`
    );

    return response.hasAccess || false;
  } catch (error) {
    console.error(
      `Error checking feature access for user ${userId}, feature ${feature}:`,
      error
    );
    // Default to denying access in case of error
    return false;
  }
};

/**
 * Send OTP for profile update
 * @param data The profile data to update
 * @returns Promise resolving when OTP is sent
 */
export const sendProfileOTP = async (data: any): Promise<boolean> => {
  try {
    // Send an OTP to the user via API
    const response = await apiClient.post("/api/auth/send-otp", {
      ...data,
      purpose: "profile_update",
    });

    return response.success || false;
  } catch (error) {
    console.error("Error sending OTP for profile update:", error);
    throw error;
  }
};

/**
 * Update profile with OTP verification
 * @param data The profile data and OTP
 * @returns Promise resolving when profile is updated
 */
export const updateProfile = async (
  data: UpdateAccountData
): Promise<ActualUserAccount> => {
  try {
    // Get current user ID from auth context or session
    const response = await apiClient.put("/api/users/profile", data);

    // Return the updated user account
    if (response && response.user) {
      return response.user;
    } else {
      throw new Error(response?.message || "Failed to update profile");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

/**
 * Update password with current password verification
 * @param currentPassword The user's current password
 * @param newPassword The new password
 * @returns Promise resolving when password is updated
 */
export const updatePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  try {
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Verify the current password and update to the new one via API
    const response = await apiClient.post("/api/users/change-password", {
      currentPassword,
      newPassword,
    });

    return response.success || false;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

/**
 * Enable two-factor authentication
 * @returns Promise resolving when 2FA is enabled
 */
export const enable2FA = async (): Promise<boolean> => {
  try {
    // Enable 2FA for the user via API
    const response = await apiClient.post("/api/users/enable-2fa", {});

    return response.success || false;
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    throw error;
  }
};

/**
 * Export user account data
 * @returns Promise resolving when data export is initiated
 */
export const exportAccountData = async (): Promise<boolean> => {
  try {
    // Initiate an account data export via API
    const response = await apiClient.post("/api/users/export-data", {});

    return response.success || false;
  } catch (error) {
    console.error("Error exporting account data:", error);
    throw error;
  }
};

const accountService = {
  getUserAccount,
  updateAccount,
  changePassword,
  deleteAccount,
  getAccountUsage,
  updateAccountPreferences,
  getUserPlan,
  hasFeatureAccess,
  sendProfileOTP,
  updateProfile,
  updatePassword,
  enable2FA,
  exportAccountData,
};

export default accountService;
