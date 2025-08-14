# Multi-stage Dockerfile for Clem AI Backend
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.14.0

# Set working directory
WORKDIR /app

# Copy root workspace files for dependency caching
COPY package.json pnpm-workspace.yaml ./

# Copy backend package files
COPY apps/backend/package.json apps/backend/pnpm-lock.yaml ./apps/backend/

# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Copy backend source code and Prisma schema
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Generate Prisma client
RUN cd apps/backend && pnpm prisma generate

# Build the NestJS application
RUN cd apps/backend && pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.14.0

# Set working directory
WORKDIR /app

# Copy backend package files
COPY apps/backend/package.json apps/backend/pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/apps/backend/dist ./dist

# Copy Prisma generated files
COPY --from=builder /app/apps/backend/node_modules/.prisma ./node_modules/.prisma

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["node", "dist/main"]

