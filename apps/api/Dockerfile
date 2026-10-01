FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.26.0 --activate

FROM base AS builder
ENV NODE_ENV=development
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc .pnpmfile.cjs ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch --store-dir /pnpm/store
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --offline --frozen-lockfile --store-dir /pnpm/store
RUN pnpm --filter api exec prisma generate
ENV NODE_ENV=production
RUN pnpm --filter api run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3309
CMD ["sh", "-c", "pnpm --filter api exec prisma db push && pnpm --filter api run start:prod"]
