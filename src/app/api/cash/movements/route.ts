import { NextResponse, type NextRequest } from "next/server";
import { cashMovementRowSchema, cashMovementSchema } from "@/contracts/cash";
import { recordCashMovement } from "@/domains/cash/service";
import { adminBodyRoute } from "../../_lib/admin";

// Open to any session: sangria and suprimento are counter operations.
export function POST(request: NextRequest) {
  return adminBodyRoute(request, cashMovementSchema, async (input, session) =>
    NextResponse.json(
      cashMovementRowSchema.parse(
        await recordCashMovement(session.user, input),
      ),
      { status: 201 },
    ),
  );
}
