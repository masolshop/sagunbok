import express from "express";
import { authenticateConsultant, requireConsultant } from "../middleware/auth.js";
import { runAi, analyzeFinancialStatement, generateFinalConsulting } from "../controllers/aiController.js";

const router = express.Router();

router.post("/run", authenticateConsultant, requireConsultant, runAi);
router.post("/analyze-financial-statement", authenticateConsultant, requireConsultant, analyzeFinancialStatement);
router.post("/final-consulting", authenticateConsultant, requireConsultant, generateFinalConsulting);

export default router;
