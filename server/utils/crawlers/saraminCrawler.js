import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

/**
 * 사람인 크롤러
 * - 채용공고 정보
 * - 연봉 정보
 * - 복리후생 정보
 */

class SaraminCrawler {
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
   * 사람인 기업 검색 및 크롤링
   */
  async crawlCompany(companyName) {
    let browser;
    try {
      console.log(`[Saramin] 크롤링 시작: ${companyName}`);
      
      browser = await this.launchBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // 사람인 채용공고 검색
      const searchUrl = `https://www.saramin.co.kr/zf_user/search?searchType=search&searchword=${encodeURIComponent(companyName)}`;
      console.log(`[Saramin] 검색 URL: ${searchUrl}`);
      
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout
      });

      // 페이지 로딩 대기
      await page.waitForTimeout(3000);

      // HTML 추출
      const html = await page.content();
      const $ = cheerio.load(html);

      // 채용공고 정보 추출
      const jobs = [];
      $('.item_recruit').each((i, elem) => {
        if (i >= 10) return; // 최대 10개

        const $elem = $(elem);
        const title = $elem.find('.job_tit a').text().trim();
        const company = $elem.find('.corp_name a').text().trim();
        const location = $elem.find('.job_condition .job_day').text().trim();
        const salary = $elem.find('.job_condition .job_sector').text().trim();
        
        // 복리후생
        const welfare = [];
        $elem.find('.job_sector').each((j, tag) => {
          const text = $(tag).text().trim();
          if (text && !text.includes('경력') && !text.includes('학력')) {
            welfare.push(text);
          }
        });

        if (company.includes(companyName) || title.includes(companyName)) {
          jobs.push({
            title,
            company,
            location,
            salary,
            welfare: welfare.join(', '),
            link: 'https://www.saramin.co.kr' + $elem.find('.job_tit a').attr('href')
          });
        }
      });

      console.log(`[Saramin] 크롤링 완료: ${jobs.length}개 채용공고`);

      // AI 파싱용 요약 데이터
      const summary = {
        totalJobs: jobs.length,
        salaryInfo: jobs.map(j => j.salary).filter(Boolean),
        welfareInfo: jobs.map(j => j.welfare).filter(Boolean),
        locations: jobs.map(j => j.location).filter(Boolean)
      };

      return {
        success: true,
        source: 'saramin',
        companyName,
        jobs,
        summary,
        html: html.slice(0, 50000) // 50KB 제한
      };

    } catch (error) {
      console.error(`[Saramin] 크롤링 실패:`, error.message);
      return {
        success: false,
        source: 'saramin',
        error: error.message,
        stack: error.stack
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export default SaraminCrawler;
