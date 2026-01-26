import express from 'express';
import { authenticateConsultant, requireConsultant } from '../middleware/auth.js';

const router = express.Router();

// 대시보드 통계
router.get('/dashboard', authenticateConsultant, requireConsultant, (req, res) => {
  // TODO: 실제 데이터베이스에서 통계 조회
  res.json({
    success: true,
    data: {
      overview: {
        totalCustomers: 24,
        activeCustomers: 18,
        newThisMonth: 5,
        totalRevenue: 125000000,
        monthlyTarget: 150000000,
        achievementRate: 83.3
      },
      recentActivity: [
        {
          id: 'act_001',
          type: 'consultation',
          customer: '(주)테크놀로지',
          description: '절세 컨설팅 완료',
          timestamp: new Date().toISOString()
        },
        {
          id: 'act_002',
          type: 'proposal',
          customer: '(주)마케팅솔루션',
          description: '제안서 발송',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      upcomingTasks: [
        {
          id: 'task_001',
          customer: '(주)제조업',
          task: '정기 상담',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          priority: 'high'
        }
      ],
      performanceChart: {
        labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
        consultations: [8, 12, 15, 18, 20, 22],
        revenue: [20, 35, 48, 62, 88, 125]
      }
    }
  });
});

// 월간 실적 보고서
router.get('/monthly-report', authenticateConsultant, requireConsultant, (req, res) => {
  const { year, month } = req.query;
  
  res.json({
    success: true,
    data: {
      period: `${year}-${month}`,
      summary: {
        consultations: {
          total: 22,
          completed: 20,
          cancelled: 2,
          avgDuration: 45 // minutes
        },
        customers: {
          new: 5,
          retained: 18,
          churn: 1
        },
        revenue: {
          total: 125000000,
          target: 150000000,
          achievement: 83.3
        },
        proposals: {
          sent: 12,
          accepted: 8,
          rejected: 2,
          pending: 2
        }
      },
      topCustomers: [
        { name: '(주)테크놀로지', revenue: 50000000, consultations: 5 },
        { name: '(주)마케팅솔루션', revenue: 30000000, consultations: 4 },
        { name: '(주)제조업', revenue: 25000000, consultations: 3 }
      ],
      categoryBreakdown: {
        '절세컨설팅': 45,
        '사근복도입': 30,
        '가업승계': 15,
        '기타': 10
      }
    }
  });
});

// 고객 분석
router.get('/customer-insights', authenticateConsultant, requireConsultant, (req, res) => {
  res.json({
    success: true,
    data: {
      industryDistribution: {
        'IT/소프트웨어': 8,
        '제조업': 6,
        '서비스업': 5,
        '유통/도소매': 3,
        '기타': 2
      },
      customerSegments: {
        'VIP (매출 5천만 이상)': 4,
        '주요 고객 (3천만~5천만)': 6,
        '일반 고객 (3천만 미만)': 14
      },
      consultationTrends: {
        peakHours: ['10:00-12:00', '14:00-16:00'],
        peakDays: ['화요일', '목요일'],
        avgConsultationTime: 45
      },
      conversionRates: {
        prospectToCustomer: 75,
        proposalAcceptance: 66.7,
        customerRetention: 94.7
      }
    }
  });
});

// 성과 분석
router.get('/performance', authenticateConsultant, requireConsultant, (req, res) => {
  const { period = 'quarter' } = req.query; // month, quarter, year
  
  res.json({
    success: true,
    data: {
      period,
      kpis: {
        customerAcquisition: {
          value: 15,
          target: 20,
          achievement: 75,
          trend: '+20%'
        },
        revenuePerCustomer: {
          value: 5208333,
          target: 5000000,
          achievement: 104.2,
          trend: '+8%'
        },
        consultationEfficiency: {
          value: 91.7,
          target: 90,
          achievement: 101.9,
          trend: '+3%'
        },
        customerSatisfaction: {
          value: 4.7,
          target: 4.5,
          achievement: 104.4,
          trend: '+5%'
        }
      },
      rankings: {
        teamRank: 3,
        teamTotal: 15,
        topPerformers: [
          { name: '김컨설턴트', revenue: 180000000 },
          { name: '이컨설턴트', revenue: 150000000 },
          { name: req.user.name, revenue: 125000000 }
        ]
      },
      achievements: [
        {
          title: '월 목표 달성',
          icon: '🎯',
          unlocked: true,
          date: '2024-06-01'
        },
        {
          title: 'VIP 고객 10명 확보',
          icon: '⭐',
          unlocked: false,
          progress: 40
        }
      ]
    }
  });
});

export default router;
