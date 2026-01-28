import puppeteer from 'puppeteer';

/**
 * 리뷰 사이트 크롤러
 * - 잡플래닛 (JobPlanet)
 * - 블라인드 (Blind) - 로그인 필요
 */

class ReviewSitesCrawler {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.timeout = options.timeout || 30000;
  }

  async launchBrowser() {
    return await puppeteer.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  }

  /**
   * 잡플래닛 크롤링
   */
  async crawlJobPlanet(companyName) {
    let browser;
    try {
      console.log(`[JobPlanet] 크롤링 시작: ${companyName}`);
      
      browser = await this.launchBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // 잡플래닛 검색
      await page.goto('https://www.jobplanet.co.kr/search?query=' + encodeURIComponent(companyName), {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });

      await page.waitForTimeout(2000);

      const html = await page.content();
      
      // 회사 정보 추출
      const data = await page.evaluate(() => {
        const company = document.querySelector('.company_name, .company-name, h1')?.textContent?.trim();
        const rating = document.querySelector('.rating_avg, .total-rating, .company-rating')?.textContent?.trim();
        
        const reviews = [];
        const reviewItems = document.querySelectorAll('.content_wrap, .review-item, .review_item');
        
        reviewItems.forEach(item => {
          const title = item.querySelector('.review_title, .title')?.textContent?.trim();
          const content = item.querySelector('.review_cont, .content, .description')?.textContent?.trim();
          const pros = item.querySelector('.pros, .advantage')?.textContent?.trim();
          const cons = item.querySelector('.cons, .disadvantage')?.textContent?.trim();
          const author = item.querySelector('.author, .reviewer, .writer_name')?.textContent?.trim();
          const date = item.querySelector('.date, .reg_date')?.textContent?.trim();
          
          if (content) {
            reviews.push({ title, content, pros, cons, author, date });
          }
        });
        
        // 평점 정보
        const ratings = {};
        document.querySelectorAll('.score_section, .rating-section').forEach(section => {
          const label = section.querySelector('.label, dt')?.textContent?.trim();
          const score = section.querySelector('.score, dd, .value')?.textContent?.trim();
          if (label && score) {
            ratings[label] = score;
          }
        });
        
        return { company, rating, reviews, ratings };
      });

      console.log(`[JobPlanet] 크롤링 완료: ${data.reviews.length}개 리뷰`);
      
      return {
        success: true,
        source: 'jobplanet',
        company: data.company,
        overall_rating: data.rating,
        ratings: data.ratings,
        reviews: data.reviews,
        html: html.slice(0, 100000)
      };

    } catch (error) {
      console.error(`[JobPlanet] 크롤링 실패:`, error.message);
      return {
        success: false,
        source: 'jobplanet',
        error: error.message
      };
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * 블라인드 크롤링 (로그인 필요 - 추후 구현)
   */
  async crawlBlind(companyName, credentials = null) {
    console.log(`[Blind] 블라인드는 로그인이 필요합니다. (추후 구현 예정)`);
    
    return {
      success: false,
      source: 'blind',
      message: '블라인드는 로그인이 필요합니다. 추후 구현 예정입니다.',
      login_required: true
    };
  }

  /**
   * 모든 리뷰 사이트 크롤링
   */
  async crawlAll(companyName, credentials = null) {
    console.log(`[ReviewSites] 전체 크롤링 시작: ${companyName}`);
    
    const results = await Promise.allSettled([
      this.crawlJobPlanet(companyName),
      // this.crawlBlind(companyName, credentials) // 추후 활성화
    ]);

    return {
      jobplanet: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason?.message },
      blind: { success: false, message: '추후 구현 예정' }
    };
  }
}

export default ReviewSitesCrawler;
