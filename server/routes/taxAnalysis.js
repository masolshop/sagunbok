import express from 'express';
import { analyzeTaxForCEO, analyzeTaxForConsultant } from '../controllers/taxAnalysisController.js';

const router = express.Router();

/**
 * AI 절세 분석 라우트
 */

// CEO 관점 절세 분석
router.post('/analyze/ceo', analyzeTaxForCEO);

// 컨설턴트 관점 절세 분석
router.post('/analyze/consultant', analyzeTaxForConsultant);

export default router;
