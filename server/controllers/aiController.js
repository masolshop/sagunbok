import { PROMPTS, SYSTEM_PROMPT, CONSULTANT_ZONE_SYSTEM_PROMPT, CRETOP_SYSTEM_PROMPT, PROMPT_VERSION } from "../prompts/catalog.js";
import { loadKey } from "../utils/cryptoStore.js";
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 🎯 Task Type 정의 (OpenAI 자동 모델 선택용)
const TASK_TYPES = {
  CHAT_LIGHT: 'CHAT_LIGHT',                       // 간단 상담/요약
  CONSULTING_STANDARD: 'CONSULTING_STANDARD',     // 복지제도 추천/리포트
  FIN_STATEMENT_ANALYSIS: 'FIN_STATEMENT_ANALYSIS', // 재무제표 분석 (Reasoning 우선)
  CODE_GEN: 'CODE_GEN'                            // 코드 생성
};

// 💰 GPT 모델 카테고리 (2026년 기준)
const GPT_MODELS = {
  // Reasoning 계열 (복잡한 추론/분석/계산)
  REASONING_STRONG: ['o3', 'o3-pro'],
  REASONING_FAST: ['o4-mini', 'o3-mini'],
  
  // GPT 계열 (범용/코딩/문서)
  QUALITY_GPT: ['gpt-5.2', 'gpt-4.1', 'gpt-4o'],
  BALANCED_GPT: ['gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o'],
  CHEAP_GPT: ['gpt-5-nano', 'gpt-4.1-nano', 'gpt-4o-mini'],
  
  // 코딩 특화
  CODING_GPT: ['gpt-5.2-codex', 'gpt-5.2', 'gpt-4.1', 'gpt-4o']
};

// 🔍 모델 선택 함수 (Task Type + Plan + Cost Mode)
function selectGPTModel(availableModels, taskType, userPlan = 'free', costMode = 'balanced') {
  const available = new Set(availableModels);
  
  // Helper: 후보 목록에서 첫 번째 사용 가능한 모델 선택
  const pickFirst = (candidates) => candidates.find(m => available.has(m));
  
  // 📊 재무제표 분석 → Reasoning 우선
  if (taskType === TASK_TYPES.FIN_STATEMENT_ANALYSIS) {
    const reasoningCandidates = userPlan === 'paid' 
      ? GPT_MODELS.REASONING_STRONG 
      : GPT_MODELS.REASONING_FAST;
    
    const model = pickFirst(reasoningCandidates)
      || pickFirst(GPT_MODELS.QUALITY_GPT)
      || pickFirst(GPT_MODELS.BALANCED_GPT)
      || pickFirst(GPT_MODELS.CHEAP_GPT);
    
    if (!model) throw new Error('No suitable model for FIN_STATEMENT_ANALYSIS');
    
    console.log(`[Model Select] Task: FIN_STATEMENT_ANALYSIS, Plan: ${userPlan} → ${model}`);
    return { model, reason: 'financial analysis => reasoning-first fallback' };
  }
  
  // 💻 코드 생성 → 코딩 강한 모델 우선
  if (taskType === TASK_TYPES.CODE_GEN) {
    const model = pickFirst(GPT_MODELS.CODING_GPT)
      || pickFirst(GPT_MODELS.BALANCED_GPT)
      || pickFirst(GPT_MODELS.CHEAP_GPT);
    
    if (!model) throw new Error('No suitable model for CODE_GEN');
    
    console.log(`[Model Select] Task: CODE_GEN → ${model}`);
    return { model, reason: 'code generation => coding-strong models' };
  }
  
  // 📝 일반 상담/컨설팅 → Cost Mode 기반
  const baseCandidates = costMode === 'cheap' 
    ? GPT_MODELS.CHEAP_GPT 
    : costMode === 'quality' 
      ? GPT_MODELS.QUALITY_GPT 
      : GPT_MODELS.BALANCED_GPT;
  
  // 무료 사용자는 한 단계 더 저렴하게
  const finalCandidates = userPlan === 'free' 
    ? [...GPT_MODELS.CHEAP_GPT, ...baseCandidates]
    : baseCandidates;
  
  const model = pickFirst(finalCandidates)
    || pickFirst(GPT_MODELS.QUALITY_GPT)
    || pickFirst(GPT_MODELS.CHEAP_GPT);
  
  if (!model) throw new Error('No suitable GPT model available');
  
  console.log(`[Model Select] Task: ${taskType}, Plan: ${userPlan}, Cost: ${costMode} → ${model}`);
  return { model, reason: `task=${taskType}, plan=${userPlan}, costMode=${costMode}` };
}

// GPT 모델 자동 선택 (레거시 호환성 유지)
async function pickBestGPTModel(apiKey, plan = 'free', taskType = TASK_TYPES.CONSULTING_STANDARD) {
  try {
    const client = new OpenAI({ apiKey });
    const list = await client.models.list();
    const availableModels = list.data.map(m => m.id);
    
    console.log(`[GPT Auto] 사용 가능한 모델: ${availableModels.length}개`);
    
    // Task Type 기반 선택
    const { model, reason } = selectGPTModel(availableModels, taskType, plan);
    
    console.log(`[GPT Auto] ✅ 선택된 모델: ${model} (이유: ${reason})`);
    return model;
  } catch (error) {
    if (error.status === 401) {
      throw new Error('GPT API 키가 유효하지 않습니다. 키를 확인해주세요.');
    }
    throw error;
  }
}

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

// OpenAI PDF 추출 (자동 모델 선택 + Responses API)
async function extractPdfWithOpenAI(apiKey, pdfBuffer, originalFilename, options = {}) {
  try {
    console.log(`[GPT PDF] 추출 시작... (파일: ${originalFilename}, 크기: ${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    
    // 1. PDF 파일 헤더 검증 (%PDF로 시작해야 함)
    const header = pdfBuffer.slice(0, 4).toString('utf8');
    if (header !== '%PDF') {
      throw new Error(`업로드된 파일이 PDF가 아닙니다. 헤더=${JSON.stringify(header)} (처음 4바이트). 실제 타입을 확인하세요.`);
    }
    
    const client = new OpenAI({ apiKey });
    
    // 2. 모델 자동 선택 (재무제표 분석 = FIN_STATEMENT_ANALYSIS)
    const taskType = TASK_TYPES.FIN_STATEMENT_ANALYSIS;
    const model = options.model || await pickBestGPTModel(apiKey, options.plan || 'free', taskType);
    console.log(`[GPT PDF] 사용 모델: ${model} (Task: ${taskType})`);
    
    // 3. Base64 인코딩 및 data URL 생성
    const base64 = pdfBuffer.toString('base64');
    const file_data = `data:application/pdf;base64,${base64}`;
    
    console.log(`[GPT PDF] Base64 인코딩 완료 (${Math.round(base64.length / 1024)} KB)`);
    
    // 4. Responses API로 PDF 직접 분석
    const response = await client.responses.create({
      model,
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_file',
            filename: originalFilename || 'document.pdf',
            file_data,
          },
          {
            type: 'input_text',
            text: PDF_EXTRACTION_PROMPT
          }
        ],
      }],
    });
    
    console.log(`[GPT PDF] 추출 완료 (모델: ${model}, Task: ${taskType})`);
    
    return response.output_text;
    
  } catch (error) {
    // 에러 타입별 처리
    if (error.status === 401) {
      throw new Error('GPT API 키가 유효하지 않습니다.');
    } else if (error.status === 403 || error.status === 404) {
      throw new Error(`선택된 모델을 사용할 권한이 없습니다: ${error.message}`);
    } else if (error.status === 429) {
      throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    }
    
    console.error(`[GPT PDF] 추출 실패:`, error.message);
    throw new Error(`GPT PDF extraction failed: ${error.message}`);
  }
}

// 📋 Gemini 2.5/3.0 Controlled Generation용 Response Schema (2026년형 - 사근복닷컴 전용)
// Claude 컨설팅 반영: 가지급금 추출 정밀도 향상, 단위 환산 명시
const financeSchema = {
  type: "object",
  description: "한국 기업 재무제표 PDF에서 추출한 8대 핵심 금융 지표",
  properties: {
    company_name: {
      type: "string",
      description: "재무제표 상의 정확한 법인명 또는 상호명. 예: ㈜쏠라리버, 삼성전자㈜, (주)네이버"
    },
    ceo_name: {
      type: "string",
      description: "대표이사 또는 대표자 성명. 예: 최무영, 홍길동. 없으면 빈 문자열",
      nullable: true
    },
    business_number: {
      type: "string",
      description: "사업자등록번호 (형식: 000-00-00000). 예: 122-81-94563. 없으면 빈 문자열",
      nullable: true
    },
    industry: {
      type: "string",
      description: "주요 업종 및 사업 내용. 예: 태양광 발전 장치 제조 및 공사업, 제조업, 도소매업. 명확하지 않으면 '제품 매출' 또는 '서비스업'으로 추정",
      nullable: true
    },
    statement_year: {
      type: "string",
      description: "재무제표 기준 연도 (YYYY 형식). 예: 2024, 2023. 가장 최근 결산일(예: 2024-12-31) 기준"
    },
    revenue: {
      type: "number",
      description: "매출액 (단위: 원). 주의: 재무제표 단위가 '천원'이면 반드시 1,000을 곱해 '원' 단위로 환산. 손익계산서의 '매출액(*)' 항목 참조. 예: 9571217 (천원) → 9571217000 (원). 없으면 0",
      nullable: true
    },
    retained_earnings: {
      type: "number",
      description: "이익잉여금 (단위: 원). 주의: 재무제표 단위가 '천원'이면 반드시 1,000을 곱해 '원' 단위로 환산. 재무상태표의 '이익잉여금(*)' 항목 참조. 예: 1379030 (천원) → 1379030000 (원). 결손금은 음수로 표시. 없으면 0",
      nullable: true
    },
    loans_to_officers: {
      type: "number",
      description: "가지급금/대여금 합계 (단위: 원). 재무상태표 유동자산 또는 비유동자산 항목 중 '단기대여금', '장기대여금', '임원대여금', '주주단기대여금', '가지급금' 등을 합산. 주의: '매출채권', '미수금(영업용)', '선급금'은 제외. 단위가 '천원'이면 1,000 곱해 환산. 해당 항목이 없으면 0",
      nullable: true
    }
  },
  required: ["company_name", "statement_year"]
};

// Gemini PDF 추출 (inline bytes + Controlled Generation)
async function extractPdfWithGemini(apiKey, pdfBuffer, originalFilename, modelType = 'gemini-flash') {
  try {
    console.log(`[GEMINI PDF] 추출 시작... (파일: ${originalFilename}, 크기: ${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    
    // 모델 매핑: UI에서 온 값 → Gemini API 모델명 (2026년 1월 최신)
    const modelMap = {
      'gemini-pro': 'gemini-2.5-pro',           // 최고 성능
      'gemini-flash': 'gemini-2.5-flash',       // 고속, 가성비
      'gemini-lite': 'gemini-2.5-flash-lite',   // 경량
      'gemini-preview': 'gemini-3-pro-preview', // 차세대 실험
      'gemini': 'gemini-2.5-flash'              // 기본값
    };
    
    const actualModel = modelMap[modelType] || 'gemini-2.5-flash';
    console.log(`[GEMINI PDF] 모델: ${modelType} → ${actualModel}`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🎯 Controlled Generation: JSON Schema 강제
    const model = genAI.getGenerativeModel({ 
      model: actualModel,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: financeSchema
      }
    });
    
    // 📝 Claude 컨설팅 기반 프롬프트 (2026년 사근복닷컴 전용)
    const expertPrompt = `
당신은 한국 기업 재무제표 전문 회계 컨설턴트입니다. 첨부된 PDF 재무제표를 정밀 분석하세요.

[핵심 분석 지침]

1️⃣ **단위 환산 (최우선)**
   - 재무제표 상단에서 기본 단위 확인 (예: "단위: 천원", "단위: 백만원", "단위: 원")
   - **"천원" 단위인 경우 반드시 ×1,000 환산하여 "원" 단위로 출력**
   - 예: 재무제표에 "9,571,217 (천원)" → JSON 출력: 9571217000
   - 예: 재무제표에 "1,379,030 (천원)" → JSON 출력: 1379030000

2️⃣ **가지급금/대여금 추출 정밀도 향상**
   재무상태표의 **유동자산** 및 **비유동자산** 항목에서 아래 계정과목을 스캔:
   
   ✅ **포함 대상** (합산):
   - 단기대여금
   - 장기대여금
   - 임원대여금
   - 주주대여금
   - 주임종단기대여금 (주주·임원·종업원 단기대여금)
   - 가지급금
   
   ❌ **제외 대상** (영업 관련 계정):
   - 매출채권 / 받을어음
   - 미수금 (단, "미수금(비영업용)" 명시 시 포함 고려)
   - 선급금 / 선급비용
   - 선급법인세
   
   ⚠️ **판단 기준**:
   - 해당 계정이 **주주·임원·관계사** 등에 대한 금전 대여 성격이면 포함
   - 정상 영업 활동(매출/비용 선지급)과 관련되면 제외
   - 확실하지 않으면 **0으로 처리** (과대 추정 방지)

3️⃣ **최신 데이터 우선**
   - 여러 연도가 표시된 경우 **가장 우측(최신 결산일)** 데이터 사용
   - 예: "2023년 / 2024년" 표시 시 → 2024년 데이터만 추출

4️⃣ **정확한 항목 식별**
   - 매출액: 손익계산서의 **"매출액(*)"** 또는 **"I. 매출액"** 합계
   - 이익잉여금: 재무상태표 자본 항목의 **"이익잉여금(*)"** 또는 **"V. 이익잉여금"**
   - 결손금은 음수(-)로 표시

5️⃣ **출력 형식**
   - 숫자는 콤마 없이 순수 숫자로 반환 (예: 9571217000)
   - 사업자등록번호는 하이픈 포함 (예: "122-81-94563")
   - 업종은 구체적으로 (예: "태양광 발전 장치 제조 및 공사업")

[예시]
재무제표에 "매출액 9,571,217 (단위: 천원)" 표시 시:
→ revenue: 9571217000 (천원 × 1,000)

재무제표에 "가지급금" 항목 없음:
→ loans_to_officers: 0
`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      },
      expertPrompt
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log(`[GEMINI PDF] 추출 완료 (Controlled Generation)`);
    
    // ✅ 이제 text는 항상 유효한 JSON 문자열
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

// GPT API 호출 (자동 모델 선택 지원)
async function callGPT(apiKey, system, userPrompt, maxTokens = 1600, options = {}) {
  // 모델 자동 선택 (수동 지정 시 스킵)
  const model = options.model || await pickBestGPTModel(apiKey, options.plan || 'free');
  console.log(`[GPT] 사용 모델: ${model}`);
  
  const url = "https://api.openai.com/v1/chat/completions";

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
  
  // 에러 타입별 처리
  if (!r.ok) {
    if (r.status === 401) {
      throw new Error('GPT API 키가 유효하지 않습니다.');
    } else if (r.status === 403 || r.status === 404) {
      throw new Error(`선택된 모델을 사용할 권한이 없습니다: ${txt}`);
    } else if (r.status === 429) {
      throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    }
    throw new Error(`GPT_ERROR ${r.status}: ${txt}`);
  }

  const j = JSON.parse(txt);
  return j.choices?.[0]?.message?.content?.trim() || "";
}

// Gemini API 호출 (동적 모델 선택)
async function callGemini(apiKey, system, userPrompt, modelType = 'gemini-flash') {
  // 모델 매핑: UI에서 온 값 → Gemini API 모델명 (2026년 1월 최신)
  const modelMap = {
    'gemini-pro': 'gemini-2.5-pro',           // 최고 성능
    'gemini-flash': 'gemini-2.5-flash',       // 고속, 가성비
    'gemini-lite': 'gemini-2.5-flash-lite',   // 경량
    'gemini-preview': 'gemini-3-pro-preview', // 차세대 실험
    'gemini': 'gemini-2.5-flash'              // 기본값
  };
  
  const actualModel = modelMap[modelType] || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`;

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
  // Gemini 모델들 처리
  if (modelType.startsWith('gemini')) {
    return await callGemini(apiKey, system, userPrompt, modelType);
  }
  
  switch (modelType) {
    case "gpt":
      return await callGPT(apiKey, system, userPrompt, maxTokens);
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

    // modelType과 plan 파라미터
    const { modelType, plan = 'free', gptModel } = req.body || {};
    
    // Gemini 4가지 모델 모두 허용
    const allowedModels = ["claude", "gpt", "gemini", "gemini-pro", "gemini-flash", "gemini-lite", "gemini-preview"];
    
    // 🔍 디버깅 로그 추가
    console.log(`[AUTH] 요청된 모델 타입: "${modelType}" (타입: ${typeof modelType})`);
    console.log(`[AUTH] allowedModels:`, allowedModels);
    
    if (!modelType || !allowedModels.includes(modelType)) {
      return res.status(400).json({ 
        ok: false, 
        error: "INVALID_MODEL_TYPE. Please provide modelType (claude, gpt, gemini-pro, gemini-flash, gemini-lite, or gemini-preview)" 
      });
    }
    
    // Gemini 모델들은 모두 'gemini' 키 사용
    const keyType = modelType.startsWith('gemini') ? 'gemini' : modelType;
    
    // API 키 로드 (에러 처리 추가)
    let apiKey;
    try {
      apiKey = loadKey(consultantId, keyType);
    } catch (keyError) {
      return res.status(400).json({ 
        ok: false, 
        error: keyError.message || `NO_SAVED_API_KEY_FOR_${keyType.toUpperCase()}`
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
        // OpenAI Responses API로 PDF 직접 처리 (자동 모델 선택)
        responseText = await extractPdfWithOpenAI(apiKey, req.file.buffer, req.file.originalname, {
          plan,
          model: gptModel // 수동 지정 시 사용
        });
      } else if (modelType.startsWith('gemini')) {
        // Gemini inline PDF로 직접 처리 (3가지 모델 지원)
        responseText = await extractPdfWithGemini(apiKey, req.file.buffer, req.file.originalname, modelType);
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
      } else if (modelType.startsWith('gemini')) {
        // Gemini 이미지 처리 (3가지 모델 지원)
        responseText = await extractPdfWithGemini(apiKey, req.file.buffer, req.file.originalname, modelType);
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
    let rawAnalysis;
    try {
      const cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      rawAnalysis = JSON.parse(cleanedText);
      console.log(`[ANALYZE] JSON 파싱 성공`);
      console.log(`[ANALYZE] 추출 결과 (raw):`, JSON.stringify(rawAnalysis, null, 2));
    } catch (parseError) {
      console.error(`[ANALYZE] JSON 파싱 실패:`, parseError.message);
      console.error(`[ANALYZE] 원본 응답:`, responseText);
      return res.status(500).json({ 
        ok: false, 
        error: "JSON_PARSE_FAILED", 
        rawResponse: responseText 
      });
    }

    // 🔄 프론트엔드 호환성을 위해 { value, evidence } 구조로 변환
    const analysis = {
      company_name: {
        value: rawAnalysis.company_name || '',
        evidence: { page: 1, quote: rawAnalysis.company_name || '' }
      },
      ceo_name: {
        value: rawAnalysis.ceo_name || '',
        evidence: { page: 1, quote: rawAnalysis.ceo_name || '' }
      },
      business_number: {
        value: rawAnalysis.business_number || '',
        evidence: { page: 1, quote: rawAnalysis.business_number || '' }
      },
      industry: {
        value: rawAnalysis.industry || '',
        evidence: { page: 1, quote: rawAnalysis.industry || '' }
      },
      statement_year: {
        value: rawAnalysis.statement_year || '',
        evidence: { page: 1, quote: rawAnalysis.statement_year || '' }
      },
      revenue: {
        value: rawAnalysis.revenue || 0,
        evidence: { page: 1, quote: String(rawAnalysis.revenue || 0) }
      },
      retained_earnings: {
        value: rawAnalysis.retained_earnings || 0,
        evidence: { page: 1, quote: String(rawAnalysis.retained_earnings || 0) }
      },
      loans_to_officers: {
        value: rawAnalysis.loans_to_officers || 0,
        evidence: { page: 1, quote: String(rawAnalysis.loans_to_officers || 0) }
      }
    };

    console.log(`[ANALYZE] 변환 완료 (프론트엔드 호환 구조)`);

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

// GPT 사용 가능한 모델 목록 조회 엔드포인트
export const getGPTModels = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    // GPT API 키 로드
    let apiKey;
    try {
      apiKey = loadKey(consultantId, 'gpt');
    } catch (keyError) {
      return res.status(400).json({ 
        ok: false, 
        error: 'NO_GPT_API_KEY',
        message: 'GPT API 키가 등록되지 않았습니다.'
      });
    }

    // 모델 목록 조회
    const client = new OpenAI({ apiKey });
    const list = await client.models.list();
    
    const models = list.data
      .filter(m => m.id.startsWith('gpt'))
      .map(m => ({
        id: m.id,
        owned_by: m.owned_by,
        created: m.created
      }))
      .sort((a, b) => {
        // 우선순위 정렬
        const priority = ['gpt-5.2', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini'];
        const aIndex = priority.indexOf(a.id);
        const bIndex = priority.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.id.localeCompare(b.id);
      });

    // 추천 모델 선택
    const plan = req.query.plan || 'free';
    const recommended = await pickBestGPTModel(apiKey, plan);

    res.json({
      ok: true,
      models,
      recommended,
      plan
    });

  } catch (error) {
    console.error('[GPT Models] 조회 실패:', error);
    
    if (error.status === 401) {
      return res.status(401).json({
        ok: false,
        error: 'INVALID_API_KEY',
        message: 'GPT API 키가 유효하지 않습니다.'
      });
    }
    
    res.status(500).json({
      ok: false,
      error: error.message || 'UNKNOWN_ERROR'
    });
  }
};
