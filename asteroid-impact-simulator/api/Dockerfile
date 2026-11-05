# Asteroid Impact Simulator API - production image
#
# v2.0.7:
# - Node 22 LTS (Node 18 reached end of life in April 2025)
# - Reproducible install from the committed package-lock.json (npm ci)
# - Production dependencies only, no npm in the start command
# - Runs as the unprivileged "node" user, not root
# - Only runtime files are copied (see .dockerignore)

# ---- Stage 1: production dependencies ----------------------------------
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# ---- Stage 2: runtime --------------------------------------------------
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json swagger.yaml ./
COPY --chown=node:node src ./src

USER node

EXPOSE 7071

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7071/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Run node directly so SIGTERM reaches the process (graceful scale-down)
CMD ["node", "src/index.js"]
