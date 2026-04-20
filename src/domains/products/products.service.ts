import { prisma } from "../../config/database.js";

export class ProductsService {
  async getAllProducts() {
    return await prisma.product.findMany({
      include: {
        inventory: true,
        competitorPrice: true,
      },
    });
  }

  async getProductsByCategory(category: string) {
    return await prisma.product.findMany({
      where: { category },
      include: {
        inventory: true,
        competitorPrice: true,
      },
    });
  }
}
