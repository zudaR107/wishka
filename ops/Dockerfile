FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS builder
RUN apk add --no-cache libc6-compat
ENV DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/wshka
ENV DATABASE_SSL=false
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat \
  && addgroup -S nodejs \
  && adduser -S nextjs -G nodejs
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY drizzle ./drizzle
COPY ops/deploy/run-migrations.mjs ./ops/deploy/run-migrations.mjs
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
