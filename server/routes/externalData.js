import express from 'express';
import { analyzeJobSites, analyzeReviewSites } from '../controllers/externalDataController.js';
// import { authenticateConsultant } from '../middleware/auth.js';

const router = express.Router();

// 구인구직 사이트 크롤링 (TODO: 인증 추가 authenticateConsultant)
router.post('/job-sites', analyzeJobSites);

// 리뷰 사이트 크롤링 (TODO: 인증 추가 authenticateConsultant)
router.post('/review-sites', analyzeReviewSites);

export default router;
