import { PROMPTS, SYSTEM_PROMPT, CONSULTANT_ZONE_SYSTEM_PROMPT, CRETOP_SYSTEM_PROMPT, PROMPT_VERSION } from "../prompts/catalog.js";
import { loadKey } from "../utils/cryptoStore.js";
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => JSON.stringify(vars[k] ?? "", null, 2));
}

// 8개 항목 추출 JSON 스키마
const EXTRACTION_SCHEMA = {
  company_name: { value: null, evidence: { page: null, quote: null } },
  ceo_name: { value: null, evidence: { page: null, quote: null } },
  biz_reg_no: { value: null, evidence: { page: null, quote: null } },
  industry: { value: null, evidence: { page: null, quote: null } },
  fs_year: { value: null, evidence: { page: null, quote: null } },
  revenue: { value: null, unit: null, year: null, evidence: { page: null, quote: null } },
  retained_earnings: { value: null, unit: null, year: null, evidence: { page: null, quote: null } },
  due_from_officers_etc: { value: null, unit: null, year: null, evidence: { page: null, quote: null } },
  notes: []
};

// PDF 추출용 공통 프롬프트
const PDF_EXTRACTION_PROMPT = `
너는 재무제표 PDF에서 아래 8개 항목을 추출해 JSON으로만 답해야 한다.

추출 항목:
1. company_name(회사명)
2. ceo_name(대표자)
3. biz_reg_no(사업자등록번호)
4. industry(업종)
5. fs_year(재무제표 연도/결산일)
6. revenue(매출액) - 금액 + 단위(천원/원 등) + 해당 연도
7. retained_earnings(잉여금/이익잉여금/결손금) - 금액 + 단위 + 해당 연도
8. due_from_officers_etc(가지급금/대여금) - 금액 + 단위 + 해당 연도
   - 없으면 null로 두고, 유사 계정(미수금/가수금/대여금 등)이 있으면 notes에 남겨라.

반드시 각 항목에 evidence를 포함:
- evidence.page: 페이지 번호(문서 기준 1부터)
- evidence.quote: PDF에서 그대로 베껴온 짧은 근거 문장/표 행(최대 25단어 정도)

출력은 JSON 단 하나(설명 금지). 아래 스키마 형태를 최대한 따를 것:
${JSON.stringify(EXTRACTION_SCHEMA, null, 2)}
`;

// OpenAI PDF 추출 (Responses API + Files API)
async function extractPdfWithOpenAI(apiKey, pdfBuffer, originalFilename) {
  try {
    console.log(`[GPT PDF] 추출 시작... (파일: ${originalFilename}, 크기: ${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    
    const client = new OpenAI({ apiKey });
    
    // 1. Files API 업로드
    const file = await client.files.create({
      file: new Blob([pdfBuffer], { type: 'application/pdf' }),
      purpose: 'user_data',
    });
    
    console.log(`[GPT PDF] 파일 업로드 완료 (file_id: ${file.id})`);
    
    // 2. Responses API로 PDF 직접 분석
    const response = await client.responses.create({
      model: 'gpt-4o', // PDF 입력 지원
      input: [{
        role: 'user',
        content: [
          { type: 'input_file', file_id: file.id },
          { type: 'input_text', text: PDF_EXTRACTION_PROMPT },
        ],
      }],
    });
    
    console.log(`[GPT PDF] 추출 완료`);
    
    return response.output_text;
  } catch (error) {
    console.error(`[GPT PDF] 추출 실패:`, error.message);
    throw new Error(`GPT PDF extraction failed: ${error.message}`);
  }
}

// Gemini PDF 추출 (inline bytes)
async function extractPdfWithGemini(apiKey, pdfBuffer, originalFilename) {
  try {
    console.log(`[GEMINI PDF] 추출 시작... (파일: ${originalFilename}, 크기: ${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }); // PDF 지원 (사용자 코드 예시)
    
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      },
      PDF_EXTRACTION_PROMPT
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log(`[GEMINI PDF] 추출 완료`);
    
    return text;
  } catch (error) {
    console.error(`[GEMINI PDF] 추출 실패:`, error.message);
    throw new Error(`Gemini PDF extraction failed: ${error.message}`);
  }
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

    const userPrompt = req.body.userPrompt || "이 재무제표를 분석하여 8개 필드를 추출해주세요.";
    
    let responseText = "";

    // PDF 파일인 경우 모델별 직접 추출
    if (req.file && req.file.mimetype === 'application/pdf') {
      console.log(`[ANALYZE] PDF 직접 추출 모드 (모델: ${modelType})`);
      
      if (modelType === 'gpt') {
        // OpenAI Responses API로 PDF 직접 처리
        responseText = await extractPdfWithOpenAI(apiKey, req.file.buffer, req.file.originalname);
      } else if (modelType === 'gemini') {
        // Gemini inline PDF로 직접 처리
        responseText = await extractPdfWithGemini(apiKey, req.file.buffer, req.file.originalname);
      } else if (modelType === 'claude') {
        // Claude Vision API (기존 방식)
        responseText = await callClaudeWithDocument(
          apiKey, 
          PDF_EXTRACTION_PROMPT, 
          userPrompt, 
          req.file.buffer, 
          req.file.mimetype, 
          4000
        );
      }
    } else if (req.file) {
      // 이미지 파일은 기존 Vision API 사용
      console.log(`[ANALYZE] 이미지 Vision API 모드 (모델: ${modelType})`);
      
      if (modelType === 'claude') {
        responseText = await callClaudeWithDocument(
          apiKey, 
          PDF_EXTRACTION_PROMPT, 
          userPrompt, 
          req.file.buffer, 
          req.file.mimetype, 
          4000
        );
      } else if (modelType === 'gemini') {
        // Gemini 이미지 처리
        responseText = await extractPdfWithGemini(apiKey, req.file.buffer, req.file.originalname);
      } else {
        return res.status(400).json({ 
          ok: false, 
          error: "GPT_IMAGE_NOT_SUPPORTED",
          message: "GPT 모델은 이미지 Vision을 지원하지 않습니다. Claude 또는 Gemini를 사용해주세요."
        });
      }
    } else {
      // 텍스트 기반 분석 (fallback)
      console.log(`[ANALYZE] 텍스트 기반 분석 (모델: ${modelType})`);
      
      const fileInfo = req.file 
        ? `파일명: ${req.file.originalname}\n파일 타입: ${req.file.mimetype}\n` 
        : '파일 내용:\n';
      
      const fullPrompt = `${userPrompt}\n\n${fileInfo}${req.body.fileContent || '(분석 필요)'}`;
      responseText = await callAI(modelType, apiKey, PDF_EXTRACTION_PROMPT, fullPrompt, 2000);
    }

    console.log(`[ANALYZE] 모델 응답 받음 (길이: ${responseText.length}자)`);

    // JSON 파싱 시도 (마크다운 코드 블록 제거)
    let analysis;
    try {
      const cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      analysis = JSON.parse(cleanedText);
      console.log(`[ANALYZE] JSON 파싱 성공`);
      console.log(`[ANALYZE] 추출 결과:`, JSON.stringify(analysis, null, 2));
    } catch (parseError) {
      console.error(`[ANALYZE] JSON 파싱 실패:`, parseError.message);
      console.error(`[ANALYZE] 원본 응답:`, responseText);
      return res.status(500).json({ 
        ok: false, 
        error: "JSON_PARSE_FAILED", 
        rawResponse: responseText 
      });
    }

    res.json({
      ok: true,
      analysis,
      modelType,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ANALYZE] 오류:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// CRETOP 리포트 생성
export const generateCretopReport = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { companyInfo, financialStatements, modelType } = req.body;

    if (!companyInfo || !financialStatements) {
      return res.status(400).json({ ok: false, error: "MISSING_DATA" });
    }

    // modelType에 따라 API 키 로드
    let apiKey;
    try {
      apiKey = loadKey(consultantId, modelType);
    } catch (keyError) {
      return res.status(400).json({ 
        ok: false, 
        error: keyError.message || `NO_SAVED_API_KEY_FOR_${modelType.toUpperCase()}`
      });
    }

    const prompt = render(PROMPTS.CRETOP_FULL_REPORT, {
      companyInfo,
      financialStatements,
    });

    const responseText = await callAI(modelType, apiKey, CRETOP_SYSTEM_PROMPT, prompt, 4000);

    // JSON 응답 파싱
    let report;
    try {
      const cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      report = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("[CRETOP] JSON 파싱 실패:", parseError.message);
      return res.status(500).json({ 
        ok: false, 
        error: "JSON_PARSE_FAILED", 
        rawResponse: responseText 
      });
    }

    res.json({
      ok: true,
      report,
      modelType,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[CRETOP] 리포트 생성 오류:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// 컨설턴트존 AI 조언
export const consultantZoneAdvice = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { question, context, modelType } = req.body;

    if (!question) {
      return res.status(400).json({ ok: false, error: "MISSING_QUESTION" });
    }

    // modelType에 따라 API 키 로드
    let apiKey;
    try {
      apiKey = loadKey(consultantId, modelType);
    } catch (keyError) {
      return res.status(400).json({ 
        ok: false, 
        error: keyError.message || `NO_SAVED_API_KEY_FOR_${modelType.toUpperCase()}`
      });
    }

    const prompt = render(PROMPTS.CONSULTANT_ZONE_ADVICE, {
      question,
      context: context || "추가 정보 없음",
    });

    const answer = await callAI(modelType, apiKey, CONSULTANT_ZONE_SYSTEM_PROMPT, prompt, 1600);

    res.json({
      ok: true,
      answer,
      modelType,
      version: PROMPT_VERSION,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[CONSULTANT_ZONE] AI 조언 오류:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// 일반 프롬프트 호출
export const invokePrompt = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { promptKey, vars, modelType } = req.body;

    if (!promptKey || !PROMPTS[promptKey]) {
      return res.status(400).json({ ok: false, error: "INVALID_PROMPT_KEY" });
    }

    // modelType에 따라 API 키 로드
    let apiKey;
    try {
      apiKey = loadKey(consultantId, modelType);
    } catch (keyError) {
      return res.status(400).json({ 
        ok: false, 
        error: keyError.message || `NO_SAVED_API_KEY_FOR_${modelType.toUpperCase()}`
      });
    }

    const tpl = PROMPTS[promptKey];
    const prompt = render(tpl, vars || {});
    const result = await callAI(modelType, apiKey, SYSTEM_PROMPT, prompt);

    res.json({
      ok: true,
      result,
      promptKey,
      modelType,
      version: PROMPT_VERSION,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[INVOKE_PROMPT] 오류:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// runAi 함수 (기존 호환)
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

    // 변수 처리
    const userPrompt = render(tpl, {
      calcResult,
      caseMeta: caseMeta || {},
      companyProfile: calcResult?.companyProfile || "",
      financials: calcResult?.financials || "",
      reviews: calcResult?.reviews || "",
      welfare: calcResult?.welfare || "",
    });

    // 시스템 프롬프트 선택
    let systemPrompt = SYSTEM_PROMPT;
    let maxTokens = 1600;
    
    if (module === "CONSULTANT_ZONE") {
      systemPrompt = CONSULTANT_ZONE_SYSTEM_PROMPT;
    } else if (module === "CRETOP_REPORT") {
      systemPrompt = CRETOP_SYSTEM_PROMPT;
      maxTokens = 4096;
    }

    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, maxTokens);

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
      report: parsedReport,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};

// 최종 통합 컨설팅 생성
export const generateFinalIntegrated = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { modelType = "gpt" } = req.body || {};
    const apiKey = loadKey(consultantId, modelType);

    const systemPrompt = `당신은 사내근로복지기금 전문 컨설턴트입니다. 종합 분석하여 실행 가능한 컨설팅 리포트를 작성하세요.`;
    const userPrompt = `제공된 데이터를 분석하여 리포트를 작성하세요:\n${JSON.stringify(req.body, null, 2)}`;

    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, 8000);

    let result = null;
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error("[FINAL] JSON 파싱 실패:", e.message);
      return res.status(500).json({ ok: false, error: "JSON_PARSE_FAILED", rawText: text });
    }

    return res.json({
      ok: true,
      report: result,
      modelType,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};

// 레거시: 간단한 통합 컨설팅
export const generateFinalConsulting = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { modelType = "claude" } = req.body || {};
    const apiKey = loadKey(consultantId, modelType);

    const systemPrompt = `당신은 사내근로복지기금 전문 컨설턴트입니다. 데이터를 종합 분석하여 실행 가능한 컨설팅 리포트를 작성하세요.`;
    const userPrompt = `\n=== 종합 데이터 ===\n${JSON.stringify(req.body, null, 2)}\n\n위 데이터를 종합하여 사내근로복지기금 컨설팅 리포트를 작성하세요.`;

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

// 구인구직 데이터 분석
export const analyzeJobsite = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { rawText, json, modelType = "gpt" } = req.body || {};
    
    if (!rawText && !json) {
      return res.status(400).json({ ok: false, error: "NO_DATA_PROVIDED" });
    }

    const apiKey = loadKey(consultantId, modelType);

    const systemPrompt = `당신은 구인구직 데이터 분석 전문가입니다. 채용 정보와 복지 정보를 분석하여 JSON 형식으로 구조화된 리포트를 작성하세요.`;
    const userPrompt = `\n=== 구인구직 데이터 ===\n${rawText || JSON.stringify(json, null, 2)}\n\n위 데이터를 분석하여 복지 경쟁력을 평가하세요.`;

    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, 3000);

    let result = null;
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error("[JOBSITE] JSON 파싱 실패:", e.message);
      return res.status(500).json({ ok: false, error: "JSON_PARSE_FAILED", rawText: text });
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

// 직원 리뷰 분석
export const analyzeReviews = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { rawText, json, modelType = "gpt" } = req.body || {};
    
    if (!rawText && !json) {
      return res.status(400).json({ ok: false, error: "NO_DATA_PROVIDED" });
    }

    const apiKey = loadKey(consultantId, modelType);

    const systemPrompt = `당신은 직원 리뷰 분석 전문가입니다. 블라인드/잡플래닛 리뷰를 분석하여 JSON 형식으로 구조화된 리포트를 작성하세요.`;
    const userPrompt = `\n=== 직원 리뷰 데이터 ===\n${rawText || JSON.stringify(json, null, 2)}\n\n위 리뷰를 분석하여 조직 리스크를 평가하세요.`;

    const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, 4000);

    let result = null;
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error("[REVIEWS] JSON 파싱 실패:", e.message);
      return res.status(500).json({ ok: false, error: "JSON_PARSE_FAILED", rawText: text });
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
