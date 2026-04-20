import type { Response } from "express";

// Define the expected parameters using an interface with a generic type <T> for the data payload
interface ApiResponseParams<T> {
  res: Response;
  statusCode: number;
  message: string;
  data?: T;
  errorStack?: string;
}

// The standardized utility function
export const sendApiResponse = <T>({
  res,
  statusCode,
  message,
  data,
  errorStack,
}: ApiResponseParams<T>) => {
  // Automatically calculate the status string based on the HTTP status code
  const status = statusCode >= 200 && statusCode < 300 ? "success" : "failed";

  // Construct the payload, conditionally adding data and errorStack if they exist
  const responsePayload = {
    status,
    message,
    ...(data !== undefined && { data }),
    // Only show error stacks in development, hide them in production
    ...(errorStack !== undefined &&
      process.env.NODE_ENV !== "production" && { errorStack }),
  };

  return res.status(statusCode).json(responsePayload);
};
