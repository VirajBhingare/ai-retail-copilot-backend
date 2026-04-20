import app from "./app.js";
import { config } from "./config/env.js";

app.listen(config.port, () => {
  console.log(`Backend server running at http://${config.host}:${config.port}`);
});
