# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (including devDependencies for Prisma)
RUN npm ci

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy package files
COPY package.json ./

# Copy application files
COPY src ./src
COPY prisma ./prisma
COPY docker-entrypoint.sh ./

# Create data directory for SQLite with proper permissions
RUN mkdir -p /data && chmod 755 /data && chmod +x docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/db.sqlite

# Generate Prisma Client
RUN npm run prisma:generate

# Expose port
EXPOSE 4000

# Health check using curl (more reliable)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:4000/api/me > /dev/null || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start application with entrypoint script - database will be initialized on first startup
CMD ["./docker-entrypoint.sh"]
