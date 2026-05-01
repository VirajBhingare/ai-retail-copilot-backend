import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config/env.js";
import { prisma } from "../../config/database.js";
import {
  inventoryTool,
  updatePriceTool,
  createPurchaseOrderTool,
} from "./ai.tools.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const availableTools = [
  inventoryTool,
  updatePriceTool,
  createPurchaseOrderTool,
];

export class AIService {
  async processChat(prompt: string) {
    // 1. Initialize the conversation history for this request
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: prompt },
    ];
    let hasUsedTool = false;

    // 2. The Agent Loop: Keep running until Claude is finished taking actions
    while (true) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system:
          "You are a helpful retail copilot. You can monitor inventory, autonomously adjust prices, and create purchase orders to replenish stock. Always confirm with the user after taking an action.",
        messages: messages,
        tools: availableTools,
      });

      // Append Claude's response (which may contain tool requests) to the history
      messages.push({ role: "assistant", content: response.content });

      // If Claude wants to use a tool, process it and continue the loop!
      if (response.stop_reason === "tool_use") {
        hasUsedTool = true;
        const toolCalls = response.content.filter(
          (block) => block.type === "tool_use",
        );
        const toolResultBlocks: any[] = [];

        for (const toolCall of toolCalls) {
          if (toolCall.type !== "tool_use") continue;
          let toolResultData;

          console.log(`[Agent Action] Executing Tool: ${toolCall.name}`);

          // ACTION 1: Read Inventory
          if (toolCall.name === "check_inventory_and_pricing") {
            const args = toolCall.input as any;
            toolResultData = await prisma.product.findMany({
              where: {
                ...(args.category && { category: args.category }),
                ...(args.status && { inventory: { status: args.status } }),
              },
              take: args.limit || 5,
              include: { inventory: true, competitorPrice: true },
            });
          }
          // ACTION 2: Write/Update Price
          else if (toolCall.name === "update_product_price") {
            const args = toolCall.input as any;
            toolResultData = await prisma.product.update({
              where: { id: args.productId },
              data: { basePrice: args.newPrice },
            });
          }
          // ACTION 3: Write/Create Purchase Order
          else if (toolCall.name === "create_purchase_order") {
            const args = toolCall.input as any;
            toolResultData = await prisma.product.update({
              where: { id: args.productId },
              data: {
                inventory: {
                  update: {
                    stockLevel: { increment: args.quantity },
                    status: "IN_STOCK", // Optimistically change status to in stock
                  },
                },
              },
              include: { inventory: true },
            });
          } else {
            toolResultData = { error: `Unknown tool: ${toolCall.name}` };
          }

          // Format the result to give back to Claude
          toolResultBlocks.push({
            type: "tool_result",
            tool_use_id: toolCall.id,
            content: JSON.stringify(toolResultData),
          });
        }

        // Append the actual database results back into the conversation history
        // The while loop will restart, sending this updated history to Claude
        messages.push({ role: "user", content: toolResultBlocks });
      } else {
        // 3. Loop Exit: Claude didn't ask for a tool, meaning it gave a final text answer
        const finalAnswer = response.content.find(
          (block) => block.type === "text",
        );

        return {
          response:
            finalAnswer && "text" in finalAnswer ? finalAnswer.text : "",
          tool_used: hasUsedTool,
        };
      }
    }
  }
}
