FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

ENV NODE_ENV=development
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN mkdir -p /app/external/integration-konnns-extension/konnns-extension/.wxt && \
    echo '{"compilerOptions":{"target":"ESNext","module":"ESNext","moduleResolution":"Bundler","jsx":"react-jsx"}}' > /app/external/integration-konnns-extension/konnns-extension/.wxt/tsconfig.json && \
    node -e 'const fs=require("fs"); const p="/app/external/integration-konnns-extension/konnns-extension/tsconfig.json"; if(fs.existsSync(p)){ try { const j=JSON.parse(fs.readFileSync(p,"utf8")); delete j.extends; j.compilerOptions=Object.assign({target:"ESNext",module:"ESNext",moduleResolution:"Bundler",jsx:"react-jsx"},j.compilerOptions||{}); fs.writeFileSync(p,JSON.stringify(j,null,2)); } catch(e){} }'

RUN pnpm --filter konnns-web-wrapper run build

FROM nginx:alpine
COPY --from=builder /app/external/integration-konnns-extension/wrapper/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

