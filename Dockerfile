# --- builder ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
# Drop the husky `prepare` hook before the production install: husky is a
# devDependency and is absent under --omit=dev, so running it would fail.
RUN npm pkg delete scripts.prepare && npm ci --omit=dev

COPY --from=builder /app/dist ./dist
# NOTE: proto/ is intentionally not copied yet — the Angel outbox gRPC service
# is not wired until the proto lands in hobom-buf-proto. When it does: run
# `npm run proto:pull` in CI and re-add `COPY --from=builder /app/proto ./proto`.

EXPOSE 8080
CMD ["node", "dist/main.js"]
