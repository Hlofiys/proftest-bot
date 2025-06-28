# Use official Node.js LTS image
FROM node:alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Build TypeScript (if you want to run compiled JS)
RUN npm install -g typescript && npm run build

# Expose port (optional, for debugging)
# EXPOSE 3000

# Set environment variables (optional, or use docker run -e)
# ENV BOT_TOKEN=your_token_here

# Start the bot
CMD ["node", "dist/bot.js"]