import { NextResponse, type NextRequest } from "next/server";
import {
  inviteUserSchema,
  userRowSchema,
  usersListResponseSchema,
} from "@/contracts/users";
import { inviteUser, listUsers } from "@/domains/users/service";
import { sessionBodyRoute, sessionRoute } from "../../_lib/session-route";

// ADMIN only: the shared access rule refuses CASHIER here as well as in the proxy.
export function GET(request: NextRequest) {
  return sessionRoute(request, async () =>
    NextResponse.json(
      usersListResponseSchema.parse({ users: await listUsers() }),
    ),
  );
}

export function POST(request: NextRequest) {
  return sessionBodyRoute(request, inviteUserSchema, async (input, session) =>
    NextResponse.json(
      userRowSchema.parse(await inviteUser(session.user, input)),
      { status: 201 },
    ),
  );
}
