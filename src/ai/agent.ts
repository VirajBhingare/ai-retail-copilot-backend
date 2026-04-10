import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Anthropic client using the API key from .env
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// This is the "Tool" definition we give to Claude.
// It explains exactly what the tool does and what inputs it requires.
export const inventoryTool = {
  name: "check_inventory_and_pricing",
  description:
    "Fetches current stock levels, base price, and competitor pricing for products. Use this whenever the user asks about stock, inventory, or pricing of an item.",
  input_schema: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        description:
          'Optional category filter, e.g., "Electronics" or "Grocery". Leave empty to fetch all items.',
      },
    },
  },
};
