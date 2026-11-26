FROM node:22-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://u:@localhost:5432/db" npx prisma generate --config prisma7.config.ts

ENV NODE_ENV=production

EXPOSE 3000

# Start: əvvəl miqrasiyalar , sonra server.
CMD ["sh" , "-c" , "npx prisma migrate deploy --config prisma7.config.ts && npx tsx src/server.ts"]