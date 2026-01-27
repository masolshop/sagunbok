# 🚀 Sagunbok Consultant Zone API Server

Express 기반의 컨설턴트 전용 API 서버입니다.

## 📋 Features

### 1. 컨설턴트 관리 (`/api/consultant`)
- ✅ 프로필 조회 및 수정
- ✅ 활동 로그 조회
- ✅ 통계 조회

### 2. 고객 관리 (`/api/customers`)
- ✅ 고객 목록 조회 (페이지네이션, 검색, 필터)
- ✅ 고객 상세 정보
- ✅ 고객 등록/수정/삭제
- ✅ 상담 기록 관리

### 3. 분석 & 통계 (`/api/analytics`)
- ✅ 대시보드 통계
- ✅ 월간 실적 보고서
- ✅ 고객 인사이트
- ✅ 성과 분석 & KPI

### 4. 리소스 관리 (`/api/resources`)
- ✅ 제안서 템플릿
- ✅ 교육 자료
- ✅ 사례 연구
- ✅ FAQ & 지식 베이스
- ✅ 최신 뉴스 & 법규 업데이트

## 🛠️ Installation

```bash
cd server
npm install
```

## 🚀 Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Consultant
```
GET    /api/consultant/profile          # 프로필 조회
PUT    /api/consultant/profile          # 프로필 수정
GET    /api/consultant/activity-log     # 활동 로그
GET    /api/consultant/stats            # 통계
```

### Customers
```
GET    /api/customers                   # 고객 목록
GET    /api/customers/:id               # 고객 상세
POST   /api/customers                   # 고객 등록
PUT    /api/customers/:id               # 고객 수정
DELETE /api/customers/:id               # 고객 삭제
POST   /api/customers/:id/consultations # 상담 기록 추가
```

### Analytics
```
GET    /api/analytics/dashboard         # 대시보드
GET    /api/analytics/monthly-report    # 월간 보고서
GET    /api/analytics/customer-insights # 고객 분석
GET    /api/analytics/performance       # 성과 분석
```

### Resources
```
GET    /api/resources/templates         # 템플릿 목록
GET    /api/resources/templates/:id/download  # 템플릿 다운로드
GET    /api/resources/learning          # 교육 자료
GET    /api/resources/case-studies      # 사례 연구
GET    /api/resources/knowledge-base    # FAQ
GET    /api/resources/updates           # 최신 뉴스
```

## 🔐 Authentication

모든 API 요청에는 인증 헤더가 필요합니다:

```
Authorization: Bearer <token>
```

또는 API Key:

```
X-API-Key: <api_key>
```

## 📦 Project Structure

```
server/
├── index.js              # 메인 서버 파일
├── routes/               # API 라우트
│   ├── consultant.js     # 컨설턴트 관련
│   ├── customer.js       # 고객 관리
│   ├── analytics.js      # 분석 & 통계
│   └── resources.js      # 리소스 관리
├── middleware/           # 미들웨어
│   └── auth.js          # 인증 미들웨어
├── controllers/          # 비즈니스 로직
├── models/              # 데이터 모델
├── .env                 # 환경 변수
├── .env.example         # 환경 변수 예시
└── package.json         # 의존성
```

## 🔧 Environment Variables

`.env` 파일 설정:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=https://sagunbok.com
API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
```

## 📝 TODO

### Phase 1 (Current - Mock Data)
- ✅ Express 서버 구축
- ✅ API 라우트 설계
- ✅ Mock 데이터 응답
- ✅ 인증 미들웨어

### Phase 2 (Next - Database Integration)
- [ ] 데이터베이스 연결 (MongoDB 또는 PostgreSQL)
- [ ] 실제 데이터 CRUD 구현
- [ ] JWT 토큰 구현
- [ ] 세션 관리

### Phase 3 (Future - Advanced Features)
- [ ] 파일 업로드/다운로드
- [ ] 이메일 알림
- [ ] WebSocket 실시간 알림
- [ ] 캐싱 (Redis)
- [ ] 로깅 시스템
- [ ] API 문서 (Swagger)

## 🚀 Deployment

### EC2 배포

```bash
# 서버 빌드
npm install --production

# PM2로 실행
pm2 start index.js --name sagunbok-api

# Nginx 프록시 설정
# /etc/nginx/sites-available/sagunbok
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 📞 Contact

문의사항이 있으시면 연락 주세요!

---

**Made with ❤️ by Sagunbok Team**
