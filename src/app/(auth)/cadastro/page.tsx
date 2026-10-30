import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasStore } from "@/domains/store/service";
import { redirectIfSignedIn } from "../redirect-if-signed-in";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar conta — Mkt Control" };

export default async function SignupPage() {
  await redirectIfSignedIn();
  // Single-store product: once the store exists, new people join by invitation only.
  if (await hasStore()) redirect("/login");
  return <SignupForm />;
}
