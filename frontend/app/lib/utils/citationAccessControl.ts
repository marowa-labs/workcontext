/**
 * Citation access control service for managing citation permissions
 */

import { apiClient } from "./apiClient";

export interface CitationAccessControl {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAdd: boolean;
}

export interface UserCitationPermissions {
  userId: string;
  projectId: string;
  accessLevel: "viewer" | "editor" | "admin";
  permissions: CitationAccessControl;
}

/**
 * Check if user has permission to view citations
 * @param userId The user ID
 * @param projectId The project ID
 * @returns Boolean indicating if user can view citations
 */
export const canViewCitations = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/api/citations/access/${projectId}`);
    return response.permissions?.canView ?? false;
  } catch (error) {
    console.error("Error checking view citation permissions:", error);
    return false;
  }
};

/**
 * Check if user has permission to edit citations
 * @param userId The user ID
 * @param projectId The project ID
 * @returns Boolean indicating if user can edit citations
 */
export const canEditCitations = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/api/citations/access/${projectId}`);
    return response.permissions?.canEdit ?? false;
  } catch (error) {
    console.error("Error checking edit citation permissions:", error);
    return false;
  }
};

/**
 * Check if user has permission to delete citations
 * @param userId The user ID
 * @param projectId The project ID
 * @returns Boolean indicating if user can delete citations
 */
export const canDeleteCitations = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/api/citations/access/${projectId}`);
    return response.permissions?.canDelete ?? false;
  } catch (error) {
    console.error("Error checking delete citation permissions:", error);
    return false;
  }
};

/**
 * Check if user has permission to add citations
 * @param userId The user ID
 * @param projectId The project ID
 * @returns Boolean indicating if user can add citations
 */
export const canAddCitations = async (
  userId: string,
  projectId: string,
): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/api/citations/access/${projectId}`);
    return response.permissions?.canAdd ?? false;
  } catch (error) {
    console.error("Error checking add citation permissions:", error);
    return false;
  }
};

/**
 * Get user citation permissions for a specific project
 * @param userId The user ID
 * @param projectId The project ID
 * @returns User citation permissions object
 */
export const getUserCitationPermissions = async (
  userId: string,
  projectId: string,
): Promise<UserCitationPermissions> => {
  try {
    const response = await apiClient.get(`/api/citations/access/${projectId}`);

    return {
      userId,
      projectId,
      accessLevel: response.accessLevel || "viewer",
      permissions: {
        canView: response.permissions?.canView ?? false,
        canEdit: response.permissions?.canEdit ?? false,
        canDelete: response.permissions?.canDelete ?? false,
        canAdd: response.permissions?.canAdd ?? false,
      },
    };
  } catch (error) {
    console.error("Error fetching user citation permissions:", error);
    // Return default permissions in case of error
    return {
      userId,
      projectId,
      accessLevel: "viewer",
      permissions: {
        canView: false,
        canEdit: false,
        canDelete: false,
        canAdd: false,
      },
    };
  }
};

/**
 * Check if user has specific citation permission
 * @param userId The user ID
 * @param projectId The project ID
 * @param permission The specific permission to check
 * @returns Boolean indicating if user has the specified permission
 */
export const hasCitationPermission = async (
  userId: string,
  projectId: string,
  permission: keyof CitationAccessControl,
): Promise<boolean> => {
  const userPermissions = await getUserCitationPermissions(userId, projectId);
  return userPermissions.permissions[permission];
};

/**
 * Get current user's citation access information
 * @returns Promise resolving to user's citation access information
 */
export const getUserCitationAccess =
  async (): Promise<UserCitationPermissions> => {
    try {
      // Get the current project ID from the context or URL
      const pathParts = window.location.pathname.split("/");
      const projectIdIndex = pathParts.indexOf("projects");
      const projectId =
        projectIdIndex !== -1 && pathParts[projectIdIndex + 1]
          ? pathParts[projectIdIndex + 1]
          : null; // Don't default to a fake project ID

      // If no project ID is found in the URL, return default permissions
      if (!projectId) {
        return {
          userId: "unknown",
          projectId: "none",
          accessLevel: "viewer",
          permissions: {
            canView: true,
            canEdit: false,
            canDelete: false,
            canAdd: false,
          },
        };
      }

      // Call the backend API to get citation access for the current user and project
      const response = await apiClient.get(
        `/api/citations/access/${projectId}`,
      );

      // Return the access information from the API response
      if (response && response.access) {
        return response.access;
      }

      // Fallback: if API response doesn't contain expected format, construct from response
      return {
        userId: response.userId || "unknown",
        projectId: projectId,
        accessLevel: response.accessLevel || "viewer",
        permissions: {
          canView: response.canView !== undefined ? response.canView : true,
          canEdit: response.canEdit !== undefined ? response.canEdit : false,
          canDelete:
            response.canDelete !== undefined ? response.canDelete : false,
          canAdd: response.canAdd !== undefined ? response.canAdd : false,
        },
      };
    } catch (error: any) {
      console.error("Error fetching citation access:", error);

      // Check if the error is a 403 (Forbidden) due to project not found
      if (
        error.message &&
        (error.message.includes("403") ||
          error.message.includes("access denied") ||
          error.message.includes("Project not found"))
      ) {
        // For 403 errors, return default permissions with limited access
        const pathParts = window.location.pathname.split("/");
        const projectIdIndex = pathParts.indexOf("projects");
        const projectId =
          projectIdIndex !== -1 && pathParts[projectIdIndex + 1]
            ? pathParts[projectIdIndex + 1]
            : "none";

        return {
          userId: "unknown",
          projectId,
          accessLevel: "viewer",
          permissions: {
            canView: false, // Set to false since access was denied
            canEdit: false,
            canDelete: false,
            canAdd: false,
          },
        };
      }

      // For other errors, return default permissions
      const pathParts = window.location.pathname.split("/");
      const projectIdIndex = pathParts.indexOf("projects");
      const projectId =
        projectIdIndex !== -1 && pathParts[projectIdIndex + 1]
          ? pathParts[projectIdIndex + 1]
          : "none";

      return {
        userId: "unknown",
        projectId,
        accessLevel: "viewer",
        permissions: {
          canView: true,
          canEdit: false,
          canDelete: false,
          canAdd: false,
        },
      };
    }
  };

export default {
  canViewCitations,
  canEditCitations,
  canDeleteCitations,
  canAddCitations,
  getUserCitationPermissions,
  hasCitationPermission,
  getUserCitationAccess,
};
