export const inventoryTool = {
  name: "check_inventory_and_pricing",
  description:
    "Fetches stock levels and pricing. ALWAYS use filters to limit results.",
  input_schema: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        description: 'e.g., "Electronics", "Grocery"',
      },
      status: {
        type: "string",
        description:
          'Filter by stock status: "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"',
      },
      limit: {
        type: "number",
        description:
          "Maximum number of items to return. Default is 5. Never request more than 10.",
      },
    },
  },
};

export const updatePriceTool = {
  name: "update_product_price",
  description:
    "Updates the base price of a specific product in the database. Use this when you decide a price change is necessary.",
  input_schema: {
    type: "object" as const,
    properties: {
      productId: {
        type: "string",
        description: "The UUID of the product to update",
      },
      newPrice: { type: "number", description: "The new base price (Float)" },
    },
    required: ["productId", "newPrice"],
  },
};
