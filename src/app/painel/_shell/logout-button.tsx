"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconButton } from "@ds/components/button";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";

export function LogoutButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const result = await apiFetch("/api/auth/logout", { method: "POST" });
    // 401: the session was already gone, which is what logging out wanted.
    if (!result.ok && result.status !== 401) {
      setPending(false);
      return toast({
        title: "Não foi possível sair",
        message: result.errors.error,
        tone: "danger",
      });
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <IconButton
      variant="ghost"
      size="sm"
      icon={LogOut}
      label="Sair"
      disabled={pending}
      focusableWhenDisabled
      onClick={() => void logout()}
    />
  );
}
