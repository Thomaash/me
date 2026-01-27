FROM --platform=linux/amd64 node:18-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY docker-entrypoint.sh ./

RUN mkdir -p /data && chmod 755 /data && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:kvTsnYqy9qaH4IAhG2Fe@remote-asiatech.runflare.com:32190/postgresivm_db
ENV PORT=4000

EXPOSE 4000

ENTRYPOINT ["sh", "docker-entrypoint.sh"]