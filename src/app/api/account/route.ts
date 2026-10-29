import { NextResponse, type NextRequest } from "next/server";
import { accountResponseSchema } from "@/contracts/account";
import { getAccount } from "@/domains/users/service";
import { adminRoute } from "../_lib/admin";

export function GET(request: NextRequest) {
  return adminRoute(request, async (session) =>
    NextResponse.json(accountResponseSchema.parse(await getAccount(session))),
  );
}
