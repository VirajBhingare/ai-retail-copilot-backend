/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with JSON mock retail data...");

  // 1. Clear existing data to prevent duplicates on re-runs
  await prisma.competitorPrice.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();

  // 2. Read the JSON file
  const jsonPath = path.join(process.cwd(), "prisma", "data.json");
  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const products = JSON.parse(rawData);

  // 3. Iterate and insert
  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        category: p.category,
        basePrice: p.basePrice,
        costPrice: p.costPrice,
        inventory: {
          create: p.inventory,
        },
        competitorPrice: {
          create: p.competitorPrice,
        },
      },
    });
  }

  console.log(`Database seeded successfully with ${products.length} products!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
