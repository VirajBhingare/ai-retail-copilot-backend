import { Router } from "express";
import { chatController } from "./ai.controller.js";

const router = Router();
router.post("/chat", chatController);

export default router;
