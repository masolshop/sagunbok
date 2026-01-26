import { saveKey, hasKey } from "../utils/cryptoStore.js";

export const saveConsultantApiKey = async (req, res) => {
  const consultantId = req.user?.id;
  const apiKey = String(req.body?.apiKey || "").trim();

  if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  if (!apiKey) return res.status(400).json({ ok: false, error: "NO_API_KEY" });

  saveKey(consultantId, apiKey);
  return res.json({ ok: true });
};

export const apiKeyStatus = async (req, res) => {
  const consultantId = req.user?.id;
  if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  return res.json({ ok: true, hasKey: hasKey(consultantId) });
};
