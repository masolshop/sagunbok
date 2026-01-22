# 🚀 EC2 배포 완료 보고서

## 📅 배포 일시
**2026-01-22 07:11 UTC (한국시간 16:11)**

---

## 🎯 문제 해결

### ❌ 이전 문제
- **샌드박스에서만 작업** → 가짜 UI 표시
- **EC2 서버에 배포 안 됨** → 실제 사용자가 접속 불가

### ✅ 해결 방법
- **EC2 SSH 키 사용** (`/home/user/webapp/lightsail-key.pem`)
- **샌드박스에서 빌드** → **EC2로 배포**
- **실제 운영 서버에 로그인 전용 앱 배포 완료**

---

## 🖥️ EC2 서버 정보

### 서버 스펙
| 항목 | 내용 |
|------|------|
| **IP 주소** | 3.34.186.174 |
| **내부 IP** | 172.26.7.147 |
| **호스트명** | ip-172-26-7-147 |
| **OS** | Ubuntu 22.04.5 LTS |
| **커널** | 6.8.0-1044-aws |
| **웹 서버** | Nginx 1.18.0 |

### 배포 경로
- **웹 루트**: `/var/www/sagunbok/`
- **백업**: `/var/www/sagunbok.backup.20260122071046/`
- **Nginx 설정**: `/etc/nginx/sites-available/sagunbok`

---

## 📦 배포 프로세스

### 1단계: SSH 키 설정
```bash
chmod 400 /home/user/webapp/lightsail-key.pem
ssh -i lightsail-key.pem ubuntu@3.34.186.174
```

### 2단계: 샌드박스에서 빌드
```bash
cd /home/user/webapp
npm run build
# → dist/ 폴더 생성 (264KB)
```

**빌드 결과**:
- `dist/index.html` (2.13 kB)
- `dist/assets/index-DOhu-hi6.css` (17.09 kB)
- `dist/assets/index-BvSVETQX.js` (225.71 kB)

### 3단계: 압축 및 전송
```bash
tar czf dist-login-only-20260122071034.tar.gz -C dist .
scp -i lightsail-key.pem dist-login-only-*.tar.gz ubuntu@3.34.186.174:/tmp/
```

**전송 파일**: `dist-login-only-20260122071034.tar.gz` (71 KB)

### 4단계: EC2 서버에서 배포
```bash
# 백업 생성
sudo mv /var/www/sagunbok /var/www/sagunbok.backup.20260122071046

# 압축 해제
sudo mkdir -p /var/www/sagunbok
sudo tar xzf /tmp/dist-login-only-*.tar.gz -C /var/www/sagunbok/

# 권한 설정
sudo chown -R www-data:www-data /var/www/sagunbok
sudo chmod -R 755 /var/www/sagunbok
```

### 5단계: Nginx 재시작
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ 배포 결과

### 파일 구조
```
/var/www/sagunbok/
├── assets/
│   ├── index-BvSVETQX.js (226 KB)
│   └── index-DOhu-hi6.css (17 KB)
├── favicon.svg (259 B)
├── index.html (2.1 KB)
└── logout.html (2.5 KB)
```

### 접속 테스트
✅ **http://3.34.186.174/** 정상 작동

```html
<title>사근복 AI 스튜디오 MVP v3.0</title>
<script src="/assets/index-BvSVETQX.js"></script>
<link rel="stylesheet" href="/assets/index-DOhu-hi6.css">
```

---

## 🔗 API 연동 설정

### ⚠️ 중요: Proxy 서버 설정 필요

현재 **샌드박스의 Proxy 서버**(localhost:3001)는 EC2에서 접근 불가합니다.

### 해결 방법

#### 옵션 1: EC2에 Node.js Proxy 서버 설치 (권장)
```bash
# EC2 서버에 proxy-server.js 배포
scp -i lightsail-key.pem proxy-server.js ubuntu@3.34.186.174:/home/ubuntu/

# EC2에서 실행
ssh -i lightsail-key.pem ubuntu@3.34.186.174
cd /home/ubuntu
npm install express cors node-fetch
node proxy-server.js &
```

#### 옵션 2: Vite 설정 수정 (API 직접 호출)
`vite.config.ts`에서 프록시 설정 제거하고 API 직접 호출:

```typescript
// Auth.tsx에서
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
const response = await fetch(BACKEND_URL, { 
  method: 'POST',
  body: JSON.stringify({ action, ...data })
});
```

---

## 🧪 테스트 절차

### 1단계: 브라우저 접속
```
http://3.34.186.174/
```

### 2단계: 캐시 삭제
- F12 → Application → Storage → Clear All
- Ctrl+Shift+R (강제 새로고침)

### 3단계: 로그인 테스트
- 전화번호: 01099887766
- 비밀번호: test1234

### 4단계: 네트워크 확인
- F12 → Network 탭
- `/api` 요청 확인
- CORS 에러 확인

---

## 📊 현재 상태

### ✅ 완료된 작업
1. ✅ EC2 SSH 키 확인 및 연결
2. ✅ 샌드박스에서 앱 빌드
3. ✅ EC2로 파일 전송
4. ✅ EC2 서버에 배포
5. ✅ Nginx 재시작
6. ✅ 웹 페이지 접속 확인

### ⚠️ 추가 작업 필요
1. **Proxy 서버 설정**
   - EC2에 Node.js Proxy 서버 설치 OR
   - API 직접 호출로 변경

2. **도메인 연결** (선택사항)
   - DNS A 레코드: `sagunbok.com` → `3.34.186.174`
   - SSL 인증서 설치 (Let's Encrypt)

3. **모니터링 설정**
   - Nginx 로그 확인
   - 에러 모니터링

---

## 🔧 배포 스크립트

향후 배포를 위한 자동화 스크립트:

```bash
#!/bin/bash
# deploy-to-ec2.sh

set -e

echo "🔨 빌드 중..."
npm run build

echo "📦 압축 중..."
TIMESTAMP=$(date +%Y%m%d%H%M%S)
tar czf dist-login-only-$TIMESTAMP.tar.gz -C dist .

echo "📤 EC2로 전송 중..."
scp -i lightsail-key.pem dist-login-only-$TIMESTAMP.tar.gz ubuntu@3.34.186.174:/tmp/

echo "🚀 EC2에서 배포 중..."
ssh -i lightsail-key.pem ubuntu@3.34.186.174 << EOF
sudo mv /var/www/sagunbok /var/www/sagunbok.backup.\$(date +%Y%m%d%H%M%S)
sudo mkdir -p /var/www/sagunbok
sudo tar xzf /tmp/dist-login-only-$TIMESTAMP.tar.gz -C /var/www/sagunbok/
sudo chown -R www-data:www-data /var/www/sagunbok
sudo chmod -R 755 /var/www/sagunbok
sudo systemctl reload nginx
EOF

echo "✅ 배포 완료!"
echo "🌐 URL: http://3.34.186.174/"
```

---

## 📝 Git 상태

### 커밋 이력
```
3cbc751 - docs: 회원가입/로그인 시스템 테스트 보고서 추가
83f57d8 - docs: 로그인 전용 시스템 README 추가
cfb2474 - feat: 로그인 전용 앱으로 초기화
```

---

## 🎉 결론

### ✅ EC2 배포 성공!

- **실제 운영 서버**에 로그인 전용 앱 배포 완료
- **http://3.34.186.174/** 정상 접속 가능
- **샌드박스 ≠ EC2** 문제 해결

### 📚 다음 단계
1. **Proxy 서버 설정** (API 연동을 위해 필수)
2. **브라우저 테스트** (로그인 기능 확인)
3. **도메인 연결** (선택사항)
4. **SSL 인증서** (HTTPS 적용)

---

## 📞 연락처

### EC2 접속 정보
- **IP**: 3.34.186.174
- **사용자**: ubuntu
- **SSH 키**: `/home/user/webapp/lightsail-key.pem`

### Google Sheets
- **URL**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit

### Git Repository
- **URL**: https://github.com/masolshop/sagunbok.git
- **Branch**: main

---

**작성자**: AI Assistant  
**배포 일시**: 2026-01-22 07:11 UTC  
**배포 파일**: dist-login-only-20260122071034.tar.gz  
**문서 위치**: /home/user/webapp/EC2_DEPLOYMENT.md
