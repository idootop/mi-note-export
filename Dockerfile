FROM node:22-alpine AS builder

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@10.14.0

WORKDIR /app

COPY ./apps .

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    cd web && pnpm install --frozen-lockfile && pnpm run build

FROM lipanski/docker-static-website:latest AS runner

COPY --from=builder /app/web/dist .

EXPOSE 3000

CMD ["/busybox-httpd", "-f", "-v", "-p", "3000"]

