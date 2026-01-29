# OpenAI API 키 설정 가이드

## 📌 개요
절세계산기 AI 고도화 기능을 위해 OpenAI GPT-4o API 키가 필요합니다.

## 🔑 API 키 설정

### 1. EC2 서버 접속
```bash
ssh -i lightsail-key.pem ubuntu@3.34.186.174
```

### 2. 환경 변수 파일 편집
```bash
cd /var/www/sagunbok-api
sudo nano .env
```

### 3. OpenAI API 키 추가
`.env` 파일에 다음 라인을 추가하세요:
```env
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

**보안 주의사항:**
- API 키는 절대 Git에 커밋하지 마세요
- 키는 `sk-proj-` 또는 `sk-` 로 시작합니다
- 키를 안전한 곳에 보관하세요

### 4. PM2 재시작
```bash
pm2 restart sagunbok-api
pm2 logs sagunbok-api --lines 50
```

## 📊 API 사용량 & 비용

### GPT-4o 비용 (2026년 1월 기준)
- **Input**: $2.50 / 1M tokens
- **Output**: $10.00 / 1M tokens

### 예상 비용 (요청당)
| 분석 타입 | 입력 토큰 | 출력 토큰 | 비용 |
|---------|---------|---------|-----|
| CEO 분석 | ~2,000 | ~1,000 | $0.015 |
| 컨설턴트 분석 | ~2,500 | ~2,500 | $0.034 |

### 월간 예상 비용 (200건 기준)
- CEO 분석 100건: $1.50
- 컨설턴트 분석 100건: $3.40
- **총 월 비용**: ~$5.00

## 🧪 API 테스트

### 1. CEO 분석 테스트
```bash
curl -X POST https://sagunbok.com/api/tax-analysis/analyze/ceo \
  -H "Content-Type: application/json" \
  -d '{
    "simulation_id": "test_001",
    "company_info": {
      "company_name": "테스트컴퍼니",
      "industry": "IT서비스"
    },
    "ceo_info": {
      "annual_salary": 120000000,
      "executive_bonus": 30000000
    },
    "corporate_tax_scenario": {
      "revenue": 2000000000,
      "corporate_tax": 73700000
    },
    "tax_optimization_opportunities": {
      "welfare_benefits": {
        "current": 0,
        "potential": 50000000,
        "tax_saving": 11000000
      }
    }
  }'
```

### 2. 컨설턴트 분석 테스트
```bash
curl -X POST https://sagunbok.com/api/tax-analysis/analyze/consultant \
  -H "Content-Type: application/json" \
  -d @simulation-data-example.json
```

### 3. 응답 예시
```json
{
  "success": true,
  "analysis": "...",
  "company_name": "테스트컴퍼니",
  "timestamp": "2026-01-29T01:00:00Z"
}
```

## 🚨 문제 해결

### API 키 오류
```bash
# 로그 확인
pm2 logs sagunbok-api --lines 100

# 환경 변수 확인
pm2 show sagunbok-api
```

### 일반적인 오류
1. **"API key not configured"** → .env 파일에 OPENAI_API_KEY 추가
2. **"Incorrect API key"** → API 키 형식 확인 (sk-proj- 또는 sk-)
3. **"Rate limit exceeded"** → API 사용량 제한 확인

## 📝 참고 사항
- API 키는 OpenAI 대시보드에서 발급받을 수 있습니다
- 테스트 후 실제 운영 환경에 배포하세요
- API 사용량을 주기적으로 모니터링하세요

## 🔗 관련 파일
- `/home/user/webapp/ai-prompts-config.json` - AI 프롬프트 설정
- `/home/user/webapp/server/controllers/taxAnalysisController.js` - 컨트롤러
- `/home/user/webapp/server/routes/taxAnalysis.js` - 라우트
- `/home/user/webapp/simulation-data-example.json` - 테스트 데이터
