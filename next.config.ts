import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the production Docker image (see Dockerfile).
  output: "standalone",
  // The dev server blocks its JS chunks and HMR for other hostnames; without this the
  // LAN address (http://192.168.0.27:3000) never hydrates. Dev only; update if the IP changes.
  allowedDevOrigins: ["192.168.0.4", "192.168.0.27"],
  // same-origin: /recuperar?email=... must not leak through Referer to other sites.
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "same-origin" },
      ],
    },
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
