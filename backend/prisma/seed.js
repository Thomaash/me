import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      password: hash,
      name: "Dev User",
    },
  });

  // Create a sample config for the test user (composite PK: userId + name)
  await prisma.config.upsert({
    where: { userId_name: { userId: user.id, name: "default" } },
    update: {
      content: JSON.stringify({ example: "default config" }),
    },
    create: {
      userId: user.id,
      name: "default",
      content: JSON.stringify({ example: "default config" }),
    },
  });

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
