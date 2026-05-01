import { AIService } from "../domains/ai/ai.service.js";

const ai = new AIService();

const testCases = [
  {
    prompt: "Are we out of stock on any electronics?",
    expectedTool: "check_inventory_and_pricing",
  },
  {
    prompt:
      "Drop the price of product 123e4567-e89b-12d3-a456-426614174000 to 15.99",
    expectedTool: "update_product_price",
  },
];

async function runEvals() {
  console.log("🚀 Starting Agent Eval Loop...\n");
  let passed = 0;

  for (const [index, test] of testCases.entries()) {
    console.log(`Test ${index + 1}: "${test.prompt}"`);

    // We are passing the prompt to the service
    const result = await ai.processChat(test.prompt);

    // Check if the agent correctly identified the need for a tool based on the returned response flags
    if (result.tool_used) {
      console.log(`✅ Passed: Agent successfully executed a tool loop.\n`);
      passed++;
    } else {
      console.log(`❌ Failed: Agent did not use a tool.\n`);
    }
  }

  console.log(`📊 Eval Results: ${passed}/${testCases.length} Passed`);
  process.exit();
}

runEvals();
