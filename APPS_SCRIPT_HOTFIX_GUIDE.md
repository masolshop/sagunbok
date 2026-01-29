# 🚨 긴급 핫픽스: Apps Script doGet 파라미터 오류 수정

## 📋 문제 상황

**에러 메시지**:
```
TypeError: Cannot read properties of undefined (reading 'parameter')
doGet @ Code.gs:682
```

**증상**:
- 기업회원 로그인 시도 시 아무 반응 없음
- Console에 디버깅 로그도 나타나지 않음
- Network 탭에 exec 요청도 없음
- **매니저/컨설턴트는 로그인 가능**

**원인**:
- Apps Script의 `doGet(e)` 함수에서 `e.parameter`를 읽으려 할 때
- `e` 또는 `e.parameter`가 `undefined`인 경우 크래시 발생

---

## ✅ 해결 방법

### 1️⃣ Google Sheets 열기

```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc
```

### 2️⃣ Apps Script 편집기 열기

- **확장 프로그램** → **Apps Script**

### 3️⃣ doGet 함수 찾기

- **Ctrl+F**로 `function doGet` 검색
- 681번 라인으로 이동

### 4️⃣ doGet 함수 교체

**기존 코드 (681~710번 라인):**
```javascript
function doGet(e) {
  var action = e.parameter.action;
  
  try {
    // 회원가입
    if (action === 'registerCompany') {
      return createResponse(registerCompany(e.parameter));
    }
    // ... (나머지 코드)
```

**새 코드 (APPS_SCRIPT_v7.2.2_HOTFIX.gs 전체 내용):**

→ **APPS_SCRIPT_v7.2.2_HOTFIX.gs 파일의 내용을 복사해서 기존 doGet 함수를 통째로 교체**

### 5️⃣ 저장

- **Ctrl+S** 또는 **저장 버튼** 클릭

### 6️⃣ 배포

**방법 A: 기존 배포 업데이트 (권장 - URL 변경 없음)**

1. **배포** → **배포 관리**
2. 기존 배포 옆 **수정 아이콘** 클릭
3. **버전**: **새 버전**
4. **설명**: `v7.2.2 핫픽스 - doGet 파라미터 null 체크`
5. **배포** 버튼 클릭
6. ✅ **완료** (기존 URL 유지)

**방법 B: 새 배포 (URL 변경됨)**

1. **배포** → **새 배포**
2. **설명**: `v7.2.2 핫픽스 - doGet 파라미터 null 체크`
3. **액세스**: **모든 사용자**
4. **배포** 버튼 클릭
5. **새 웹앱 URL 복사**
6. ⚠️ **프런트엔드 Auth.tsx의 API_URL 업데이트 필요**

---

## 🔍 수정 내용

### Before (에러 발생):
```javascript
function doGet(e) {
  var action = e.parameter.action; // ← e.parameter가 undefined면 크래시!
  // ...
}
```

### After (에러 해결):
```javascript
function doGet(e) {
  // ✅ null 체크 추가
  if (!e || !e.parameter) {
    return createResponse({ 
      success: false, 
      error: 'Invalid request: missing parameters' 
    });
  }
  
  var action = e.parameter.action;
  
  // ✅ action도 null 체크
  if (!action) {
    return createResponse({ 
      success: false, 
      error: 'Invalid request: missing action parameter' 
    });
  }
  
  try {
    // ... (기존 코드)
  } catch (error) {
    // ✅ 에러 핸들링 강화
    return createResponse({ 
      success: false, 
      error: 'Server error: ' + error.toString() 
    });
  }
}
```

---

## ✅ 테스트 방법

### 1️⃣ 배포 완료 후 즉시 테스트

```
https://sagunbok.com
```

### 2️⃣ 로그인 시도

- **기업** 탭 선택
- 전화번호: `010-6352-9091`
- 비밀번호: `12345`
- **로그인** 버튼 클릭

### 3️⃣ 예상 결과

**성공 시**:
- ✅ 로그인 성공
- ✅ 메인 페이지로 이동
- ✅ 좌측 메뉴 모든 항목 활성화
- ✅ 우측 상단에 "이종근" 표시

**실패 시**:
- ❌ "전화번호 또는 비밀번호가 일치하지 않습니다"
- → Google Sheets에서 전화번호/비밀번호 확인 필요

---

## 🔧 추가 정보

### Git Commit
- **커밋 ID**: 87424b2
- **브랜치**: genspark_ai_developer
- **날짜**: 2026-01-29

### 관련 파일
- `APPS_SCRIPT_v7.2.2_LOGIN_FIX.gs` (전체 코드)
- `APPS_SCRIPT_v7.2.2_HOTFIX.gs` (doGet 함수만)

### 참고
- Apps Script 배포 후 **즉시 적용**됨 (1분 이내)
- 프런트엔드 재배포 **불필요** (API URL이 같은 경우)
- 브라우저 캐시 **영향 없음** (서버 사이드 코드)

---

**배포 완료 후 테스트 결과를 알려주세요!** 🚀
