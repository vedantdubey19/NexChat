# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]
