import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const info = vi.hoisted(() => vi.fn());
vi.mock("@/lib/logger", () => ({ logger: { info } }));

import { getMailer } from "./index";
import { inviteMail, resetCodeMail, signupCodeMail } from "./templates";

const message = {
  to: "ana@example.com",
  subject: "Assunto",
  text: "Corpo 123456",
};

afterEach(() => vi.unstubAllEnvs());

describe("getMailer with a Resend key", () => {
  it("POSTs the message to Resend with bearer auth and the configured sender", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("MAIL_FROM", "Mkt <no-reply@example.com>");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await getMailer().send(message);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer re_test_key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      from: "Mkt <no-reply@example.com>",
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  });

  it("rejects on a non-2xx status without leaking the response body", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("secret-provider-detail", { status: 500 }),
    );

    const failure = getMailer().send(message);
    await expect(failure).rejects.toThrow("mail delivery failed: 500");
    await expect(failure).rejects.not.toThrow("secret-provider-detail");
  });
});

describe("getMailer without a Resend key", () => {
  it("logs the message outside production instead of sending", async () => {
    vi.stubEnv("RESEND_API_KEY", undefined);
    vi.stubEnv("NODE_ENV", "development");
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await getMailer().send(message);

    expect(info).toHaveBeenCalledWith(message, "mail (dev)");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a configuration error in production", () => {
    vi.stubEnv("RESEND_API_KEY", undefined);
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getMailer()).toThrow("RESEND_API_KEY");
  });
});

describe("mail templates", () => {
  it("includes the code in the signup and reset mails", () => {
    expect(signupCodeMail("123456")).toMatchObject({
      subject: "Seu código do Mkt Control",
    });
    expect(signupCodeMail("123456").text).toContain("123456");
    expect(signupCodeMail("123456").text).toContain("10 minutos");
    expect(resetCodeMail("654321")).toMatchObject({
      subject: "Redefinição de senha do Mkt Control",
    });
    expect(resetCodeMail("654321").text).toContain("654321");
    expect(resetCodeMail("654321").text).toContain("10 minutos");
  });

  it("explains the invite flow with the recovery page, e-mail and code", () => {
    const mail = inviteMail({
      name: "Ana",
      storeName: "Loja Centro",
      code: "111222",
    });
    expect(mail.subject).toBe("Você foi convidado para o Mkt Control");
    expect(mail.text).toContain("Ana");
    expect(mail.text).toContain("Loja Centro");
    expect(mail.text).toContain("111222");
    expect(mail.text).toContain("/recuperar");
    expect(mail.text).toContain("48 horas");
  });
});
