# ==============================================================================
# Multi-stage Dockerfile untuk Aplikasi Yayasan Nurjaman Bongas Purwakarta
# Mendukung multi-platform: linux/amd64 dan linux/arm64
# Sesuai standar keamanan: user non-root (nextjs:nodejs UID 1001), fail-fast
# ==============================================================================

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 1: Dependencies
# ------------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 2: Development (Hot Reloading)
# ------------------------------------------------------------------------------
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# ------------------------------------------------------------------------------
# Stage 3: Builder
# ------------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build_dummy:build_dummy@localhost:5432/build_dummy?schema=public"
RUN pnpm prisma generate || true
RUN pnpm build

# ------------------------------------------------------------------------------
# Stage 4: Migrator (Layanan Sekali Jalan prisma migrate deploy)
# ------------------------------------------------------------------------------
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY package.json ./
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]

# ------------------------------------------------------------------------------
# Stage 5: Runner (Produksi Next.js Standalone)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# User non-root demi keamanan (UID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Salin aset publik dan output standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
