# 🌐 EC2 배포 가이드 - API Server

## 📊 현재 상태

### ✅ 이미 배포된 것
- **프론트엔드**: https://sagunbok.com (EC2 + Nginx)
- **EC2 IP**: 3.34.186.174
- **Region**: Asia Pacific (Seoul)
- **SSH Key**: lightsail-key.pem ✓

### ⚠️ 아직 배포 안 된 것
- **API Server**: 현재 로컬(localhost:3002)에서만 실행 중
- EC2에 배포 필요!

---

## 🚀 API Server를 EC2에 배포하는 방법

### Option 1: 간단한 방법 (PM2 사용)

#### 1단계: 서버 파일을 EC2로 전송
```bash
cd /home/user/webapp
scp -i lightsail-key.pem -r server ubuntu@3.34.186.174:/home/ubuntu/
```

#### 2단계: EC2에 접속해서 설치
```bash
ssh -i lightsail-key.pem ubuntu@3.34.186.174

# Node.js 설치 확인
node -v || curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs

# PM2 설치
sudo npm install -g pm2

# 서버 디렉토리로 이동
cd /home/ubuntu/server

# 의존성 설치
npm install

# .env 파일 확인/수정
nano .env

# PM2로 서버 시작
pm2 start index.js --name sagunbok-api

# PM2 자동 재시작 설정
pm2 startup
pm2 save
```

#### 3단계: Nginx 리버스 프록시 설정
```nginx
# /etc/nginx/sites-available/sagunbok-api
server {
    listen 80;
    server_name api.sagunbok.com;  # 또는 서브도메인

    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Nginx 설정 활성화
sudo ln -s /etc/nginx/sites-available/sagunbok-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Option 2: 같은 도메인에서 API 서빙

기존 Nginx 설정에 API 프록시 추가:

```nginx
# 기존 sagunbok.com 설정에 추가
server {
    listen 80;
    server_name sagunbok.com;

    # 프론트엔드 (기존)
    location / {
        root /var/www/sagunbok;
        try_files $uri $uri/ /index.html;
    }

    # API 서버 (새로 추가)
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 자동 배포 스크립트

### deploy-api.sh
```bash
#!/bin/bash
# EC2에 API Server 배포

echo "🚀 API Server 배포 시작..."

# 1. 서버 파일 전송
echo "📦 서버 파일 전송 중..."
scp -i lightsail-key.pem -r server ubuntu@3.34.186.174:/home/ubuntu/

# 2. EC2에서 명령 실행
echo "🔧 EC2에서 설치 및 재시작..."
ssh -i lightsail-key.pem ubuntu@3.34.186.174 << 'ENDSSH'
  cd /home/ubuntu/server
  npm install --production
  pm2 restart sagunbok-api || pm2 start index.js --name sagunbok-api
  pm2 save
ENDSSH

echo "✅ 배포 완료!"
```

---

## 🔒 보안 설정

### 1. .env 파일 수정 (EC2에서)
```env
PORT=3002
NODE_ENV=production
FRONTEND_URL=https://sagunbok.com

# 보안: 강력한 비밀키로 변경!
API_KEY=your_strong_api_key_here_change_this
JWT_SECRET=your_strong_jwt_secret_here_change_this
KEY_ENC_SECRET=your_strong_32_char_encryption_key_here

# Claude AI
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620
```

### 2. 방화벽 설정
```bash
# EC2 Security Group에서
# Inbound Rules:
# - HTTP (80) from 0.0.0.0/0
# - HTTPS (443) from 0.0.0.0/0
# - SSH (22) from your IP only
# - 3002 (API) from localhost only
```

---

## 📊 프론트엔드 수정

API_BASE_URL을 프로덕션 URL로 변경:

### ConsultantAIPanel.tsx
```typescript
// 현재
const API_BASE_URL = 'http://localhost:3002';

// 변경 (Option 1: 서브도메인)
const API_BASE_URL = 'https://api.sagunbok.com';

// 또는 (Option 2: 같은 도메인)
const API_BASE_URL = 'https://sagunbok.com';
```

---

## 🧪 테스트

### EC2 배포 후 테스트
```bash
# Health Check
curl https://sagunbok.com/api/health

# 또는 서브도메인
curl https://api.sagunbok.com/api/health
```

---

## 🎯 추천 배포 방법

**Option 2 (같은 도메인)** 추천!
- 장점: CORS 문제 없음, SSL 인증서 하나만 필요
- 단점: 없음

---

## 📝 체크리스트

- [ ] EC2에 server 디렉토리 전송
- [ ] EC2에 Node.js 설치 확인
- [ ] npm install 실행
- [ ] .env 파일 보안 설정
- [ ] PM2로 서버 시작
- [ ] Nginx 리버스 프록시 설정
- [ ] Nginx 재시작
- [ ] 프론트엔드 API_BASE_URL 수정
- [ ] 프론트엔드 재빌드 & 배포
- [ ] API Health Check 테스트
- [ ] 컨설턴트 로그인 후 AI 기능 테스트

---

## 🆘 문제 해결

### PM2 로그 확인
```bash
pm2 logs sagunbok-api
pm2 status
```

### Nginx 로그 확인
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 포트 확인
```bash
sudo netstat -tulpn | grep 3002
```

---

## 💡 다음 단계

1. **지금 바로 배포**하시겠습니까?
   - 제가 자동으로 배포 스크립트 실행할 수 있습니다!

2. **수동으로 배포**하시겠습니까?
   - 위 가이드를 따라 직접 배포하실 수 있습니다.

3. **나중에 배포**하시겠습니까?
   - 이 문서를 참고해서 나중에 배포하세요.

---

어떻게 진행하시겠습니까? 🚀
