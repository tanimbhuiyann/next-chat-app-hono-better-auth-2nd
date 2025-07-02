# Use official Bun image
FROM oven/bun:1-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --production

# Copy backend source code
COPY hono ./hono
COPY db ./db
COPY lib ./lib
COPY drizzle.config.ts ./
COPY auth-schema.ts ./
COPY tsconfig.json ./

# Create necessary directories
RUN mkdir -p public/uploads

# Expose the port your app runs on
EXPOSE 3000

# Use the production start command
CMD ["bun", "run", "start:backend"]