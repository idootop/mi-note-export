FROM node:22-alpine AS builder

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@10.14.0

COPY . .

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile && pnpm run build

FROM oven/bun:1.2.23-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist .

CMD bun download.js

