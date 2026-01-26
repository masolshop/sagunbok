import express from "express";
import { authenticateConsultant, requireConsultant } from "../middleware/auth.js";
import { crawlJobPostings, crawlReviews } from "../controllers/crawlController.js";

const router = express.Router();

// 구인구직 사이트 크롤링
router.post("/job-postings", authenticateConsultant, requireConsultant, crawlJobPostings);

// 리뷰 사이트 크롤링
router.post("/reviews", authenticateConsultant, requireConsultant, crawlReviews);

export default router;
