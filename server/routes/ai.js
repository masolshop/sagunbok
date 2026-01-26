import express from "express";
import { authenticateConsultant, requireConsultant } from "../middleware/auth.js";
import { runAi, analyzeFinancialStatement } from "../controllers/aiController.js";

const router = express.Router();

router.post("/run", authenticateConsultant, requireConsultant, runAi);
router.post("/analyze-financial-statement", authenticateConsultant, requireConsultant, analyzeFinancialStatement);

export default router;
