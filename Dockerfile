# Dockerfile for local development and production
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Set working directory
WORKDIR /app

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

FROM base AS development

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Run migrations and start dev server
CMD ["pnpm", "dev"]

FROM base AS build

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

# Copy source code
COPY . .

# Build the application
RUN pnpm build

FROM base AS production

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --dangerously-allow-all-builds

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.js"]
