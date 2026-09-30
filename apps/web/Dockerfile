FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS builder
ENV NODE_ENV=development
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NODE_ENV=production
RUN pnpm --filter web run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "exec", "next", "start", "-p", "3000"]
