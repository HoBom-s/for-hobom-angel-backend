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
# Angel outbox gRPC proto (vendored under proto/angel, source of truth is the
# hobom BSR module). buildGrpcOptions() loads it at boot to bind the outbox
# relay service consumed by hobom-event-processor.
COPY --from=builder /app/proto ./proto

EXPOSE 8080
# gRPC (outbox relay) listens on 50051; HTTP on 8080.
EXPOSE 50051
CMD ["node", "dist/main.js"]
