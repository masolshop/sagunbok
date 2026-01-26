import express from "express";
import { authenticateConsultant, requireConsultant } from "../middleware/auth.js";
import { runAi } from "../controllers/aiController.js";

const router = express.Router();

router.post("/run", authenticateConsultant, requireConsultant, runAi);

export default router;
