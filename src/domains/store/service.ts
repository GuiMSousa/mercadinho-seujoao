import "server-only";
import type { UpdateStore } from "@/contracts/store";
import { logActivity } from "@/domains/activity/service";
import { ServiceError } from "@/domains/auth/errors";
import { findStore, updateStoreRow } from "./repository";

export { storeExists as hasStore } from "./repository";

export const getStore = findStore;

export async function updateStore(
  actor: { id: string; name: string },
  input: UpdateStore,
) {
  const store = await updateStoreRow(input);
  if (!store) throw new ServiceError(404, "Loja não encontrada.");
  await logActivity({
    user: actor,
    action: "Dados da loja alterados",
    detail: store.name,
  });
  return store;
}
