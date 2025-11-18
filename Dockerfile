# ---------- 1) Builder Image ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (cache friendly)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Next.js
RUN npm run build


# ---------- 2) Production Image ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3005

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Prisma engine files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3005
CMD ["node", "server.js"]
