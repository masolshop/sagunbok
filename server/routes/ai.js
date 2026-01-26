import express from "express";
import { authenticateConsultant, requireConsultant } from "../middleware/auth.js";
import { 
  runAi, 
  analyzeFinancialStatement, 
  generateFinalConsulting,
  generateFinalIntegrated,
  analyzeJobsite,
  analyzeReviews 
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/run", authenticateConsultant, requireConsultant, runAi);
router.post("/analyze-financial-statement", authenticateConsultant, requireConsultant, analyzeFinancialStatement);
router.post("/final-consulting", authenticateConsultant, requireConsultant, generateFinalConsulting);
router.post("/final-integrated", authenticateConsultant, requireConsultant, generateFinalIntegrated);

// 외부 데이터 인사이트 분석
router.post("/insights/jobsite", authenticateConsultant, requireConsultant, analyzeJobsite);
router.post("/insights/reviews", authenticateConsultant, requireConsultant, analyzeReviews);

export default router;
