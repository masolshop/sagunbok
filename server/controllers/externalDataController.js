import { loadKey } from '../utils/cryptoStore.js';
import WorknetCrawler from '../utils/crawlers/worknetCrawler.js';
import SaraminCrawler from '../utils/crawlers/saraminCrawler.js';
import BlindCrawler from '../utils/crawlers/blindCrawler.js';
import ReviewSitesCrawler from '../utils/crawlers/reviewSitesCrawler.js';
import { parseJobSiteHTML, parseReviewSiteHTML } from '../utils/crawlers/aiParser.js';

/**
 * 구인구직 사이트 데이터 수집 (사람인 전용)
 */
export const analyzeJobSites = async (req, res) => {
  try {
    const { companyName, businessNumber, industry } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ 
        success: false, 
        error: 'MISSING_COMPANY_NAME',
        message: '회사명을 입력해주세요.' 
      });
    }

    console.log(`[JobSites] 데이터 수집 시작: ${companyName}`);

    // 1. 워크넷 공개 API (안전)
    const worknetCrawler = new WorknetCrawler();
    const worknetData = await worknetCrawler.getCompanyInfo(companyName);

    // 2. 사람인 크롤링
    const saraminCrawler = new SaraminCrawler({ headless: true });
    const saraminData = await saraminCrawler.crawlCompany(companyName);

    // 결과 통합
    const result = {
      success: true,
      company_name: companyName,
      business_number: businessNumber,
      industry,
      timestamp: new Date().toISOString(),
      data: {
        worknet: worknetData.success ? {
          success: true,
          company: worknetData.company,
          jobs: worknetData.jobs || []
        } : {
          success: false,
          message: '워크넷 데이터 없음'
        },
        saramin: saraminData.success ? {
          success: true,
          jobs: saraminData.jobs || [],
          summary: saraminData.summary || {}
        } : {
          success: false,
          error: saraminData.error,
          message: '사람인 데이터 수집 실패'
        }
      }
    };

    console.log(`[JobSites] 데이터 수집 완료`);
    console.log(`  - 워크넷: ${worknetData.success ? '성공' : '실패'}`);
    console.log(`  - 사람인: ${saraminData.success ? `성공 (${saraminData.jobs?.length || 0}개)` : '실패'}`);

    return res.json(result);

  } catch (error) {
    console.error('[JobSites] 에러:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'INTERNAL_ERROR',
      message: error.message 
    });
  }
};

/**
 * 리뷰 사이트 데이터 수집 (블라인드 전용)
 */
export const analyzeReviewSites = async (req, res) => {
  try {
    const { companyName } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ 
        success: false, 
        error: 'MISSING_COMPANY_NAME',
        message: '회사명을 입력해주세요.' 
      });
    }

    console.log(`[ReviewSites] 데이터 수집 시작: ${companyName}`);

    // 1. 잡플래닛 크롤링
    const reviewCrawler = new ReviewSitesCrawler({ headless: true });
    const jobplanetData = await reviewCrawler.crawlJobPlanet(companyName);

    // 2. 블라인드 크롤링
    const blindCrawler = new BlindCrawler({ headless: true });
    const blindData = await blindCrawler.crawlCompany(companyName);

    // 결과 통합
    const result = {
      success: true,
      company_name: companyName,
      timestamp: new Date().toISOString(),
      data: {
        jobplanet: jobplanetData.success ? {
          success: true,
          company: jobplanetData.company,
          overall_rating: jobplanetData.overall_rating,
          ratings: jobplanetData.ratings || {},
          reviews: jobplanetData.reviews || []
        } : {
          success: false,
          error: jobplanetData.error,
          message: '잡플래닛 데이터 수집 실패'
        },
        blind: blindData.success ? {
          success: true,
          rating: blindData.rating || {},
          reviews: blindData.reviews || []
        } : {
          success: false,
          error: blindData.error,
          message: blindData.message || '블라인드 데이터 수집 실패'
        }
      }
    };

    console.log(`[ReviewSites] 데이터 수집 완료`);
    console.log(`  - 잡플래닛: ${jobplanetData.success ? `성공 (${jobplanetData.reviews?.length || 0}개)` : '실패'}`);
    console.log(`  - 블라인드: ${blindData.success ? `성공 (${blindData.reviews?.length || 0}개)` : '실패'}`);

    return res.json(result);

  } catch (error) {
    console.error('[ReviewSites] 에러:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'INTERNAL_ERROR',
      message: error.message 
    });
  }
};
