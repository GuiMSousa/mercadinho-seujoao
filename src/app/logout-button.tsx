"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CSRF_COOKIE, CSRF_HEADER } from "@/contracts/auth";
import { Button } from "@ds/components/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const csrf =
      document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${CSRF_COOKIE}=`))
        ?.slice(CSRF_COOKIE.length + 1) ?? "";
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { [CSRF_HEADER]: csrf },
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Button variant="secondary" loading={pending} onClick={() => void logout()}>
      Sair
    </Button>
  );
}
