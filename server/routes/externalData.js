import express from 'express';
import { analyzeJobSites, analyzeReviewSites } from '../controllers/externalDataController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// 구인구직 사이트 크롤링
router.post('/job-sites', authenticate, analyzeJobSites);

// 리뷰 사이트 크롤링
router.post('/review-sites', authenticate, analyzeReviewSites);

export default router;
