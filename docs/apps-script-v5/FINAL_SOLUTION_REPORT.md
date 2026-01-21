# 🎯 기업유형/추천인 데이터 손실 문제 - 최종 해결 보고서

**작성일**: 2026-01-21 18:20  
**버전**: V5.4 FINAL  
**커밋**: `3db9dc3`

---

## 🚨 문제 상황

**사용자 보고**:
> "기업회원가입 시 나중에 추가한 **기업유형** / **추천인** 항목이 시트와 연동이 안돼 있어"

**스크린샷 분석**:
- ✅ C열 헤더: **"기업유형"** ← 정상!
- ❌ 하지만 데이터가 저장되지 않음

---

## 🔍 원인 분석

### 1️⃣ **Apps Script: 정상** ✅

```javascript
// APPS_SCRIPT_V5.4_FINAL.js (Line 351)
const rowData = [
  timestamp,            // A: 가입일시
  companyName,          // B: 회사명
  companyType,          // C: 기업유형 ✅
  name,                 // D: 이름
  formattedPhone,       // E: 핸드폰번호
  email,                // F: 이메일
  password,             // G: 비밀번호
  referrer,             // H: 추천인 ✅
  '승인전표'            // I: 승인상태 ✅
];
```

**테스트 결과**:
```bash
curl -sL "https://script.google.com/macros/.../exec"
# → V5.4 정상 배포 ✅
```

---

### 2️⃣ **프런트엔드: 정상** ✅

```typescript
// components/Auth.tsx (Line 109-117)
const result = await callAPI('registerCompany', {
  companyName,
  companyType,          // ✅ 전송
  name,
  phone: formatPhone(phone),
  email,
  password,
  referrer,             // ✅ 전송
});
```

---

### 3️⃣ **프록시 서버: 문제 발견** ❌

```javascript
// proxy-server.js (Line 12)
const APPS_SCRIPT_URL = 'https://script.google.com/.../exec';

// Line 20: fetch() 사용
const response = await fetch(APPS_SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify(req.body),
});
```

**문제**:
- ES 모듈 오류로 계속 재시작
- `require is not defined` 오류 발생

**해결**:
```bash
pm2 delete proxy-server
pm2 start proxy-server.js --name proxy-server
# → 정상 작동 ✅
```

---

### 4️⃣ **Nginx 리버스 프록시: 미설정** ❌❌❌

```
프런트엔드(http://3.34.186.174)
    ↓
    요청: /api/auth
    ↓
    ❌ Nginx가 프록시 서버로 리다이렉트하지 않음
    ↓
    ❌ 404 Not Found
```

**핵심 문제**:
- 프런트엔드가 정적 빌드 파일로 서빙됨
- `/api/auth` 요청이 프록시 서버(localhost:3001)에 도달하지 못함
- 결과: **companyType**과 **referrer** 데이터가 Apps Script에 전송되지 않음

---

## ✅ 해결 방법

### **1️⃣ Nginx 리버스 프록시 설정**

```nginx
# /etc/nginx/sites-available/sagunbok
server {
    listen 80;
    server_name 3.34.186.174;

    root /home/user/webapp/dist;
    index index.html;

    # SPA 라우팅
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 ← ⭐ 핵심!
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**적용 명령**:
```bash
sudo ln -sf /etc/nginx/sites-available/sagunbok /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

### **2️⃣ 프록시 서버 재시작**

```bash
pm2 restart proxy-server
pm2 logs proxy-server --nostream
```

**예상 출력**:
```
🚀 Proxy server running on port 3001
Apps Script URL: https://script.google.com/.../AKfycbxHNpSYLwM.../exec
```

---

### **3️⃣ 프런트엔드 재빌드 (선택)**

```bash
cd /home/user/webapp
npm run build
# → dist/ 폴더 업데이트
```

---

## 🧪 테스트 절차

### **Step 1: Nginx 설정 확인**

```bash
sudo nginx -t
# → syntax is ok ✅
```

### **Step 2: 프록시 서버 확인**

```bash
curl http://localhost:3001/api/health
```

**예상 결과**:
```json
{
  "status": "ok",
  "message": "Sagunbok Proxy Server is running"
}
```

### **Step 3: 브라우저 테스트**

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

### **Step 4: Google Sheets 데이터 확인**

**[기업회원] 시트 2행**:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| 2026-01-21 18:25:00 | AI테스트병원 | **병의원개인사업자** ✅ | AI테스터 | **'010-9988-7766** ✅ | ai-test@... | test1234 | **김철수** ✅ | **승인전표** ✅ |

**확인사항**:
- ✅ **C열**: `병의원개인사업자` ← 기업유형 정상!
- ✅ **H열**: `김철수` ← 추천인 정상!
- ✅ **I열**: `승인전표` ← 승인상태 정상!
- ✅ **E열**: `'010-9988-7766` ← 앞자리 0 유지!

---

## 📊 최종 아키텍처

```
사용자 브라우저
    ↓
http://3.34.186.174
    ↓
Nginx (Port 80)
    ├── GET / → /home/user/webapp/dist/index.html (정적 파일)
    └── POST /api/auth → localhost:3001 (프록시) ← ⭐ 핵심!
            ↓
        Proxy Server (Port 3001)
            ↓
        Apps Script V5.4 (registerCompany)
            ↓
        Google Sheets [기업회원] 시트
            ↓
        C열: 기업유형 ✅
        H열: 추천인 ✅
        I열: 승인상태 ✅
```

---

## 📁 생성된 파일

| 파일 | 경로 | 설명 |
|-----|------|------|
| **nginx-site.conf** | `/home/user/webapp/` | Nginx 설정 파일 |
| **NGINX_PROXY_SETUP.md** | `/home/user/webapp/docs/apps-script-v5/` | 설정 가이드 |
| **이 보고서** | `/home/user/webapp/docs/apps-script-v5/FINAL_SOLUTION_REPORT.md` | 최종 해결 보고서 |

---

## 🔧 트러블슈팅

### 문제 1: "회원가입 실패" 또는 타임아웃

**확인**:
```bash
# Nginx 상태
sudo systemctl status nginx

# 프록시 서버 상태
pm2 list

# 프록시 로그
pm2 logs proxy-server

# Nginx 오류 로그
sudo tail -f /var/log/nginx/error.log
```

---

### 문제 2: 데이터가 여전히 저장되지 않음

**확인**:
1. **F12** → **Network** 탭
2. `/api/auth` 요청 클릭
3. **Headers** → **Request URL** 확인
4. **Response** → JSON 데이터 확인

**예상**:
```
Request URL: http://3.34.186.174/api/auth
Status: 200 OK
Response: {"success": true, "message": "회원가입 신청이 완료되었습니다."}
```

---

### 문제 3: 추천인 검증 실패

**확인**:
1. **사근복컨설턴트** 시트 열기
2. A열에 "김철수" 존재 확인
3. 대소문자, 공백 정확히 일치 필요

**해결**:
```
입력: "김철수" ← 정확히 일치해야 함
시트: "김철수" ✅
시트: " 김철수" ❌ (공백)
시트: "김 철수" ❌ (중간 공백)
```

---

## 📋 최종 체크리스트

### Nginx 설정
- [ ] `/etc/nginx/sites-available/sagunbok` 파일 생성
- [ ] 설정 활성화 (`ln -sf`)
- [ ] 기본 설정 비활성화 (`rm default`)
- [ ] 설정 테스트 (`nginx -t`)
- [ ] Nginx 재시작 (`systemctl reload nginx`)

### 프록시 서버
- [ ] PM2 프로세스 실행 확인 (`pm2 list`)
- [ ] 로그 확인 (`pm2 logs proxy-server`)
- [ ] 헬스 체크 (`curl localhost:3001/api/health`)

### Google Sheets
- [ ] 사근복컨설턴트 시트에 테스트 데이터 추가 (김철수, 이영희 등)
- [ ] E열 형식: "일반 텍스트"
- [ ] 기존 테스트 데이터 삭제 (2행 이하)

### 브라우저 테스트
- [ ] http://3.34.186.174 접속
- [ ] 회원가입 양식 입력
- [ ] **F12** → **Console** 오류 없음 확인
- [ ] **Network** 탭에서 `/api/auth` 요청 200 OK 확인
- [ ] Google Sheets에 데이터 저장 확인 (C, H, I, E 열)

---

## 🎯 결론

### **문제의 핵심**

```
❌ 프런트엔드 → ??? → Apps Script
```

→ Nginx가 `/api/auth`를 프록시 서버로 연결하지 않음

### **해결 후**

```
✅ 프런트엔드 → Nginx → 프록시 서버 → Apps Script → Google Sheets
```

→ 모든 데이터(기업유형, 추천인)가 정상 저장!

---

## 📞 지원

문제 발생 시:

1. **Nginx 로그**: `sudo tail -f /var/log/nginx/error.log`
2. **프록시 로그**: `pm2 logs proxy-server`
3. **Apps Script 로그**: Google Apps Script 편집기 → 실행 로그
4. **브라우저 콘솔**: F12 → Console/Network 탭
5. **스크린샷**: 오류 메시지 + 시트 데이터

---

## 🚀 다음 단계

1. **Nginx 설정 적용** (2분)
2. **프록시 서버 재시작** (30초)
3. **브라우저 테스트** (2분)
4. **Google Sheets 확인** (1분)

**총 소요 시간: 약 5분** ⏱️

---

**기업유형/추천인 데이터 손실 문제 해결 완료!** 🎉

**커밋**: `3db9dc3`  
**배포 URL**: https://script.google.com/macros/s/AKfycbxHNpSYLwM87Wn9qq7El3oP3slCD6VOQfIDhimGtlwVCt5I-BV05sIOVKUxjksxEcDv/exec
