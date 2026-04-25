/**
 * Waitlist service for managing user waitlist operations
 */

import { apiClient } from "./apiClient";

export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  reason?: string;
  priority: "low" | "medium" | "high" | "critical";
  joinedAt: Date;
  position?: number;
  notified: boolean;
  featureInterest?: string[];
}

export interface WaitlistSubmission {
  email: string;
  name?: string;
  reason?: string;
  featureInterest?: string[];
}

/**
 * Add a user to the waitlist
 * @param data The waitlist submission data
 * @returns Promise resolving to the waitlist entry
 */
export const addToWaitlist = async (
  data: WaitlistSubmission,
): Promise<WaitlistEntry> => {
  try {
    // Send a request to add the user to the waitlist via API
    const response = await apiClient.post("/api/waitlist", data);

    // Return the waitlist entry from the response
    if (response && response.entry) {
      return {
        ...response.entry,
        joinedAt: new Date(response.entry.joinedAt),
      };
    } else {
      throw new Error(response?.message || "Failed to add to waitlist");
    }
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    throw error;
  }
};

/**
 * Check a user's position on the waitlist
 * @param email The user's email
 * @returns Promise resolving to the user's position or null if not on waitlist
 */
export const checkWaitlistPosition = async (
  email: string,
): Promise<number | null> => {
  try {
    // Fetch from an API to check position
    const response = await apiClient.get(
      `/api/waitlist/position?email=${encodeURIComponent(email)}`,
    );

    return response.position || null;
  } catch (error) {
    console.error(`Error checking waitlist position for ${email}:`, error);
    return null;
  }
};

/**
 * Check if a user is on the waitlist
 * @param email The user's email
 * @returns Promise resolving to boolean indicating if user is on waitlist
 */
export const isOnWaitlist = async (email: string): Promise<boolean> => {
  try {
    // Check against the waitlist database via API
    const response = await apiClient.get(
      `/api/waitlist/check?email=${encodeURIComponent(email)}`,
    );

    return response.isOnWaitlist || false;
  } catch (error) {
    console.error(`Error checking if ${email} is on waitlist:`, error);
    return false;
  }
};

/**
 * Get waitlist statistics
 * @returns Promise resolving to waitlist statistics
 */
export const getWaitlistStats = async (): Promise<{
  totalUsers: number;
  nextNotificationBatch: number;
  averageWaitTime: string; // in days
}> => {
  try {
    // Fetch from an API
    const response = await apiClient.get("/api/waitlist/stats");

    return {
      totalUsers: response.totalUsers || 0,
      nextNotificationBatch: response.nextNotificationBatch || 0,
      averageWaitTime: response.averageWaitTime || "0",
    };
  } catch (error) {
    console.error("Error fetching waitlist stats:", error);
    // Return default values in case of error
    return {
      totalUsers: 0,
      nextNotificationBatch: 0,
      averageWaitTime: "0",
    };
  }
};

/**
 * Remove a user from the waitlist
 * @param email The user's email
 * @returns Promise resolving when user is removed
 */
export const removeFromWaitlist = async (email: string): Promise<boolean> => {
  try {
    // Send a request to remove the user via API
    const response = await apiClient.delete("/api/waitlist", {
      email,
    });

    return response.success || false;
  } catch (error) {
    console.error(`Error removing ${email} from waitlist:`, error);
    throw error;
  }
};

/**
 * Update a waitlist entry
 * @param email The user's email
 * @param updates The updates to apply
 * @returns Promise resolving to the updated waitlist entry
 */
export const updateWaitlistEntry = async (
  email: string,
  updates: Partial<WaitlistSubmission>,
): Promise<WaitlistEntry | null> => {
  try {
    // Send a request to update the entry via API
    const response = await apiClient.put(
      `/api/waitlist/${encodeURIComponent(email)}`,
      updates,
    );

    // Return the updated entry from the response
    if (response && response.entry) {
      return {
        ...response.entry,
        joinedAt: new Date(response.entry.joinedAt),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error updating waitlist entry for ${email}:`, error);
    return null;
  }
};

/**
 * Get features users are most interested in
 * @returns Promise resolving to an array of feature interests
 */
export const getFeatureInterests = async (): Promise<
  {
    feature: string;
    count: number;
    percentage: number;
  }[]
> => {
  try {
    // Fetch from an API
    const response = await apiClient.get("/api/waitlist/features");

    return response.featureInterests || [];
  } catch (error) {
    console.error("Error fetching feature interests:", error);
    // Return default values in case of error
    return [];
  }
};

/**
 * Notify next batch of waitlist users
 * @returns Promise resolving when notifications are sent
 */
export const notifyNextBatch = async (): Promise<boolean> => {
  try {
    // Send notifications to the next batch via API
    const response = await apiClient.post("/api/waitlist/notify-batch", {});

    return response.success || false;
  } catch (error) {
    console.error("Error notifying next batch of waitlist users:", error);
    throw error;
  }
};

/**
 * Vote for a feature
 * @param featureId The ID of the feature to vote for
 * @returns Promise resolving to an object with success status and vote count
 */
export const voteForFeature = async (
  featureId: string,
): Promise<{
  success: boolean;
  votes: number;
  message?: string;
}> => {
  try {
    // Send a request to vote for a feature via API
    const response = await apiClient.post("/api/waitlist/vote", {
      featureId,
    });

    return {
      success: response.success || false,
      votes: response.votes || 0,
      message: response.message,
    };
  } catch (error: any) {
    console.error(`Error voting for feature ${featureId}:`, error);
    return {
      success: false,
      votes: 0,
      message: error.message || "Failed to submit vote",
    };
  }
};

const waitlistService = {
  addToWaitlist,
  checkWaitlistPosition,
  isOnWaitlist,
  getWaitlistStats,
  removeFromWaitlist,
  updateWaitlistEntry,
  getFeatureInterests,
  notifyNextBatch,
  voteForFeature,
};

export default waitlistService;
