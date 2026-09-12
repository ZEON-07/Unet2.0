# ── Multi-stage Dockerfile for InkLife SQLite Coolify Deployment ──

FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/inklife.db"

COPY package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Create persistent storage volume directory for Coolify
RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
