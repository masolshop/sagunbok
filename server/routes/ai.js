import express from "express";
import multer from "multer";
import { authenticateConsultant, requireConsultant } from "../middleware/auth.js";
import { 
  runAi, 
  analyzeFinancialStatement, 
  generateFinalConsulting,
  generateFinalIntegrated,
  analyzeJobsite,
  analyzeReviews,
  getGPTModels,
  analyzeFinancialSnapshot
} from "../controllers/aiController.js";

const router = express.Router();

// Multer 설정 - 메모리에 파일 저장
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
});

router.post("/run", authenticateConsultant, requireConsultant, runAi);
router.post("/analyze-financial-statement", authenticateConsultant, requireConsultant, upload.single('file'), analyzeFinancialStatement);
router.post("/analyze-financial-snapshot", authenticateConsultant, requireConsultant, analyzeFinancialSnapshot);
router.post("/final-consulting", authenticateConsultant, requireConsultant, generateFinalConsulting);
router.post("/final-integrated", authenticateConsultant, requireConsultant, generateFinalIntegrated);

// GPT 모델 목록 조회
router.get("/gpt/models", authenticateConsultant, requireConsultant, getGPTModels);

// 외부 데이터 인사이트 분석
router.post("/insights/jobsite", authenticateConsultant, requireConsultant, analyzeJobsite);
router.post("/insights/reviews", authenticateConsultant, requireConsultant, analyzeReviews);

export default router;
