FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Set AI URL to Docker service name so rewrites are baked correctly at build time
ENV PYTHON_AI_URL=http://ai:8000/ai
# DATABASE_URL is required by prisma.config.ts at config-load time (not actual connection)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
