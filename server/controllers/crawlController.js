import { loadKey } from "../utils/cryptoStore.js";

/**
 * 구인구직 사이트 크롤링 컨트롤러
 * - 잡코리아, 사람인, 인크루트 등
 */

// AI 모델 호출 (기존 aiController에서 가져옴)
async function callGPT(apiKey, system, userPrompt, maxTokens = 2000) {
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
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const txt = await r.text();
  if (!r.ok) throw new Error(`GPT_ERROR ${r.status}: ${txt}`);

  const j = JSON.parse(txt);
  return j.choices?.[0]?.message?.content?.trim() || "";
}

async function callClaude(apiKey, system, userPrompt, maxTokens = 2000) {
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

// 구인구직 사이트 크롤링
export const crawlJobPostings = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { companyName, modelType = "gpt" } = req.body || {};
    if (!companyName) return res.status(400).json({ ok: false, error: "MISSING_COMPANY_NAME" });

    const apiKey = loadKey(consultantId, modelType);

    // 실제 크롤링 대신 AI로 분석 (크롤링은 Playwright로 별도 구현 필요)
    const systemPrompt = `당신은 구인구직 사이트 데이터 분석 전문가입니다.
주어진 회사명에 대한 채용 공고 정보를 분석하여 다음 JSON 형식으로 반환하세요:

{
  "results": [
    {
      "site": "잡코리아/사람인/인크루트",
      "position": "직무명",
      "salary": "연봉 범위",
      "welfare": "복지 항목 (연차, 4대보험, 퇴직금, 식대, 교통비, 자기계발비 등)",
      "requirements": "자격 요건",
      "posted_date": "게시일"
    }
  ],
  "summary": "전체 요약 (복지 항목 중심)"
}

반드시 JSON만 출력하세요. 설명이나 마크다운 코드블록은 제외하세요.`;

    const userPrompt = `회사명: ${companyName}

위 회사의 구인구직 사이트(잡코리아, 사람인, 인크루트) 채용 공고를 분석하여 JSON으로 반환하세요.
실제 데이터가 없다면 해당 업종/회사 규모에 맞는 일반적인 복지 항목을 추정하여 작성하세요.`;

    let text = "";
    if (modelType === "gpt") {
      text = await callGPT(apiKey, systemPrompt, userPrompt);
    } else {
      text = await callClaude(apiKey, systemPrompt, userPrompt);
    }

    // JSON 파싱
    let parsedData = null;
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedData = JSON.parse(cleaned);
    } catch (e) {
      console.error("[CRAWL] JSON 파싱 실패:", e.message);
      return res.status(500).json({ ok: false, error: "JSON_PARSE_FAILED", rawText: text });
    }

    return res.json({
      ok: true,
      results: parsedData.results || [],
      summary: parsedData.summary || "",
      source: "ai_analysis", // 실제 크롤링 구현 시 'crawling'으로 변경
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};

// 리뷰 사이트 크롤링
export const crawlReviews = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { companyName, modelType = "gpt" } = req.body || {};
    if (!companyName) return res.status(400).json({ ok: false, error: "MISSING_COMPANY_NAME" });

    const apiKey = loadKey(consultantId, modelType);

    const systemPrompt = `당신은 직원 리뷰 데이터 분석 전문가입니다.
주어진 회사명에 대한 블라인드, 잡플래닛 리뷰를 분석하여 다음 JSON 형식으로 반환하세요:

{
  "results": [
    {
      "site": "블라인드/잡플래닛",
      "rating": "별점 (5점 만점)",
      "pros": ["장점1", "장점2", "장점3"],
      "cons": ["단점1", "단점2", "단점3"],
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "turnover_intent": "이직 의향 (%)",
      "ceo_rating": "경영진 평가"
    }
  ],
  "summary": "전체 요약 (복지/조직문화 중심)"
}

반드시 JSON만 출력하세요.`;

    const userPrompt = `회사명: ${companyName}

위 회사의 직원 리뷰(블라인드, 잡플래닛)를 분석하여 JSON으로 반환하세요.
실제 데이터가 없다면 해당 업종/회사 규모에 맞는 일반적인 리뷰 경향을 추정하세요.`;

    let text = "";
    if (modelType === "gpt") {
      text = await callGPT(apiKey, systemPrompt, userPrompt);
    } else {
      text = await callClaude(apiKey, systemPrompt, userPrompt);
    }

    let parsedData = null;
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedData = JSON.parse(cleaned);
    } catch (e) {
      console.error("[REVIEW] JSON 파싱 실패:", e.message);
      return res.status(500).json({ ok: false, error: "JSON_PARSE_FAILED", rawText: text });
    }

    return res.json({
      ok: true,
      results: parsedData.results || [],
      summary: parsedData.summary || "",
      source: "ai_analysis",
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};

// 최종 컨설팅 생성
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

    let report = "";
    if (modelType === "gpt") {
      report = await callGPT(apiKey, systemPrompt, userPrompt, 4000);
    } else {
      report = await callClaude(apiKey, systemPrompt, userPrompt, 4000);
    }

    return res.json({
      ok: true,
      report,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
