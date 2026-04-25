import { apiClient } from "./apiClient";

export interface Note {
  id: string;
  category: string;
  title: string;
  content: string;
  preview_image?: string;
  tags?: string[];
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNoteData {
  userId: string;
  projectId: string;
  category: string;
  title: string;
  content: string;
  previewImage?: string;
  tags?: string[];
  metadata?: any;
}

export class NoteService {
  /**
   * Get all notes for a project, optionally filtered by category
   */
  static async getNotes(projectId: string, category?: string): Promise<Note[]> {
    const url = `/api/research/notes?projectId=${projectId}${category ? `&category=${category}` : ""}`;
    const response = await apiClient.get(url);
    return response.notes;
  }

  /**
   * Create a new note
   */
  static async createNote(data: CreateNoteData): Promise<Note> {
    const response = await apiClient.post("/api/research/notes", data);
    return response.note;
  }

  /**
   * Update an existing note
   */
  static async updateNote(
    id: string,
    data: Partial<Pick<Note, "title" | "content" | "tags" | "metadata">>,
  ): Promise<Note> {
    const response = await apiClient.put(`/api/research/notes/${id}`, data);
    return response.note;
  }

  /**
   * Delete a note
   */
  static async deleteNote(id: string): Promise<void> {
    await apiClient.delete(`/api/research/notes/${id}`, undefined);
  }
}
