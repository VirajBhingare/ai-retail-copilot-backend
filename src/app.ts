import express from "express";
import cors from "cors";
import aiRoutes from "./domains/ai/ai.routes.js";
import productRoutes from "./domains/products/products.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sendApiResponse } from "./utils/apiResponse.js";

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  return sendApiResponse({
    res,
    statusCode: 200,
    message: "AI Retail Copilot API is running fine.",
  });
});

// Domain Routes
app.use("/api/ai", aiRoutes);
app.use("/api/products", productRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
