# 🔧 네트워크 에러 해결 (304/302)

**문제**: 포트 3001 접근 불가로 인한 Google Sheets 저장 실패  
**버전**: V5.4.3  
**커밋**: b284157

---

## 🐛 문제 상황

### 증상:
- ✗ 브라우저에서 회원가입 시도 → 실패
- ✗ Network 탭: 304 Not Modified / 302 Found 에러
- ✗ Google Sheets에 데이터 저장 안 됨
- ✗ 추천인 조회 없이 가입 시도

### 원인:
```
브라우저
  ↓ http://3.34.186.174:3001/api/auth
  ✗ 포트 3001 접근 불가 (AWS 보안 그룹 미설정)
  ↓
프록시 서버 (localhost:3001)
  ↓
Apps Script
  ↓
Google Sheets
```

**근본 원인**: 포트 3001이 외부에서 접근할 수 없음

---

## ✅ 해결 방법

### 새로운 아키텍처:
```
브라우저
  ↓ GET https://script.google.com/.../exec?action=...&data=...
  ✅ Apps Script 직접 호출 (CORS 없음)
  ↓
Apps Script (doGet 처리)
  ↓
Google Sheets
```

**핵심**: 프록시 서버를 거치지 않고 Apps Script 직접 호출!

---

## 📋 변경 내용

### 1️⃣ 프런트엔드 (components/Auth.tsx)

#### 변경 전:
```typescript
const BACKEND_URL = 'http://3.34.186.174:3001/api/auth';

const callAPI = async (action: string, data: any) => {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
  });
  return response.json();
};
```

#### 변경 후:
```typescript
// Apps Script URL - 직접 호출
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbw5c6wArjU15_l6bXfMNe2oMpQXMQtwqvO4eyNQ1BcP1LtSXmYECNj2EatGWP09pDnYQw/exec';

const callAPI = async (action: string, data: any) => {
  // Apps Script는 GET 요청의 쿼리 파라미터로 받음
  const params = new URLSearchParams({
    action,
    data: JSON.stringify(data)
  });
  
  const response = await fetch(`${BACKEND_URL}?${params.toString()}`, {
    method: 'GET',
  });
  
  const text = await response.text();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON 파싱 실패:', text);
    throw new Error('서버 응답 형식이 올바르지 않습니다.');
  }
};
```

---

### 2️⃣ Apps Script (APPS_SCRIPT_V5.4_FINAL.js)

#### 추가: handleRequest() 공통 함수
```javascript
/**
 * 요청 처리 공통 함수
 */
function handleRequest(action, params) {
  try {
    Logger.log('handleRequest: ' + action);
    Logger.log('데이터: ' + JSON.stringify(params));
    
    let result;
    
    switch (action) {
      case 'loginCompany':
        result = loginCompany(params.phone, params.password);
        break;
      case 'loginConsultant':
        result = loginConsultant(params.phone, params.password);
        break;
      case 'registerCompany':
        result = registerCompany({ ...params });
        break;
      case 'registerConsultant':
        result = registerConsultant({ ...params });
        break;
      case 'findUserId':
        result = findUserId(params.name, params.email);
        break;
      case 'findPassword':
        result = findPassword(params.phone, params.email);
        break;
      default:
        result = { success: false, error: '알 수 없는 action입니다: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('handleRequest 오류: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: '요청 처리 중 오류가 발생했습니다: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

#### 업데이트: doGet() - GET 요청 처리
```javascript
function doGet(e) {
  // GET 요청으로 action과 data를 받아서 처리
  if (e && e.parameter && e.parameter.action && e.parameter.data) {
    try {
      const action = e.parameter.action;
      const data = JSON.parse(e.parameter.data);
      
      // handleRequest로 처리
      return handleRequest(action, data);
    } catch (error) {
      Logger.log('doGet 파싱 오류: ' + error);
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'GET 요청 파싱 중 오류가 발생했습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // action이 없으면 버전 정보 반환
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Sagunbok Apps Script V5.4.3 (FINAL) is running!',
    version: '5.4.3',
    ...
  })).setMimeType(ContentService.MimeType.JSON);
}
```

#### 리팩토링: doPost() - handleRequest() 호출
```javascript
function doPost(e) {
  try {
    let params;
    let action;
    
    if (e.postData && e.postData.contents) {
      const body = JSON.parse(e.postData.contents);
      action = body.action;
      params = body.data || body;
    } else {
      params = e.parameter;
      action = params.action;
    }
    
    return handleRequest(action, params);
    
  } catch (error) {
    Logger.log('doPost 오류: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'POST 요청 파싱 중 오류가 발생했습니다.'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 🚀 배포 절차

### Step 1: Apps Script 재배포 (필수!)

1. Google Sheets 열기
2. **확장 프로그램** → **Apps Script**
3. 기존 코드를 모두 삭제
4. 새 코드 복사:
   - 파일: `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js`
5. **Ctrl+S** 저장
6. **배포** → **배포 관리** → 기존 배포 수정
7. **버전**: `V5.4.3 - GET 요청 지원`
8. **배포** 클릭

**⚠️ 중요**: 배포 URL은 변경되지 않습니다!

### Step 2: 브라우저 테스트

1. http://3.34.186.174 접속 (캐시 지우기: Ctrl+Shift+R)
2. **기업회원 가입** 시도:
   ```
   회사명:     직접호출테스트
   기업유형:   병의원개인사업자
   담당자:     직접호출테스터
   휴대폰:     01099998888
   이메일:     direct@test.com
   비밀번호:   test1234
   추천인:     김철수
   ```

3. **F12** → **Network** 탭 확인:
   ```
   GET https://script.google.com/macros/s/.../exec?action=registerCompany&data=...
   Status: 200 OK ✅
   ```

4. **Google Sheets** 확인:
   - 기업회원 시트에 새 행 추가 확인
   - C열: 병의원개인사업자
   - E열: 010-9999-8888
   - H열: 김철수
   - I열: 승인전표

---

## 🎯 예상 결과

### ✅ 성공 시:
- Network 탭: **200 OK**
- Response: `{"success": true, "message": "회원가입 신청이 완료되었습니다..."}`
- Google Sheets: 데이터 정상 저장

### ❌ 실패 시:
- Network 탭: 에러 메시지 확인
- Console 탭: JavaScript 오류 확인
- Apps Script 로그: Ctrl+Enter로 실행 로그 확인

---

## 📊 장단점

### ✅ 장점:
- 프록시 서버 불필요
- 포트 3001 의존성 제거
- AWS 보안 그룹 설정 불필요
- CORS 문제 없음 (Apps Script가 자동 처리)
- 단순한 아키텍처

### ⚠️ 단점:
- URL에 데이터가 노출됨 (GET 요청)
- URL 길이 제한 (2048자)
- Apps Script 실행 시간 제한 (30초)

---

## 🔧 트러블슈팅

### Q1: "JSON 파싱 실패" 에러
**A**: Apps Script가 HTML을 반환하고 있을 수 있습니다.
- Apps Script 로그 확인 (Ctrl+Enter)
- 배포 URL이 올바른지 확인
- 재배포 시도

### Q2: "알 수 없는 action" 에러
**A**: action 파라미터가 전달되지 않았습니다.
- Network 탭에서 전송 URL 확인
- callAPI 함수의 URLSearchParams 확인

### Q3: 여전히 304/302 에러
**A**: 브라우저 캐시 문제일 수 있습니다.
- Ctrl+Shift+R (하드 리프레시)
- 개발자 도구 → Network 탭 → "Disable cache" 체크

---

## 📁 관련 파일

```
/home/user/webapp/
├── components/Auth.tsx (BACKEND_URL 변경, callAPI GET 방식)
├── docs/apps-script-v5/
│   └── APPS_SCRIPT_V5.4_FINAL.js (doGet 추가, handleRequest 공통화)
└── FIX_NETWORK_ERROR.md (이 문서)
```

---

## 🔖 커밋

```
b284157 - fix: Apps Script 직접 호출로 변경 (포트 3001 우회)
```

---

## 🎉 완료!

이제 브라우저가 Apps Script를 직접 호출하여 Google Sheets에 데이터를 저장합니다!

**다음 단계**: Apps Script를 재배포하고 브라우저에서 테스트하세요!
