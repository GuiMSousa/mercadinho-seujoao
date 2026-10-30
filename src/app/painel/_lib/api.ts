import { CSRF_COOKIE, CSRF_HEADER } from "@/contracts/auth";
import { requestJson, type ApiResult } from "@/app/(auth)/auth-client";

export type { ApiResult };

function csrfToken() {
  const prefix = `${CSRF_COOKIE}=`;
  const pair = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return pair ? decodeURIComponent(pair.slice(prefix.length)) : "";
}

/** Authenticated call from the panel: echoes the readable CSRF cookie in the header and sends JSON. */
export function apiFetch<T = unknown>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
) {
  const { body, headers, ...rest } = init;
  return requestJson<T>(path, {
    ...rest,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      [CSRF_HEADER]: csrfToken(),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
