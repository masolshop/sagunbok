import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

/**
 * 블라인드 크롤러
 * - 기업 리뷰
 * - 평점 정보
 * - 현직/전직자 평가
 * 
 * 주의: 블라인드는 로그인이 필요하므로 공개 정보만 수집
 */

class BlindCrawler {
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
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  }

  /**
   * 블라인드 기업 검색 (공개 정보만)
   */
  async crawlCompany(companyName) {
    let browser;
    try {
      console.log(`[Blind] 크롤링 시작: ${companyName}`);
      
      browser = await this.launchBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // 블라인드 기업 검색 페이지
      const searchUrl = `https://www.teamblind.com/kr/company/${encodeURIComponent(companyName)}/reviews`;
      console.log(`[Blind] 검색 URL: ${searchUrl}`);
      
      // Try to load page
      try {
        await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: this.timeout
        });
      } catch (navError) {
        console.log(`[Blind] 직접 URL 실패, 검색 페이지로 시도`);
        // Fallback to search
        await page.goto(`https://www.teamblind.com/kr/search/posts?query=${encodeURIComponent(companyName)}`, {
          waitUntil: 'domcontentloaded',
          timeout: this.timeout
        });
      }

      // 페이지 로딩 대기
      await page.waitForTimeout(3000);

      // HTML 추출
      const html = await page.content();
      const $ = cheerio.load(html);

      // 스크린샷 (디버깅용)
      // await page.screenshot({ path: `/tmp/blind_${Date.now()}.png` });

      // 공개 정보 추출
      const reviews = [];
      
      // 리뷰 카드 찾기 (다양한 셀렉터 시도)
      const selectors = [
        '.review-card',
        '.company-review',
        '[data-type="review"]',
        '.post-item',
        '.feed-item'
      ];

      for (const selector of selectors) {
        $(selector).each((i, elem) => {
          if (i >= 10) return; // 최대 10개

          const $elem = $(elem);
          const title = $elem.find('.title, .post-title, h3, h4').first().text().trim();
          const content = $elem.find('.content, .description, .post-content, p').first().text().trim();
          const author = $elem.find('.author, .writer, .username').first().text().trim();
          const date = $elem.find('.date, .timestamp, time').first().text().trim();
          const likes = $elem.find('.like-count, .likes, [data-likes]').first().text().trim();

          if (content && content.length > 10) {
            reviews.push({
              title: title || '제목 없음',
              content: content.slice(0, 500), // 500자 제한
              author: author || '익명',
              date: date || '',
              likes: likes || '0'
            });
          }
        });

        if (reviews.length > 0) break; // 데이터 찾으면 중단
      }

      // 평점 정보 추출
      const rating = {
        overall: $('.rating-overall, .total-rating, [data-rating]').first().text().trim(),
        count: $('.review-count, .total-reviews').first().text().trim()
      };

      console.log(`[Blind] 크롤링 완료: ${reviews.length}개 리뷰`);

      // 데이터가 없으면 HTML 내용 확인
      if (reviews.length === 0) {
        console.log(`[Blind] 리뷰 없음. HTML 길이: ${html.length}`);
        // HTML의 일부를 로그로 출력 (디버깅)
        console.log(`[Blind] HTML 샘플:`, html.slice(0, 500));
      }

      return {
        success: reviews.length > 0,
        source: 'blind',
        companyName,
        rating,
        reviews,
        message: reviews.length === 0 
          ? '블라인드는 로그인이 필요하거나 해당 기업의 공개 리뷰가 없습니다.' 
          : undefined,
        html: html.slice(0, 50000) // 50KB 제한
      };

    } catch (error) {
      console.error(`[Blind] 크롤링 실패:`, error.message);
      return {
        success: false,
        source: 'blind',
        error: error.message,
        message: '블라인드 크롤링 실패. 로그인이 필요하거나 접근이 제한되었습니다.',
        stack: error.stack
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * 블라인드 공개 통계 정보만 수집
   */
  async getPublicStats(companyName) {
    try {
      console.log(`[Blind] 공개 통계 수집: ${companyName}`);
      
      // 실제로는 블라인드 API나 공개 데이터가 있다면 사용
      // 현재는 mock 데이터 반환
      return {
        success: true,
        source: 'blind_stats',
        message: '블라인드 상세 정보는 로그인 후 이용 가능합니다.',
        publicData: {
          companyName,
          note: '로그인 필요'
        }
      };
    } catch (error) {
      console.error(`[Blind] 통계 수집 실패:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default BlindCrawler;
