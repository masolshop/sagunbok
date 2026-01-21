# 🚀 Google Sheets + Apps Script 완전 재설정 가이드

**작성일**: 2026-01-21 19:30  
**버전**: V5.4.2 FINAL  
**최종 수정**: 2026-01-21 19:00 (컨설턴트 승인상태 추가)

---

## 📊 **Part 1: Google Sheets 설정 (5분)**

### **Step 1: 새 스프레드시트 만들기**

1. https://sheets.google.com 접속
2. **빈 문서** 클릭
3. 제목: **"사근복 회원관리 V2"**

---

### **Step 2: 시트 1 - 기업회원**

#### **헤더 행 (A1~K1):**

```
가입일시	회사명	기업유형	이름	핸드폰번호	이메일	비밀번호	추천인	승인상태		마지막로그인
```

**복사해서 A1에 붙여넣기!**

#### **E열 형식 설정 (중요!):**

1. **E열 전체 선택** (E 클릭)
2. **서식** → **숫자** → **일반 텍스트**
3. ✅ 완료!

---

### **Step 3: 시트 2 - 사근복컨설턴트**

#### **시트 이름 변경:**

1. 하단 **"시트2"** 우클릭
2. **이름 바꾸기** → **"사근복컨설턴트"**

#### **헤더 행 (A1~I1):**

```
이름	핸드폰번호	이메일	직함	소속 사업단	비밀번호	소속 지사	가입일시	승인상태
```

**복사해서 A1에 붙여넣기!**

#### **B열 형식 설정 (중요!):**

1. **B열 전체 선택** (B 클릭)
2. **서식** → **숫자** → **일반 텍스트**
3. ✅ 완료!

#### **테스트 데이터 (A2~I4):**

```
김철수	'010-1234-5678	kim@sagunbok.com	팀장	서울사업단	12345	서울지사	2026-01-21 09:00:00	승인전표
이영희	'010-5678-1234	lee@sagunbok.com	과장	부산사업단	12345	부산지사	2026-01-21 09:00:00	승인전표
박민수	'010-9876-5432	park@sagunbok.com	대리	대구사업단	12345	대구지사	2026-01-21 09:00:00	승인전표
```

**복사해서 A2에 붙여넣기!**

**중요:** 앞에 **작은따옴표 `'`** 포함해서 붙여넣기!

---

### **Step 4: 시트 3 - 로그인기록**

#### **시트 이름 변경:**

1. 하단 **"시트3"** 우클릭
2. **이름 바꾸기** → **"로그인기록"**

#### **헤더 행 (A1~D1):**

```
타임스탬프	전화번호	사용자유형	상태
```

**복사해서 A1에 붙여넣기!**

---

## 💻 **Part 2: Apps Script 설정 (3분)**

### **Step 1: Apps Script 편집기 열기**

1. Google Sheets에서 **확장 프로그램** → **Apps Script**
2. 새 탭에서 Apps Script 편집기 열림

---

### **Step 2: 기존 코드 삭제**

1. 편집기의 모든 코드 선택 (**Ctrl+A**)
2. 삭제 (**Delete**)

---

### **Step 3: V5.4.1 코드 붙여넣기**

#### **코드 복사:**

**파일 위치**: `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js`

**또는 아래에서 직접 복사:**

```javascript
/**
 * ============================================================
 * Sagunbok Apps Script - VERSION 5.4.1 (FINAL)
 * 작성일: 2026-01-21
 * 수정일: 2026-01-21 18:25 (JSON body 파싱 지원)
 * ============================================================
 */

// (전체 코드는 APPS_SCRIPT_V5.4_FINAL.js 파일 참조)
```

**📝 코드 파일:**
- 경로: `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js`
- 라인 수: 811줄
- 크기: ~27KB

#### **붙여넣기:**

1. Apps Script 편집기에 **전체 코드 붙여넣기** (Ctrl+V)
2. **저장** (Ctrl+S)
3. 프로젝트 이름: **"사근복 V5.4.1"**

---

### **Step 4: 배포**

#### **1️⃣ 새 배포 만들기:**

1. **배포** → **새 배포**
2. **유형 선택**: ⚙️ → **웹 앱**
3. **설정**:
   - 설명: `V5.4.1 - JSON body 파싱 지원`
   - 실행 계정: **나**
   - 액세스 권한: **모든 사용자**
4. **배포** 클릭

#### **2️⃣ 권한 승인:**

1. **액세스 승인** 클릭
2. Google 계정 선택
3. **고급** → **사근복 V5.4.1(안전하지 않음)으로 이동**
4. **허용** 클릭

#### **3️⃣ 배포 URL 복사:**

```
https://script.google.com/macros/s/AKfycby...여기가_새로운_URL.../exec
```

**이 URL을 복사해두세요!** 📋

---

## 🔧 **Part 3: 프록시 서버 업데이트 (2분)**

### **Step 1: 프록시 서버 코드 수정**

**파일**: `/home/user/webapp/proxy-server.js`

**12줄 수정:**

```javascript
// 기존:
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxHNpSYLwM87Wn9qq7El3oP3slCD6VOQfIDhimGtlwVCt5I-BV05sIOVKUxjksxEcDv/exec';

// 새로운 URL로 변경:
const APPS_SCRIPT_URL = '여기에_새로운_배포_URL_붙여넣기';
```

---

### **Step 2: PM2 재시작**

```bash
cd /home/user/webapp
pm2 restart proxy-server
pm2 logs proxy-server --nostream
```

**예상 출력:**

```
🚀 Proxy server running on port 3001
Apps Script URL: https://script.google.com/macros/s/AKfycby...새로운URL.../exec
```

---

## 🧪 **Part 4: 테스트 (3분)**

### **Step 1: Apps Script 직접 테스트**

**브라우저 주소창에 입력:**

```
https://script.google.com/macros/s/AKfycby...여기에_새로운_URL.../exec
```

**예상 결과:**

```json
{
  "success": true,
  "message": "Sagunbok Apps Script V5.4.1 (FINAL) is running!",
  "version": "5.4.1",
  "timestamp": "2026-01-21T10:30:00.000Z"
}
```

✅ 버전이 **5.4.1**인지 확인!

---

### **Step 2: 프록시 서버 테스트**

```bash
curl -X POST http://localhost:3001/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerCompany",
    "data": {
      "companyName": "깔끔테스트병원",
      "companyType": "병의원개인사업자",
      "name": "재설정테스터",
      "phone": "01099998888",
      "email": "clean-start@hospital.com",
      "password": "test1234",
      "referrer": "김철수"
    }
  }'
```

**예상 결과:**

```json
{
  "success": true,
  "message": "회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다."
}
```

---

### **Step 3: Google Sheets 확인**

**[기업회원] 시트 2행:**

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| 2026-01-21... | 깔끔테스트병원 | **병의원개인사업자** ✅ | 재설정테스터 | **'010-9999-8888** ✅ | clean-start@... | test1234 | **김철수** ✅ | **승인전표** ✅ |

**확인사항:**
- ✅ C열: 병의원개인사업자
- ✅ E열: '010-9999-8888 (앞자리 0 유지!)
- ✅ H열: 김철수
- ✅ I열: 승인전표

---

### **Step 4: 브라우저 테스트**

**URL**: http://3.34.186.174

**입력:**

```
회사명: 브라우저테스트병원
기업유형: 병의원개인사업자
담당자: 브라우저테스터
휴대폰: 01011112222
이메일: browser-clean@test.com
비밀번호: test1234
추천인: 이영희
```

**F12 → Network → /api/auth:**

```json
Status: 200 OK
Response: {
  "success": true,
  "message": "회원가입 신청이 완료되었습니다."
}
```

**Google Sheets 3행 확인:**

| H | I |
|---|---|
| **이영희** ✅ | **승인전표** ✅ |

---

## 📋 **최종 체크리스트**

### Google Sheets
- [ ] 새 스프레드시트 생성 (사근복 회원관리 V2)
- [ ] [기업회원] 시트: 헤더 입력, E열 일반 텍스트
- [ ] [사근복컨설턴트] 시트: 헤더 입력, B열 일반 텍스트, 테스트 데이터 3개 추가
- [ ] [로그인기록] 시트: 헤더 입력

### Apps Script
- [ ] 편집기에서 기존 코드 삭제
- [ ] V5.4.1 코드 붙여넣기
- [ ] 저장 (Ctrl+S)
- [ ] 배포 → 새 배포 (웹 앱)
- [ ] 권한 승인
- [ ] 배포 URL 복사

### 프록시 서버
- [ ] proxy-server.js 수정 (새 URL)
- [ ] PM2 재시작
- [ ] 로그 확인 (새 URL 표시)

### 테스트
- [ ] Apps Script GET 테스트 (version: 5.4.1)
- [ ] 프록시 서버 POST 테스트 (회원가입)
- [ ] Google Sheets 데이터 확인 (앞자리 0 유지)
- [ ] 브라우저 테스트 (http://3.34.186.174)

---

## 🎯 **예상 소요 시간**

1. **Google Sheets 설정**: 5분
2. **Apps Script 배포**: 3분
3. **프록시 서버 업데이트**: 2분
4. **테스트**: 3분

**총 소요 시간: 약 13분** ⏱️

---

## 🚀 **장점**

### **깔끔한 시작:**
- ✅ 이전 데이터 없음
- ✅ 올바른 시트 구조
- ✅ 일반 텍스트 형식 (앞자리 0 보존)

### **정확한 매핑:**
- ✅ H열 = 추천인
- ✅ I열 = 승인상태
- ✅ 사근복컨설턴트 시트 완벽 설정

### **완벽한 테스트:**
- ✅ 실제 컨설턴트 데이터 (김철수, 이영희, 박민수)
- ✅ 추천인 검증 작동
- ✅ 모든 필드 정상 저장

---

## 📞 **지원**

문제 발생 시:

1. **Apps Script 로그**: Ctrl+Enter
2. **프록시 로그**: `pm2 logs proxy-server`
3. **브라우저 콘솔**: F12 → Console
4. **스크린샷**: 오류 메시지 + Sheets 데이터

---

**Google Sheets + Apps Script 재설정 가이드 완료!** 🎉

**이제 처음부터 깔끔하게 시작할 수 있습니다!** ✅
