import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config/env.js";
import { prisma } from "../../config/database.js";
import { inventoryTool, updatePriceTool } from "./ai.tools.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

export class AIService {
  async processChat(prompt: string) {
    const msg1 = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system:
        "You are a helpful retail copilot. You can monitor inventory and autonomously adjust prices if needed. Always confirm with the user after taking an action.",
      messages: [{ role: "user", content: prompt }],
      tools: [inventoryTool, updatePriceTool],
    });

    if (msg1.stop_reason === "tool_use") {
      // 1. Find ALL tool calls instead of just the first one
      const toolCalls = msg1.content.filter(
        (block) => block.type === "tool_use",
      );

      if (!toolCalls.length) {
        return { response: "Tool error: No tools found", tool_used: false };
      }

      const toolResultBlocks: any[] = [];

      // 2. Loop through every tool call Claude requested and execute them
      for (const toolCall of toolCalls) {
        if (toolCall.type !== "tool_use") continue;

        let toolResultData;

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
        } else {
          toolResultData = { error: `Unknown tool: ${toolCall.name}` };
        }

        // 3. Push the specific result matching the specific tool_use_id
        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: toolCall.id,
          content: JSON.stringify(toolResultData),
        });
      }

      // 4. Send all tool results back to Claude in a single message
      const finalMsg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: msg1.content },
          {
            role: "user",
            content: toolResultBlocks, // Pass the entire array of results
          },
        ],
        tools: [inventoryTool, updatePriceTool],
      });

      const finalAnswer = finalMsg.content.find(
        (block) => block.type === "text",
      );

      return {
        response: finalAnswer && "text" in finalAnswer ? finalAnswer.text : "",
        tool_used: true,
      };
    }

    const standardAnswer = msg1.content.find((block) => block.type === "text");
    return {
      response:
        standardAnswer && "text" in standardAnswer ? standardAnswer.text : "",
      tool_used: false,
    };
  }
}
