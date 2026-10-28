type RateLimiterOptions = { limit: number; windowMs: number; maxKeys?: number };

/**
 * Sliding-window limiter: at most `limit` hits per key within `windowMs`.
 * shortcut: in-memory and per server process (resets on restart, not shared); move to PostgreSQL or Redis before running more than one instance.
 */
export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: RateLimiterOptions) {
  const hits = new Map<string, number[]>();
  return {
    hit(key: string, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
      if (recent.length >= limit) {
        const retryAfterSeconds = Math.ceil(
          (recent[0] + windowMs - now) / 1000,
        );
        return { allowed: false, retryAfterSeconds };
      }
      recent.push(now);
      // Re-insert so Map order tracks recency, then evict the stalest key to bound memory.
      hits.delete(key);
      hits.set(key, recent);
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value!);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

export const loginRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
});

/**
 * shortcut: the IP comes from headers. Cloudflare sets cf-connecting-ip; Next.js only fills
 * x-forwarded-for when the client did not send one, so a client reaching the server directly
 * can forge it. Bind the server to 127.0.0.1 behind the tunnel to make the key trustworthy.
 */
export function clientIp(headers: Headers) {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
