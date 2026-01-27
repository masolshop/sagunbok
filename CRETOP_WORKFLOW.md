# 📊 재무제표 PDF 업로드 프로세스 & 프롬프트 아키텍처

## 🎯 전체 프로세스 개요

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          사용자 인터페이스                                 │
│                     (CretopReportPage.tsx)                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  1. API 키 등록/확인       │
                    │  (Claude/GPT/Gemini)     │
                    └───────────────────────────┘
                                    │
                                    ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         2단계 AI 프로세싱                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                    │
                        ┌───────────┴──────────┐
                        ▼                      ▼
            ┌─────────────────────┐   ┌──────────────────────┐
            │  STEP 1: PDF 분석   │   │  STEP 2: 리포트 생성 │
            │  (선택적)            │   │  (필수)              │
            └─────────────────────┘   └──────────────────────┘
                        │                      │
                        ▼                      ▼
            ┌─────────────────────┐   ┌──────────────────────┐
            │  JSON 데이터 추출   │   │  CRETOP 종합 리포트  │
            │  자동 입력           │   │  생성 및 표시        │
            └─────────────────────┘   └──────────────────────┘
```

---

## 📋 STEP 1: PDF 분석 프로세스 (선택적)

### 1️⃣ 사용자 액션
```
┌──────────────────────────────────────────────────────────┐
│  PDF/Excel 파일 업로드                                     │
│  - 드래그 앤 드롭                                           │
│  - 클릭하여 선택                                            │
│  - 지원 포맷: PDF, .xls, .xlsx                            │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  프론트엔드: handleFileSelect()                            │
│  - 파일 타입 검증                                           │
│  - FormData 생성                                          │
│  - API 키 확인                                             │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  API 호출:                                                 │
│  POST /api/ai/analyze-financial-statement               │
│  - FormData: file + modelType                           │
│  - Headers: Authorization (Bearer token)                │
└──────────────────────────────────────────────────────────┘
```

### 2️⃣ 백엔드 처리
```javascript
// server/controllers/aiController.js
export const analyzeFinancialStatement = async (req, res) => {
  // 1. 인증 확인
  const consultantId = req.user?.id;
  
  // 2. API 키 로드 (모델별)
  const apiKey = loadKey(consultantId, modelType);
  
  // 3. System Prompt 구성
  const systemPrompt = `
    당신은 재무제표 분석 전문가입니다.
    업로드된 재무제표를 분석하여 JSON 형식으로 추출하세요.
  `;
  
  // 4. User Prompt 구성
  const userPrompt = `재무제표 데이터를 분석하여 JSON으로 추출하세요`;
  
  // 5. AI 호출
  const text = await callAI(modelType, apiKey, systemPrompt, userPrompt);
  
  // 6. JSON 파싱 및 반환
  const analysis = JSON.parse(cleaned);
  return res.json({ ok: true, analysis });
};
```

### 3️⃣ AI 프롬프트 구조

#### 🤖 System Prompt (PDF 분석 전용)
```
당신은 재무제표 분석 전문가입니다.
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

규칙:
- 숫자는 원 단위로 표시
- 데이터가 없으면 0으로 표시
- 반드시 JSON만 출력 (마크다운 코드블록 제외)
```

#### 📝 User Prompt
```
아래 재무제표 데이터를 분석하여 JSON으로 추출하세요:

[파일 내용 또는 추출된 텍스트]
```

### 4️⃣ 응답 처리
```javascript
// 프론트엔드: CretopReportPage.tsx
const data = await res.json();

if (data.ok && data.analysis) {
  // 자동 입력
  if (data.analysis.balance_sheet) 
    setBalanceSheet(JSON.stringify(data.analysis.balance_sheet, null, 2));
  
  if (data.analysis.income_statement) 
    setIncomeStatement(JSON.stringify(data.analysis.income_statement, null, 2));
  
  if (data.analysis.cash_flow) 
    setCashflow(JSON.stringify(data.analysis.cash_flow, null, 2));
  
  if (data.analysis.company_name) 
    setCompanyName(data.analysis.company_name);
  
  if (data.analysis.statement_date) 
    setStatementDate(data.analysis.statement_date);
  
  alert('✅ 재무제표 분석 완료! 데이터가 자동 입력되었습니다.');
}
```

---

## 📊 STEP 2: CRETOP 리포트 생성 프로세스 (필수)

### 1️⃣ 사용자 액션
```
┌──────────────────────────────────────────────────────────┐
│  기본 정보 입력                                             │
│  ✅ 회사명 (필수)                                           │
│  ✅ 결산일 (필수)                                           │
│  ⭕ 대표자명 (선택)                                         │
│  ⭕ 임직원수 (선택)                                         │
│  ⭕ 업종 (선택)                                             │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  재무제표 데이터 입력 (선택)                                │
│  - 재무상태표 (Balance Sheet) JSON                        │
│  - 손익계산서 (Income Statement) JSON                     │
│  - 현금흐름표 (Cash Flow) JSON                            │
│  ※ PDF 분석 시 자동 입력됨                                  │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  🚀 "CRETOP 기업분석 리포트 생성" 버튼 클릭                │
└──────────────────────────────────────────────────────────┘
```

### 2️⃣ API 호출 구조
```javascript
// 프론트엔드: handleGenerate()
const response = await fetch(`${API_BASE_URL}/api/ai/run`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...getAuthHeaders(), // Bearer token
  },
  body: JSON.stringify({
    module: "CRETOP_REPORT",      // 모듈 식별자
    action: "FULL_REPORT",         // 액션 타입
    modelType: selectedModel,      // claude/gpt/gemini
    calcResult: {
      // 기본 정보
      company_name: companyName,
      statement_date: statementDate,
      ceo_name: ceoName,
      employee_count: employeeCount,
      industry_name: industryName,
      
      // 재무제표 JSON
      balance_sheet_json: balanceSheet || "{}",
      income_statement_json: incomeStatement || "{}",
      cashflow_json: cashflow || "{}",
    },
  }),
});
```

### 3️⃣ 백엔드 프롬프트 처리
```javascript
// server/controllers/aiController.js
export const runAi = async (req, res) => {
  const { module, action, calcResult, modelType } = req.body;
  
  // 1. 프롬프트 템플릿 로드
  const tpl = PROMPTS?.[module]?.[action];
  // PROMPTS["CRETOP_REPORT"]["FULL_REPORT"]
  
  // 2. 시스템 프롬프트 선택
  let systemPrompt = CRETOP_SYSTEM_PROMPT;
  let maxTokens = 4096; // CRETOP는 긴 응답 필요
  
  // 3. User 프롬프트 렌더링
  const userPrompt = render(tpl, {
    company_name: calcResult.company_name,
    statement_date: calcResult.statement_date,
    balance_sheet_json: calcResult.balance_sheet_json,
    income_statement_json: calcResult.income_statement_json,
    cashflow_json: calcResult.cashflow_json,
    // ... 기타 필드
  });
  
  // 4. AI 호출
  const text = await callAI(modelType, apiKey, systemPrompt, userPrompt, maxTokens);
  
  // 5. JSON 파싱
  const parsedReport = JSON.parse(text);
  
  return res.json({
    ok: true,
    report: parsedReport,
    modelType,
  });
};
```

---

## 🎨 프롬프트 아키텍처 상세

### 📌 시스템 프롬프트 (CRETOP_SYSTEM_PROMPT)

```
┌────────────────────────────────────────────────────────────────┐
│  역할 정의                                                       │
│  "사근복닷컴 컨설턴트존의 수석 컨설턴트 AI"                       │
│  - 기업 재무제표/추가정보 기반 분석                               │
│  - CFO/대표가 바로 의사결정에 사용할 수 있는 리포트               │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│  핵심 목표 5가지                                                 │
│  1. 재무·세무 리스크/기회 '이슈체크' 요약                         │
│  2. 기업 라이프사이클 추정 및 점검과제 제시                       │
│  3. 재무상태/손익/현금흐름 요약 및 재무비율 분석                  │
│  4. 사근복·공근복 도입 적합성 및 로드맵 제시                      │
│  5. 데이터 없으면 추정 금지, "확인필요" 표기                      │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│  작성 규칙                                                       │
│  - 한국어 작성, 과장 금지                                        │
│  - 숫자는 단위 명확히 (원/천원/백만원/억원)                      │
│  - Markdown 표 사용                                             │
│  - 각 결론에 근거 명시                                           │
│  - 민감한 판단은 전제/가정/확인자료 명시                         │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│  이슈체크 로직                                                   │
│  - 기업가치 30억↑ → 배당/승계/세무리스크 점검                    │
│  - 미처분이익잉여금 10억↑ → 배당/자기주식/사근복 전략            │
│  - 가지급금/가수금/자기주식 체크리스트                           │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│  사근복/공근복 컨설팅 항목                                       │
│  A. 사근복 (사내근로복지기금)                                    │
│     - 도입 적합성 분석                                           │
│     - 재원 시나리오 (보수적/공격적)                              │
│     - 기대효과 (복지 + 세무효과)                                 │
│     - 운영체계 (정관/사업계획/통제)                              │
│     - 리스크 경고 (목적외 집행/임금대체성)                       │
│                                                                 │
│  B. 공근복 (공동근로복지기금)                                    │
│     - 적용 가능 케이스                                           │
│     - 매칭/지원 포인트                                           │
│     - 실행 로드맵                                                │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│  출력 포맷: JSON 스키마 고정                                     │
│  ⚠️ 설명/마크다운/코드블럭 절대 출력 금지                         │
│  ⚠️ 값이 없으면 "" 또는 "unknown"/"자료부족" 사용                 │
└────────────────────────────────────────────────────────────────┘
```

### 📌 출력 JSON 스키마

```json
{
  "report_meta": {
    "company_name": "회사명",
    "statement_period": "2023-12-31",
    "currency_unit": "KRW",
    "generated_at": "2024-01-26T...",
    "data_sources": ["재무상태표", "손익계산서"],
    "confidence": {
      "overall": 85,
      "missing_critical_data": ["현금흐름표", "주주명부"]
    }
  },
  
  "summary_one_page": {
    "headline": "건실한 재무구조, 복지투자 여력 충분 - 사근복 도입 적기",
    "key_findings": [
      {
        "title": "양호한 수익성",
        "impact": "high",
        "evidence": "영업이익률 12%, 당기순이익 8억원"
      }
    ],
    "top_risks": [
      {
        "title": "미처분이익잉여금 과다",
        "severity": "medium",
        "evidence": "15억원 누적, 배당 미실시",
        "next_action": "배당 또는 사근복 출연 검토"
      }
    ],
    "top_opportunities": [
      {
        "title": "사근복 도입 최적 타이밍",
        "priority": "high",
        "evidence": "현금흐름 양호, 복지 수요 증가",
        "next_action": "연 3억원 출연 시나리오 검토"
      }
    ]
  },
  
  "executive_overview": {
    "overall_grade": "양호",
    "diagnosis_lines": [
      "재무 건전성: 부채비율 45%, 유동비율 180%로 안정적",
      "수익성: 매출 100억, 영업이익 12억으로 우수",
      "성장성: 전년 대비 매출 15% 증가"
    ],
    "improvement_points": [
      {
        "point": "이익잉여금 활용 전략 부재",
        "why": "15억원 누적, 배당 미실시로 주주가치 저하",
        "how": "사근복 출연 또는 배당정책 수립"
      }
    ]
  },
  
  "issue_check": {
    "table": [
      {
        "item": "가지급금",
        "current_value": "없음",
        "status": "정상",
        "comment": "세무리스크 없음",
        "required_more_data": []
      }
    ],
    "flags": [
      {
        "flag": "미처분이익잉여금 과다",
        "severity": "medium",
        "reason": "15억원 누적, 활용 전략 필요"
      }
    ]
  },
  
  "lifecycle": {
    "stage": "성장기",
    "basis": [
      "매출 증가율 15%",
      "영업이익률 12%",
      "임직원 50명"
    ],
    "stage_tasks": [
      {
        "task": "복지제도 체계화",
        "priority": "high",
        "owner": "인사팀"
      }
    ]
  },
  
  "financial_summary": { /* 재무 요약 */ },
  "ratio_analysis": { /* 재무비율 분석 */ },
  "sagunbok_consulting": { /* 사근복 컨설팅 */ },
  "gongunbok_applicability": { /* 공근복 적용 가능성 */ },
  
  "roadmap": {
    "days_30_60_90": [
      {
        "task": "사근복 정관 초안 작성",
        "owner": "법무팀",
        "difficulty": "medium",
        "expected_impact": "법적 기반 확보"
      }
    ],
    "month_6": [ /* 6개월 로드맵 */ ],
    "month_12": [ /* 12개월 로드맵 */ ]
  },
  
  "additional_data_request": {
    "priority_1": ["주주명부", "임원급여 상세"],
    "priority_2": ["복지비 내역", "퇴직금 충당금"],
    "priority_3": ["사업계획서", "조직도"]
  },
  
  "disclaimer": {
    "lines": [
      "본 리포트는 제공된 재무제표 기반 분석입니다.",
      "정확한 판단을 위해 세무사/노무사 등 전문가 검토를 권장합니다."
    ]
  }
}
```

---

## 🔄 전체 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                        1. 사용자 입력                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ PDF 업로드   │  │ 기본정보입력 │  │ AI 모델선택  │         │
│  │  (선택)      │  │  (필수)      │  │ (Claude 등)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     2. PDF 분석 (선택적)                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  POST /api/ai/analyze-financial-statement             │    │
│  │  ↓                                                      │    │
│  │  System: "재무제표 분석 전문가..."                       │    │
│  │  User: "재무제표 데이터를 JSON으로 추출..."             │    │
│  │  ↓                                                      │    │
│  │  AI 응답: { balance_sheet: {...}, ... }               │    │
│  │  ↓                                                      │    │
│  │  자동 입력 → 입력 필드에 채워짐                         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   3. CRETOP 리포트 생성 (필수)                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  POST /api/ai/run                                      │    │
│  │  Body: {                                                │    │
│  │    module: "CRETOP_REPORT",                            │    │
│  │    action: "FULL_REPORT",                              │    │
│  │    modelType: "claude",                                │    │
│  │    calcResult: {                                        │    │
│  │      company_name: "테스트주식회사",                    │    │
│  │      statement_date: "2023-12-31",                     │    │
│  │      balance_sheet_json: "{...}",                      │    │
│  │      income_statement_json: "{...}",                   │    │
│  │      ...                                                │    │
│  │    }                                                    │    │
│  │  }                                                      │    │
│  │  ↓                                                      │    │
│  │  System: CRETOP_SYSTEM_PROMPT (4096 tokens)           │    │
│  │  User: render(PROMPTS.CRETOP_REPORT.FULL_REPORT, {...})│   │
│  │  ↓                                                      │    │
│  │  AI 응답: { report_meta: {...}, summary_one_page: {...}}│   │
│  │  ↓                                                      │    │
│  │  JSON 파싱 및 검증                                       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                       4. 리포트 렌더링                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ 종합 요약  │  │ 경영진단   │  │ 주요리스크 │              │
│  └────────────┘  └────────────┘  └────────────┘              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ 개선 기회  │  │ 실행로드맵 │  │ 면책사항   │              │
│  └────────────┘  └────────────┘  └────────────┘              │
│                                                                  │
│  💾 JSON 다운로드 버튼                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 주요 특징 정리

### ✅ 2단계 AI 프로세싱
1. **PDF 분석 (선택)**: 재무제표 자동 추출 → JSON 변환
2. **리포트 생성 (필수)**: CRETOP 종합 분석 → 구조화된 리포트

### ✅ 유연한 입력 방식
- **PDF 업로드**: AI가 자동으로 데이터 추출
- **수동 입력**: 직접 JSON 입력 가능
- **혼합 사용**: PDF 분석 후 수정 가능

### ✅ 강력한 프롬프트 엔지니어링
- **역할 기반 프롬프트**: "수석 컨설턴트 AI"
- **명확한 규칙**: 추정 금지, 근거 명시, 숫자 단위 명확
- **구조화된 출력**: JSON 스키마 강제
- **도메인 지식**: 사근복/공근복 전문 컨설팅

### ✅ 다중 AI 모델 지원
- Claude 3.5 Sonnet (추천)
- GPT-4 Turbo
- Gemini 2.0 Flash

### ✅ 보안 및 인증
- Consultant 전용 (인증 필수)
- API 키는 암호화 저장
- Bearer Token 기반 인증

---

## 📊 프롬프트 성능 최적화

### Token 할당
- **PDF 분석**: 2000 tokens
- **CRETOP 리포트**: 4096 tokens (긴 응답 필요)

### 재시도 로직
- JSON 파싱 실패 시 자동 재시도
- 마크다운 코드블록 자동 제거
- 스키마 검증

### 에러 처리
- 단계별 에러 메시지
- 상세한 로깅
- 사용자 친화적 알림

---

## 🚀 실행 예시

### 입력 예시
```json
{
  "company_name": "테스트주식회사",
  "statement_date": "2023-12-31",
  "balance_sheet_json": "{\"자산총계\": 5000000000, \"부채총계\": 2000000000}",
  "income_statement_json": "{\"매출액\": 10000000000, \"영업이익\": 1200000000}",
  "cashflow_json": "{\"영업활동현금흐름\": 900000000}",
  "employee_count": "50명",
  "industry_name": "제조업"
}
```

### 출력 예시
```
📋 종합 요약
건실한 재무구조, 복지투자 여력 충분 - 사근복 도입 적기

💼 경영진단 종합
등급: 양호
• 재무 건전성: 부채비율 40%, 유동비율 180%로 안정적
• 수익성: 매출 100억, 영업이익 12억으로 우수
• 성장성: 전년 대비 매출 15% 증가

⚠️ 주요 리스크
1. 미처분이익잉여금 과다 (중간 위험)
   → 15억원 누적, 배당 미실시
   → 액션: 배당 또는 사근복 출연 검토

🎯 개선 기회
1. 사근복 도입 최적 타이밍 (높은 우선순위)
   → 현금흐름 양호, 복지 수요 증가
   → 액션: 연 3억원 출연 시나리오 검토

🗺️ 실행 로드맵
30-90일: 사근복 정관 초안 작성
6개월: 복지제도 체계화
12개월: 사근복 정식 운영
```

---

## 📌 요약

이 시스템은 **2단계 AI 프로세싱**을 통해:

1. **PDF → JSON 변환** (선택적 자동화)
2. **JSON → 구조화된 컨설팅 리포트** (필수 분석)

를 수행하며, **강력한 프롬프트 엔지니어링**과 **도메인 전문 지식**을 결합하여 CFO/대표가 즉시 의사결정에 활용할 수 있는 고품질 기업분석 리포트를 생성합니다.

**핵심 강점:**
- 🎯 명확한 역할과 규칙
- 📊 구조화된 JSON 출력
- 🔒 보안 및 인증
- 🤖 다중 AI 모델 지원
- 💼 사근복/공근복 전문 컨설팅
- 🚀 2단계 프로세스로 유연성 확보

