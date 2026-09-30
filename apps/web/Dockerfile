FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter web run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "exec", "next", "start", "-p", "3000"]
