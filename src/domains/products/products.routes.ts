import { Router } from "express";
import {
  getAllProductsController,
  getProductsByCategoryController,
} from "./products.controller.js";

const router = Router();

router.get("/", getAllProductsController);
router.get("/category/:category", getProductsByCategoryController);

export default router;
