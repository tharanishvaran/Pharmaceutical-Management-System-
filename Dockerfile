# Use Node.js 20 LTS
FROM node:20-bookworm-slim

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy root package.json and project files
COPY package.json ./
COPY server ./server
COPY client ./client

# Install server and client dependencies, and build client
RUN npm run build

# Expose port (default 5000, customizable via PORT env)
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Start backend server
CMD ["npm", "start"]
