/**
 * CORS 프록시 서버
 * Google Apps Script 백엔드에 대한 요청을 프록시합니다.
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Google Apps Script 백엔드 URL
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxrHrk25rNmxtKsySrM-Ru_lnSkexHzryQl38HCLss6XZsBdgKm_uGTl329TR3l9u4g/exec';

// CORS 미들웨어 설정 (모든 origin 허용)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 파싱
app.use(express.json());

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CORS Proxy Server is running',
    backend: BACKEND_URL,
    timestamp: new Date().toISOString()
  });
});

// GET 요청 프록시 (테스트용)
app.get('/api', async (req, res) => {
  try {
    console.log('📥 GET Request to backend');
    const response = await fetch(BACKEND_URL, {
      method: 'GET',
      redirect: 'follow'
    });
    
    const data = await response.json();
    console.log('✅ Response:', data);
    
    res.json(data);
  } catch (error) {
    console.error('❌ GET Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Proxy server error: ' + error.message 
    });
  }
});

// POST 요청 프록시 (회원가입, 로그인 등)
app.post('/api', async (req, res) => {
  try {
    console.log('📥 POST Request:', req.body);
    
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      redirect: 'follow'
    });
    
    const data = await response.json();
    console.log('✅ Response:', data);
    
    res.json(data);
  } catch (error) {
    console.error('❌ POST Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Proxy server error: ' + error.message 
    });
  }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 CORS Proxy Server started!');
  console.log(`📍 Server running at http://0.0.0.0:${PORT}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`✅ Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📡 API endpoint: http://0.0.0.0:${PORT}/api`);
});
