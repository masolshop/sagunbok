import { loadKey } from "../utils/cryptoStore.js";
import { crawlAllJobSites, crawlAllReviewSites } from "../utils/crawler.js";

/**
 * 실제 웹 크롤링 기반 컨설팅 데이터 수집
 */

// AI 모델 호출 (GPT/Claude)
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

// 구인구직 사이트 크롤링 + AI 분석
export const crawlJobPostings = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { companyName, modelType = "gpt" } = req.body || {};
    if (!companyName) return res.status(400).json({ ok: false, error: "MISSING_COMPANY_NAME" });

    console.log(`[JOB CRAWL] 시작: ${companyName}`);

    // 실제 크롤링
    const crawledData = await crawlAllJobSites(companyName);

    // 크롤링 데이터가 없으면 AI로 추정
    let results = crawledData;
    let summary = "";
    let source = "crawling";

    if (crawledData.length === 0) {
      console.log('[JOB CRAWL] 크롤링 데이터 없음, AI 분석으로 전환');
      source = "ai_estimation";
      
      const apiKey = loadKey(consultantId, modelType);
      const systemPrompt = `당신은 구인구직 데이터 분석 전문가입니다.
회사명에 대한 일반적인 채용 공고 정보를 추정하여 JSON으로 반환하세요:

{
  "results": [
    {
      "site": "추정",
      "position": "직무명",
      "salary": "연봉 범위",
      "welfare": "복지 항목",
      "requirements": "자격 요건"
    }
  ],
  "summary": "복지 항목 중심 요약"
}

반드시 JSON만 출력하세요.`;

      const userPrompt = `회사명: ${companyName}\n\n위 회사의 일반적인 채용 공고 정보를 추정하여 JSON으로 반환하세요.`;

      let text = "";
      if (modelType === "gpt") {
        text = await callGPT(apiKey, systemPrompt, userPrompt);
      } else {
        text = await callClaude(apiKey, systemPrompt, userPrompt);
      }

      try {
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        results = parsed.results || [];
        summary = parsed.summary || "";
      } catch (e) {
        console.error('[JOB CRAWL] JSON 파싱 실패');
        results = [];
        summary = "분석 데이터 없음";
      }
    } else {
      // 크롤링 성공 시 AI로 요약 생성
      const apiKey = loadKey(consultantId, modelType);
      const systemPrompt = `다음 채용 공고 데이터를 분석하여 복지 항목 중심으로 3-5줄 요약하세요.`;
      const userPrompt = `채용 공고 데이터:\n${JSON.stringify(crawledData, null, 2)}`;

      try {
        if (modelType === "gpt") {
          summary = await callGPT(apiKey, systemPrompt, userPrompt, 500);
        } else {
          summary = await callClaude(apiKey, systemPrompt, userPrompt, 500);
        }
      } catch (e) {
        summary = `${crawledData.length}개 공고 수집 완료`;
      }
    }

    console.log(`[JOB CRAWL] 완료: ${results.length}개 결과, 출처: ${source}`);

    return res.json({
      ok: true,
      results,
      summary,
      source,
      crawledCount: crawledData.length,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[JOB CRAWL] 오류:', e.message);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};

// 리뷰 사이트 크롤링 + AI 분석
export const crawlReviews = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });

    const { companyName, modelType = "gpt" } = req.body || {};
    if (!companyName) return res.status(400).json({ ok: false, error: "MISSING_COMPANY_NAME" });

    console.log(`[REVIEW CRAWL] 시작: ${companyName}`);

    // 실제 크롤링
    const crawledData = await crawlAllReviewSites(companyName);

    let results = crawledData;
    let summary = "";
    let source = "crawling";

    if (crawledData.length === 0) {
      console.log('[REVIEW CRAWL] 크롤링 데이터 없음, AI 분석으로 전환');
      source = "ai_estimation";
      
      const apiKey = loadKey(consultantId, modelType);
      const systemPrompt = `당신은 직원 리뷰 분석 전문가입니다.
회사명에 대한 일반적인 직원 리뷰를 추정하여 JSON으로 반환하세요:

{
  "results": [
    {
      "site": "추정",
      "rating": "별점",
      "pros": ["장점1", "장점2"],
      "cons": ["단점1", "단점2"],
      "keywords": ["키워드1", "키워드2"]
    }
  ],
  "summary": "복지/조직문화 중심 요약"
}

반드시 JSON만 출력하세요.`;

      const userPrompt = `회사명: ${companyName}\n\n위 회사의 일반적인 직원 리뷰를 추정하여 JSON으로 반환하세요.`;

      let text = "";
      if (modelType === "gpt") {
        text = await callGPT(apiKey, systemPrompt, userPrompt);
      } else {
        text = await callClaude(apiKey, systemPrompt, userPrompt);
      }

      try {
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        results = parsed.results || [];
        summary = parsed.summary || "";
      } catch (e) {
        console.error('[REVIEW CRAWL] JSON 파싱 실패');
        results = [];
        summary = "분석 데이터 없음";
      }
    } else {
      // 크롤링 성공 시 AI로 요약 생성
      const apiKey = loadKey(consultantId, modelType);
      const systemPrompt = `다음 직원 리뷰 데이터를 분석하여 복지/조직문화 중심으로 3-5줄 요약하세요.`;
      const userPrompt = `리뷰 데이터:\n${JSON.stringify(crawledData, null, 2)}`;

      try {
        if (modelType === "gpt") {
          summary = await callGPT(apiKey, systemPrompt, userPrompt, 500);
        } else {
          summary = await callClaude(apiKey, systemPrompt, userPrompt, 500);
        }
      } catch (e) {
        summary = `${crawledData.length}개 리뷰 수집 완료`;
      }
    }

    console.log(`[REVIEW CRAWL] 완료: ${results.length}개 결과, 출처: ${source}`);

    return res.json({
      ok: true,
      results,
      summary,
      source,
      crawledCount: crawledData.length,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[REVIEW CRAWL] 오류:', e.message);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
