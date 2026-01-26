import express from 'express';
import { authenticateConsultant, requireConsultant } from '../middleware/auth.js';

const router = express.Router();

// 제안서 템플릿 목록
router.get('/templates', authenticateConsultant, requireConsultant, (req, res) => {
  const { category, search } = req.query;
  
  res.json({
    success: true,
    data: {
      templates: [
        {
          id: 'tmpl_001',
          title: '사근복 도입 제안서 (표준형)',
          category: '사근복',
          description: '중소기업 대상 사근복 도입 제안서 템플릿',
          fileType: 'docx',
          fileSize: '250KB',
          downloads: 1245,
          rating: 4.8,
          lastUpdated: '2024-06-01',
          thumbnail: '/templates/sagunbok-standard.png'
        },
        {
          id: 'tmpl_002',
          title: '절세 컨설팅 제안서 (종합형)',
          category: '절세',
          description: '법인세, 종소세 종합 절세 제안서',
          fileType: 'pptx',
          fileSize: '3.2MB',
          downloads: 987,
          rating: 4.9,
          lastUpdated: '2024-05-28',
          thumbnail: '/templates/tax-comprehensive.png'
        },
        {
          id: 'tmpl_003',
          title: 'CEO 개인화 제안서',
          category: 'CEO',
          description: 'CEO 대상 개인화 및 자산관리 제안서',
          fileType: 'pdf',
          fileSize: '1.8MB',
          downloads: 654,
          rating: 4.7,
          lastUpdated: '2024-06-10',
          thumbnail: '/templates/ceo-personal.png'
        }
      ],
      categories: ['전체', '사근복', '절세', 'CEO', '가업승계', '기타']
    }
  });
});

// 템플릿 다운로드
router.get('/templates/:templateId/download', authenticateConsultant, requireConsultant, (req, res) => {
  const { templateId } = req.params;
  
  // TODO: 실제 파일 다운로드 구현
  res.json({
    success: true,
    message: '템플릿 다운로드 준비 완료',
    data: {
      templateId,
      downloadUrl: `/files/templates/${templateId}.docx`,
      expiresIn: 3600 // 1시간
    }
  });
});

// 교육 자료 목록
router.get('/learning', authenticateConsultant, requireConsultant, (req, res) => {
  const { category, level } = req.query;
  
  res.json({
    success: true,
    data: {
      courses: [
        {
          id: 'course_001',
          title: '사근복 기초 과정',
          category: '사근복',
          level: 'beginner',
          duration: 120, // minutes
          modules: 8,
          progress: 100,
          completedAt: '2024-05-15',
          certificate: true
        },
        {
          id: 'course_002',
          title: '절세 전략 실무',
          category: '절세',
          level: 'intermediate',
          duration: 180,
          modules: 12,
          progress: 75,
          completedAt: null,
          certificate: false
        },
        {
          id: 'course_003',
          title: '고객 상담 스킬',
          category: '영업',
          level: 'advanced',
          duration: 90,
          modules: 6,
          progress: 0,
          completedAt: null,
          certificate: false
        }
      ],
      categories: ['전체', '사근복', '절세', 'CEO', '영업', '상담스킬'],
      levels: ['beginner', 'intermediate', 'advanced']
    }
  });
});

// 사례 연구
router.get('/case-studies', authenticateConsultant, requireConsultant, (req, res) => {
  const { industry, size } = req.query;
  
  res.json({
    success: true,
    data: {
      cases: [
        {
          id: 'case_001',
          title: 'IT기업 A사 절세 성공 사례',
          industry: 'IT/소프트웨어',
          companySize: '중견기업',
          challenge: '법인세 부담 과중, 유보금 누적',
          solution: '사근복 도입 + 복지적금 활용',
          result: '연간 법인세 30% 절감 (약 1.2억원)',
          savings: 120000000,
          period: '2023-2024',
          tags: ['사근복', '법인세절세', '중견기업']
        },
        {
          id: 'case_002',
          title: '제조업 B사 가업승계 컨설팅',
          industry: '제조업',
          companySize: '중소기업',
          challenge: '가업승계세 부담, 자금 유동성 부족',
          solution: 'SECRET PLAN 활용 + 자산구조 개편',
          result: '증여세 50% 절감, 승계 완료',
          savings: 300000000,
          period: '2023-2024',
          tags: ['가업승계', '증여세절세', '중소기업']
        }
      ],
      filters: {
        industries: ['IT/소프트웨어', '제조업', '서비스업', '유통/도소매'],
        sizes: ['소기업', '중소기업', '중견기업', '대기업']
      }
    }
  });
});

// FAQ & 지식 베이스
router.get('/knowledge-base', authenticateConsultant, requireConsultant, (req, res) => {
  const { category, search } = req.query;
  
  res.json({
    success: true,
    data: {
      faqs: [
        {
          id: 'faq_001',
          category: '사근복',
          question: '사근복 최소 설립 요건은?',
          answer: '근로자 10인 이상 사업장이며, 사업주와 근로자가 함께 출연금을 납입합니다.',
          views: 1234,
          helpful: 98
        },
        {
          id: 'faq_002',
          category: '절세',
          question: '법인세와 종소세 차이는?',
          answer: '법인세는 법인이 내는 세금, 종소세는 개인(대표)이 내는 세금입니다.',
          views: 987,
          helpful: 95
        }
      ],
      categories: ['전체', '사근복', '절세', 'CEO', '가업승계', '상담기법']
    }
  });
});

// 최신 뉴스 & 법규 업데이트
router.get('/updates', authenticateConsultant, requireConsultant, (req, res) => {
  res.json({
    success: true,
    data: {
      news: [
        {
          id: 'news_001',
          title: '2024년 사근복 세제 혜택 확대',
          summary: '사근복 출연금 한도 상향 및 세액공제 확대',
          category: '세법 개정',
          date: '2024-06-15',
          source: '국세청',
          url: 'https://example.com/news/001'
        },
        {
          id: 'news_002',
          title: '가업승계 특례 적용 범위 확대',
          summary: '중견기업까지 가업승계 특례 적용',
          category: '세법 개정',
          date: '2024-06-10',
          source: '기획재정부',
          url: 'https://example.com/news/002'
        }
      ],
      alerts: [
        {
          id: 'alert_001',
          type: 'urgent',
          title: '법인세 신고 마감 임박',
          message: '3월 결산법인 법인세 신고 기한: 2024년 6월 30일',
          date: '2024-06-20'
        }
      ]
    }
  });
});

export default router;
