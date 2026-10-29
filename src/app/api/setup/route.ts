import { NextResponse, type NextRequest } from "next/server";
import { setupResponseSchema } from "@/contracts/auth";
import { hasStore } from "@/domains/store/service";
import { errorResponse, guard } from "../_lib/guard";

// Public: the login and signup screens use it to know whether "Criar conta da loja" is offered.
export async function GET(request: NextRequest) {
  const { denial } = await guard(request);
  if (denial) return errorResponse(denial);
  return NextResponse.json(
    setupResponseSchema.parse({ hasStore: await hasStore() }),
  );
}
