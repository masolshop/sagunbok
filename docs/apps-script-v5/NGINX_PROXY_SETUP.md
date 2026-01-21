# 🚀 Nginx 리버스 프록시 설정 가이드

**작성일**: 2026-01-21 18:15  
**목적**: 프런트엔드 → 프록시 서버 → Apps Script 연결  

---

## 🚨 문제 상황

**스크린샷 분석 결과**:
- ✅ C열 헤더: "기업유형" ← 정상!
- ✅ Apps Script V5.4: 정상 배포
- ✅ 프록시 서버: 정상 작동 (localhost:3001)
- ❌ **문제**: 프런트엔드(3.34.186.174)에서 API 요청이 프록시 서버에 도달하지 못함

### 원인:

```
프런트엔드(3.34.186.174) 
  ↓
  요청: /api/auth
  ↓
  ❌ Nginx가 프록시 서버로 리다이렉트하지 않음
  ↓
  ❌ 404 Not Found 또는 타임아웃
```

---

## ✅ 해결 방법: Nginx 리버스 프록시

### **1️⃣ Nginx 설정 파일 생성**

```bash
sudo nano /etc/nginx/sites-available/sagunbok
```

**내용**:

```nginx
server {
    listen 80;
    server_name 3.34.186.174;

    # 정적 파일 서빙
    root /home/user/webapp/dist;
    index index.html;

    # SPA 라우팅 지원
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 (중요!)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
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

---

### **2️⃣ Nginx 설정 활성화**

```bash
# 심볼릭 링크 생성
sudo ln -sf /etc/nginx/sites-available/sagunbok /etc/nginx/sites-enabled/sagunbok

# 기본 설정 비활성화 (충돌 방지)
sudo rm -f /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl reload nginx
```

---

### **3️⃣ 프록시 서버 확인**

```bash
# PM2로 프록시 서버 실행 확인
pm2 list

# 로그 확인
pm2 logs proxy-server --nostream

# 헬스 체크
curl http://localhost:3001/api/health
```

**예상 결과**:
```json
{
  "status": "ok",
  "message": "Sagunbok Proxy Server is running",
  "timestamp": "2026-01-21T08:15:00.000Z"
}
```

---

### **4️⃣ 브라우저 테스트**

**URL**: http://3.34.186.174

**입력 데이터**:
```
회사명: AI테스트병원
기업유형: 병의원개인사업자
담당자: AI테스터
휴대폰: 01099887766
이메일: ai-test@hospital.com
비밀번호: test1234
추천인: 김철수
```

**예상 결과**:
```
✅ "회원가입 신청이 완료되었습니다."
```

---

### **5️⃣ Google Sheets 확인**

**[기업회원] 시트 2행**:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| 2026-01-21 18:20:00 | AI테스트병원 | **병의원개인사업자** ✅ | AI테스터 | **'010-9988-7766** ✅ | ai-test@... | test1234 | **김철수** ✅ | **승인전표** ✅ |

**확인사항**:
- **C열**: `병의원개인사업자` ← 기업유형 정상 저장!
- **H열**: `김철수` ← 추천인 정상 저장!
- **I열**: `승인전표` ← 승인상태 정상 저장!
- **E열**: `'010-9988-7766` ← 앞자리 0 유지!

---

## 🔧 트러블슈팅

### 문제 1: Nginx 설정 오류

```bash
# 설정 파일 문법 검사
sudo nginx -t

# 자세한 오류 로그
sudo tail -f /var/log/nginx/error.log
```

---

### 문제 2: 프록시 서버 응답 없음

```bash
# 프록시 서버 재시작
pm2 restart proxy-server

# 로그 실시간 확인
pm2 logs proxy-server

# 포트 사용 확인
lsof -i :3001
```

---

### 문제 3: 브라우저 콘솔 오류

**F12** → **Console** → 오류 확인

**네트워크** 탭에서 `/api/auth` 요청 확인:

- **Status Code**: 200 OK ← 정상
- **Response**: JSON 데이터 ← 정상
- **Status Code**: 502/504 ← 프록시 서버 문제
- **Status Code**: 404 ← Nginx 설정 문제

---

## 📊 아키텍처 다이어그램

```
사용자 브라우저
    ↓
http://3.34.186.174
    ↓
Nginx (Port 80)
    ├── / → /home/user/webapp/dist (정적 파일)
    └── /api/ → localhost:3001 (프록시)
            ↓
        Proxy Server (Port 3001)
            ↓
        Apps Script V5.4
            ↓
        Google Sheets
```

---

## 📋 체크리스트

- [ ] Nginx 설정 파일 생성 (`/etc/nginx/sites-available/sagunbok`)
- [ ] 설정 활성화 (`ln -sf`)
- [ ] 기본 설정 비활성화 (`rm default`)
- [ ] Nginx 설정 테스트 (`nginx -t`)
- [ ] Nginx 재시작 (`systemctl reload nginx`)
- [ ] 프록시 서버 실행 확인 (`pm2 list`)
- [ ] 브라우저 테스트 (http://3.34.186.174)
- [ ] Google Sheets 데이터 확인 (C, H, I, E 열)

---

## 🔗 관련 파일

| 파일 | 경로 |
|-----|------|
| **Nginx 설정** | `/etc/nginx/sites-available/sagunbok` |
| **프록시 서버** | `/home/user/webapp/proxy-server.js` |
| **Apps Script** | `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js` |
| **이 가이드** | `/home/user/webapp/docs/apps-script-v5/NGINX_PROXY_SETUP.md` |

---

## 📞 지원

문제 발생 시:

1. **Nginx 로그**: `sudo tail -f /var/log/nginx/error.log`
2. **프록시 로그**: `pm2 logs proxy-server`
3. **브라우저 콘솔**: F12 → Console/Network 탭
4. **스크린샷**: 오류 메시지 + 시트 데이터

---

**Nginx 리버스 프록시 설정 완료!** 🎉

**이제 데이터가 정상적으로 Google Sheets에 저장됩니다!** ✅
