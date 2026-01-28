import express from 'express';
import { 
  analyzeJobSites, 
  analyzeReviewSites,
  lookupCompanyByBusinessNumber 
} from '../controllers/externalDataController.js';
// import { authenticateConsultant } from '../middleware/auth.js';

const router = express.Router();

// 사업자번호로 회사명 조회
router.post('/lookup-business-number', lookupCompanyByBusinessNumber);

// 구인구직 사이트 크롤링 (TODO: 인증 추가 authenticateConsultant)
router.post('/job-sites', analyzeJobSites);

// 리뷰 사이트 크롤링 (TODO: 인증 추가 authenticateConsultant)
router.post('/review-sites', analyzeReviewSites);

export default router;
