import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the production Docker image (see Dockerfile).
  output: "standalone",
  // The dev server blocks its JS chunks and HMR for other hostnames; without this the
  // LAN address (http://192.168.0.27:3000) never hydrates. Dev only; update if the IP changes.
  allowedDevOrigins: ["192.168.0.27"],
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
