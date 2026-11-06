import { NextResponse, type NextRequest } from "next/server";
import { accountResponseSchema } from "@/contracts/account";
import { getAccount } from "@/domains/users/service";
import { sessionRoute } from "../_lib/session-route";

export function GET(request: NextRequest) {
  return sessionRoute(request, async (session) =>
    NextResponse.json(accountResponseSchema.parse(await getAccount(session))),
  );
}
