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
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
# proto/ is pulled via `npm run proto:pull` in CI and copied here once the
# Angel outbox proto lands in hobom-buf-proto.
COPY --from=builder /app/proto ./proto

EXPOSE 8080
CMD ["node", "dist/main.js"]
