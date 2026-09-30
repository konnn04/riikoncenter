FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

ENV NODE_ENV=development
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter konnns-web-wrapper run build

FROM nginx:alpine
COPY --from=builder /app/external/integration-konnns-extension/wrapper/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
