import { saveKey, hasKey } from "../utils/cryptoStore.js";

export const saveConsultantApiKey = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    const apiKey = String(req.body?.apiKey || "").trim();
    const modelType = String(req.body?.modelType || "claude").toLowerCase();

    console.log(`[API Key Save] consultantId: ${consultantId}, modelType: ${modelType}, keyLength: ${apiKey.length}`);

    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    if (!apiKey) return res.status(400).json({ ok: false, error: "NO_API_KEY" });
    if (!["claude", "gpt", "gemini"].includes(modelType)) {
      return res.status(400).json({ ok: false, error: "INVALID_MODEL_TYPE" });
    }

    // API Key 형식 검증
    if (modelType === "claude" && !apiKey.startsWith("sk-ant-")) {
      return res.status(400).json({ ok: false, error: "INVALID_CLAUDE_KEY_FORMAT" });
    }
    if (modelType === "gpt" && !apiKey.startsWith("sk-")) {
      return res.status(400).json({ ok: false, error: "INVALID_GPT_KEY_FORMAT" });
    }
    if (modelType === "gemini" && !apiKey.startsWith("AIza")) {
      return res.status(400).json({ ok: false, error: "INVALID_GEMINI_KEY_FORMAT" });
    }

    saveKey(consultantId, apiKey, modelType);
    console.log(`[API Key Save] ✅ Success for ${modelType}`);
    return res.json({ ok: true, modelType });
  } catch (e) {
    console.error(`[API Key Save] ❌ Error:`, e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};

export const apiKeyStatus = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    
    // 3개 모델 모두의 키 상태 반환
    const keys = {
      claude: hasKey(consultantId, "claude"),
      gpt: hasKey(consultantId, "gpt"),
      gemini: hasKey(consultantId, "gemini"),
    };

    console.log(`[API Key Status] consultantId: ${consultantId}, keys:`, keys);
    
    return res.json({ 
      ok: true, 
      keys
    });
  } catch (e) {
    console.error(`[API Key Status] ❌ Error:`, e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
