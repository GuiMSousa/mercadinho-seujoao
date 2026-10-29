import "server-only";
import type { ActivityAction, ActivityPage } from "@/contracts/activity";
import { logger } from "@/lib/logger";
import { insertActivity, selectActivityPage } from "./repository";

export class InvalidCursorError extends Error {
  constructor() {
    super("Invalid activity cursor");
  }
}

/** Records an action. Never throws: a failed log must not undo the action it describes. */
export async function logActivity(input: {
  user: { id: string; name: string } | null;
  action: ActivityAction;
  detail?: string;
}): Promise<void> {
  try {
    await insertActivity({
      userId: input.user?.id ?? null,
      userName: input.user?.name ?? "Sistema",
      action: input.action,
      detail: input.detail ?? "",
    });
  } catch (error) {
    logger.error(
      { err: error, action: input.action },
      "Failed to write activity log",
    );
  }
}

const encodeCursor = (at: Date, id: string) =>
  Buffer.from(`${at.toISOString()}|${id}`).toString("base64url");

function decodeCursor(cursor: string) {
  const [iso, id, ...rest] = Buffer.from(cursor, "base64url")
    .toString()
    .split("|");
  const at = new Date(iso ?? "");
  if (rest.length || !id || Number.isNaN(at.getTime()))
    throw new InvalidCursorError();
  return { at, id };
}

export async function listActivity({
  cursor,
  limit,
}: {
  cursor?: string;
  limit: number;
}): Promise<ActivityPage> {
  // One extra row tells whether another page exists.
  const rows = await selectActivityPage(
    cursor ? decodeCursor(cursor) : undefined,
    limit + 1,
  );
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    items: page.map((row) => ({
      id: row.id,
      at: row.createdAt.toISOString(),
      userName: row.userName,
      action: row.action,
      detail: row.detail,
    })),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor(last.createdAt, last.id)
        : null,
  };
}
