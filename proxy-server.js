import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// CORS 모든 도메인 허용
app.use(cors());
app.use(express.json());

// Apps Script URL (Updated 2026-01-21 18:10 - V5.4 FINAL)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5c6wArjU15_l6bXfMNe2oMpQXMQtwqvO4eyNQ1BcP1LtSXmYECNj2EatGWP09pDnYQw/exec';

// 프록시 엔드포인트
app.post('/api/auth', async (req, res) => {
  try {
    console.log('=== Proxy Request ===');
    console.log('Body:', req.body);

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    console.log('Apps Script Response:', text);

    // JSON으로 파싱 시도
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      res.status(500).json({
        success: false,
        error: 'Apps Script returned invalid JSON',
        response: text.substring(0, 500)
      });
    }

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sagunbok Proxy Server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`Apps Script URL: ${APPS_SCRIPT_URL}`);
});
