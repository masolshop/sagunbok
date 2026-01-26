import { saveKey, hasKey } from "../utils/cryptoStore.js";

export const saveConsultantApiKey = async (req, res) => {
  const consultantId = req.user?.id;
  const apiKey = String(req.body?.apiKey || "").trim();
  const modelType = String(req.body?.modelType || "claude").toLowerCase();

  if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  if (!apiKey) return res.status(400).json({ ok: false, error: "NO_API_KEY" });
  if (!["claude", "gpt", "gemini"].includes(modelType)) {
    return res.status(400).json({ ok: false, error: "INVALID_MODEL_TYPE" });
  }

  saveKey(consultantId, apiKey, modelType);
  return res.json({ ok: true, modelType });
};

export const apiKeyStatus = async (req, res) => {
  const consultantId = req.user?.id;
  if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  
  // 3개 모델 모두의 키 상태 반환
  return res.json({ 
    ok: true, 
    keys: {
      claude: hasKey(consultantId, "claude"),
      gpt: hasKey(consultantId, "gpt"),
      gemini: hasKey(consultantId, "gemini"),
    }
  });
};
