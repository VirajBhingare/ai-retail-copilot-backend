import type { Request, Response } from "express";
import { AIService } from "./ai.service.js";
import { sendApiResponse } from "../../utils/apiResponse.js";

const aiService = new AIService();

export const chatController = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return sendApiResponse({
        res,
        statusCode: 400,
        message: "Prompt is required",
      });
    }

    const result = await aiService.processChat(prompt);
    return sendApiResponse({
      res,
      statusCode: 200,
      message: "Chat response generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("AI Controller Error:", error);
    return sendApiResponse({
      res,
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};
