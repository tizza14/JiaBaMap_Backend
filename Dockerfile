FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Non-root user — required for both Render and ECS Fargate security policies
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Render reads this for docs; ECS task definition maps container port 3200
EXPOSE 3200

# Use node directly (not npm) so SIGTERM reaches the process — critical for ECS graceful drain
CMD ["node", "app.js"]
