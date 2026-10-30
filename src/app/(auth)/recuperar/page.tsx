import type { Metadata } from "next";
import { redirectIfSignedIn } from "../redirect-if-signed-in";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Recuperar senha — Mkt Control" };

export default async function ResetPage() {
  await redirectIfSignedIn();
  return <ResetForm />;
}
