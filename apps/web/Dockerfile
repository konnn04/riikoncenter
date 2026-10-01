FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.26.0 --activate

FROM base AS builder
ENV NODE_ENV=development
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc .pnpmfile.cjs ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch --store-dir /pnpm/store
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --offline --frozen-lockfile --store-dir /pnpm/store
RUN pnpm --filter simple-customize-markdown-converter run build || true

# Build the konnns-extension wrapper as static files and serve them from web's public/ (iframe -> /konnns-extension/index.html)
RUN mkdir -p /app/external/integration-konnns-extension/konnns-extension/.wxt &&     echo '{"compilerOptions":{"target":"ESNext","module":"ESNext","moduleResolution":"Bundler","jsx":"react-jsx"}}' > /app/external/integration-konnns-extension/konnns-extension/.wxt/tsconfig.json &&     node -e 'const fs=require("fs"); const p="/app/external/integration-konnns-extension/konnns-extension/tsconfig.json"; if(fs.existsSync(p)){ try { const j=JSON.parse(fs.readFileSync(p,"utf8")); delete j.extends; j.compilerOptions=Object.assign({target:"ESNext",module:"ESNext",moduleResolution:"Bundler",jsx:"react-jsx"},j.compilerOptions||{}); fs.writeFileSync(p,JSON.stringify(j,null,2)); } catch(e){} }'
RUN pnpm --filter konnns-web-wrapper run build &&     mkdir -p apps/web/public/konnns-extension &&     cp -r external/integration-konnns-extension/wrapper/dist/. apps/web/public/konnns-extension/

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GAME_PROXY_URL
ENV NEXT_PUBLIC_GAME_PROXY_URL=$NEXT_PUBLIC_GAME_PROXY_URL
ARG NEXT_PUBLIC_KONNNS_EXTENSION_TOOLS_URL=https://tools.konnn04.dev/
ENV NEXT_PUBLIC_KONNNS_EXTENSION_TOOLS_URL=$NEXT_PUBLIC_KONNNS_EXTENSION_TOOLS_URL
ENV NEXT_PUBLIC_KONNNS_EXTENSION_URL=/konnns-extension/index.html

ENV NODE_ENV=production
RUN pnpm --filter web run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "exec", "next", "start", "-p", "3000"]
