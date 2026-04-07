FROM node:22-slim

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy server files
COPY package.json ./
RUN npm install --production

COPY src/ ./src/

# Create workspace directory for agent jobs
RUN mkdir -p /workspace

EXPOSE 3100

ENV NODE_ENV=production
CMD ["node", "src/server.js"]
