# ──────────────────────────────────────────
# AirPass - Secure File Sharing
# ──────────────────────────────────────────
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose the application port
EXPOSE 5000

# Health check - verify the server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
