FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .
RUN pnpm build

FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --chmod=0755 docker-entrypoint.sh /docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3200
EXPOSE 3200

# Entrypoint sources the dashboard-init bootstrap credentials file
# (populated on first boot via the dashboard-init sidecar) and exports
# LOGTO_APP_ID / LOGTO_APP_SECRET into the environment before launching
# the Next.js standalone server. If the file is absent (e.g. dev mode
# where the user sets Logto env vars directly), the entrypoint falls
# through cleanly.
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
