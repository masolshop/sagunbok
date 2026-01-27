import express from 'express';
import { authenticateConsultant, requireConsultant } from '../middleware/auth.js';

const router = express.Router();

// 고객 목록 조회
router.get('/', authenticateConsultant, requireConsultant, (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  
  // TODO: 데이터베이스에서 고객 목록 조회
  const mockCustomers = [
    {
      id: 'cust_001',
      companyName: '(주)테크놀로지',
      ceo: '김대표',
      phone: '010-1234-5678',
      email: 'ceo@technology.com',
      status: 'active',
      lastContact: new Date().toISOString(),
      createdAt: '2024-01-15',
      tags: ['IT', '대기업', 'VIP']
    },
    {
      id: 'cust_002',
      companyName: '(주)마케팅솔루션',
      ceo: '이대표',
      phone: '010-2345-6789',
      email: 'ceo@marketing.com',
      status: 'prospect',
      lastContact: new Date(Date.now() - 86400000).toISOString(),
      createdAt: '2024-02-01',
      tags: ['마케팅', '중소기업']
    },
    {
      id: 'cust_003',
      companyName: '(주)제조업',
      ceo: '박대표',
      phone: '010-3456-7890',
      email: 'ceo@manufacturing.com',
      status: 'active',
      lastContact: new Date(Date.now() - 172800000).toISOString(),
      createdAt: '2024-01-20',
      tags: ['제조', '중견기업']
    }
  ];

  res.json({
    success: true,
    data: {
      customers: mockCustomers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 24,
        totalPages: 2
      }
    }
  });
});

// 고객 상세 조회
router.get('/:customerId', authenticateConsultant, requireConsultant, (req, res) => {
  const { customerId } = req.params;
  
  // TODO: 데이터베이스에서 고객 상세 조회
  res.json({
    success: true,
    data: {
      id: customerId,
      companyName: '(주)테크놀로지',
      ceo: '김대표',
      phone: '010-1234-5678',
      email: 'ceo@technology.com',
      address: '서울시 강남구 테헤란로 123',
      industry: 'IT/소프트웨어',
      employeeCount: 50,
      revenue: 10000000000,
      status: 'active',
      tags: ['IT', '대기업', 'VIP'],
      notes: '매우 중요한 고객. 정기 상담 필요.',
      createdAt: '2024-01-15',
      updatedAt: new Date().toISOString(),
      consultations: [
        {
          id: 'consult_001',
          date: '2024-03-15',
          type: '절세 컨설팅',
          status: 'completed',
          notes: '사근복 도입 제안 완료'
        }
      ],
      proposals: [
        {
          id: 'prop_001',
          date: '2024-03-20',
          title: '사근복 도입 제안서',
          status: 'accepted',
          amount: 50000000
        }
      ]
    }
  });
});

// 고객 등록
router.post('/', authenticateConsultant, requireConsultant, (req, res) => {
  const { companyName, ceo, phone, email, industry, employeeCount } = req.body;
  
  // 유효성 검사
  if (!companyName || !ceo || !phone) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '필수 정보가 누락되었습니다.'
    });
  }

  // TODO: 데이터베이스에 고객 저장
  const newCustomer = {
    id: `cust_${Date.now()}`,
    companyName,
    ceo,
    phone,
    email,
    industry,
    employeeCount,
    status: 'prospect',
    consultantId: req.user.id,
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: '고객이 등록되었습니다.',
    data: newCustomer
  });
});

// 고객 정보 수정
router.put('/:customerId', authenticateConsultant, requireConsultant, (req, res) => {
  const { customerId } = req.params;
  const updateData = req.body;
  
  // TODO: 데이터베이스 업데이트
  res.json({
    success: true,
    message: '고객 정보가 수정되었습니다.',
    data: {
      id: customerId,
      ...updateData,
      updatedAt: new Date().toISOString()
    }
  });
});

// 고객 삭제
router.delete('/:customerId', authenticateConsultant, requireConsultant, (req, res) => {
  const { customerId } = req.params;
  
  // TODO: 데이터베이스에서 삭제 (soft delete 권장)
  res.json({
    success: true,
    message: '고객이 삭제되었습니다.'
  });
});

// 상담 기록 추가
router.post('/:customerId/consultations', authenticateConsultant, requireConsultant, (req, res) => {
  const { customerId } = req.params;
  const { type, notes, nextSchedule } = req.body;
  
  // TODO: 상담 기록 저장
  const consultation = {
    id: `consult_${Date.now()}`,
    customerId,
    consultantId: req.user.id,
    type,
    notes,
    nextSchedule,
    date: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: '상담 기록이 추가되었습니다.',
    data: consultation
  });
});

export default router;
