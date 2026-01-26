#!/usr/bin/env node

/**
 * 크롤링 테스트 스크립트
 * Usage: node test-crawler.js "회사명"
 */

import { crawlAllJobSites, crawlAllReviewSites } from './utils/crawler.js';

const companyName = process.argv[2] || '삼성전자';

console.log(`\n${'='.repeat(60)}`);
console.log(`크롤링 테스트 시작: ${companyName}`);
console.log(`${'='.repeat(60)}\n`);

async function test() {
  try {
    // 1. 구인구직 사이트 크롤링
    console.log('\n[1단계] 구인구직 사이트 크롤링...\n');
    const jobs = await crawlAllJobSites(companyName);
    
    console.log('\n=== 구인구직 크롤링 결과 ===');
    console.log(`총 ${jobs.length}개 공고 수집`);
    jobs.forEach((job, idx) => {
      console.log(`\n${idx + 1}. [${job.site}] ${job.position}`);
      console.log(`   회사: ${job.company}`);
      console.log(`   복지: ${job.welfare}`);
      console.log(`   연봉: ${job.salary}`);
    });
    
    // 2. 리뷰 사이트 크롤링
    console.log('\n\n[2단계] 리뷰 사이트 크롤링...\n');
    const reviews = await crawlAllReviewSites(companyName);
    
    console.log('\n=== 리뷰 크롤링 결과 ===');
    console.log(`총 ${reviews.length}개 리뷰 수집`);
    reviews.forEach((review, idx) => {
      console.log(`\n${idx + 1}. [${review.site}]`);
      console.log(`   평점: ${review.rating}`);
      if (review.pros) console.log(`   장점: ${review.pros}`);
      if (review.cons) console.log(`   단점: ${review.cons}`);
      if (review.content) console.log(`   내용: ${review.content.substring(0, 100)}...`);
    });
    
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ 크롤링 테스트 완료!');
    console.log(`${'='.repeat(60)}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
