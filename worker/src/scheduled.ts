/**
 * Scheduled Cron Handler for DocShowcase Cloudflare Worker
 * Automatically cleans up expired documents from Firestore
 */

import { deleteDocument, findExpiredDocuments } from "./firestore";
import type { Env, ExecutionContext, ScheduledEvent } from "./types";

export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  try {
    const expiredDocIds = await findExpiredDocuments(env);
    if (expiredDocIds.length === 0) {
      return;
    }

    // Delete in parallel batches
    const deletePromises = expiredDocIds.map((id) =>
      deleteDocument(env, id).catch((err) => {
        // Log generic non-sensitive error
        console.error(`Failed to delete expired document ${id}:`, err);
      })
    );

    await Promise.all(deletePromises);
  } catch (err) {
    console.error("Scheduled cleanup error:", err);
  }
}
