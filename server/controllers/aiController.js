import { PROMPTS, SYSTEM_PROMPT, CONSULTANT_ZONE_SYSTEM_PROMPT, PROMPT_VERSION } from "../prompts/catalog.js";
import { loadKey } from "../utils/cryptoStore.js";

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => JSON.stringify(vars[k] ?? "", null, 2));
}

// Claude API 호출
async function callClaude(apiKey, system, userPrompt) {
  const url = "https://api.anthropic.com/v1/messages";
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620";

  const payload = {
    model,
    max_tokens: 1600,
    system,
    messages: [{ role: "user", content: userPrompt }],
  };

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  const txt = await r.text();
  if (!r.ok) throw new Error(`CLAUDE_ERROR ${r.status}: ${txt}`);

  const j = JSON.parse(txt);
  const parts = j.content || [];
  return parts.map((p) => p.text || "").join("\n").trim();
}

// GPT API 호출
async function callGPT(apiKey, system, userPrompt) {
  const url = "https://api.openai.com/v1/chat/completions";
  const model = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";

  const payload = {
    model,
    max_tokens: 1600,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  };

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const txt = await r.text();
  if (!r.ok) throw new Error(`GPT_ERROR ${r.status}: ${txt}`);

  const j = JSON.parse(txt);
  return j.choices?.[0]?.message?.content?.trim() || "";
}

// Gemini API 호출 (최신 2.0 Flash 지원)
async function callGemini(apiKey, system, userPrompt) {
  // Gemini 2.0 Flash (최신) 또는 1.5 Pro
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: `${system}\n\n---\n\n${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  };

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const txt = await r.text();
  if (!r.ok) throw new Error(`GEMINI_ERROR ${r.status}: ${txt}`);

  const j = JSON.parse(txt);
  return j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// AI 모델별 호출 라우터
async function callAI(modelType, apiKey, system, userPrompt) {
  switch (modelType) {
    case "gpt":
      return await callGPT(apiKey, system, userPrompt);
    case "gemini":
      return await callGemini(apiKey, system, userPrompt);
    case "claude":
    default:
      return await callClaude(apiKey, system, userPrompt);
  }
}

export const runAi = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { module, action, calcResult, caseMeta, modelType = "claude" } = req.body || {};
    if (!module || !action) return res.status(400).json({ ok: false, error: "MISSING_MODULE_ACTION" });

    const tpl = PROMPTS?.[module]?.[action];
    if (!tpl) return res.status(400).json({ ok: false, error: "INVALID_PROMPT" });

    // 모델별로 저장된 API Key 로드
    const apiKey = loadKey(consultantId, modelType);

    const userPrompt = render(tpl, {
      calcResult,
      caseMeta: caseMeta || {},
      companyProfile: calcResult?.companyProfile || "",
      financials: calcResult?.financials || "",
      reviews: calcResult?.reviews || "",
      welfare: calcResult?.welfare || "",
    });

    // 컨설턴트존일 때는 전용 SYSTEM PROMPT 사용
    const systemPrompt = module === "CONSULTANT_ZONE" ? CONSULTANT_ZONE_SYSTEM_PROMPT : SYSTEM_PROMPT;

    // 선택한 AI 모델로 호출
    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt);

    return res.json({
      ok: true,
      module,
      action,
      modelType,
      promptVersion: PROMPT_VERSION,
      text,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
