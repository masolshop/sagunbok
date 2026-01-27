import express from "express";
import { authenticateConsultant, requireConsultant } from "../middleware/auth.js";
import { saveConsultantApiKey, apiKeyStatus } from "../controllers/apiKeyController.js";

const router = express.Router();

router.get("/status", authenticateConsultant, requireConsultant, apiKeyStatus);
router.post("/", authenticateConsultant, requireConsultant, saveConsultantApiKey);

export default router;
