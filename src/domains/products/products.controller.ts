import type { Request, Response } from "express";
import { ProductsService } from "./products.service.js";
import { sendApiResponse } from "../../utils/apiResponse.js";

const productsService = new ProductsService();

export const getAllProductsController = async (req: Request, res: Response) => {
  try {
    const products = await productsService.getAllProducts();
    return sendApiResponse({
      res,
      statusCode: 200,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("Products Controller Error:", error);
    return sendApiResponse({
      res,
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};

export const getProductsByCategoryController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { category } = req.params;
    if (typeof category !== "string" || !category) {
      return sendApiResponse({
        res,
        statusCode: 400,
        message: "Category is required",
      });
    }
    const products = await productsService.getProductsByCategory(category);
    return sendApiResponse({
      res,
      statusCode: 200,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("Products Controller Error:", error);
    return sendApiResponse({
      res,
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};
