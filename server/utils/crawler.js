import { chromium } from 'playwright';

/**
 * 실제 웹 크롤링 유틸리티
 * Playwright 기반
 */

// 잡코리아 크롤링
export async function crawlJobKorea(companyName) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // 잡코리아 검색
    const searchUrl = `https://www.jobkorea.co.kr/Search/?stext=${encodeURIComponent(companyName)}`;
    console.log('[JobKorea] 검색 URL:', searchUrl);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 채용 공고 목록 추출
    const jobs = await page.evaluate(() => {
      const results = [];
      const jobItems = document.querySelectorAll('.recruit-info, .post-list-corp, article');
      
      jobItems.forEach((item, idx) => {
        if (idx >= 5) return; // 최대 5개
        
        const titleEl = item.querySelector('.title, .name, h3, a');
        const companyEl = item.querySelector('.company, .corp-name');
        const welfareEl = item.querySelector('.welfare, .benefit, .condition');
        const salaryEl = item.querySelector('.salary, .pay');
        
        if (titleEl) {
          results.push({
            position: titleEl.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            welfare: welfareEl?.textContent?.trim() || '정보 없음',
            salary: salaryEl?.textContent?.trim() || '협의',
            site: 'jobkorea'
          });
        }
      });
      
      return results;
    });
    
    console.log(`[JobKorea] ${jobs.length}개 공고 추출`);
    return jobs;
    
  } catch (error) {
    console.error('[JobKorea] 크롤링 오류:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

// 사람인 크롤링
export async function crawlSaramin(companyName) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // 사람인 검색
    const searchUrl = `https://www.saramin.co.kr/zf_user/search/recruit?searchType=search&searchword=${encodeURIComponent(companyName)}`;
    console.log('[Saramin] 검색 URL:', searchUrl);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 채용 공고 목록 추출
    const jobs = await page.evaluate(() => {
      const results = [];
      const jobItems = document.querySelectorAll('.item_recruit, .recruit_list_box, .recruit_item');
      
      jobItems.forEach((item, idx) => {
        if (idx >= 5) return;
        
        const titleEl = item.querySelector('.job_tit, .recruit_info, h2 a');
        const companyEl = item.querySelector('.corp_name, .company_nm');
        const conditionEl = item.querySelector('.job_condition, .recruit_condition');
        
        if (titleEl) {
          results.push({
            position: titleEl.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            welfare: conditionEl?.textContent?.trim() || '정보 없음',
            salary: '회사 내규에 따름',
            site: 'saramin'
          });
        }
      });
      
      return results;
    });
    
    console.log(`[Saramin] ${jobs.length}개 공고 추출`);
    return jobs;
    
  } catch (error) {
    console.error('[Saramin] 크롤링 오류:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

// 블라인드 크롤링
export async function crawlBlind(companyName) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // 블라인드 회사 검색
    const searchUrl = `https://www.teamblind.com/kr/company/${encodeURIComponent(companyName)}/reviews`;
    console.log('[Blind] 검색 URL:', searchUrl);
    
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
      
      // 리뷰 추출
      const reviews = await page.evaluate(() => {
        const results = [];
        const reviewItems = document.querySelectorAll('.review-item, .review-card, article');
        
        reviewItems.forEach((item, idx) => {
          if (idx >= 3) return;
          
          const ratingEl = item.querySelector('.rating, .star-rating');
          const prosEl = item.querySelector('.pros, .positive');
          const consEl = item.querySelector('.cons, .negative');
          
          results.push({
            rating: ratingEl?.textContent?.trim() || '정보 없음',
            pros: prosEl?.textContent?.trim() || '',
            cons: consEl?.textContent?.trim() || '',
            site: 'blind'
          });
        });
        
        return results;
      });
      
      console.log(`[Blind] ${reviews.length}개 리뷰 추출`);
      return reviews;
      
    } catch (navError) {
      console.log('[Blind] 페이지 접근 불가, 빈 배열 반환');
      return [];
    }
    
  } catch (error) {
    console.error('[Blind] 크롤링 오류:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

// 잡플래닛 크롤링
export async function crawlJobPlanet(companyName) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // 잡플래닛 검색
    const searchUrl = `https://www.jobplanet.co.kr/companies?query=${encodeURIComponent(companyName)}`;
    console.log('[JobPlanet] 검색 URL:', searchUrl);
    
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
      
      // 리뷰 추출
      const reviews = await page.evaluate(() => {
        const results = [];
        const reviewItems = document.querySelectorAll('.review_section, .content_wrap, .us_content');
        
        reviewItems.forEach((item, idx) => {
          if (idx >= 3) return;
          
          const ratingEl = item.querySelector('.star_point, .rating');
          const contentEl = item.querySelector('.content, .review-content');
          
          results.push({
            rating: ratingEl?.textContent?.trim() || '정보 없음',
            content: contentEl?.textContent?.trim() || '',
            site: 'jobplanet'
          });
        });
        
        return results;
      });
      
      console.log(`[JobPlanet] ${reviews.length}개 리뷰 추출`);
      return reviews;
      
    } catch (navError) {
      console.log('[JobPlanet] 페이지 접근 불가, 빈 배열 반환');
      return [];
    }
    
  } catch (error) {
    console.error('[JobPlanet] 크롤링 오류:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

// 통합 크롤링 함수
export async function crawlAllJobSites(companyName) {
  console.log(`\n=== 구인구직 사이트 크롤링 시작: ${companyName} ===\n`);
  
  const results = await Promise.allSettled([
    crawlJobKorea(companyName),
    crawlSaramin(companyName)
  ]);
  
  const allJobs = [];
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      allJobs.push(...result.value);
    } else {
      console.error(`[크롤링 ${idx}] 실패:`, result.reason);
    }
  });
  
  console.log(`\n=== 총 ${allJobs.length}개 공고 수집 완료 ===\n`);
  return allJobs;
}

export async function crawlAllReviewSites(companyName) {
  console.log(`\n=== 리뷰 사이트 크롤링 시작: ${companyName} ===\n`);
  
  const results = await Promise.allSettled([
    crawlBlind(companyName),
    crawlJobPlanet(companyName)
  ]);
  
  const allReviews = [];
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      allReviews.push(...result.value);
    } else {
      console.error(`[크롤링 ${idx}] 실패:`, result.reason);
    }
  });
  
  console.log(`\n=== 총 ${allReviews.length}개 리뷰 수집 완료 ===\n`);
  return allReviews;
}
