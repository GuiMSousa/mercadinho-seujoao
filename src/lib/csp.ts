/**
 * The pages' Content-Security-Policy: scripts only from this server and only with this response's
 * nonce, which Next.js reads from the request header and puts on its own scripts.
 */
export function contentSecurityPolicy(nonce: string, dev: boolean) {
  return [
    "default-src 'self'",
    // React's development build needs eval for its error overlays; production never does.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // React renders style attributes into the HTML, and a nonce cannot cover attributes.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // No upgrade-insecure-requests: the store's LAN uses plain HTTP, and it would break it.
  ].join("; ");
}

/** A fresh nonce per response: 128 random bits, base64. */
export const newNonce = () =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
