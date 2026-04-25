import {
  getSupabaseClient,
  getSupabaseAdminClient,
} from "../lib/supabase/client";
import logger from "../monitoring/logger";

// Define metadata interface for stored files
interface FileMetadata {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  projectId?: string;
  tags?: string[];
  description?: string;
  createdAt: string | Date;
}

export class SupabaseStorageService {
  // Upload file to Supabase Storage with metadata support
  static async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    userId: string,
    metadata?: Partial<FileMetadata>
  ): Promise<{ url: string; fileSize: number; filePath: string }> {
    try {
      // Ensure supabaseAdmin is available for storage operations
      const client = await getSupabaseAdminClient();

      if (!client) {
        throw new Error("Supabase admin client not initialized");
      }

      if (!client) {
        throw new Error("Supabase admin client not initialized");
      }

      // Create a unique file name to prevent conflicts
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const uniqueFileName = `${userId}/${timestamp}-${randomString}-${fileName}`;

      // Upload file to Supabase Storage bucket
      // Assuming we're using a bucket named 'uploads' - this should be configured in your Supabase project
      const { data, error } = await client.storage
        .from("uploads")
        .upload(uniqueFileName, fileBuffer, {
          contentType: mimeType,
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        logger.error("Error uploading file to Supabase Storage:", error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = client.storage
        .from("uploads")
        .getPublicUrl(uniqueFileName);

      const fileSize = fileBuffer.length;

      logger.info("File uploaded successfully to Supabase Storage", {
        fileName: uniqueFileName,
        fileSize,
        url: urlData.publicUrl,
        metadata,
      });

      return {
        url: urlData.publicUrl,
        fileSize,
        filePath: uniqueFileName,
      };
    } catch (error) {
      logger.error("Error in uploadFile:", error);
      throw error;
    }
  }

  // Delete file from Supabase Storage
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Ensure supabaseAdmin is available for storage operations
      const client = await getSupabaseAdminClient();

      if (!client) {
        throw new Error("Supabase admin client not initialized");
      }

      // Delete file from Supabase Storage bucket
      const { error } = await client.storage.from("uploads").remove([filePath]);

      if (error) {
        logger.error("Error deleting file from Supabase Storage:", error);
        return false;
      }

      logger.info("File deleted successfully from Supabase Storage", {
        filePath,
      });

      return true;
    } catch (error) {
      logger.error("Error in deleteFile:", error);
      return false;
    }
  }

  // Get file URL from Supabase Storage
  static async getFileUrl(filePath: string): Promise<string> {
    try {
      // Ensure supabaseAdmin is available for storage operations
      const client = await getSupabaseAdminClient();

      if (!client) {
        throw new Error("Supabase admin client not initialized");
      }

      // Get the public URL for the file
      const { data } = client.storage.from("uploads").getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      logger.error("Error in getFileUrl:", error);
      throw error;
    }
  }

  // List files in a user's directory
  static async listUserFiles(userId: string): Promise<any[]> {
    try {
      // Ensure supabaseAdmin is available for storage operations
      const client = await getSupabaseAdminClient();

      if (!client) {
        throw new Error("Supabase admin client not initialized");
      }

      // List files in the user's directory
      const { data, error } = await client.storage
        .from("uploads")
        .list(userId, {
          limit: 1000, // Increase limit to get all files
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) {
        logger.error("Error listing files in Supabase Storage:", error);
        throw new Error(`Failed to list files: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Error in listUserFiles:", error);
      throw error;
    }
  }

  // Get file info including metadata
  static async getFileInfo(filePath: string): Promise<any> {
    try {
      // Ensure supabaseAdmin is available for storage operations
      const client = await getSupabaseAdminClient();

      if (!client) {
        throw new Error("Supabase admin client not initialized");
      }

      // Get file info
      const { data, error } = await client.storage
        .from("uploads")
        .list(undefined, {
          limit: 1,
          offset: 0,
          search: filePath,
        });

      if (error) {
        logger.error("Error getting file info from Supabase Storage:", error);
        throw new Error(`Failed to get file info: ${error.message}`);
      }

      return data?.[0] || null;
    } catch (error) {
      logger.error("Error in getFileInfo:", error);
      throw error;
    }
  }

  // Calculate total storage used by a user
  static async calculateUserStorageUsage(userId: string): Promise<number> {
    try {
      // Ensure supabaseAdmin is available for storage operations
      const client = await getSupabaseAdminClient();

      if (!client) {
        throw new Error("Supabase admin client not initialized");
      }

      // List all files for the user
      const files = await this.listUserFiles(userId);

      // Calculate total size in bytes
      let totalSize = 0;
      for (const file of files) {
        // The file object should contain a 'metadata' field with size information
        // If not available, we can't accurately calculate storage usage
        if (file.metadata && file.metadata.size) {
          totalSize += file.metadata.size;
        }
      }

      // Convert bytes to GB
      return totalSize / (1024 * 1024 * 1024);
    } catch (error) {
      logger.error("Error calculating user storage usage:", error);
      // Return 0 if we can't calculate storage usage
      return 0;
    }
  }

  // Get detailed storage breakdown for a user
  static async getStorageBreakdown(userId: string): Promise<{
    totalSize: number;
    fileCount: number;
    files: Array<{ name: string; size: number; createdAt: Date }>;
  }> {
    try {
      // Ensure supabaseAdmin is available for storage operations
      const client = await getSupabaseAdminClient();

      if (!client) {
        throw new Error("Supabase admin client not initialized");
      }

      // List all files for the user
      const files = await this.listUserFiles(userId);

      // Process files to extract size information
      const fileDetails = files.map((file: any) => ({
        name: file.name,
        size: file.metadata?.size || 0,
        createdAt: file.created_at ? new Date(file.created_at) : new Date(),
      }));

      // Calculate total size in bytes
      const totalSize = fileDetails.reduce(
        (sum: number, file: any) => sum + file.size,
        0
      );

      // Convert total size to GB
      const totalSizeGB = totalSize / (1024 * 1024 * 1024);

      return {
        totalSize: totalSizeGB,
        fileCount: files.length,
        files: fileDetails,
      };
    } catch (error) {
      logger.error("Error getting storage breakdown:", error);
      return {
        totalSize: 0,
        fileCount: 0,
        files: [],
      };
    }
  }
}
