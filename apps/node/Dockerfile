FROM oven/bun:1.2.23-alpine AS runner

WORKDIR /app

COPY ./dist .

CMD ["bun", "sync.js"]

