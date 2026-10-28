# syntax=docker/dockerfile:1
# Production image: Next.js standalone output on Node.js 24 (same major as .nvmrc and CI).
# No secrets at build time; DATABASE_URL and LOG_LEVEL are provided when the container runs.

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
# Unprivileged user shipped with the official Node.js image.
USER node
EXPOSE 3000
CMD ["node", "server.js"]
