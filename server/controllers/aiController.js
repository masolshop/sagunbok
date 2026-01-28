import { PROMPTS, SYSTEM_PROMPT, CONSULTANT_ZONE_SYSTEM_PROMPT, CRETOP_SYSTEM_PROMPT, FINANCIAL_SNAPSHOT_SYSTEM_PROMPT, PROMPT_VERSION } from "../prompts/catalog.js";
import { loadKey } from "../utils/cryptoStore.js";
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

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
    return model;  // ✅ 문자열만 반환
  }
  
  // 💻 코드 생성 → 코딩 강한 모델 우선
  if (taskType === TASK_TYPES.CODE_GEN) {
    const model = pickFirst(GPT_MODELS.CODING_GPT)
      || pickFirst(GPT_MODELS.BALANCED_GPT)
      || pickFirst(GPT_MODELS.CHEAP_GPT);
    
    if (!model) throw new Error('No suitable model for CODE_GEN');
    
    console.log(`[Model Select] Task: CODE_GEN → ${model}`);
    return model;  // ✅ 문자열만 반환
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
  return model;  // ✅ 문자열만 반환
}

// GPT 모델 자동 선택 (레거시 호환성 유지)
async function pickBestGPTModel(apiKey, plan = 'free', taskType = TASK_TYPES.CONSULTING_STANDARD) {
  try {
    const client = new OpenAI({ apiKey });
    const list = await client.models.list();
    const availableModels = list.data.map(m => m.id);
    
    console.log(`[GPT Auto] 사용 가능한 모델: ${availableModels.length}개`);
    
    // Task Type 기반 선택
    const model = selectGPTModel(availableModels, taskType, plan);
    
    console.log(`[GPT Auto] ✅ 선택된 모델: ${model}`);
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

// 강화된 추출 스키마 (단위/스케일 검증 포함)
const EXTRACTION_SCHEMA = {
  meta: {
    company_name: null,
    asof_date: null,
    detected_units: [],
    notes: []
  },
  items: [
    {
      key: "company_name",
      original_text: null,
      unit: null,
      multiplier_to_won: 1,
      value_won: null,
      pretty_krw: null,
      confidence: 0,
      evidence: { page: null, section_hint: null }
    }
  ],
  anomalies: []
};

// PDF 추출용 강화 프롬프트 (단위/스케일 자동 교정)
const PDF_EXTRACTION_PROMPT = `
너는 PDF 재무제표에서 숫자를 정확히 추출하는 회계 데이터 추출기다.

[필수 규칙]
1) 단위 감지: (단위: 원/천원/백만원/억원) 문구를 우선 탐색한다. 단위가 천원이면 모든 표 숫자에 ×1,000을 적용해 원화로 변환한다.
2) 모든 금액 항목은 반드시 5개 필드를 함께 출력:
   - original_text: PDF에 보이는 원문 문자열(콤마 포함)
   - unit: 원/천원/백만원/억원/unknown
   - multiplier_to_won: 1/1000/1000000/100000000
   - value_won: 변환된 정수 원화(콤마 없는 숫자)
   - pretty_krw: 사람이 읽는 한글 단위(예: 1조 2,295억…)
3) 교차검증:
   - '재무현황 개요(억원)' 값과 '손익계산서(천원)' 값의 스케일이 일치하는지 검사한다.
   - 10/100/1000배 오류가 의심되면 anomalies에 기록하고, scale_fix(multiplier)를 제안한다.
4) 계정 매핑 강화:
   - 가지급금은 {가지급금, 단기대여금, 임원/주주/종업원대여금, 기타당좌자산 중 가지급금성} 후보를 모두 검색한다.
   - '0원'으로 출력하기 전, 후보 계정이 존재하는지 최소 2번 확인한다.
5) 출력은 오직 JSON만. 설명/마크다운/코드블럭 금지.

추출 항목 (2024 기준 우선):
- 회사명, 대표자, 사업자등록번호, 업종, 결산기준일
- 매출액, 복리후생비, 이익잉여금, 미처분이익잉여금, 가지급금

출력 JSON 스키마:
{
  "meta": {
    "company_name": "",
    "asof_date": "",
    "detected_units": [],
    "notes": []
  },
  "items": [
    {
      "key": "company_name|ceo_name|business_number|industry|statement_year|revenue|retained_earnings|loans_to_officers|welfare_expenses",
      "original_text": "PDF 원문",
      "unit": "원|천원|백만원|억원|unknown",
      "multiplier_to_won": 1,
      "value_won": 0,
      "pretty_krw": "1조 2,295억 원",
      "confidence": 0.95,
      "evidence": {
        "page": 1,
        "section_hint": "손익계산서 / 재무상태표"
      }
    }
  ],
  "anomalies": [
    {
      "issue": "스케일 불일치",
      "suspected_cause": "단위 누락 (천원→원 변환 안됨)",
      "scale_fix_multiplier_to_won": 1000,
      "how_to_verify": "재무현황 개요(억원)와 표(천원) 비교"
    }
  ]
}
`;

// ✅ model을 항상 문자열로 정규화 (UI에서 {label,value} 등 객체로 들어오는 경우까지 대응)
function normalizeModel(model) {
  if (typeof model === 'string') return model.trim();

  // 흔한 UI 옵션 객체 / 서버 응답 객체 대응
  if (model && typeof model === 'object') {
    if (typeof model.id === 'string') return model.id.trim();
    if (typeof model.value === 'string') return model.value.trim();
    if (typeof model.model === 'string') return model.model.trim();
    if (typeof model.name === 'string') return model.name.trim();
  }
  return '';
}

function startsWithAny(modelStr, prefixes) {
  if (typeof modelStr !== 'string' || modelStr.length === 0) return false;
  return prefixes.some((p) => modelStr.startsWith(p));
}

// 🔧 모델별 토큰 파라미터 자동 선택 (o3/o4-mini/gpt-5 계열 호환)
function buildTokenParams(model, maxTokens) {
  const modelId = normalizeModel(model);
  console.log('[buildTokenParams]', { model, modelId, type: typeof model });

  // Reasoning 모델(o3, o4-mini) 및 최신 gpt-5 계열은 max_completion_tokens 사용
  if (startsWithAny(modelId, ['o3', 'o4', 'gpt-5'])) {
    return { max_completion_tokens: maxTokens };
  }

  // 기존 모델(gpt-4, gpt-4o, gpt-4.1 등)은 max_tokens 사용
  return { max_tokens: maxTokens };
}

// 🔧 모델별 temperature 파라미터 체크 (reasoning 모델은 temperature 불가)
function buildTemperatureParam(model, temperature) {
  const modelId = normalizeModel(model);
  console.log('[buildTemperatureParam]', { model, modelId, type: typeof model });

  // Reasoning 모델은 temperature를 지원하지 않음
  if (startsWithAny(modelId, ['o3', 'o4'])) {
    return {};  // temperature 파라미터 제외
  }

  return { temperature };
}

// 🎯 OpenAI PDF 추출 (Chat Completions + JSON 모드 강화)
async function extractPdfWithOpenAI(apiKey, pdfBuffer, originalFilename, options = {}) {
  try {
    console.log(`[GPT PDF] 추출 시작... (파일: ${originalFilename}, 크기: ${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    
    // 1. PDF 파일 헤더 검증 (%PDF로 시작해야 함)
    const header = pdfBuffer.slice(0, 4).toString('utf8');
    if (header !== '%PDF') {
      throw new Error(`업로드된 파일이 PDF가 아닙니다. 헤더=${JSON.stringify(header)} (처음 4바이트). 실제 타입을 확인하세요.`);
    }
    
    // 2. PDF를 텍스트로 변환 (pdf-parse)
    console.log(`[GPT PDF] PDF 텍스트 추출 시작...`);
    const parser = new PDFParse({ data: pdfBuffer });
    let pdfText = '';
    let numPages = 0;
    
    try {
      const pdfData = await parser.getText();
      pdfText = pdfData.text || '';
      numPages = pdfData.total || pdfData.totalPages || pdfData.numpages || 0;
      console.log(`[GPT PDF] PDF 텍스트 추출 완료 (${numPages}페이지, ${pdfText.length}자)`);
    } finally {
      await parser.destroy();
    }
    
    if (!pdfText.trim()) {
      throw new Error('PDF에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF이거나 보호된 PDF일 수 있습니다.');
    }
    
    const client = new OpenAI({ apiKey });
    
    // 3. 모델 자동 선택 (재무제표 분석 = FIN_STATEMENT_ANALYSIS)
    const taskType = TASK_TYPES.FIN_STATEMENT_ANALYSIS;
    const model = options.model || await pickBestGPTModel(apiKey, options.plan || 'free', taskType);
    console.log(`[GPT PDF] 사용 모델: ${model} (Task: ${taskType})`);
    
    // 4. Chat Completions API로 텍스트 분석 (JSON 모드 강화)
    const systemPrompt = `너는 한국 재무제표 전문 회계사다. 아래 규칙에 따라 재무제표 PDF 텍스트에서 데이터를 추출해 **반드시 유효한 JSON만** 출력해야 한다.

규칙:
1. 출력은 반드시 { 로 시작하고 } 로 끝나야 함
2. 모든 키는 큰따옴표로 감싸야 함
3. 문자열 값도 큰따옴표로 감싸야 함
4. 주석이나 설명 금지
5. JSON 이외의 텍스트 절대 금지

출력 스키마:
{
  "company_name": "회사명",
  "ceo_name": "대표자명",
  "business_number": "사업자등록번호",
  "industry": "업종",
  "statement_year": "재무제표 연도",
  "revenue": {
    "original_text": "9,571,217",
    "unit": "천원",
    "multiplier_to_won": 1000,
    "value_won": 9571217000,
    "pretty_krw": "95억 7천만원",
    "evidence": "손익계산서 매출액 항목"
  },
  "retained_earnings": { "original_text": "", "unit": "", "multiplier_to_won": 1, "value_won": 0, "pretty_krw": "", "evidence": "" },
  "loans_to_officers": { "original_text": "", "unit": "", "multiplier_to_won": 1, "value_won": 0, "pretty_krw": "", "evidence": "" },
  "welfare_expenses": { "original_text": "", "unit": "", "multiplier_to_won": 1, "value_won": 0, "pretty_krw": "", "evidence": "" },
  "anomalies": []
}`;

    const userPrompt = `=== 재무제표 텍스트 ===
${pdfText.slice(0, 50000)}

위 재무제표에서 아래 항목을 추출해 **유효한 JSON만** 출력:
- 회사명, 대표자명, 사업자등록번호, 업종, 재무제표 연도
- 매출액, 이익잉여금, 가지급금 (후보: 가지급금/단기대여금/대여금/임원대여금), 복리후생비

중요: { 로 시작해서 } 로 끝나는 유효한 JSON만 출력. 주석/설명 금지.`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },  // ✅ JSON 모드 강제
      ...buildTokenParams(model, 4096),
      ...buildTemperatureParam(model, 0.1)
    });
    
    console.log(`[GPT PDF] 추출 완료 (모델: ${model})`);
    
    // 5. 응답 추출 및 JSON 검증
    const rawContent = response.choices[0].message.content;
    console.log(`[GPT PDF] 원본 응답 길이: ${rawContent?.length || 0}자`);
    
    // JSON 검증
    try {
      JSON.parse(rawContent);  // 파싱 테스트
      console.log(`[GPT PDF] JSON 검증 성공`);
    } catch (parseError) {
      console.error(`[GPT PDF] JSON 파싱 실패:`, parseError.message);
      console.error(`[GPT PDF] 원본 응답 (처음 500자):`, rawContent?.slice(0, 500));
      throw new Error(`GPT 응답이 유효한 JSON이 아닙니다: ${parseError.message}`);
    }
    
    return rawContent
    
  } catch (error) {
    // 에러 타입별 처리
    if (error.status === 401) {
      throw new Error('GPT API 키가 유효하지 않습니다.');
    } else if (error.status === 403 || error.status === 404) {
      throw new Error('선택된 모델을 사용할 권한이 없습니다.');
    } else if (error.status === 429) {
      throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    } else if (error.code === 'ENOENT' || error.message?.includes('invalid_file_format')) {
      throw new Error('PDF 파일을 읽을 수 없습니다. 파일이 손상되었거나 이미지 기반 PDF일 수 있습니다.');
    }
    
    console.error(`[GPT PDF] 추출 실패:`, error.message);
    throw new Error(`GPT PDF extraction failed: ${error.message}`);
  }
}

// 📋 Gemini 2.5/3.0 Controlled Generation용 Response Schema (2026년형 - 사근복닷컴 전용)
// Claude 컨설팅 반영: 가지급금 추출 정밀도 향상, 단위 환산 명시, 복리후생비 추가
const financeSchema = {
  type: "object",
  description: "한국 기업 재무제표 PDF에서 추출한 9대 핵심 금융 지표",
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
    },
    welfare_expenses: {
      type: "number",
      description: "복리후생비 (단위: 원). 손익계산서의 '판매비와관리비' 또는 '판매비및일반관리비' 중 '복리후생비' 항목. 주의: 재무제표 단위가 '천원'이면 반드시 1,000을 곱해 '원' 단위로 환산. 예: 50000 (천원) → 50000000 (원). 없으면 0",
      nullable: true
    }
  },
  required: ["company_name", "statement_year"]
};

// Gemini PDF 추출 (inline bytes + Controlled Generation)
async function extractPdfWithGemini(apiKey, pdfBuffer, originalFilename, modelType = 'gemini-flash') {
  try {
    console.log(`[GEMINI PDF] 추출 시작... (파일: ${originalFilename}, 크기: ${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    
    // 모델 매핑: UI에서 온 값 → Gemini API 모델명
    const modelMap = {
      'gemini-pro': 'gemini-1.5-pro',           // 고성능
      'gemini-flash': 'gemini-1.5-flash',       // 안정 버전 (권장)
      'gemini-lite': 'gemini-1.5-flash',        // 안정 버전
      'gemini-preview': 'gemini-1.5-flash',     // 기본값으로 폴백
      'gemini': 'gemini-1.5-flash'              // 기본값
    };
    
    const actualModel = modelMap[modelType] || 'gemini-1.5-flash';
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
    
    // 📝 Claude 컨설팅 기반 프롬프트 (2026년 사근복닷컴 전용 - 9개 필드)
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

3️⃣ **복리후생비 추출**
   손익계산서의 **판매비와관리비** 또는 **판매비및일반관리비** 항목에서:
   - "복리후생비" 항목 찾기
   - 주의: 재무제표 단위가 '천원'이면 반드시 1,000을 곱해 '원' 단위로 환산
   - 예: 재무제표에 "복리후생비 50,000 (천원)" → JSON 출력: 50000000
   - 없으면 **0으로 처리**

4️⃣ **최신 데이터 우선**
   - 여러 연도가 표시된 경우 **가장 우측(최신 결산일)** 데이터 사용
   - 예: "2023년 / 2024년" 표시 시 → 2024년 데이터만 추출

5️⃣ **정확한 항목 식별**
   - 매출액: 손익계산서의 **"매출액(*)"** 또는 **"I. 매출액"** 합계
   - 이익잉여금: 재무상태표 자본 항목의 **"이익잉여금(*)"** 또는 **"V. 이익잉여금"**
   - 복리후생비: 손익계산서 판매비와관리비의 **"복리후생비"**
   - 결손금은 음수(-)로 표시

6️⃣ **출력 형식**
   - 숫자는 콤마 없이 순수 숫자로 반환 (예: 9571217000)
   - 사업자등록번호는 하이픈 포함 (예: "122-81-94563")
   - 업종은 구체적으로 (예: "태양광 발전 장치 제조 및 공사업")

[예시]
재무제표에 "매출액 9,571,217 (단위: 천원)" 표시 시:
→ revenue: 9571217000 (천원 × 1,000)

재무제표에 "복리후생비 50,000 (단위: 천원)" 표시 시:
→ welfare_expenses: 50000000 (천원 × 1,000)

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
    ...buildTokenParams(model, maxTokens),  // ✅ 모델별 자동 토큰 파라미터
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
  try {
    // 모델 매핑: UI에서 온 값 → Gemini API 모델명
    const modelMap = {
      'gemini-pro': 'gemini-1.5-pro',           // 고성능 (1.5-pro로 변경)
      'gemini-flash': 'gemini-1.5-flash',       // 안정 버전 (권장)
      'gemini-lite': 'gemini-1.5-flash',        // 안정 버전
      'gemini-preview': 'gemini-1.5-flash',     // 기본값으로 폴백
      'gemini': 'gemini-1.5-flash'              // 기본값
    };
    
    const actualModel = modelMap[modelType] || process.env.GEMINI_MODEL || "gemini-1.5-flash";
    console.log(`[GEMINI SDK] Using model: ${actualModel}`);
    
    // 🎯 SDK 사용 (REST API 대신)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: actualModel,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      }
    });
    
    const prompt = `${system}\n\n---\n\n${userPrompt}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error(`[GEMINI SDK ERROR]`, error);
    throw new Error(`GEMINI_ERROR: ${error.message}`);
  }
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
    console.log(`[ANALYZE] 응답 미리보기 (처음 500자):`, responseText.substring(0, 500));

    // JSON 파싱 시도 (여러 방법으로 JSON 추출)
    let rawAnalysis;
    try {
      // GPT의 response_format: json_object는 이미 순수 JSON 반환
      // 하지만 Claude/Gemini는 마크다운 코드 블록으로 감쌀 수 있음
      
      let cleanedText = responseText.trim();
      
      // 1. 마크다운 코드 블록 제거 (Claude/Gemini 대응)
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      }
      
      // 2. JSON 블록 찾기 (중괄호 기준)
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error('JSON 블록을 찾을 수 없습니다. 응답에 { } 구조가 없습니다.');
      }
      
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      
      // 3. JSON 파싱 시도
      rawAnalysis = JSON.parse(cleanedText);
      console.log(`[ANALYZE] JSON 파싱 성공`);
      console.log(`[ANALYZE] 추출 결과 키:`, Object.keys(rawAnalysis));
      
      // 4. 필수 필드 검증
      if (!rawAnalysis.company_name && !rawAnalysis.revenue && !rawAnalysis.items) {
        console.warn(`[ANALYZE] 필수 필드 누락: company_name, revenue, items 모두 없음`);
      }
      
    } catch (parseError) {
      console.error(`[ANALYZE] JSON 파싱 실패:`, parseError.message);
      console.error(`[ANALYZE] 원본 응답 (처음 1000자):`, responseText.substring(0, 1000));
      console.error(`[ANALYZE] 원본 응답 (마지막 500자):`, responseText.substring(Math.max(0, responseText.length - 500)));
      return res.status(500).json({ 
        ok: false, 
        error: "JSON_PARSE_FAILED", 
        message: `AI 응답을 JSON으로 파싱할 수 없습니다: ${parseError.message}`,
        rawResponse: responseText.substring(0, 2000), // 처음 2000자만 반환 (너무 길면 문제)
        parseError: parseError.message,
        modelType
      });
    }

    // ✅ 안전장치: 새 스키마(items 배열) vs 구 스키마(직접 필드) 자동 감지
    const parseNewSchema = (data) => {
      if (data.items && Array.isArray(data.items)) {
        // 새 스키마: items 배열을 객체로 변환
        const result = {};
        
        // meta 정보에서 기본 필드 추출
        if (data.meta) {
          result.company_name = data.meta.company_name || '';
          result.ceo_name = data.meta.ceo_name || '';
          result.business_number = data.meta.business_registration_number || data.meta.business_number || '';
          result.industry = data.meta.industry || '';
          result.statement_year = data.meta.asof_date || data.meta.statement_year || '';
        }
        
        // items 배열 처리
        data.items.forEach(item => {
          const key = item.key;
          // key 매핑 (GPT가 다른 이름을 사용할 수 있음)
          const mappedKey = key === 'undistributed_retained_earnings' ? 'unappropriated_retained_earnings' : key;
          
          result[mappedKey] = {
            original_text: item.original_text,
            unit: item.unit,
            multiplier_to_won: item.multiplier_to_won || 1,
            value_won: item.value_won,
            pretty_krw: item.pretty_krw,
            confidence: item.confidence || 0.9,
            evidence: item.evidence || {}
          };
        });
        
        result._anomalies = data.anomalies || [];
        result._meta = data.meta || {};
        
        console.log('[ANALYZE] 새 스키마 변환 완료:', {
          company_name: result.company_name,
          revenue: result.revenue?.value_won,
          has_meta: !!data.meta,
          items_count: data.items.length
        });
        
        return result;
      }
      // 구 스키마: 그대로 반환
      console.log('[ANALYZE] 구 스키마 사용');
      return data;
    };

    const parsedData = parseNewSchema(rawAnalysis);

    // ✅ 안전장치 1: value_won 재계산 (LLM 숫자 실수 방지)
    const recalculateValueWon = (item) => {
      if (!item || !item.original_text) return 0;
      
      // original_text에서 숫자 추출
      const numStr = String(item.original_text).replace(/[^\d.-]/g, '');
      const num = Number(numStr);
      
      if (isNaN(num)) return 0;
      
      // multiplier 적용
      const multiplier = item.multiplier_to_won || 1;
      return Math.floor(num * multiplier);
    };

    // ✅ 안전장치 2: 스케일 검증 (매출액 기준)
    const verifyScale = (revenue, expectedRange) => {
      if (!revenue) return true;
      const val = typeof revenue === 'number' ? revenue : recalculateValueWon(revenue);
      
      // 예상 범위: 1억 ~ 100조
      const min = 100000000; // 1억
      const max = 100000000000000; // 100조
      
      if (val < min || val > max) {
        console.warn(`[ANALYZE] 스케일 이상: 매출액 ${val}원이 범위(1억~100조)를 벗어남`);
        return false;
      }
      return true;
    };

    // ✅ 안전장치 3: 가지급금 0 방지
    const checkLoansToOfficers = (loans) => {
      if (!loans || !loans.original_text) {
        console.warn(`[ANALYZE] 가지급금 누락: 후보 계정(단기대여금/임원대여금) 재확인 필요`);
      }
    };

    // 🔄 프론트엔드 호환성을 위해 ExtractedFieldsTable 구조로 변환
    // { value, confidence, page_number, snippet, method }
    
    // 1) {value,...} 형태면 value만 꺼내기 (GPT가 중첩 객체를 반환하는 경우 대비)
    const unwrap = (v) => {
      if (v == null) return null;
      if (typeof v === 'object') {
        if ('value' in v) return v.value ?? null;
        return null;
      }
      return v;
    };

    // 2) 금액 파싱: "9,571,217,000원" / "95억 7,121만 7,000" / multiplier 처리
    const parseMoney = (v, autoMultiplier = null) => {
      // 🔥 최우선: 현재 GPT 응답 형식 처리 { value: "1,229,518,853", unit: "천원", ... }
      if (v && typeof v === 'object') {
        let numValue = null;
        let multiplier = autoMultiplier || 1;
        
        // unit 필드로 multiplier 결정
        if (v.unit) {
          const unitStr = String(v.unit).trim();
          if (unitStr === '천원') multiplier = 1000;
          else if (unitStr === '백만원') multiplier = 1000000;
          else if (unitStr === '억원') multiplier = 100000000;
          else if (unitStr === '원') multiplier = 1;
        }
        
        // value 필드에서 숫자 추출
        if (v.value != null) {
          const numStr = String(v.value).replace(/[^\d.-]/g, '');
          numValue = Number(numStr);
        } else if (v.original_text != null) {
          const numStr = String(v.original_text).replace(/[^\d.-]/g, '');
          numValue = Number(numStr);
        }
        
        // multiplier_to_won이 명시되어 있으면 우선 사용
        if (v.multiplier_to_won != null) {
          multiplier = v.multiplier_to_won;
        }
        
        // value_won이 이미 계산되어 있으면 사용
        if (v.value_won != null && Number.isFinite(v.value_won)) {
          return v.value_won;
        }
        
        // 계산
        if (numValue != null && !isNaN(numValue) && Number.isFinite(numValue)) {
          const result = Math.floor(numValue * multiplier);
          console.log(`[parseMoney] ${numValue} × ${multiplier} = ${result}원`);
          return result;
        }
      }
      
      // 기존 로직 (문자열/숫자 처리)
      v = unwrap(v);
      if (v == null) return 0;
      if (typeof v === 'number') return Number.isFinite(v) ? v : 0;

      const s = String(v).replace(/\s+/g, ' ').trim();
      if (!s) return 0;

      // 2-1) 단순 숫자(콤마/원 포함) 먼저
      const plain = s.replace(/[^\d.-]/g, ''); // 콤마/원/공백 제거
      if (/^-?\d+(\.\d+)?$/.test(plain)) {
        const num = Number(plain);
        return Math.floor(num * (autoMultiplier || 1));
      }

      // 2-2) 한국 단위(조/억/만) 처리: "95억 7,121만 7,000"
      let total = 0;
      const unitMap = { '조': 1e12, '억': 1e8, '만': 1e4 };

      let rest = s;
      for (const [u, mul] of Object.entries(unitMap)) {
        const m = rest.match(new RegExp(`([\\d,\\.]+)${u}`));
        if (m) {
          const num = Number(m[1].replace(/,/g, ''));
          if (Number.isFinite(num)) total += num * mul;
          rest = rest.replace(m[0], ''); // 제거
        }
      }

      // 남은 숫자(원 단위) 더하기
      const tail = rest.replace(/[^\d.-]/g, '');
      if (/^-?\d+(\.\d+)?$/.test(tail)) total += Number(tail);

      return Number.isFinite(total) ? total : 0;
    };
    
    const analysis = {
      company_name: {
        value: String(unwrap(parsedData.company_name) ?? ''),
        confidence: 0.95,
        page_number: 1,
        snippet: String(unwrap(parsedData.company_name) ?? ''),
        method: 'ai_extraction'
      },
      ceo_name: {
        value: String(unwrap(parsedData.ceo_name) ?? ''),
        confidence: 0.90,
        page_number: 1,
        snippet: String(unwrap(parsedData.ceo_name) ?? ''),
        method: 'ai_extraction'
      },
      business_number: {
        value: String(unwrap(parsedData.business_number) ?? ''),
        confidence: 0.92,
        page_number: 1,
        snippet: String(unwrap(parsedData.business_number) ?? ''),
        method: 'ai_extraction'
      },
      industry: {
        value: String(unwrap(parsedData.industry) ?? ''),
        confidence: 0.88,
        page_number: 1,
        snippet: String(unwrap(parsedData.industry) ?? ''),
        method: 'ai_extraction'
      },
      statement_year: {
        value: String(unwrap(parsedData.statement_year) ?? ''),
        confidence: 0.95,
        page_number: 1,
        snippet: String(unwrap(parsedData.statement_year) ?? ''),
        method: 'ai_extraction'
      },
      revenue: {
        value: String(parseMoney(parsedData.revenue)),
        confidence: 0.85,
        page_number: 1,
        snippet: `매출액: ${parseMoney(parsedData.revenue).toLocaleString()}원`,
        method: 'ai_extraction',
        unit: '원'
      },
      retained_earnings: {
        value: String(parseMoney(parsedData.retained_earnings)),
        confidence: 0.85,
        page_number: 1,
        snippet: `이익잉여금: ${parseMoney(parsedData.retained_earnings).toLocaleString()}원`,
        method: 'ai_extraction',
        unit: '원'
      },
      loans_to_officers: {
        value: String(parseMoney(parsedData.loans_to_officers)),
        confidence: 0.80,
        page_number: 1,
        snippet: `가지급금: ${parseMoney(parsedData.loans_to_officers).toLocaleString()}원`,
        method: 'ai_extraction',
        unit: '원'
      },
      welfare_expenses: {
        value: String(parseMoney(parsedData.welfare_expenses)),
        confidence: 0.85,
        page_number: 1,
        snippet: `복리후생비: ${parseMoney(parsedData.welfare_expenses).toLocaleString()}원`,
        method: 'ai_extraction',
        unit: '원'
      }
    };

    console.log(`[ANALYZE] 변환 완료 (프론트엔드 호환 구조)`);
    console.log(`[ANALYZE] 최종 응답 샘플:`, {
      company_name: analysis.company_name?.value,
      revenue: analysis.revenue?.value,
      welfare_expenses: analysis.welfare_expenses?.value
    });

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

// 재무제표 스냅샷 분석 (사근복 관점)
export const analyzeFinancialSnapshot = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const {
      company_name,
      industry,
      year,
      employee_count,
      unit,
      balance_sheet,
      income_statement,
      cash_flow,
      model_type
    } = req.body;

    console.log('[SNAPSHOT] 스냅샷 분석 시작:', { company_name, model_type });

    if (!company_name || !balance_sheet || !income_statement) {
      return res.status(400).json({ ok: false, error: "MISSING_DATA" });
    }

    // API 키 로드
    let apiKey;
    try {
      apiKey = loadKey(consultantId, model_type || 'gpt');
    } catch (keyError) {
      return res.status(400).json({ 
        ok: false, 
        error: keyError.message || `NO_SAVED_API_KEY_FOR_${(model_type || 'gpt').toUpperCase()}`
      });
    }

    // 템플릿 변수 매핑
    const userPrompt = PROMPTS.FINANCIAL_SNAPSHOT.SNAPSHOT_REPORT
      .replace('{{company_name}}', company_name)
      .replace('{{industry_name_or_code}}', industry || '미입력')
      .replace('{{year}}', year || '2024')
      .replace('{{employee_count_or_unknown}}', employee_count || '미입력')
      .replace('{{unit}}', unit || '원')
      .replace('{{revenue_value_won}}', income_statement.매출액 || income_statement.revenue || '0')
      .replace('{{net_income_value_won}}', income_statement.당기순이익 || income_statement.net_income || '0')
      .replace('{{retained_earnings_value_won}}', balance_sheet.이익잉여금 || balance_sheet.retained_earnings || '0')
      .replace('{{unappropriated_retained_earnings_value_won}}', balance_sheet.미처분이익잉여금 || balance_sheet.unappropriated_retained_earnings || '0')
      .replace('{{advances_to_officers_value_won}}', balance_sheet.가지급금 || balance_sheet.advances_to_officers || '0')
      .replace('{{welfare_expense_value_won}}', income_statement.복리후생비 || income_statement.welfare_expense || '0')
      .replace('{{trend_available_yes_no}}', 'unknown')
      .replace('{{owner_issues_or_unknown}}', 'unknown');

    console.log('[SNAPSHOT] 프롬프트 생성 완료');

    // AI 호출
    let analysis;
    
    if (model_type === 'gemini') {
      // Gemini 호출
      console.log('[SNAPSHOT] Gemini 호출 시작');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent([
        { text: FINANCIAL_SNAPSHOT_SYSTEM_PROMPT },
        { text: userPrompt }
      ]);
      
      analysis = result.response.text();
      console.log('[SNAPSHOT] Gemini 응답 완료');
      
    } else {
      // GPT 호출 (Reasoning 모델 우선)
      console.log('[SNAPSHOT] GPT 호출 시작');
      const openai = new OpenAI({ apiKey });
      
      // 사용 가능한 모델 조회
      const modelsList = await openai.models.list();
      const availableModels = modelsList.data.map(m => m.id);
      
      // 재무 분석용 모델 선택
      const selectedModel = selectGPTModel(
        availableModels,
        TASK_TYPES.FIN_STATEMENT_ANALYSIS,
        'free',
        'balanced'
      );
      
      console.log('[SNAPSHOT] 선택된 모델:', selectedModel);
      
      // Temperature 파라미터 빌드 (Reasoning 모델은 제외)
      const tempParams = buildTemperatureParam(selectedModel, 0.7);
      
      // Token 파라미터 빌드
      const tokenParams = buildTokenParams(selectedModel, 4096);
      
      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: FINANCIAL_SNAPSHOT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        ...tempParams,
        ...tokenParams
      });
      
      analysis = completion.choices[0].message.content;
      console.log('[SNAPSHOT] GPT 응답 완료');
    }

    res.json({
      ok: true,
      analysis,
      model_type: model_type || 'gpt',
      createdAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('[SNAPSHOT] 오류:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
