import puppeteer from 'puppeteer';

/**
 * Puppeteer 기반 구인구직 사이트 크롤러
 * - 잡코리아 (JobKorea)
 * - 사람인 (Saramin)
 */

class JobSitesCrawler {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.timeout = options.timeout || 30000;
  }

  /**
   * 브라우저 시작
   */
  async launchBrowser() {
    return await puppeteer.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
  }

  /**
   * 잡코리아 크롤링
   */
  async crawlJobKorea(companyName) {
    let browser;
    try {
      console.log(`[JobKorea] 크롤링 시작: ${companyName}`);
      
      browser = await this.launchBrowser();
      const page = await browser.newPage();
      
      // User-Agent 설정
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // 잡코리아 검색
      await page.goto('https://www.jobkorea.co.kr/Search/?stext=' + encodeURIComponent(companyName), {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });

      // 페이지 로드 대기
      await page.waitForTimeout(2000);

      // HTML 추출
      const html = await page.content();
      
      // 주요 섹션만 추출
      const data = await page.evaluate(() => {
        const results = [];
        const items = document.querySelectorAll('.list-default-recruit, .list-post, .recruit-item');
        
        items.forEach(item => {
          const title = item.querySelector('.post-list-corp-name, .name, h3, .company-name')?.textContent?.trim();
          const salary = item.querySelector('.chip-pay, .pay, .salary')?.textContent?.trim();
          const benefits = Array.from(item.querySelectorAll('.chip-condition, .benefit, .welfare-list li'))
            .map(el => el.textContent.trim());
          
          if (title) {
            results.push({ title, salary, benefits });
          }
        });
        
        return results;
      });

      console.log(`[JobKorea] 크롤링 완료: ${data.length}개 항목`);
      
      return {
        success: true,
        source: 'jobkorea',
        count: data.length,
        html: html.slice(0, 100000), // AI 파싱용 (100KB 제한)
        data
      };

    } catch (error) {
      console.error(`[JobKorea] 크롤링 실패:`, error.message);
      return {
        success: false,
        source: 'jobkorea',
        error: error.message
      };
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * 사람인 크롤링
   */
  async crawlSaramin(companyName) {
    let browser;
    try {
      console.log(`[Saramin] 크롤링 시작: ${companyName}`);
      
      browser = await this.launchBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // 사람인 검색
      await page.goto('https://www.saramin.co.kr/zf_user/search?searchType=search&searchword=' + encodeURIComponent(companyName), {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });

      await page.waitForTimeout(2000);

      const html = await page.content();
      
      // 주요 정보 추출
      const data = await page.evaluate(() => {
        const results = [];
        const items = document.querySelectorAll('.item_recruit, .list_item, .recruit_info');
        
        items.forEach(item => {
          const company = item.querySelector('.corp_name, .company, h2')?.textContent?.trim();
          const position = item.querySelector('.job_tit, .title')?.textContent?.trim();
          const salary = item.querySelector('.salary, .pay')?.textContent?.trim();
          const conditions = Array.from(item.querySelectorAll('.job_condition, .condition, .recruit_condition span'))
            .map(el => el.textContent.trim());
          
          if (company) {
            results.push({ company, position, salary, conditions });
          }
        });
        
        return results;
      });

      console.log(`[Saramin] 크롤링 완료: ${data.length}개 항목`);
      
      return {
        success: true,
        source: 'saramin',
        count: data.length,
        html: html.slice(0, 100000),
        data
      };

    } catch (error) {
      console.error(`[Saramin] 크롤링 실패:`, error.message);
      return {
        success: false,
        source: 'saramin',
        error: error.message
      };
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * 모든 구인구직 사이트 크롤링
   */
  async crawlAll(companyName) {
    console.log(`[JobSites] 전체 크롤링 시작: ${companyName}`);
    
    const results = await Promise.allSettled([
      this.crawlJobKorea(companyName),
      this.crawlSaramin(companyName)
    ]);

    return {
      jobkorea: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason?.message },
      saramin: results[1].status === 'fulfilled' ? results[1].value : { success: false, error: results[1].reason?.message }
    };
  }
}

export default JobSitesCrawler;
