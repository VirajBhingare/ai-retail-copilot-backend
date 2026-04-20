import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config/env.js";
import { prisma } from "../../config/database.js";
import { inventoryTool } from "./ai.tools.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

export class AIService {
  async processChat(prompt: string) {
    const msg1 = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: "You are a helpful retail copilot.",
      messages: [{ role: "user", content: prompt }],
      tools: [inventoryTool],
    });

    if (msg1.stop_reason === "tool_use") {
      const toolCall = msg1.content.find((block) => block.type === "tool_use");

      if (
        toolCall &&
        toolCall.type === "tool_use" &&
        toolCall.name === "check_inventory_and_pricing"
      ) {
        const category =
          toolCall.input &&
          typeof toolCall.input === "object" &&
          "category" in toolCall.input
            ? (toolCall.input as { category: string }).category
            : undefined;

        // DB Query isolated in the service
        const dbResults = await prisma.product.findMany({
          ...(category ? { where: { category } } : {}),
          include: { inventory: true, competitorPrice: true },
        });

        const finalMsg = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: msg1.content },
            {
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: toolCall.id,
                  content: JSON.stringify(dbResults),
                },
              ],
            },
          ],
          tools: [inventoryTool],
        });

        const finalAnswer = finalMsg.content.find(
          (block) => block.type === "text",
        );
        return {
          response:
            finalAnswer && "text" in finalAnswer ? finalAnswer.text : "",
          tool_used: true,
        };
      }
    }

    const standardAnswer = msg1.content.find((block) => block.type === "text");
    return {
      response:
        standardAnswer && "text" in standardAnswer ? standardAnswer.text : "",
      tool_used: false,
    };
  }
}
