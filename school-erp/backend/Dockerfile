# Production Multi-Stage Dockerfile for School ERP Backend
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy dependency configs
COPY package*.json ./

# Install all dependencies (including devDependencies for build steps if any)
RUN npm ci

# Copy the rest of backend code
COPY . .

# --- Runner Stage ---
FROM node:20-slim

WORKDIR /usr/src/app

# Install system dependencies needed for Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Environment Variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install chromium for PDF rendering
RUN apt-get update && apt-get install -y chromium --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy source from builder
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/config ./config
COPY --from=builder /usr/src/app/server.js ./
COPY --from=builder /usr/src/app/templates ./templates

# Expose port
EXPOSE 5000

# Use a non-privileged user for runtime security
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r => r.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
