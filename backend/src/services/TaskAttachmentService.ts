import { prisma } from "../lib/prisma";
import { SupabaseStorageService } from "./supabaseStorageService";
import { getSupabaseAdminClient } from "../lib/supabase/client";
import logger from "../monitoring/logger";

export class TaskAttachmentService {
  /**
   * Upload an attachment for a task
   */
  static async uploadAttachment(
    taskId: string,
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ) {
    try {
      // 1. Upload to Supabase Storage
      const { url, fileSize, filePath } =
        await SupabaseStorageService.uploadFile(
          fileBuffer,
          fileName,
          mimeType,
          userId,
        );

      // 2. Save metadata to database
      const attachment = await prisma.taskAttachment.create({
        data: {
          task_id: taskId,
          name: fileName,
          file_url: url,
          file_type: mimeType,
          file_size: fileSize,
        },
      });

      logger.info(`Attachment uploaded for task ${taskId}`, {
        attachmentId: attachment.id,
        fileName,
      });

      return attachment;
    } catch (error) {
      logger.error(`Error uploading attachment for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an attachment
   */
  static async deleteAttachment(attachmentId: string) {
    try {
      // 1. Get attachment metadata
      const attachment = await prisma.taskAttachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        throw new Error("Attachment not found");
      }

      // 2. Extract relative path from URL to delete from storage
      // Supabase public URLs are usually: .../storage/v1/object/public/uploads/path/to/file
      // SupabaseStorageService uses the uniqueFileName as path
      // We need to parse back the unique path from the URL if we didn't store the path
      // Actually SupabaseStorageService returns 'filePath' which we should have stored
      // But my schema only has file_url. Let's fix that or parse it.

      const url = new URL(attachment.file_url);
      const urlParts = url.pathname.split("/");
      // The path usually starts after 'uploads/' in the public URL
      const uploadsIndex = urlParts.indexOf("uploads");
      const filePath = urlParts.slice(uploadsIndex + 1).join("/");

      // 3. Delete from Supabase Storage
      await SupabaseStorageService.deleteFile(filePath);

      // 4. Delete from database
      await prisma.taskAttachment.delete({
        where: { id: attachmentId },
      });

      logger.info(`Attachment ${attachmentId} deleted successfully`);
      return true;
    } catch (error) {
      logger.error(`Error deleting attachment ${attachmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get an attachment by ID
   */
  static async getAttachmentById(id: string) {
    try {
      return await prisma.taskAttachment.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error(`Error fetching attachment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Download an attachment from storage
   */
  static async downloadAttachment(attachmentId: string) {
    try {
      const attachment = await this.getAttachmentById(attachmentId);
      if (!attachment) throw new Error("Attachment not found");

      const url = new URL(attachment.file_url);
      const urlParts = url.pathname.split("/");
      const uploadsIndex = urlParts.indexOf("uploads");
      const filePath = urlParts.slice(uploadsIndex + 1).join("/");

      const client = await getSupabaseAdminClient();
      if (!client) throw new Error("Storage client not available");

      const { data, error } = await client.storage
        .from("uploads")
        .download(filePath);

      if (error) throw error;

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        data: buffer,
        mimeType: attachment.file_type,
      };
    } catch (error) {
      logger.error(`Error downloading attachment ${attachmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get all attachments for a task
   */
  static async getTaskAttachments(taskId: string) {
    try {
      return await prisma.taskAttachment.findMany({
        where: { task_id: taskId },
        orderBy: { created_at: "desc" },
      });
    } catch (error) {
      logger.error(`Error fetching attachments for task ${taskId}:`, error);
      throw error;
    }
  }
}
