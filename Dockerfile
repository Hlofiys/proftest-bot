# --- Build Stage ---
FROM node:alpine AS builder

WORKDIR /app

# Install dependencies (including dev for build)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Start the bot
CMD ["node", "dist/bot.js"]