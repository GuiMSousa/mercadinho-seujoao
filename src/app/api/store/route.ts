import { NextResponse, type NextRequest } from "next/server";
import { storeResponseSchema, updateStoreSchema } from "@/contracts/store";
import { ServiceError } from "@/domains/auth/errors";
import { getStore, updateStore } from "@/domains/store/service";
import { sessionBodyRoute, sessionRoute } from "../_lib/session-route";

export function GET(request: NextRequest) {
  return sessionRoute(request, async () => {
    const store = await getStore();
    if (!store) throw new ServiceError(404, "Loja não encontrada.");
    return NextResponse.json(storeResponseSchema.parse(store));
  });
}

export function PATCH(request: NextRequest) {
  return sessionBodyRoute(request, updateStoreSchema, async (input, session) =>
    NextResponse.json(
      storeResponseSchema.parse(await updateStore(session.user, input)),
    ),
  );
}
