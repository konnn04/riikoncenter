FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3309
CMD ["sh", "-c", "pnpm --filter api exec prisma db push && pnpm --filter api run start:prod"]
