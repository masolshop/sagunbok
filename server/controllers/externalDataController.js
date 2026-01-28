import { loadKey } from '../utils/cryptoStore.js';
import WorknetCrawler from '../utils/crawlers/worknetCrawler.js';
import JobSitesCrawler from '../utils/crawlers/jobSitesCrawler.js';
import ReviewSitesCrawler from '../utils/crawlers/reviewSitesCrawler.js';
import { parseJobSiteHTML, parseReviewSiteHTML } from '../utils/crawlers/aiParser.js';

/**
 * 구인구직 사이트 데이터 수집
 */
export const analyzeJobSites = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

    const { companyName, businessNumber, industry, modelType = 'gpt' } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ ok: false, error: 'MISSING_COMPANY_NAME' });
    }

    // API 키 로드
    const apiKey = loadKey(consultantId, modelType);
    
    console.log(`[JobSites] 데이터 수집 시작: ${companyName}`);

    // 1. 워크넷 공개 API (안전)
    const worknetCrawler = new WorknetCrawler();
    const worknetData = await worknetCrawler.getCompanyInfo(companyName);

    // 2. Puppeteer 크롤링 (잡코리아, 사람인)
    const jobSitesCrawler = new JobSitesCrawler({ headless: true });
    const crawledData = await jobSitesCrawler.crawlAll(companyName);

    // 3. AI 파싱 (HTML → JSON)
    const parsedData = {};
    
    // 잡코리아 파싱
    if (crawledData.jobkorea.success && crawledData.jobkorea.html) {
      try {
        parsedData.jobkorea = await parseJobSiteHTML(
          crawledData.jobkorea.html,
          companyName,
          apiKey,
          modelType
        );
      } catch (e) {
        console.warn('[JobSites] 잡코리아 AI 파싱 실패:', e.message);
        parsedData.jobkorea = { error: 'AI 파싱 실패' };
      }
    }

    // 사람인 파싱
    if (crawledData.saramin.success && crawledData.saramin.html) {
      try {
        parsedData.saramin = await parseJobSiteHTML(
          crawledData.saramin.html,
          companyName,
          apiKey,
          modelType
        );
      } catch (e) {
        console.warn('[JobSites] 사람인 AI 파싱 실패:', e.message);
        parsedData.saramin = { error: 'AI 파싱 실패' };
      }
    }

    // 4. 통합 결과
    const result = {
      company_name: companyName,
      business_number: businessNumber,
      industry,
      worknet: worknetData.success ? worknetData.company : null,
      jobkorea: {
        raw: crawledData.jobkorea.data || [],
        parsed: parsedData.jobkorea || null
      },
      saramin: {
        raw: crawledData.saramin.data || [],
        parsed: parsedData.saramin || null
      },
      summary: {
        total_jobs: (crawledData.jobkorea.count || 0) + (crawledData.saramin.count || 0),
        avg_salary: calculateAvgSalary(parsedData),
        common_benefits: extractCommonBenefits(parsedData)
      }
    };

    console.log(`[JobSites] 데이터 수집 완료: ${result.summary.total_jobs}개 채용 정보`);

    res.json({
      ok: true,
      data: result,
      modelType,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[JobSites] 데이터 수집 실패:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * 리뷰 사이트 데이터 수집
 */
export const analyzeReviewSites = async (req, res) => {
  try {
    const consultantId = req.user?.id;
    if (!consultantId) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

    const { companyName, modelType = 'gpt' } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ ok: false, error: 'MISSING_COMPANY_NAME' });
    }

    // API 키 로드
    const apiKey = loadKey(consultantId, modelType);
    
    console.log(`[ReviewSites] 데이터 수집 시작: ${companyName}`);

    // 1. Puppeteer 크롤링 (잡플래닛, 블라인드)
    const reviewCrawler = new ReviewSitesCrawler({ headless: true });
    const crawledData = await reviewCrawler.crawlAll(companyName);

    // 2. AI 파싱
    const parsedData = {};
    
    // 잡플래닛 파싱
    if (crawledData.jobplanet.success && crawledData.jobplanet.html) {
      try {
        parsedData.jobplanet = await parseReviewSiteHTML(
          crawledData.jobplanet.html,
          companyName,
          apiKey,
          modelType
        );
      } catch (e) {
        console.warn('[ReviewSites] 잡플래닛 AI 파싱 실패:', e.message);
        parsedData.jobplanet = { error: 'AI 파싱 실패' };
      }
    }

    // 3. 통합 결과
    const result = {
      company_name: companyName,
      jobplanet: {
        raw: crawledData.jobplanet,
        parsed: parsedData.jobplanet || null
      },
      blind: {
        message: '추후 구현 예정 (로그인 필요)'
      },
      summary: {
        overall_rating: parsedData.jobplanet?.overall_rating || null,
        review_count: parsedData.jobplanet?.reviews?.length || 0,
        welfare_keywords: parsedData.jobplanet?.welfare_keywords || []
      }
    };

    console.log(`[ReviewSites] 데이터 수집 완료: ${result.summary.review_count}개 리뷰`);

    res.json({
      ok: true,
      data: result,
      modelType,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ReviewSites] 데이터 수집 실패:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 헬퍼 함수: 평균 연봉 계산
function calculateAvgSalary(parsedData) {
  const salaries = [];
  
  Object.values(parsedData).forEach(data => {
    if (data?.salary?.avg) salaries.push(data.salary.avg);
  });
  
  if (salaries.length === 0) return null;
  return Math.floor(salaries.reduce((a, b) => a + b, 0) / salaries.length);
}

// 헬퍼 함수: 공통 복지 항목 추출
function extractCommonBenefits(parsedData) {
  const benefitCounts = {};
  
  Object.values(parsedData).forEach(data => {
    if (data?.benefits) {
      data.benefits.forEach(benefit => {
        benefitCounts[benefit] = (benefitCounts[benefit] || 0) + 1;
      });
    }
  });
  
  return Object.entries(benefitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([benefit, _]) => benefit);
}
