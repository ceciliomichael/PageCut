# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Clean-install production and development dependencies
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy node_modules from deps stage and project files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Compile Next.js production bundle
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment and bind port
ENV NODE_ENV=production
ENV PORT=3089
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package configurations
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose custom port 3089
EXPOSE 3089

# Start Next.js production server on port 3089
CMD ["npx", "next", "start", "-p", "3089"]
