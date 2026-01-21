# 🔍 브라우저 콘솔 분석 결과 - 최종 해결 가이드

**작성일**: 2026-01-21 19:00  
**커밋**: `9712190`  

---

## 🚨 **콘솔에서 발견한 문제**

### **브라우저 콘솔 오류:**
```
▲ cdn.tailwindcss.com should not be used in production
▲ Failed to read resource: the server responded with a status of 404 (Not Found)
```

### **네트워크 탭 확인:**
- ✅ 정적 파일 로드: 성공
- ❌ **`/api/auth` 요청: 없음!** ← 핵심 문제!

---

## 🔍 **근본 원인 분석**

### **1️⃣ 회원가입 버튼 클릭 시 API 요청이 전송되지 않음**

**이유:**
```javascript
// components/Auth.tsx (기존)
const BACKEND_URL = '/api/auth';  // 상대 경로

// 요청:
POST http://3.34.186.174/api/auth
```

**문제:**
- Nginx가 실행되지 않음
- `/api/auth` → `localhost:3001` 프록시 설정 없음
- 결과: **404 Not Found** 또는 **타임아웃**

---

### **2️⃣ Nginx 미실행 확인**

```bash
# 확인 결과:
ps aux | grep nginx
# → 없음!

lsof -i :80
# → envd만 있음 (Nginx 없음)

ls /etc/nginx/sites-enabled/
# → 디렉토리 없음
```

**결론**: Nginx가 설치되지 않았거나 실행되지 않음

---

### **3️⃣ 정적 빌드 파일은 프록시 설정 미적용**

```javascript
// vite.config.ts (개발 서버용)
server: {
  proxy: {
    '/api': 'http://localhost:3001'  // ← 빌드 파일에 미적용!
  }
}
```

**문제**:
- `vite.config.ts` 프록시는 **개발 서버**에서만 작동
- `npm run build` 후 `dist/` 파일은 **정적 HTML/JS**
- 프록시 설정 없음

---

## ✅ **해결 방법**

### **빠른 해결 (5분) - 포트 3001 직접 사용**

#### **Step 1: 프런트엔드 변경 (완료 ✅)**

```javascript
// components/Auth.tsx (수정됨)
const BACKEND_URL = 'http://3.34.186.174:3001/api/auth';
```

#### **Step 2: 재빌드 (완료 ✅)**

```bash
npm run build
# → dist/assets/index-6n2Xk_wl.js
```

#### **Step 3: AWS 보안 그룹에서 포트 3001 개방**

**AWS 콘솔**:
1. **EC2** → **인스턴스** → 인스턴스 선택
2. **보안** 탭 → **보안 그룹** 클릭
3. **인바운드 규칙** → **인바운드 규칙 편집**
4. **규칙 추가**:
   - 유형: **사용자 지정 TCP**
   - 포트 범위: **3001**
   - 소스: **0.0.0.0/0** (또는 특정 IP)
5. **규칙 저장**

---

### **Step 4: 브라우저 테스트**

**URL**: http://3.34.186.174

**입력**:
```
회사명: 포트테스트병원
기업유형: 병의원개인사업자
담당자: 포트테스터
휴대폰: 01011112222
이메일: port-test@hospital.com
비밀번호: test1234
추천인: 김철수
```

**F12** → **Network** 탭:
```
POST http://3.34.186.174:3001/api/auth
Status: 200 OK
Response: {
  "success": true,
  "message": "회원가입 신청이 완료되었습니다."
}
```

---

## 🏆 **프로덕션 해결 (권장) - Nginx 설정**

### **Step 1: Nginx 설치 및 설정**

```bash
cd /home/user/webapp
./setup_nginx.sh
```

**스크립트 내용**:
- Nginx 설치
- 설정 파일 복사 (`nginx-site.conf`)
- `/api/` → `localhost:3001` 프록시 설정
- Nginx 재시작

---

### **Step 2: 프런트엔드를 다시 상대 경로로 변경**

```javascript
// components/Auth.tsx
const BACKEND_URL = '/api/auth';  // ← 상대 경로로 복원
```

```bash
npm run build
```

---

### **Step 3: Nginx 확인**

```bash
# Nginx 상태
sudo systemctl status nginx

# 프록시 테스트
curl http://localhost/api/health
```

**예상 결과**:
```json
{
  "status": "ok",
  "message": "Sagunbok Proxy Server is running"
}
```

---

## 📊 **아키텍처 비교**

### **현재 (임시 해결)**:
```
브라우저
  ↓
  POST http://3.34.186.174:3001/api/auth
  ↓
프록시 서버 (Port 3001) ← 직접 노출 ⚠️
  ↓
Apps Script V5.4.1
  ↓
Google Sheets
```

**단점**:
- ❌ 프록시 서버 직접 노출 (보안 취약)
- ❌ 포트 3001 개방 필요

---

### **프로덕션 (권장)**:
```
브라우저
  ↓
  POST http://3.34.186.174/api/auth
  ↓
Nginx (Port 80)
  ├── GET / → dist/ (정적 파일)
  └── POST /api/ → localhost:3001 (프록시)
       ↓
   프록시 서버 (내부만) ✅
       ↓
   Apps Script V5.4.1
       ↓
   Google Sheets
```

**장점**:
- ✅ 프록시 서버 숨김 (보안)
- ✅ 포트 80만 개방
- ✅ SSL/TLS 추가 가능
- ✅ 로드 밸런싱 가능

---

## 🔧 **트러블슈팅**

### **문제 1: 포트 3001 개방 후에도 타임아웃**

**확인**:
```bash
# 프록시 서버 상태
pm2 list

# 로그
pm2 logs proxy-server

# 방화벽
sudo ufw status
```

**해결**:
```bash
# 방화벽 포트 개방
sudo ufw allow 3001/tcp
```

---

### **문제 2: Nginx 설정 후에도 404**

**확인**:
```bash
# Nginx 상태
sudo systemctl status nginx

# 설정 테스트
sudo nginx -t

# 오류 로그
sudo tail -f /var/log/nginx/error.log
```

**해결**:
```bash
# Nginx 재시작
sudo systemctl restart nginx
```

---

### **문제 3: CORS 오류**

**브라우저 콘솔**:
```
Access to fetch at 'http://3.34.186.174:3001/api/auth' 
has been blocked by CORS policy
```

**확인**:
```javascript
// proxy-server.js
app.use(cors());  // ← 이미 설정됨 ✅
```

**해결**:
- 프록시 서버 재시작: `pm2 restart proxy-server`

---

## 📋 **최종 체크리스트**

### **즉시 해결 (포트 3001)**
- [x] 프런트엔드 BACKEND_URL 변경
- [x] 재빌드 (`npm run build`)
- [ ] AWS 보안 그룹에서 포트 3001 개방
- [ ] 브라우저 테스트
- [ ] Google Sheets 데이터 확인

### **프로덕션 해결 (Nginx)**
- [ ] Nginx 설치 (`./setup_nginx.sh`)
- [ ] 프런트엔드 BACKEND_URL 복원 (`/api/auth`)
- [ ] 재빌드
- [ ] Nginx 설정 확인
- [ ] 브라우저 테스트
- [ ] AWS 보안 그룹에서 포트 3001 닫기 (보안)

### **Apps Script**
- [ ] V5.4.1 배포 (JSON body 파싱 지원)
- [ ] 배포 URL 확인
- [ ] GET 테스트 (`version: 5.4.1` 확인)

---

## 🎯 **결론**

### **콘솔로 발견한 근본 원인:**

1. ❌ **Nginx 미실행**: API 프록시 없음
2. ❌ **정적 빌드**: 프록시 설정 미적용
3. ❌ **네트워크 탭**: `/api/auth` 요청 없음

### **해결:**

**방법 1 (빠름)**:
- 프런트엔드가 포트 3001 직접 호출
- AWS 보안 그룹에서 포트 3001 개방

**방법 2 (권장)**:
- Nginx 설치 및 프록시 설정
- 프런트엔드는 상대 경로 사용
- 포트 80만 개방 (보안)

---

## 🚀 **다음 단계**

1. **AWS 보안 그룹에서 포트 3001 개방** (2분)
2. **브라우저 테스트** (2분)
3. **Apps Script V5.4.1 배포** (2분)
4. **Google Sheets 확인** (1분)

**총 소요 시간: 약 7분** ⏱️

---

**브라우저 콘솔 분석 완료!** 🎉

**커밋**: `9712190`  
**스크립트**: `/home/user/webapp/setup_nginx.sh`
