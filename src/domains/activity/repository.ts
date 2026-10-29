import "server-only";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { getDb } from "@/infrastructure/db";
import { activityLog } from "@/infrastructure/db/schema";

export function insertActivity(values: {
  userId: string | null;
  userName: string;
  action: string;
  detail: string;
}) {
  // Millisecond precision (unlike now()) so a cursor built from an ISO date compares exactly.
  return getDb()
    .insert(activityLog)
    .values({ ...values, createdAt: new Date() });
}

/** Rows strictly older than `after` (createdAt, then id, descending); `limit` rows at most. */
export function selectActivityPage(
  after: { at: Date; id: string } | undefined,
  limit: number,
) {
  return getDb()
    .select()
    .from(activityLog)
    .where(
      after &&
        or(
          lt(activityLog.createdAt, after.at),
          and(
            eq(activityLog.createdAt, after.at),
            lt(activityLog.id, after.id),
          ),
        ),
    )
    .orderBy(desc(activityLog.createdAt), desc(activityLog.id))
    .limit(limit);
}
