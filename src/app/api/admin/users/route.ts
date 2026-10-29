import { NextResponse, type NextRequest } from "next/server";
import {
  inviteUserSchema,
  userRowSchema,
  usersListResponseSchema,
} from "@/contracts/users";
import { inviteUser, listUsers } from "@/domains/users/service";
import { adminBodyRoute, adminRoute } from "../../_lib/admin";

// ADMIN only: the shared access rule refuses CASHIER here as well as in the proxy.
export function GET(request: NextRequest) {
  return adminRoute(request, async () =>
    NextResponse.json(
      usersListResponseSchema.parse({ users: await listUsers() }),
    ),
  );
}

export function POST(request: NextRequest) {
  return adminBodyRoute(request, inviteUserSchema, async (input, session) =>
    NextResponse.json(
      userRowSchema.parse(await inviteUser(session.user, input)),
      { status: 201 },
    ),
  );
}
