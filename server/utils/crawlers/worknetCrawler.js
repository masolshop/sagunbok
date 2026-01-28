import axios from 'axios';

/**
 * 워크넷 공개 API 크롤러
 * API 문서: https://openapi.work.go.kr/
 */

const WORKNET_API_BASE = 'https://openapi.work.go.kr/opi/opi/opia';

class WorknetCrawler {
  constructor(authKey) {
    this.authKey = authKey || 'SAMPLE'; // 실제 키로 교체 필요
  }

  /**
   * 채용 정보 검색
   */
  async searchJobs(companyName, options = {}) {
    try {
      console.log(`[Worknet] 채용 정보 검색: ${companyName}`);

      const params = {
        authKey: this.authKey,
        callTp: 'L',                    // 목록 조회
        returnType: 'JSON',
        startPage: options.page || 1,
        display: options.limit || 20,
        keyword: companyName,
        ...options
      };

      const response = await axios.get(`${WORKNET_API_BASE}/wantedApi.do`, {
        params,
        timeout: 10000
      });

      if (response.data.jobsrrch) {
        const jobs = response.data.jobsrrch.wanted || [];
        console.log(`[Worknet] 검색 결과: ${jobs.length}개`);
        
        return {
          success: true,
          count: jobs.length,
          jobs: jobs.map(job => this.parseJob(job))
        };
      }

      return { success: false, count: 0, jobs: [] };

    } catch (error) {
      console.error(`[Worknet] 검색 실패:`, error.message);
      return { 
        success: false, 
        error: error.message,
        jobs: [] 
      };
    }
  }

  /**
   * 채용 정보 파싱
   */
  parseJob(job) {
    return {
      company: job.company || job.cmpnyNm || '',
      position: job.wantedTitle || '',
      salary: {
        min: this.parseSalary(job.salTpNm),
        max: null,
        raw: job.salTpNm || ''
      },
      location: job.region || job.regionNm || '',
      experience: job.career || '',
      education: job.education || '',
      employment_type: job.empType || '',
      url: job.wantedInfoUrl || job.url || '',
      posted_date: job.regDt || '',
      benefits: this.parseBenefits(job),
      source: 'worknet'
    };
  }

  /**
   * 연봉 파싱 (예: "회사내규에 따름", "2500~3500")
   */
  parseSalary(salaryText) {
    if (!salaryText) return null;
    
    // 숫자 추출
    const numbers = salaryText.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return parseInt(numbers[0]) * 10000; // 만원 단위 → 원
    }
    
    return null;
  }

  /**
   * 복지 항목 파싱
   */
  parseBenefits(job) {
    const benefits = [];
    
    // 워크넷 API에서 제공하는 복지 정보
    if (job.welfare) benefits.push(...job.welfare.split(','));
    if (job.fourIns) benefits.push('4대보험');
    if (job.retirePay) benefits.push('퇴직금');
    
    return benefits.filter(b => b);
  }

  /**
   * 회사 정보 조회
   */
  async getCompanyInfo(companyName) {
    try {
      console.log(`[Worknet] 회사 정보 조회: ${companyName}`);

      // 채용 정보에서 회사 정보 추출
      const jobData = await this.searchJobs(companyName, { limit: 5 });
      
      if (jobData.jobs.length === 0) {
        return { success: false, message: '회사 정보를 찾을 수 없습니다.' };
      }

      // 첫 번째 결과에서 회사 정보 추출
      const firstJob = jobData.jobs[0];
      
      return {
        success: true,
        company: {
          name: firstJob.company,
          jobs_count: jobData.count,
          recent_salaries: jobData.jobs
            .map(j => j.salary.min)
            .filter(s => s !== null),
          common_benefits: this.extractCommonBenefits(jobData.jobs)
        }
      };

    } catch (error) {
      console.error(`[Worknet] 회사 정보 조회 실패:`, error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * 공통 복지 항목 추출
   */
  extractCommonBenefits(jobs) {
    const benefitCounts = {};
    
    jobs.forEach(job => {
      job.benefits.forEach(benefit => {
        benefitCounts[benefit] = (benefitCounts[benefit] || 0) + 1;
      });
    });

    // 50% 이상 나타나는 복지 항목만
    const threshold = jobs.length * 0.5;
    return Object.entries(benefitCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([benefit, _]) => benefit);
  }
}

export default WorknetCrawler;
