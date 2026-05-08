import app from "./app.js";
import serverless from "serverless-http";
import { config } from "./config/env.js";

if (process.env.NODE_ENV !== "production" && !process.env.LAMBDA_TASK_ROOT) {
  app.listen(config.port, () => {
    console.log(
      `Backend server running at http://${config.host}:${config.port}`,
    );
  });
}

// AWS Lambda Support
// Wrap the Express app for AWS Lambda and export it as 'handler'
// This matches the 'handler: dist/server.handler' instruction in serverless.yml
export const handler = serverless(app);
