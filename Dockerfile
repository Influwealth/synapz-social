FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build --workspace=apps/api

# Expose API port
EXPOSE 4001

# Set environment to production
ENV NODE_ENV=production

# Start API server
CMD ["npm", "run", "start", "--workspace=apps/api"]