import type { Metadata } from "next";
import { redirectIfSignedIn } from "../redirect-if-signed-in";
import { resetStart } from "./reset-start";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Recuperar senha — Mkt Control" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string | string[];
    etapa?: string | string[];
  }>;
}) {
  await redirectIfSignedIn();
  const start = resetStart(await searchParams);
  return <ResetForm initialEmail={start.email} initialStep={start.step} />;
}
