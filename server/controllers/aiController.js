import { PROMPTS, SYSTEM_PROMPT, CONSULTANT_ZONE_SYSTEM_PROMPT, CRETOP_SYSTEM_PROMPT, PROMPT_VERSION } from "../prompts/catalog.js";
import { loadKey } from "../utils/cryptoStore.js";

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => JSON.stringify(vars[k] ?? "", null, 2));
}

// Claude API 호출
async function callClaude(apiKey, system, userPrompt, maxTokens = 1600) {
  const url = "https://api.anthropic.com/v1/messages";
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620";

  const payload = {
    model,
    max_tokens: maxTokens,
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
async function callGPT(apiKey, system, userPrompt, maxTokens = 1600) {
  const url = "https://api.openai.com/v1/chat/completions";
  const model = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";

  const payload = {
    model,
    max_tokens: maxTokens,
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
async function callAI(modelType, apiKey, system, userPrompt, maxTokens = 1600) {
  switch (modelType) {
    case "gpt":
      return await callGPT(apiKey, system, userPrompt, maxTokens);
    case "gemini":
      return await callGemini(apiKey, system, userPrompt);
    case "claude":
    default:
      return await callClaude(apiKey, system, userPrompt, maxTokens);
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

    // CRETOP 리포트를 위한 변수 처리 (calcResult의 모든 필드 병합)
    const userPrompt = render(tpl, {
      calcResult,
      caseMeta: caseMeta || {},
      companyProfile: calcResult?.companyProfile || "",
      financials: calcResult?.financials || "",
      reviews: calcResult?.reviews || "",
      welfare: calcResult?.welfare || "",
      // CRETOP 리포트 전용 필드
      company_name: calcResult?.company_name || "",
      incorporation_date: calcResult?.incorporation_date || "",
      fiscal_month: calcResult?.fiscal_month || "",
      statement_date: calcResult?.statement_date || "",
      ceo_name: calcResult?.ceo_name || "",
      ceo_birth_or_age: calcResult?.ceo_birth_or_age || "",
      industry_code: calcResult?.industry_code || "",
      industry_name: calcResult?.industry_name || "",
      employee_count: calcResult?.employee_count || "",
      products: calcResult?.products || "",
      address: calcResult?.address || "",
      capital: calcResult?.capital || "",
      shares_outstanding: calcResult?.shares_outstanding || "",
      shareholders_table: calcResult?.shareholders_table || "",
      executives_table: calcResult?.executives_table || "",
      balance_sheet_json: calcResult?.balance_sheet_json || "",
      income_statement_json: calcResult?.income_statement_json || "",
      cashflow_json: calcResult?.cashflow_json || "",
      tax_info: calcResult?.tax_info || "",
      comp_dividend_history: calcResult?.comp_dividend_history || "",
      hr_costs: calcResult?.hr_costs || "",
      welfare_current: calcResult?.welfare_current || "",
      partners_info: calcResult?.partners_info || "",
    });

    // 시스템 프롬프트 선택
    let systemPrompt = SYSTEM_PROMPT;
    let maxTokens = 1600;
    
    if (module === "CONSULTANT_ZONE") {
      systemPrompt = CONSULTANT_ZONE_SYSTEM_PROMPT;
    } else if (module === "CRETOP_REPORT") {
      systemPrompt = CRETOP_SYSTEM_PROMPT;
      maxTokens = 4096; // CRETOP 리포트는 더 긴 응답 필요
    }

    // 선택한 AI 모델로 호출
    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, maxTokens);

    // CRETOP 리포트인 경우 JSON 파싱 시도
    let parsedReport = null;
    if (module === "CRETOP_REPORT") {
      try {
        parsedReport = JSON.parse(text);
      } catch (e) {
        console.error("[CRETOP] JSON 파싱 실패:", e.message);
      }
    }

    return res.json({
      ok: true,
      module,
      action,
      modelType,
      promptVersion: PROMPT_VERSION,
      text,
      report: parsedReport, // CRETOP 리포트인 경우 JSON 객체도 함께 반환
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
