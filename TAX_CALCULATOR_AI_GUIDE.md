# 절세계산기 AI 분석 고도화 가이드

## 📋 개요

절세계산기에서 시뮬레이션 후 **GPT-4를 활용한 2가지 관점의 AI 절세 분석**을 제공합니다.

---

## 🎯 2가지 분석 유형

### 1. 기업회원용 (CEO 관점)
**특징**:
- 경영자 중심의 실용적 분석
- 명확한 수치와 즉시 실행 가능한 방안
- 짧고 명확한 분석 (800~1000자)

**분석 내용**:
- 🎯 핵심 절세 포인트 (3~5개)
- 💰 예상 절세 효과 (구체적 금액)
- 📋 즉시 실행 가능한 액션 아이템 (3개)
- ⚠️ 리스크 및 주의사항

### 2. 컨설턴트용 (사근복 전문가 관점)
**특징**:
- 전문가적이고 심층적인 분석
- 법적 근거와 리스크 명확히 설명
- 상세하고 포괄적인 분석 (2000~2500자)

**분석 내용**:
- 📊 종합 세무 분석 (심층 분석)
- 🏆 우선순위 절세 전략 (5~7개, 효과 순)
- 💼 근로복지 최적화 방안 (구체적 설계안)
- 📈 장기 절세 로드맵 (1년/3년/5년)
- ⚖️ 법적 근거 및 리스크 분석
- 🎯 산업 특화 전략
- 💡 추가 컨설팅 포인트

---

## 🔧 설정 방법

### 1. OpenAI API 키 발급
1. https://platform.openai.com 접속
2. API Keys 메뉴에서 새 키 생성
3. 키를 안전하게 저장

### 2. EC2 서버에 API 키 설정
```bash
ssh -i lightsail-key.pem ubuntu@3.34.186.174
cd /var/www/sagunbok-api
echo "OPENAI_API_KEY=sk-proj-your-key-here" >> .env
pm2 restart sagunbok-api
```

### 3. 파일 업로드
```bash
# 로컬에서 실행
cd /home/user/webapp
scp -i lightsail-key.pem ai-prompts-config.json ubuntu@3.34.186.174:/var/www/sagunbok-api/
scp -i lightsail-key.pem server/controllers/taxAnalysisController.js ubuntu@3.34.186.174:/var/www/sagunbok-api/controllers/
scp -i lightsail-key.pem server/routes/taxAnalysis.js ubuntu@3.34.186.174:/var/www/sagunbok-api/routes/
```

### 4. 메인 서버 파일에 라우트 추가
```javascript
// server/index.js or app.js
import taxAnalysisRouter from './routes/taxAnalysis.js';

app.use('/api/tax-analysis', taxAnalysisRouter);
```

---

## 📡 API 사용법

### CEO 관점 분석
```bash
POST /api/tax-analysis/analyze/ceo
Content-Type: application/json

{
  "simulation_id": "sim_20260129_001",
  "created_at": "2026-01-29T00:30:00Z",
  "user_type": "company",
  "company_info": {
    "business_number": "220-81-62708",
    "company_name": "에스텍시스템",
    "company_type": "법인",
    "industry": "IT서비스"
  },
  "simulation_data": {
    "total_employees": 10,
    "ceo_info": {
      "annual_salary": 120000000,
      "executive_bonus": 30000000
    },
    "employees": [...],
    "corporate_tax_scenario": {
      "revenue": 2000000000,
      "corporate_tax": 73700000
    }
  },
  "net_pay_analysis": {
    "ceo": {
      "gross_annual": 120000000,
      "net_annual": 81474000,
      "actual_tax_rate": 0.321
    }
  },
  "tax_optimization_opportunities": {
    "welfare_benefits": {
      "tax_saving": 11000000
    },
    "research_deduction": {
      "tax_saving": 22000000
    }
  }
}
```

**응답 예시**:
```json
{
  "success": true,
  "analysis_type": "ceo",
  "company_name": "에스텍시스템",
  "analysis": "🎯 핵심 절세 포인트\n\n1. 복리후생비 활용\n- 현재 미활용 상태\n- 연 5천만원 복리후생비 도입 시 약 1,100만원 절세...",
  "timestamp": "2026-01-29T00:45:00Z"
}
```

### 컨설턴트 관점 분석
```bash
POST /api/tax-analysis/analyze/consultant
Content-Type: application/json

(동일한 JSON 데이터)
```

**응답 예시**:
```json
{
  "success": true,
  "analysis_type": "consultant",
  "company_name": "에스텍시스템",
  "analysis": "📊 종합 세무 분석\n\n귀사는 IT서비스 업종으로 연매출 20억원...",
  "timestamp": "2026-01-29T00:45:00Z"
}
```

---

## 🧪 테스트

### 1. curl로 테스트
```bash
curl -X POST http://localhost:3000/api/tax-analysis/analyze/ceo \
  -H "Content-Type: application/json" \
  -d @simulation-data-example.json
```

### 2. 프론트엔드에서 테스트
```typescript
// Frontend 코드 예시
const response = await fetch('/api/tax-analysis/analyze/ceo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(simulationData),
});

const result = await response.json();
console.log(result.analysis);
```

---

## 💰 비용 추정

### GPT-4o 가격 (2026년 1월 기준)
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens

### 예상 토큰 사용량
- **CEO 분석**: 약 2,000 tokens (input) + 1,000 tokens (output) = **약 $0.015/건**
- **컨설턴트 분석**: 약 3,500 tokens (input) + 2,500 tokens (output) = **약 $0.034/건**

### 월간 비용 예측
- 100건/월 (CEO): $1.50
- 100건/월 (컨설턴트): $3.40
- **총 200건/월: 약 $5**

---

## 📁 파일 구조

```
webapp/
├── ai-prompts-config.json              # AI 프롬프트 설정
├── simulation-data-example.json         # 시뮬레이션 데이터 예시
├── TAX_CALCULATOR_AI_GUIDE.md          # 이 문서
└── server/
    ├── controllers/
    │   └── taxAnalysisController.js    # AI 분석 컨트롤러
    └── routes/
        └── taxAnalysis.js               # API 라우트
```

---

## ⚠️ 주의사항

1. **API 키 보안**
   - `.env` 파일에만 저장
   - Git에 절대 커밋하지 말 것
   - EC2 서버에만 설정

2. **비용 관리**
   - API 호출 로그 모니터링
   - 월간 사용량 추적
   - 필요시 rate limiting 구현

3. **에러 처리**
   - API 호출 실패 시 사용자에게 명확한 메시지
   - 타임아웃 설정 (60초)
   - 재시도 로직 고려

---

## 🚀 다음 단계

1. ✅ API 키 설정
2. ✅ 파일 업로드
3. ✅ 서버 재시작
4. ✅ 테스트
5. 🔲 Frontend UI 개발
6. 🔲 사용자 피드백 수집
7. 🔲 프롬프트 최적화

---

**문의사항이 있으면 PR 코멘트로 남겨주세요!** 🎉
