import dotenv from "dotenv";
dotenv.config();

export const config = {
  host: process.env.HOST || "localhost",
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
};
