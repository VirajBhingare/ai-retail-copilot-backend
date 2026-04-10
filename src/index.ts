import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { anthropic, inventoryTool } from "./ai/agent.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const prisma = new PrismaClient(); // Initialize Prisma

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Retail Copilot API is running!");
});

// Fetch Products
app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: true,
        competitorPrice: true,
      },
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.prompt;

  if (!userMessage) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // 1. Send the user's message to Claude, AND provide our tool definition
    const msg1 = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system:
        "You are a helpful retail copilot. You assist managers in checking inventory and adjusting prices.",
      messages: [{ role: "user", content: userMessage }],
      tools: [inventoryTool],
    });

    // 2. Check if Claude decided to use a tool
    if (msg1.stop_reason === "tool_use") {
      // Find the specific tool Claude wants to use
      const toolCall = msg1.content.find((block) => block.type === "tool_use");

      if (
        toolCall &&
        toolCall.type === "tool_use" &&
        toolCall.name === "check_inventory_and_pricing"
      ) {
        console.log("🤖 Claude requested data. Fetching from database...");

        // Extract the category argument Claude generated (if any)
        const category =
          toolCall.input &&
          typeof toolCall.input === "object" &&
          "category" in toolCall.input
            ? (toolCall.input as { category: string }).category
            : undefined;

        // 3. Execute the actual Database Query using Prisma
        const dbResults = await prisma.product.findMany({
          ...(category ? { where: { category } } : {}),
          include: { inventory: true, competitorPrice: true },
        });

        // 4. Send the database results BACK to Claude so it can formulate an answer
        const finalMsg = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system:
            "You are a helpful retail copilot. You assist managers in checking inventory and adjusting prices.",
          messages: [
            { role: "user", content: userMessage },
            { role: "assistant", content: msg1.content }, // Give Claude its previous thought process
            {
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: toolCall.id, // Must match the ID Claude gave us
                  content: JSON.stringify(dbResults), // The raw data from our DB
                },
              ],
            },
          ],
          tools: [inventoryTool],
        });

        // Extract the final text response
        const finalAnswer = finalMsg.content.find(
          (block) => block.type === "text",
        );
        return res.json({
          response:
            finalAnswer && "text" in finalAnswer
              ? finalAnswer.text
              : "No text response generated.",
          tool_used: true,
        });
      }
    }

    // If Claude didn't need a tool, just return its standard text response
    const standardAnswer = msg1.content.find((block) => block.type === "text");
    return res.json({
      response:
        standardAnswer && "text" in standardAnswer
          ? standardAnswer.text
          : "No text response generated.",
      tool_used: false,
    });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to process AI request" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
