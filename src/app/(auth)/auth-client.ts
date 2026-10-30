import { useEffect, useRef, useState, type RefObject } from "react";

export type FormErrors = { error?: string; fields: Record<string, string> };

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; errors: FormErrors };

/** Fetches JSON and folds every failure (HTTP error, network error) into `{ error, fields }`. */
export async function requestJson<T = unknown>(
  url: string,
  init: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, init);
    const data = (await response.json().catch(() => null)) as unknown;
    if (response.ok)
      return { ok: true, status: response.status, data: data as T };
    const failure = data as {
      error?: string;
      fields?: Record<string, string>;
    } | null;
    return {
      ok: false,
      status: response.status,
      errors: {
        error: failure?.error ?? "Não foi possível concluir. Tente novamente.",
        fields: failure?.fields ?? {},
      },
    };
  } catch {
    return {
      ok: false,
      status: 0,
      errors: {
        error:
          "Sem conexão com o servidor. Verifique a internet e tente novamente.",
        fields: {},
      },
    };
  }
}

/** POSTs a JSON body. */
export const postJson = <T = unknown>(url: string, body: unknown) =>
  requestJson<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

/** After a failed submit, moves focus to the first invalid control, or to the alert. */
export function useFocusOnError(
  form: RefObject<HTMLFormElement | null>,
  errors: FormErrors | null,
) {
  useEffect(() => {
    if (!errors) return;
    const target =
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form.current?.querySelector<HTMLElement>('[role="alert"]');
    target?.focus();
  }, [form, errors]);
}

/**
 * Returns a ref for the step heading (give it tabIndex={-1}); focus moves there when `step` changes,
 * so keyboard and screen reader users land on the new step instead of a vanished control.
 * Call it before useFocusOnError so an error on the new step still wins the focus.
 */
export function useFocusOnStep(step: number) {
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef(step);
  useEffect(() => {
    if (shown.current === step) return; // first mount (and the dev double-effect): keep the page's focus
    shown.current = step;
    heading.current?.focus();
  }, [step]);
  return heading;
}

export const RESEND_SECONDS = 60;

/** Seconds left until a resend is allowed; `restart()` begins a new countdown. */
export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return { left, restart: () => setLeft(seconds) };
}
