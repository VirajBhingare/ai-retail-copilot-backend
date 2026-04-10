/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with mock retail data...");

  // 1. Clear existing data to prevent duplicates on re-runs
  await prisma.competitorPrice.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();

  // 2. Create Product A: Low stock, we are priced higher than competitor (Action needed!)
  const productA = await prisma.product.create({
    data: {
      name: "MacBook Pro M3 14-inch",
      category: "Electronics",
      basePrice: 1599.0,
      costPrice: 1300.0,
      inventory: {
        create: { stockLevel: 4, reorderThreshold: 10, status: "LOW_STOCK" },
      },
      competitorPrice: {
        create: { competitorName: "TechStore Mega", competitorPrice: 1499.0 },
      },
    },
  });

  // 3. Create Product B: Good stock, we have the best price
  const productB = await prisma.product.create({
    data: {
      name: "Sony WH-1000XM5 Headphones",
      category: "Electronics",
      basePrice: 348.0,
      costPrice: 250.0,
      inventory: {
        create: { stockLevel: 45, reorderThreshold: 15, status: "IN_STOCK" },
      },
      competitorPrice: {
        create: { competitorName: "AudioMart", competitorPrice: 398.0 },
      },
    },
  });

  // 4. Create Product C: Out of stock (Urgent action needed!)
  const productC = await prisma.product.create({
    data: {
      name: "Organic Avocados (Pack of 4)",
      category: "Grocery",
      basePrice: 5.99,
      costPrice: 3.5,
      inventory: {
        create: { stockLevel: 0, reorderThreshold: 50, status: "OUT_OF_STOCK" },
      },
      competitorPrice: {
        create: { competitorName: "FreshFoods", competitorPrice: 6.49 },
      },
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
