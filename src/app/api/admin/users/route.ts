import { NextResponse, type NextRequest } from "next/server";
import { usersListResponseSchema } from "@/contracts/auth";
import { listUsers } from "@/domains/auth/service";
import { errorResponse, guard } from "../../_lib/guard";

// ADMIN only: the shared access rule refuses CASHIER here as well as in the proxy.
export async function GET(request: NextRequest) {
  const { denial } = await guard(request);
  if (denial) return errorResponse(denial);
  return NextResponse.json(
    usersListResponseSchema.parse({ users: await listUsers() }),
  );
}
