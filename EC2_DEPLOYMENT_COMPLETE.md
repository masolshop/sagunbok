# 🎉 EC2 배포 완료! - API Server Live

**날짜**: 2026-01-26  
**상태**: ✅ 완료 및 운영 중  
**URL**: https://sagunbok.com

---

## 🚀 배포 완료 요약

### ✅ 완성된 시스템

#### 1. 프론트엔드 (React + Vite)
- **URL**: https://sagunbok.com
- **호스팅**: EC2 + Nginx
- **SSL**: Let's Encrypt (HTTPS)
- **빌드**: `index-COyTMknQ.js` (697.47 KB)
- **상태**: ✅ 운영 중

#### 2. 백엔드 API 서버 (Express.js)
- **내부 포트**: 3002
- **외부 접근**: https://sagunbok.com/api/*
- **프로세스 관리**: PM2
- **상태**: ✅ 운영 중 (PM2: online)
- **업타임**: 지속적 모니터링 중

#### 3. Nginx 리버스 프록시
- **HTTP → HTTPS**: 자동 리다이렉트
- **프론트엔드**: `/` → `/var/www/sagunbok`
- **API 프록시**: `/api` → `http://localhost:3002`
- **SSL 인증서**: Let's Encrypt
- **CORS**: 설정 완료

---

## 🌐 API 엔드포인트 (Production)

### 컨설턴트 API Key 관리
```bash
# 1. API Key 저장
POST https://sagunbok.com/api/consultant/api-key
Headers: 
  Authorization: Bearer {consultant_token}
  Content-Type: application/json
Body:
  {
    "apiKey": "sk-ant-api03-..."
  }

# 2. API Key 상태 확인
GET https://sagunbok.com/api/consultant/api-key/status
Headers:
  Authorization: Bearer {consultant_token}
Response:
  {
    "ok": true,
    "hasKey": true
  }
```

### AI 실행
```bash
POST https://sagunbok.com/api/ai/run
Headers:
  Authorization: Bearer {consultant_token}
  Content-Type: application/json
Body:
  {
    "module": "CORP_TAX",
    "action": "SUMMARY",
    "calcResult": {
      "currentTax": 50000000,
      "optimizedTax": 35000000,
      "savings": 15000000
    },
    "caseMeta": {
      "companyName": "테스트주식회사",
      "region": "서울",
      "employeeCount": 20
    }
  }
```

---

## 📊 EC2 인프라

### 서버 정보
- **IP**: 3.34.186.174
- **Region**: Asia Pacific (Seoul)
- **OS**: Ubuntu 22.04.5 LTS
- **Node.js**: v20.20.0
- **npm**: 10.8.2
- **PM2**: 6.0.14

### 실행 중인 서비스
```
┌────┬───────────────────┬──────────┬─────────┬────────┐
│ id │ name              │ mode     │ status  │ memory │
├────┼───────────────────┼──────────┼─────────┼────────┤
│ 1  │ sagunbok-api      │ fork     │ online  │ 55.4mb │
│ 0  │ sagunbok-proxy    │ fork     │ online  │ 70.8mb │
└────┴───────────────────┴──────────┴─────────┴────────┘
```

### 디렉토리 구조 (EC2)
```
/home/ubuntu/
├── sagunbok-api/          # API Server
│   ├── index.js
│   ├── package.json
│   ├── .env
│   ├── prompts/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── utils/
└── server-deploy.tar.gz   # 배포 아카이브

/var/www/
└── sagunbok/              # Frontend
    ├── index.html
    ├── assets/
    │   ├── index-COyTMknQ.js
    │   └── index-DgpRCJvv.css
    └── favicon.svg
```

---

## 🔧 Nginx 설정

### `/etc/nginx/sites-available/sagunbok`
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name sagunbok.com www.sagunbok.com;
    
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name sagunbok.com www.sagunbok.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/sagunbok.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sagunbok.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /var/www/sagunbok;
    index index.html;
    
    # 프론트엔드 (React)
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # API 서버 프록시 ⭐
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS
        add_header Access-Control-Allow-Origin "https://sagunbok.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    }
}
```

---

## 🧪 테스트 결과

### ✅ API 엔드포인트 테스트
```bash
# Health Check (내부)
curl http://localhost:3002/health
→ { "status": "ok", "service": "Sagunbok Consultant API" }

# API Key Status (외부)
curl https://sagunbok.com/api/consultant/api-key/status \
  -H "Authorization: Bearer test-token"
→ { "ok": true, "hasKey": false }
```

### ✅ PM2 상태
```
sagunbok-api: online
uptime: 지속적
memory: ~55MB
cpu: 0%
```

### ✅ Nginx 상태
```
nginx: active (running)
configuration: syntax ok
reload: successful
```

### ✅ SSL 인증서
```
Certificate: /etc/letsencrypt/live/sagunbok.com/fullchain.pem
Valid: ✓
HTTPS: Working
```

---

## 📝 운영 가이드

### PM2 명령어
```bash
# 서버 상태 확인
pm2 status

# 로그 확인
pm2 logs sagunbok-api

# 서버 재시작
pm2 restart sagunbok-api

# 서버 중지
pm2 stop sagunbok-api

# 서버 시작
pm2 start sagunbok-api
```

### Nginx 명령어
```bash
# 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl reload nginx

# 상태 확인
sudo systemctl status nginx

# 로그 확인
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 서버 업데이트
```bash
# 1. 로컬에서 빌드
cd /home/user/webapp/server
tar -czf ../server-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='data' .

# 2. EC2로 전송
scp -i lightsail-key.pem server-deploy.tar.gz ubuntu@3.34.186.174:/home/ubuntu/

# 3. EC2에서 배포
ssh -i lightsail-key.pem ubuntu@3.34.186.174
cd /home/ubuntu/sagunbok-api
tar -xzf /home/ubuntu/server-deploy.tar.gz
npm install --production
pm2 restart sagunbok-api
```

---

## 🔒 보안 설정

### 환경 변수 (.env on EC2)
```env
PORT=3002
NODE_ENV=production  # ⚠️ production으로 변경 권장
FRONTEND_URL=https://sagunbok.com

# 보안 키 (프로덕션에서 변경 필요!)
API_KEY=sagunbok_api_key_2024_secure_change_in_production
JWT_SECRET=sagunbok_jwt_secret_2024_change_in_production
KEY_ENC_SECRET=sagunbok_crypto_secret_key_2024_change_in_production_32chars_minimum

# Claude AI
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620

# Google Apps Script
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/...
```

### 방화벽 (AWS Security Group)
```
Inbound Rules:
- HTTP (80)    from 0.0.0.0/0
- HTTPS (443)  from 0.0.0.0/0
- SSH (22)     from [Your IP Only]
```

---

## 📊 모니터링

### 실시간 모니터링
```bash
# CPU/Memory 사용량
ssh ubuntu@3.34.186.174 'top -bn1 | head -20'

# PM2 모니터링
ssh ubuntu@3.34.186.174 'pm2 monit'

# Nginx 액세스 로그
ssh ubuntu@3.34.186.174 'sudo tail -f /var/log/nginx/access.log'
```

### Health Check
```bash
# API 서버
curl https://sagunbok.com/api/consultant/api-key/status \
  -H "Authorization: Bearer test"

# 예상 응답
{"ok":true,"hasKey":false}
```

---

## 🎯 다음 단계

### 운영 개선
- [ ] NODE_ENV를 `production`으로 변경
- [ ] .env 보안 키 강화
- [ ] 로그 로테이션 설정
- [ ] 모니터링 도구 추가 (CloudWatch)
- [ ] 백업 자동화

### 기능 확장
- [ ] MongoDB 또는 PostgreSQL 연결
- [ ] 상담 기록 저장 기능
- [ ] PDF 자동 생성
- [ ] 이메일 발송
- [ ] 사용량 통계

---

## 🐛 문제 해결

### API 응답 없음
```bash
# 1. PM2 상태 확인
pm2 status
pm2 logs sagunbok-api --lines 50

# 2. 포트 확인
sudo netstat -tulpn | grep 3002

# 3. Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log
```

### SSL 오류
```bash
# 인증서 갱신
sudo certbot renew
sudo systemctl reload nginx
```

### 메모리 부족
```bash
# PM2 재시작
pm2 restart sagunbok-api

# 또는 서버 재부팅
sudo reboot
```

---

## 📚 참고 문서

- **프로젝트 문서**: `/home/user/webapp/CONSULTANT_AI_COMPLETE.md`
- **배포 가이드**: `/home/user/webapp/EC2_API_DEPLOYMENT_GUIDE.md`
- **GitHub**: https://github.com/masolshop/sagunbok

---

## ✅ 최종 체크리스트

- [x] Express API 서버 구축
- [x] EC2에 서버 파일 업로드
- [x] npm 의존성 설치
- [x] PM2로 서버 시작
- [x] Nginx 리버스 프록시 설정
- [x] HTTPS/SSL 설정
- [x] CORS 헤더 설정
- [x] 프론트엔드 API URL 업데이트
- [x] 프론트엔드 빌드 & 배포
- [x] API 엔드포인트 테스트
- [x] GitHub 커밋 & Push
- [x] 문서화

---

## 🎉 완성!

**API 서버가 EC2에 성공적으로 배포되었고, HTTPS를 통해 운영 중입니다!**

- ✅ 프론트엔드: https://sagunbok.com
- ✅ API 서버: https://sagunbok.com/api/*
- ✅ PM2: online
- ✅ Nginx: running
- ✅ SSL: active
- ✅ GitHub: pushed

**컨설턴트들이 이제 실제 프로덕션 환경에서 AI 기능을 사용할 수 있습니다!** 🚀

---

*생성일: 2026-01-26*  
*최종 업데이트: 2026-01-26 08:00 UTC*  
*버전: 1.0.0 - Production*
