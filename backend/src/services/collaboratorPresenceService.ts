import { prisma } from "../lib/prisma";

export class CollaboratorPresenceService {
  /**
   * Cleans up stale collaborator presence records older than the specified minutes.
   * @param minutes - The age threshold in minutes to consider a record stale.
   * @returns The number of deleted records.
   */
  static async cleanupStalePresence(minutes: number): Promise<number> {
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    const result = await prisma.collaboratorPresence.deleteMany({
      where: {
        last_active_at: {
          lt: threshold,
        },
      },
    });
    return result.count;
  }
}
