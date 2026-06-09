# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /home/node/app/Frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_SOCKET_URL=/
RUN npm run build

# Final runner
FROM node:20-alpine
WORKDIR /home/node/app

# Copy backend dependencies configuration
COPY --chown=node:node Backend/package*.json ./Backend/

# Switch to the non-root user 'node' (UID 1000)
USER node

# Install backend dependencies
RUN cd Backend && npm install

# Copy backend source code
COPY --chown=node:node Backend/ ./Backend/

# Copy built frontend from builder stage
COPY --chown=node:node --from=frontend-builder /home/node/app/Frontend ./Frontend

# Setup start script
COPY --chown=node:node start.sh ./
RUN chmod +x start.sh

# Expose Hugging Face default port
EXPOSE 7860

CMD ["./start.sh"]
