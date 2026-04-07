FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy API package
COPY packages/api/package.json packages/api/tsconfig.json ./packages/api/
COPY packages/api/src ./packages/api/src

# Install and build
RUN pnpm install --frozen-lockfile --filter @autonomyx/api
RUN pnpm --filter @autonomyx/api build

# ── Production stage ──────────────────────────
FROM node:22-alpine

WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/packages/api/dist ./packages/api/dist

RUN pnpm install --frozen-lockfile --filter @autonomyx/api --prod

EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "packages/api/dist/index.js"]
