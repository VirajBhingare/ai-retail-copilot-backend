import type { Request, Response, NextFunction } from "express";
import { sendApiResponse } from "../utils/apiResponse.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(`[Unhandled Error] ${err.message}`);

  return sendApiResponse({
    res,
    statusCode: 500,
    message: err.message || "An unexpected error occurred on the server.",
    ...(typeof err.stack === "string" ? { errorStack: err.stack } : {}),
  });
};
