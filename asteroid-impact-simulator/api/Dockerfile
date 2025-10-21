# Multi-stage build for optimized cold start
# Stage 1: Build dependencies
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --only=production

# Stage 2: Production runtime
FROM node:18-slim

WORKDIR /app

# Copy only production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy package files
COPY package*.json ./

# Copy application files
COPY . .

# Expose the port
EXPOSE 7071

# Health check - faster startup (start-period reduced to 3s)
HEALTHCHECK --interval=30s --timeout=3s --start-period=3s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7071/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
