# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/Frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_SOCKET_URL=/
RUN npm run build

# Final runner
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY Backend/package*.json ./Backend/
RUN cd Backend && npm install
COPY Backend/ ./Backend/

# Copy built frontend
COPY --from=frontend-builder /app/Frontend ./Frontend

# Setup start script
COPY start.sh ./
RUN chmod +x start.sh

# Expose Hugging Face default port
EXPOSE 7860

CMD ["./start.sh"]
