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

// Claude Vision API 호출 (PDF/이미지 분석)
async function callClaudeWithDocument(apiKey, system, userText, documentBuffer, mimeType, maxTokens = 2000) {
  const url = "https://api.anthropic.com/v1/messages";
  const model = "claude-3-5-sonnet-20241022"; // Vision 지원 모델

  // PDF를 base64로 인코딩
  const base64Document = documentBuffer.toString('base64');

  const payload = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: mimeType,
            data: base64Document
          }
        },
        {
          type: "text",
          text: userText
        }
      ]
    }],
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
  if (!r.ok) throw new Error(`CLAUDE_VISION_ERROR ${r.status}: ${txt}`);

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

// Gemini Vision API 호출 (PDF/이미지 분석)
async function callGeminiWithDocument(apiKey, system, userText, documentBuffer, mimeType, maxTokens = 2048) {
  // Gemini 2.0 Flash Experimental (Vision 지원, PDF 분석)
  const model = "gemini-2.0-flash-exp";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // PDF를 base64로 인코딩
  const base64Document = documentBuffer.toString('base64');

  const payload = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Document
            }
          },
          {
            text: `${system}\n\n---\n\n${userText}`
          }
        ]
      }
    ],
    generationConfig: {
      maxOutputTokens: maxTokens,
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
  if (!r.ok) throw new Error(`GEMINI_VISION_ERROR ${r.status}: ${txt}`);

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

    // modelType은 필수로 받아야 함 (기본값 제거)
    const { modelType } = req.body || {};
    if (!modelType || !["claude", "gpt", "gemini"].includes(modelType)) {
      return res.status(400).json({ 
        ok: false, 
        error: "INVALID_MODEL_TYPE. Please provide modelType (claude, gpt, or gemini)" 
      });
    }
    
    // API 키 로드 (에러 처리 추가)
    let apiKey;
    try {
      apiKey = loadKey(consultantId, modelType);
    } catch (keyError) {
      return res.status(400).json({ 
        ok: false, 
        error: keyError.message || `NO_SAVED_API_KEY_FOR_${modelType.toUpperCase()}`
      });
    }

    // 파일 처리 - multer로 req.file에 업로드된 파일 정보 확인
    if (!req.file && !req.body.fileContent) {
      return res.status(400).json({ ok: false, error: "NO_FILE_PROVIDED" });
    }

    // 파일 정보 로깅
    if (req.file) {
      console.log(`[ANALYZE] 파일 업로드됨: ${req.file.originalname}, ${req.file.mimetype}, ${req.file.size} bytes, modelType: ${modelType}`);
    }

    const systemPrompt = `당신은 재무제표 분석 전문가입니다. 
업로드된 재무제표(PDF, Excel 등)를 분석하여 다음 8개 항목을 구조화된 JSON 형식으로 추출하세요.
각 항목마다 value, confidence, page_number, snippet, method를 포함해야 합니다.

출력 형식:
{
  "company_name": {
    "value": "회사명 (예: 쏠라리버(주))",
    "confidence": 0.95,
    "page_number": 1,
    "snippet": "추출된 원문 일부 (최대 100자)",
    "method": "vision_api"
  },
  "ceo_name": {
    "value": "대표자명 (예: 홍길동)",
    "confidence": 0.9,
    "page_number": 1,
    "snippet": "추출된 원문 일부",
    "method": "vision_api"
  },
  "business_number": {
    "value": "123-45-67890",
    "confidence": 0.95,
    "page_number": 1,
    "snippet": "추출된 원문 일부",
    "method": "vision_api"
  },
  "industry": {
    "value": "업종명",
    "confidence": 0.9,
    "page_number": 1,
    "snippet": "추출된 원문 일부",
    "method": "vision_api"
  },
  "statement_year": {
    "value": "2024",
    "confidence": 0.95,
    "page_number": 1,
    "snippet": "추출된 원문 일부",
    "method": "vision_api"
  },
  "revenue": {
    "value": "5,432,100,000원",
    "confidence": 0.92,
    "page_number": 2,
    "snippet": "추출된 원문 일부",
    "method": "vision_api",
    "unit": "원"
  },
  "retained_earnings": {
    "value": "1,234,567,890원",
    "confidence": 0.88,
    "page_number": 2,
    "snippet": "추출된 원문 일부",
    "method": "vision_api",
    "unit": "원"
  },
  "loans_to_officers": {
    "value": "50,000,000원",
    "confidence": 0.85,
    "page_number": 2,
    "snippet": "추출된 원문 일부",
    "method": "vision_api",
    "unit": "원"
  }
}

중요한 규칙:
1. value: 추출된 값 (문자열). 숫자는 쉼표로 구분하고 단위 포함 (예: "1,234,567원")
2. confidence: 신뢰도 점수 0.0~1.0 (높을수록 확실함)
3. page_number: 해당 정보가 있는 페이지 번호 (1부터 시작)
4. snippet: 실제 원문에서 추출한 텍스트 일부 (최대 100자, 큰따옴표 제거)
5. method: "vision_api"로 고정
6. unit (선택): 금액 항목의 경우 단위 (원, 천원, 백만원 등)

추출 우선순위:
- 회사명: 상단 헤더나 표지에서 찾기
- 대표자: "대표이사", "대표자" 키워드 근처
- 사업자등록번호: "123-45-67890" 형식
- 업종: "업종", "업태" 키워드 근처
- 재무제표 연도: "YYYY년 재무제표" 또는 표지의 연도
- 매출액: 손익계산서의 "매출액" 항목
- 이익잉여금: 재무상태표의 "이익잉여금" 또는 "미처분이익잉여금" 항목
- 가지급금: 재무상태표의 자산 항목에서 다음을 찾기
  * "가지급금" (가장 일반적)
  * "임원가지급금" (임원 대상)
  * "단기대여금", "장기대여금" (대여금 계정)
  * "기타유동자산", "기타비유동자산" 항목의 상세 내역
  * 만약 위 계정이 모두 없거나 금액이 0이면 value를 "0원" 또는 "없음"으로 표시하고 snippet에 "해당 계정과목 없음" 기재
  * 절대 null로 표시하지 말고, 없으면 명시적으로 "0원" 또는 "없음"으로 표시

중요 규칙:
- 가지급금은 반드시 찾아서 표시해야 합니다 (없으면 "0원" 또는 "없음")
- 찾을 수 없는 다른 항목은 null로 표시하세요
- 반드시 순수 JSON만 출력하고, 설명이나 마크다운 코드블록은 제외하세요`;

    const userPrompt = `위의 재무제표 문서를 분석하여 JSON 형식으로 필요한 정보를 추출해주세요.`;

    let text;
    // 파일이 있으면 Vision API 사용 (Claude, Gemini 지원)
    if (req.file && (modelType === "claude" || modelType === "gemini")) {
      console.log(`[ANALYZE] 🤖 ${modelType.toUpperCase()} Vision API 호출 중... (파일: ${req.file.originalname}, ${(req.file.size / 1024).toFixed(1)} KB)`);
      if (modelType === "claude") {
        text = await callClaudeWithDocument(
          apiKey, 
          systemPrompt, 
          userPrompt, 
          req.file.buffer, 
          req.file.mimetype, 
          4000 // PDF 분석에는 더 많은 토큰 필요
        );
      } else if (modelType === "gemini") {
        text = await callGeminiWithDocument(
          apiKey, 
          systemPrompt, 
          userPrompt, 
          req.file.buffer, 
          req.file.mimetype, 
          4000 // PDF 분석에는 더 많은 토큰 필요
        );
      }
      console.log(`[ANALYZE] ✅ Vision API 응답 길이: ${text.length}자`);
    } else if (req.file && modelType === "gpt") {
      // GPT는 Vision API를 지원하지 않으므로 에러 반환
      console.log(`[ANALYZE] ❌ GPT는 이미지 기반 PDF Vision을 지원하지 않음`);
      return res.status(400).json({ 
        ok: false, 
        error: "GPT_VISION_NOT_SUPPORTED",
        message: "GPT 모델은 현재 이미지 기반 PDF Vision 분석을 지원하지 않습니다. Claude 또는 Gemini 모델을 사용해주세요."
      });
    } else {
      // 텍스트 기반 분석 (fallback)
      console.log(`[ANALYZE] 📝 텍스트 기반 분석 (모델: ${modelType})`);
      const fileInfo = req.file 
        ? `파일명: ${req.file.originalname}, 타입: ${req.file.mimetype}`
        : "파일 내용";
      const fullPrompt = `${userPrompt}\n\n${fileInfo}\n\n${req.body.fileContent || "[파일 분석이 필요합니다]"}`;
      text = await callAI(modelType, apiKey, systemPrompt, fullPrompt, 2000);
    }
    
    // JSON 파싱 시도
    let analysis = null;
    try {
      // 마크다운 코드블록 제거
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
      console.log(`[ANALYZE] ✅ JSON 파싱 성공`);
      
      // 추출된 필드 요약 로그
      const extractedCount = Object.values(analysis).filter(v => v !== null && v?.value !== "미확인").length;
      console.log(`[ANALYZE] 📊 추출 완료: ${extractedCount}/8 필드`);
      
      // 각 필드의 신뢰도 로그
      Object.entries(analysis).forEach(([key, field]) => {
        if (field && field.value) {
          const conf = Math.round(field.confidence * 100);
          console.log(`[ANALYZE]   - ${key}: "${field.value}" (신뢰도: ${conf}%)`);
        }
      });
    } catch (e) {
      console.error("[ANALYZE] ❌ JSON 파싱 실패:", e.message);
      console.error("[ANALYZE] 원본 응답 (처음 500자):", text.substring(0, 500));
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


// 최종 통합 컨설팅 생성 (7단계 클라이맥스)
export const generateFinalIntegrated = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const {
      company_profile,
      step1_financial_report,
      step2_jobsite_benefits_report,
      step3_reviews_report,
      step4_tax_simulation_report,
      modelType = "gpt"
    } = req.body || {};

    const apiKey = loadKey(consultantId, modelType);
    
    // 프롬프트 템플릿 로드
    const finalPrompt = await import('../prompts/finalIntegrated.js').then(m => m.default);
    
    const inputData = {
      company_profile: company_profile || {},
      step1_financial_report: step1_financial_report || {},
      step2_jobsite_benefits_report: step2_jobsite_benefits_report || {},
      step3_reviews_report: step3_reviews_report || {},
      step4_tax_simulation_report: step4_tax_simulation_report || {}
    };
    
    const systemPrompt = finalPrompt.systemPrompt;
    const userPrompt = finalPrompt.userPromptTemplate(inputData);
    
    // AI 호출 (maxTokens 증가 - 복잡한 리포트)
    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, 8000);
    
    // JSON 파싱 시도 (재시도 로직 포함)
    let result = null;
    let parseError = null;
    
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // 마크다운 코드블록 제거
        const cleaned = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        result = JSON.parse(cleaned);
        
        // 스키마 검증
        finalPrompt.validateSchema(result);
        break;
      } catch (e) {
        parseError = e.message;
        if (attempt === 0) {
          console.warn(`[FINAL] JSON 파싱 실패 (시도 ${attempt + 1}/2):`, e.message);
        }
      }
    }
    
    if (!result) {
      return res.status(500).json({ 
        ok: false, 
        error: "JSON_PARSE_FAILED", 
        details: parseError,
        rawText: text 
      });
    }
    
    // 리포트 ID 생성
    const report_id = `rpt_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now().toString().slice(-4)}`;
    
    return res.json({
      ok: true,
      report_id,
      report_type: "final_integrated",
      company: {
        name: company_profile?.company_name || company_profile?.name || "",
        industry: company_profile?.industry || "",
        period: company_profile?.period || ""
      },
      report: result,
      modelType,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};

// 레거시: 간단한 통합 컨설팅 (기존 호환)
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

// 구인구직(잡코리아 등) 복지/채용 메시지 분석
export const analyzeJobsite = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { rawText, json, modelType = "gpt" } = req.body || {};
    
    if (!rawText && !json) {
      return res.status(400).json({ ok: false, error: "NO_DATA_PROVIDED" });
    }

    const apiKey = loadKey(consultantId, modelType);
    
    // 프롬프트 템플릿 로드
    const jobsitePrompt = await import('../prompts/jobsiteAnalysis.js').then(m => m.default);
    
    // 입력 데이터 구성
    const inputData = json || {
      company: { name: "", industry: "", headcount: 0 },
      job_site_data: {
        source: "user_upload",
        collected_at: new Date().toISOString(),
        postings: [],
        benefit_tags_extracted: []
      }
    };
    
    // rawText가 있으면 추가
    if (rawText) {
      inputData._rawText = rawText;
    }
    
    const systemPrompt = jobsitePrompt.systemPrompt;
    const userPrompt = jobsitePrompt.userPromptTemplate(inputData);
    
    // AI 호출 (JSON 강제 출력, temperature 낮게)
    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, 3000);
    
    // JSON 파싱 시도 (재시도 로직 포함)
    let result = null;
    let parseError = null;
    
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // 마크다운 코드블록 제거
        const cleaned = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        result = JSON.parse(cleaned);
        
        // 스키마 검증
        jobsitePrompt.validateSchema(result);
        break;
      } catch (e) {
        parseError = e.message;
        if (attempt === 0) {
          console.warn(`[JOBSITE] JSON 파싱 실패 (시도 ${attempt + 1}/2):`, e.message);
        }
      }
    }
    
    if (!result) {
      return res.status(500).json({ 
        ok: false, 
        error: "JSON_PARSE_FAILED", 
        details: parseError,
        rawText: text 
      });
    }
    
    return res.json({
      ok: true,
      report_type: "jobsite",
      report: result,
      modelType,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};

// 블라인드/잡플래닛 직원 리뷰 분석
export const analyzeReviews = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { rawText, json, modelType = "gpt" } = req.body || {};
    
    if (!rawText && !json) {
      return res.status(400).json({ ok: false, error: "NO_DATA_PROVIDED" });
    }

    const apiKey = loadKey(consultantId, modelType);
    
    // 프롬프트 템플릿 로드
    const reviewsPrompt = await import('../prompts/reviewsAnalysis.js').then(m => m.default);
    
    // 입력 데이터 구성
    const inputData = json || {
      company: { name: "", industry: "", headcount: 0 },
      review_data: {
        source: "user_upload",
        collected_at: new Date().toISOString(),
        rating: {
          overall: 0,
          work_life: 0,
          pay_benefit: 0,
          culture: 0,
          management: 0,
          growth: 0,
          recommend_to_friend_pct: ""
        },
        reviews: [],
        sample_size: 0
      }
    };
    
    // rawText가 있으면 추가
    if (rawText) {
      inputData._rawText = rawText;
    }
    
    const systemPrompt = reviewsPrompt.systemPrompt;
    const userPrompt = reviewsPrompt.userPromptTemplate(inputData);
    
    // AI 호출 (JSON 강제 출력, temperature 낮게)
    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, 4000);
    
    // JSON 파싱 시도 (재시도 로직 포함)
    let result = null;
    let parseError = null;
    
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // 마크다운 코드블록 제거
        const cleaned = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        result = JSON.parse(cleaned);
        
        // 스키마 검증
        reviewsPrompt.validateSchema(result);
        break;
      } catch (e) {
        parseError = e.message;
        if (attempt === 0) {
          console.warn(`[REVIEWS] JSON 파싱 실패 (시도 ${attempt + 1}/2):`, e.message);
        }
      }
    }
    
    if (!result) {
      return res.status(500).json({ 
        ok: false, 
        error: "JSON_PARSE_FAILED", 
        details: parseError,
        rawText: text 
      });
    }
    
    return res.json({
      ok: true,
      report_type: "reviews",
      report: result,
      modelType,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
