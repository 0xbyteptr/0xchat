# Multi-stage build for Next.js production
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lock + package manifest first for efficient caching
COPY package.json pnpm-lock.yaml ./

# Install dev deps and build
COPY . .
RUN pnpm install --frozen-lockfile --production=false
RUN pnpm build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install runtime pnpm and only production deps
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --production

# Copy built assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/cdn_server.js ./cdn_server.js

EXPOSE 3000
ENV PORT=3000

CMD ["pnpm", "start"]
