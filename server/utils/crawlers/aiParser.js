import { callAI } from '../aiHelpers.js';

/**
 * AI 기반 크롤링 데이터 파서
 * HTML → 구조화된 JSON
 */

// 구인구직 데이터 파싱 프롬프트
const JOB_SITE_PARSE_PROMPT = `
당신은 채용 정보 추출 전문가입니다. 아래 HTML에서 구조화된 데이터를 추출하세요.

**추출 항목:**
1. 연봉 정보:
   - salary_min: 최소 연봉 (원 단위, 숫자)
   - salary_max: 최대 연봉 (원 단위, 숫자)
   - salary_avg: 평균 연봉 (원 단위, 숫자)
   - salary_type: 연봉 타입 (예: "연봉", "월급", "시급")

2. 복지 항목 (배열):
   - benefits: ["4대보험", "퇴직금", "연차", "경조사비", "식대", "교통비", ...]

3. 채용 건수:
   - job_count: 현재 채용 중인 건수

4. 근무 조건:
   - work_hours: 근무 시간 (예: "주 40시간")
   - work_type: 근무 형태 (예: "정규직", "계약직")

**출력 형식: JSON만**
{
  "salary": {
    "min": 30000000,
    "max": 45000000,
    "avg": 37500000,
    "type": "연봉"
  },
  "benefits": ["4대보험", "퇴직금", "연차", "경조사비"],
  "job_count": 5,
  "work_conditions": {
    "hours": "주 40시간",
    "type": "정규직"
  }
}

**주의:**
- 못 찾으면 null
- 숫자는 원 단위로 환산 (만원 → ×10000, 천원 → ×1000)
- JSON 외 텍스트 절대 금지
`;

// 리뷰 데이터 파싱 프롬프트
const REVIEW_SITE_PARSE_PROMPT = `
당신은 기업 리뷰 분석 전문가입니다. 아래 HTML에서 구조화된 데이터를 추출하세요.

**추출 항목:**
1. 전체 평점:
   - overall_rating: 전체 평점 (1~5, 소수점 1자리)

2. 세부 평점:
   - welfare_rating: 복지 평점 (1~5)
   - work_life_balance: 워라밸 평점 (1~5)
   - company_culture: 기업 문화 평점 (1~5)
   - salary_rating: 급여 평점 (1~5)
   - career_growth: 경력 성장 평점 (1~5)

3. 리뷰 목록 (최대 10개):
   - reviews: [
       {
         "type": "현직" | "전직",
         "rating": 4.5,
         "title": "리뷰 제목",
         "pros": "장점",
         "cons": "단점",
         "date": "2024-01-15"
       }
     ]

4. 복지 키워드 (빈도 높은 순):
   - welfare_keywords: ["건강검진", "식대지원", "4대보험", ...]

**출력 형식: JSON만**
{
  "overall_rating": 3.8,
  "detailed_ratings": {
    "welfare": 4.0,
    "work_life_balance": 3.5,
    "culture": 4.2,
    "salary": 3.6,
    "career": 3.8
  },
  "reviews": [...],
  "welfare_keywords": ["건강검진", "식대지원"]
}

**주의:**
- 못 찾으면 null
- 평점은 1~5 범위
- JSON 외 텍스트 절대 금지
`;

/**
 * 구인구직 사이트 HTML 파싱
 */
export async function parseJobSiteHTML(html, companyName, apiKey, modelType = 'gpt') {
  try {
    console.log(`[AI Parse] 구인구직 데이터 파싱 시작 (${companyName})`);
    
    const prompt = `${JOB_SITE_PARSE_PROMPT}

회사명: ${companyName}

HTML:
${html.slice(0, 50000)}
`;

    const systemPrompt = `당신은 HTML에서 채용 정보를 추출하는 전문가입니다. 항상 유효한 JSON만 출력하세요.`;
    
    const response = await callAI(modelType, apiKey, systemPrompt, prompt, 2000);
    
    // JSON 파싱
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      // 코드펜스 제거 후 재시도
      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
    
    console.log(`[AI Parse] 구인구직 데이터 파싱 완료`);
    return parsed;

  } catch (error) {
    console.error(`[AI Parse] 구인구직 파싱 실패:`, error.message);
    throw error;
  }
}

/**
 * 리뷰 사이트 HTML 파싱
 */
export async function parseReviewSiteHTML(html, companyName, apiKey, modelType = 'gpt') {
  try {
    console.log(`[AI Parse] 리뷰 데이터 파싱 시작 (${companyName})`);
    
    const prompt = `${REVIEW_SITE_PARSE_PROMPT}

회사명: ${companyName}

HTML:
${html.slice(0, 50000)}
`;

    const systemPrompt = `당신은 HTML에서 기업 리뷰를 추출하는 전문가입니다. 항상 유효한 JSON만 출력하세요.`;
    
    const response = await callAI(modelType, apiKey, systemPrompt, prompt, 2000);
    
    // JSON 파싱
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
    
    console.log(`[AI Parse] 리뷰 데이터 파싱 완료`);
    return parsed;

  } catch (error) {
    console.error(`[AI Parse] 리뷰 파싱 실패:`, error.message);
    throw error;
  }
}
