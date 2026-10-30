import { CSRF_COOKIE, CSRF_HEADER } from "@/contracts/auth";
import { requestJson, type ApiResult } from "@/app/(auth)/auth-client";

export type { ApiResult };

function csrfToken() {
  const prefix = `${CSRF_COOKIE}=`;
  const pair = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return pair ? decodeURIComponent(pair.slice(prefix.length)) : "";
}

/**
 * Authenticated call from the panel: echoes the readable CSRF cookie in the header and sends JSON.
 * A 401 means the session ended, so the person goes back to the login instead of seeing a toast.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
) {
  const { body, headers, ...rest } = init;
  const result = await requestJson<T>(path, {
    ...rest,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      [CSRF_HEADER]: csrfToken(),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // A full load drops the router cache of the ended session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (!result.ok && result.status === 401) window.location.href = "/login";
  return result;
}
