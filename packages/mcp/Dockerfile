FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/mcp/package.json packages/mcp/tsconfig.json ./packages/mcp/
COPY packages/mcp/src ./packages/mcp/src

RUN pnpm install --frozen-lockfile --filter @autonomyx/mcp-fast-saas
RUN pnpm --filter @autonomyx/mcp-fast-saas build

# ── Runtime ───────────────────────────────────
FROM node:22-alpine

WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/mcp/package.json ./packages/mcp/
COPY --from=builder /app/packages/mcp/dist ./packages/mcp/dist

RUN pnpm install --frozen-lockfile --filter @autonomyx/mcp-fast-saas --prod

# The MCP server is stdio-only. Run it with:
#   docker run -i --rm autonomyx/fast-saas-mcp:latest
# or via docker exec from a client that speaks MCP over stdio.
ENV NODE_ENV=production
CMD ["node", "packages/mcp/dist/index.js"]
