# syntax=docker/dockerfile:1
# Production image: Next.js standalone output on Node.js 24 (same major as .nvmrc and CI).
# No secrets at build time; DATABASE_URL, RESEND_API_KEY and MAIL_FROM (the last two required in
# production) and optionally LOG_LEVEL are provided when the container runs.

FROM node:24-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# public/ may be empty and therefore absent from Git; the runner copies it unconditionally.
RUN mkdir -p public && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# Migrations run at start (scripts/migrate.mjs). The standalone trace keeps only the drizzle-orm
# files the server imports, so the whole package (no dependencies of its own) comes from deps.
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --from=build --chown=node:node /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=deps --chown=node:node /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
# Unprivileged user shipped with the official Node.js image.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
# A failed migration stops the container before it serves anything.
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node server.js"]
