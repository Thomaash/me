# Backend (Prisma + Express)

1. Copy .env.example to .env and adjust if needed.
2. Install deps: npm install
3. Generate Prisma client and push schema:
   - npx prisma generate
   - npx prisma db push
4. Seed dev data: npm run seed
5. Start: npm run dev
6. Endpoints: POST /api/register, POST /api/login
