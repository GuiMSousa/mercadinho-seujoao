import type { Metadata } from "next";
import { hasStore } from "@/domains/store/service";
import { redirectIfSignedIn } from "../redirect-if-signed-in";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar — Mkt Control" };

export default async function LoginPage() {
  await redirectIfSignedIn();
  return (
    <LoginForm
      canSignup={!(await hasStore())}
      showDemo={process.env.NODE_ENV === "development"}
    />
  );
}
