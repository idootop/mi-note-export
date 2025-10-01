FROM node:22-alpine AS base

WORKDIR /app

FROM base AS builder

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@10.14.0

COPY . .

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile && pnpm run build

FROM base AS runner

COPY --from=builder /app/dist .

CMD node download.js

