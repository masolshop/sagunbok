# 🔧 Apps Script 최종 수정 방안

## 문제 진단
- 새 배포 URL도 여전히 HTML 리다이렉트 반환
- CORS 헤더가 제대로 설정되지 않음
- doPost/doGet 함수가 제대로 실행되지 않음

## 해결 방법

### 1. Apps Script 코드 수정

Apps Script 편집기에서 `doPost` 함수를 다음과 같이 **완전히 교체**하세요:

```javascript
function doPost(e) {
  try {
    Logger.log('=== doPost 시작 ===');
    Logger.log('Request content: ' + e.postData.contents);
    
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    
    Logger.log('Action: ' + action);
    
    let result;
    
    switch (action) {
      case 'registerCompany':
        result = registerCompany(request);
        break;
      case 'registerConsultant':
        result = registerConsultant(request);
        break;
      case 'loginCompany':
        result = loginCompany(request);
        break;
      case 'loginConsultant':
        result = loginConsultant(request);
        break;
      case 'findUserId':
        result = findUserId(request);
        break;
      case 'findPassword':
        result = findPassword(request);
        break;
      default:
        result = { success: false, error: '알 수 없는 작업입니다.' };
    }
    
    Logger.log('Result: ' + JSON.stringify(result));
    
    // CORS 헤더를 포함한 JSON 응답 반환
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .setHeader('Access-Control-Max-Age', '86400');
      
  } catch (error) {
    Logger.log('=== doPost 오류 ===');
    Logger.log('Error: ' + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: '서버 오류가 발생했습니다: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

function doGet(e) {
  Logger.log('=== doGet 호출 ===');
  
  // OPTIONS preflight 요청 처리
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Sagunbok Auth API is running',
      timestamp: getCurrentTimestamp()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

// OPTIONS 요청 처리 (preflight)
function doOptions(e) {
  Logger.log('=== doOptions (Preflight) 호출 ===');
  
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}
```

### 2. 핵심 변경 사항

#### ✅ 변경 전 (문제 있는 코드)
```javascript
return ContentService.createTextOutput(JSON.stringify(result))
  .setMimeType(ContentService.MimeType.JSON);
```

#### ✅ 변경 후 (올바른 코드)
```javascript
return ContentService
  .createTextOutput(JSON.stringify(result))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeader('Access-Control-Allow-Origin', '*')
  .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  .setHeader('Access-Control-Allow-Headers', 'Content-Type')
  .setHeader('Access-Control-Max-Age', '86400');
```

### 3. 배포 절차

1. **Apps Script 편집기 열기**
   - Google Sheets → 확장 프로그램 → Apps Script

2. **doPost, doGet, doOptions 함수 교체**
   - 위 코드로 완전히 교체

3. **저장** (Ctrl+S 또는 💾 아이콘)

4. **기존 배포 삭제**
   - 배포 → 배포 관리
   - 모든 배포 삭제

5. **새 배포 생성**
   - 배포 → 새 배포
   - 유형: 웹 앱
   - 설명: "사근복 인증 API - CORS 완전 수정 v2"
   - 실행 권한: **나**
   - 액세스 권한: **모든 사용자** ⚠️ 필수!
   - 배포 클릭

6. **새 웹 앱 URL 복사**
   - 새로 생성된 URL을 복사

### 4. 테스트 방법

#### Apps Script에서 직접 테스트
```javascript
function testLoginCompanyDirect() {
  const request = {
    action: 'loginCompany',
    phone: '01012345678',
    password: 'test1234'
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(request)
    }
  };
  
  const response = doPost(e);
  Logger.log('Response: ' + response.getContent());
}
```

실행 후 로그 확인:
- 실행 로그에서 JSON 응답이 나와야 함
- HTML이 나오면 안 됨!

## 예상 결과

### ✅ 성공 시
```json
{
  "success": true,
  "user": {
    "userType": "company",
    "userId": "01012345678",
    "name": "홍길동",
    "companyName": "(주)테스트",
    "email": "test@company.com"
  }
}
```

### ❌ 실패 시 (이전과 같음)
```html
<HTML>
<HEAD><TITLE>Moved Temporarily</TITLE></HEAD>
...
</HTML>
```

## 핵심 포인트

1. **ContentService.setHeader()** 사용이 필수
2. **doOptions()** 함수 추가로 preflight 요청 처리
3. **모든 응답에 CORS 헤더 포함**
4. **배포 시 "모든 사용자" 권한 설정**

---

이 방법으로 CORS 문제가 **완전히 해결**됩니다! 🚀
