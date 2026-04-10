# ── Claude Agent — REST API wrapper around Claude Code CLI ─────
# Runs in the monorepo build context.

FROM node:22-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── deps + build stage ──
FROM base AS builder
# Install native-build tools once for better-sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json .npmrc ./
COPY packages/claude-agent ./packages/claude-agent
RUN pnpm install --filter @autonomyx/claude-agent... --frozen-lockfile
RUN pnpm --filter @autonomyx/claude-agent build

# Create a flat deployable dir with all production deps resolved.
# --legacy is required in pnpm v10+ when not using inject-workspace-packages.
RUN pnpm --filter @autonomyx/claude-agent --prod --legacy deploy /deploy

# ── runtime stage ──
FROM node:22-slim AS runner
WORKDIR /app

# Install git (for cloning OSS repos) + curl for healthchecks
RUN apt-get update && \
    apt-get install -y --no-install-recommends git curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Copy the flat deployable — /deploy/{package.json, dist, node_modules}
COPY --from=builder /deploy ./

# Data dir for SQLite job store + saas-apps mount
RUN mkdir -p /data /saas-apps
VOLUME ["/data", "/saas-apps"]

ENV PORT=3100
ENV JOBS_DB_PATH=/data/jobs.db
ENV SAAS_OUTPUT_DIR=/saas-apps
EXPOSE 3100

CMD ["node", "dist/index.js"]
