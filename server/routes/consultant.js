import express from 'express';
import { authenticateConsultant, requireConsultant } from '../middleware/auth.js';

const router = express.Router();

// 컨설턴트 프로필 조회
router.get('/profile', authenticateConsultant, requireConsultant, (req, res) => {
  // TODO: 데이터베이스에서 프로필 조회
  res.json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      position: req.user.position,
      phone: '010-6352-9091',
      joinDate: '2024-01-01',
      totalCustomers: 24,
      activeCustomers: 18,
      completedProjects: 156,
      monthlyGoal: 30,
      monthlyAchievement: 22
    }
  });
});

// 컨설턴트 프로필 수정
router.put('/profile', authenticateConsultant, requireConsultant, (req, res) => {
  const { name, phone, email } = req.body;
  
  // TODO: 데이터베이스 업데이트
  res.json({
    success: true,
    message: '프로필이 업데이트되었습니다.',
    data: {
      id: req.user.id,
      name: name || req.user.name,
      phone: phone || '010-6352-9091',
      email: email || req.user.email
    }
  });
});

// 컨설턴트 활동 로그
router.get('/activity-log', authenticateConsultant, requireConsultant, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  // TODO: 데이터베이스에서 활동 로그 조회
  res.json({
    success: true,
    data: {
      logs: [
        {
          id: 'log_001',
          type: 'customer_contact',
          description: '고객 상담 완료',
          customerId: 'cust_123',
          customerName: '(주)테크놀로지',
          timestamp: new Date().toISOString()
        },
        {
          id: 'log_002',
          type: 'proposal_sent',
          description: '제안서 발송',
          customerId: 'cust_124',
          customerName: '(주)마케팅',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 156,
        totalPages: 8
      }
    }
  });
});

// 컨설턴트 통계
router.get('/stats', authenticateConsultant, requireConsultant, (req, res) => {
  const { period = 'month' } = req.query; // day, week, month, year
  
  // TODO: 데이터베이스에서 통계 조회
  res.json({
    success: true,
    data: {
      period,
      consultations: {
        total: 45,
        completed: 38,
        inProgress: 7,
        trend: '+12%'
      },
      revenue: {
        total: 125000000,
        target: 150000000,
        achievement: 83.3,
        trend: '+8%'
      },
      customers: {
        new: 5,
        active: 18,
        churn: 1,
        retention: 94.7
      },
      proposals: {
        sent: 12,
        accepted: 8,
        rejected: 2,
        pending: 2,
        acceptanceRate: 66.7
      }
    }
  });
});

export default router;
