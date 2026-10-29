import "server-only";
import { getMailFrom, getResendApiKey } from "@/lib/env";
import { logger } from "@/lib/logger";

export type MailMessage = { to: string; subject: string; text: string };
export type Mailer = { send(message: MailMessage): Promise<void> };

export function getMailer(): Mailer {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    // Dev only: the text carries the verification code on purpose.
    return {
      async send({ to, subject, text }) {
        logger.info({ to, subject, text }, "mail (dev)");
      },
    };
  }
  const from = getMailFrom();
  return {
    async send({ to, subject, text }) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, text }),
      });
      // Never include the response body: it can echo the recipient or provider details.
      if (!response.ok)
        throw new Error(`mail delivery failed: ${response.status}`);
    },
  };
}
