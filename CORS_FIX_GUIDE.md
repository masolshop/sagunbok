# 🔧 CORS 문제 해결 및 테스트 가이드

## ❌ 문제 상황

Google Apps Script에서 CORS (Cross-Origin Resource Sharing) 정책으로 인해 브라우저에서 직접 API를 호출할 수 없는 문제가 발생했습니다.

**오류 메시지:**
```
Access to fetch at 'https://script.google.com/macros/s/.../exec' 
from origin 'https://8000-...' has been blocked by CORS policy
```

---

## ✅ 해결 방법

### 1. Code-Final.gs 업데이트 (v2.2)

Google Apps Script에 `doOptions` 함수를 추가했습니다:

```javascript
/**
 * CORS Preflight 요청 처리 (OPTIONS)
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}
```

**변경사항:**
- ✅ `doOptions` 함수 추가
- ✅ 버전 업데이트: v2.1 → v2.2
- ✅ 기능에 'CORS지원' 추가

---

### 2. Google Apps Script 재배포 필요 ⚠️

**중요:** CORS 지원을 활성화하려면 다음 단계를 수행해야 합니다:

#### Step 1: Apps Script 편집기 열기
1. Google Sheets 열기
   ```
   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
   ```
2. 상단 메뉴: 확장 프로그램 → Apps Script

#### Step 2: 코드 업데이트
1. Code.gs 파일 열기 (또는 사용 중인 파일)
2. `/home/user/webapp/google-apps-script/Code-Final.gs` 전체 내용 복사
3. 기존 코드를 모두 삭제하고 새 코드 붙여넣기
4. 저장 (Ctrl+S)

#### Step 3: 재배포
1. 상단 메뉴: 배포 → 배포 관리
2. 기존 배포 항목 옆의 "연필" 아이콘 클릭 (편집)
3. "버전" 드롭다운에서 "새 버전" 선택
4. "배포" 버튼 클릭
5. 새 배포 URL 확인 (기존과 같아야 함)

**또는 새로 배포:**
1. 상단 메뉴: 배포 → 새 배포
2. 유형 선택: 웹 앱
3. 설정:
   - 실행 사용자: 나
   - 액세스 권한: 모든 사용자
4. 배포 버튼 클릭
5. 새 URL 복사

---

## 🧪 재배포 후 테스트 방법

### 방법 1: 자동 테스트 페이지 (권장)

**URL:**
```
https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai/auto-test.html
```

**테스트 절차:**
1. 위의 URL 접속
2. 자동으로 테스트 실행
3. 로그에서 결과 확인
4. Google Sheets 확인

**예상 결과:**
- ✅ 헬스체크 성공 (버전 2.2)
- ✅ 컨설턴트 가입 성공
- ✅ 기업회원 가입 성공
- ⚠️  로그인은 승인 후 성공

---

### 방법 2: Apps Script 편집기에서 직접 테스트

**장점:** CORS 문제 없음, 가장 확실한 방법

**테스트 함수:**
```javascript
function testRegisterConsultant() {
  const testData = {
    action: 'registerConsultant',
    name: '홍길동',
    phone: '010-8765-4321',
    email: 'hong@sagunbok.com',
    position: '수석 컨설턴트',
    businessUnit: '서울사업단',
    branchOffice: '강남지사'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData),
      type: 'application/json'
    }
  };
  
  const result = doPost(mockEvent);
  const response = JSON.parse(result.getContent());
  Logger.log(JSON.stringify(response, null, 2));
  
  return response;
}
```

**실행 방법:**
1. Apps Script 편집기에서 위 함수 추가
2. 함수 선택: `testRegisterConsultant`
3. 실행 버튼 클릭
4. 로그 확인 (Ctrl+Enter)
5. Google Sheets에서 데이터 확인

---

### 방법 3: 메인 앱 UI 테스트

**URL:**
```
https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai
```

**테스트 절차:**
1. 메인 앱 접속
2. "회원가입" 탭 클릭
3. 컨설턴트/기업회원 정보 입력
4. 가입 버튼 클릭
5. Google Sheets 확인

---

## 📊 Google Sheets 확인

### 시트 구조 확인

#### 사근복컨설턴트 시트 (10열)
```
A: 이름
B: 전화번호
C: 이메일
D: 직함
E: 소속사업단
F: 소속지사
G: 비밀번호
H: 가입일
I: 승인여부
J: 로그기록
```

#### 기업회원 시트 (10열)
```
A: 회사명
B: 기업회원분류
C: 추천인
D: 이름
E: 전화번호
F: 이메일
G: 비밀번호
H: 가입일
I: 승인여부
J: 로그기록
```

### 헤더 행 설정 (필수)

**사근복컨설턴트 시트 1행:**
```
이름 | 전화번호 | 이메일 | 직함 | 소속사업단 | 소속지사 | 비밀번호 | 가입일 | 승인여부 | 로그기록
```

**기업회원 시트 1행:**
```
회사명 | 기업회원분류 | 추천인 | 이름 | 전화번호 | 이메일 | 비밀번호 | 가입일 | 승인여부 | 로그기록
```

---

## 🎯 테스트 체크리스트

### ✅ 재배포 전
- [ ] Code-Final.gs 코드 업데이트
- [ ] `doOptions` 함수 추가 확인
- [ ] 버전 2.2 확인
- [ ] Google Sheets 헤더 행 설정

### ✅ 재배포
- [ ] Apps Script 편집기에서 재배포
- [ ] 새 버전 또는 기존 URL 확인
- [ ] React 앱의 BACKEND_URL 확인

### ✅ 테스트
- [ ] 헬스체크 (버전 2.2 확인)
- [ ] 컨설턴트 가입
- [ ] Google Sheets 데이터 확인
- [ ] 승인여부 변경
- [ ] 컨설턴트 로그인
- [ ] 기업회원 가입 (추천인 검증)
- [ ] 기업회원 로그인

---

## 🚨 문제 해결

### 문제 1: 여전히 CORS 오류 발생

**원인:** 재배포를 하지 않았거나 새 버전이 적용되지 않음

**해결:**
1. Google Apps Script 편집기에서 완전히 로그아웃
2. 다시 로그인 후 재배포
3. 브라우저 캐시 삭제
4. 시크릿 모드에서 테스트

### 문제 2: "시트를 찾을 수 없습니다" 오류

**원인:** Google Sheets의 시트 이름이 정확하지 않음

**해결:**
1. Google Sheets에서 시트 탭 이름 확인
2. 정확히 `기업회원`, `사근복컨설턴트`인지 확인
3. 띄어쓰기, 오타 없는지 확인

### 문제 3: "헤더를 찾을 수 없습니다" 오류

**원인:** 시트의 1행에 헤더가 없음

**해결:**
1. 각 시트의 1행에 헤더 입력
2. 위의 "시트 구조 확인" 섹션 참조
3. 정확한 순서와 이름 사용

---

## 📝 다음 단계

1. ✅ Google Apps Script 재배포
2. ✅ 헬스체크로 버전 2.2 확인
3. ✅ 자동 테스트 페이지 실행
4. ✅ Google Sheets 데이터 확인
5. ✅ 승인 처리
6. ✅ 로그인 테스트
7. 🚀 EC2 배포 준비

---

## 🔗 빠른 링크

**Google Sheets:**
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

**자동 테스트 페이지:**
```
https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai/auto-test.html
```

**메인 앱:**
```
https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai
```

**백엔드 API:**
```
https://script.google.com/macros/s/AKfycbwB26bKC8LI0MVYdmGptMYEXeiD4XtbrI5jsbxWheQbpBstq4ECHGQ_YfrhvEoOFKIM4g/exec
```

---

## 🎉 완료!

재배포 후 자동 테스트 페이지에서 모든 테스트가 성공하면 회원가입 시스템이 완전히 작동하는 것입니다!

**⚠️  가장 중요한 단계: Google Apps Script 재배포!**
