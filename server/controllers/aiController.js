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

// 재무제표 PDF/Excel 분석 엔드포인트
export const analyzeFinancialStatement = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { modelType = "gpt" } = req.body || {};
    const apiKey = loadKey(consultantId, modelType);

    // 파일 처리는 multer 등을 통해 req.file로 받는다고 가정
    // 실제 프로덕션에서는 multer 설정 필요
    if (!req.file && !req.body.fileContent) {
      return res.status(400).json({ ok: false, error: "NO_FILE_PROVIDED" });
    }

    const systemPrompt = `당신은 재무제표 분석 전문가입니다. 
업로드된 재무제표(PDF, Excel 등)를 분석하여 다음 정보를 JSON 형식으로 추출하세요:

{
  "company_name": "회사명",
  "statement_date": "결산일 (YYYY-MM-DD)",
  "balance_sheet": {
    "자산총계": 숫자,
    "부채총계": 숫자,
    "자본총계": 숫자,
    "유동자산": 숫자,
    "비유동자산": 숫자
  },
  "income_statement": {
    "매출액": 숫자,
    "매출원가": 숫자,
    "매출총이익": 숫자,
    "영업이익": 숫자,
    "당기순이익": 숫자
  },
  "cash_flow": {
    "영업활동현금흐름": 숫자,
    "투자활동현금흐름": 숫자,
    "재무활동현금흐름": 숫자
  }
}

숫자는 원 단위로 표시하고, 데이터가 없으면 0으로 표시하세요.
반드시 JSON만 출력하세요. 설명이나 마크다운 코드블록은 제외하세요.`;

    const userPrompt = `아래 재무제표 데이터를 분석하여 JSON으로 추출하세요:\n\n${req.body.fileContent || "[파일 내용]"}`;

    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, 2000);
    
    // JSON 파싱 시도
    let analysis = null;
    try {
      // 마크다운 코드블록 제거
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error("[ANALYZE] JSON 파싱 실패:", e.message);
      return res.status(500).json({ ok: false, error: "JSON_PARSE_FAILED", rawText: text });
    }

    return res.json({
      ok: true,
      analysis,
      modelType,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};

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


// 최종 통합 컨설팅 생성
export const generateFinalConsulting = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const {
      companyInfo,
      financialData,
      jobPostingData,
      reviewData,
      taxCalculatorData,
      modelType = "claude",
    } = req.body || {};

    const apiKey = loadKey(consultantId, modelType);

    const systemPrompt = `당신은 사내근로복지기금 전문 컨설턴트입니다.
다음 데이터를 종합 분석하여 실행 가능한 컨설팅 리포트를 작성하세요:

1. 재무 분석 및 여력 진단
2. 복지 경쟁력 비교 (구인구직 데이터 기반)
3. 조직 리스크 진단 (직원 리뷰 기반)
4. 절세 효과 분석 (절세계산기 데이터 기반)
5. 사근복 도입 제안 (3개 시나리오: 보수적/중립적/공격적)
6. 실행 로드맵 (30일/60일/90일)
7. 예상 ROI 및 면책사항

한국어로 작성하고, 구체적인 수치와 근거를 포함하세요.`;

    const userPrompt = `
=== 기업 정보 ===
${JSON.stringify(companyInfo, null, 2)}

=== 재무제표 데이터 ===
${JSON.stringify(financialData, null, 2)}

=== 구인구직 복지 데이터 ===
${JSON.stringify(jobPostingData, null, 2)}

=== 직원 리뷰 데이터 ===
${JSON.stringify(reviewData, null, 2)}

=== 절세계산기 데이터 ===
${JSON.stringify(taxCalculatorData, null, 2)}

위 데이터를 종합하여 사내근로복지기금 컨설팅 리포트를 작성하세요.
`;

    const report = await callAI(modelType, apiKey, systemPrompt, userPrompt, 4096);

    return res.json({
      ok: true,
      report,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
