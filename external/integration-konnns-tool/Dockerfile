FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
ENV NODE_ENV=development
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter konnn-tools run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3001
CMD ["pnpm", "--filter", "konnn-tools", "start", "-p", "3001"]
