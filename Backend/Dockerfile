# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the API port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
