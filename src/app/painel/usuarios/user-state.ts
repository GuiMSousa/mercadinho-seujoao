import type { UserRow } from "@/contracts/users";

type Editable = { name: string; role: string; active: boolean };

/** Only the fields the person changed; the server then ignores what stays as it was. */
export function userPatch(user: UserRow, next: Editable) {
  const patch: Partial<Editable> = {};
  const name = next.name.trim();
  if (name !== user.name) patch.name = name;
  if (next.role !== user.role) patch.role = next.role;
  if (next.active !== user.active) patch.active = next.active;
  return patch;
}

/** A deactivated user is shown as such even while the invite is still pending. */
export function accessStatus(user: Pick<UserRow, "active" | "pending">) {
  return !user.active ? "inactive" : user.pending ? "pending" : "active";
}
