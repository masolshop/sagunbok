## 🚨 Google Apps Script 재배포 상세 가이드

### ❌ 현재 상태
- 백엔드 버전: 2.1 (구버전)
- CORS 오류 발생 중
- 회원가입/로그인 실패

### ✅ 목표 상태
- 백엔드 버전: 2.2 (신버전)
- CORS 지원
- 회원가입/로그인 성공

---

## 📋 재배포 상세 단계

### 1단계: Google Sheets 열기
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

### 2단계: Apps Script 편집기 열기
1. Google Sheets 상단 메뉴
2. **확장 프로그램** 클릭
3. **Apps Script** 클릭

### 3단계: 코드 확인 및 업데이트

Apps Script 편집기에서 현재 코드를 확인하세요.

**확인 포인트:**
- `doOptions` 함수가 있는가?
- `version: '2.2'` 로 되어 있는가?
- `'CORS지원'` 이 features에 있는가?

**없으면 코드를 교체해야 합니다:**

1. 기존 코드 전체 선택 (Ctrl+A)
2. 삭제
3. 아래 코드 전체 복사
4. 붙여넣기
5. 저장 (Ctrl+S)

---

### 📄 교체할 코드 (Code-Final.gs v2.2)

```javascript
/**
 * 사근복 AI - Google Apps Script 백엔드 (최종 버전 v2.2)
 * 
 * 필요한 Google Sheets:
 * 1. 기업회원 시트: 회사명, 기업회원분류, 추천인, 이름, 전화번호, 이메일, 비밀번호, 가입일, 승인여부, 로그기록
 * 2. 사근복컨설턴트 시트: 이름, 전화번호, 이메일, 직함, 소속사업단, 소속지사, 비밀번호, 가입일, 승인여부, 로그기록
 */

// 스프레드시트 ID
const SPREADSHEET_ID = '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc';

// 시트 이름
const SHEETS = {
  COMPANY: '기업회원',
  CONSULTANT: '사근복컨설턴트'
};

/**
 * 로그 기록 추가 함수
 */
function addLog(sheet, rowIndex, logColumnIndex, message) {
  try {
    const currentLog = sheet.getRange(rowIndex, logColumnIndex).getValue();
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    const newLog = `[${timestamp}] ${message}`;
    const updatedLog = currentLog ? `${currentLog}\n${newLog}` : newLog;
    sheet.getRange(rowIndex, logColumnIndex).setValue(updatedLog);
  } catch (error) {
    Logger.log('로그 기록 오류: ' + error.message);
  }
}

/**
 * HTTP POST 요청 처리
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    let result;
    
    switch (action) {
      case 'registerCompany':
        result = registerCompany(data);
        break;
      case 'registerConsultant':
        result = registerConsultant(data);
        break;
      case 'loginCompany':
        result = loginCompany(data);
        break;
      case 'loginConsultant':
        result = loginConsultant(data);
        break;
      case 'findUserId':
        result = findUserId(data);
        break;
      case 'findPassword':
        result = findPassword(data);
        break;
      default:
        result = { status: 'error', message: '알 수 없는 액션입니다.' };
    }
    
    output.setContent(JSON.stringify(result));
    return output;
    
  } catch (error) {
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({
      status: 'error',
      message: '서버 오류: ' + error.message
    }));
    return output;
  }
}

/**
 * 기업회원 가입
 */
function registerCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companySheet = ss.getSheetByName(SHEETS.COMPANY);
    const consultantSheet = ss.getSheetByName(SHEETS.CONSULTANT);
    
    if (!data.companyName || !data.companyType || !data.referrer || 
        !data.name || !data.phone || !data.email || !data.password) {
      return { status: 'error', message: '모든 필수 항목을 입력해주세요.' };
    }
    
    const consultantData = consultantSheet.getDataRange().getValues();
    let referrerExists = false;
    
    for (let i = 1; i < consultantData.length; i++) {
      const consultantName = consultantData[i][0];
      const approvalStatus = consultantData[i][8];
      
      if (consultantName === data.referrer && approvalStatus === '승인완료') {
        referrerExists = true;
        break;
      }
    }
    
    if (!referrerExists) {
      return { 
        status: 'error', 
        message: '등록되지 않은 추천인입니다. 승인완료된 사근복 컨설턴트 이름을 입력해주세요.' 
      };
    }
    
    const companyData = companySheet.getDataRange().getValues();
    for (let i = 1; i < companyData.length; i++) {
      if (companyData[i][4] === data.phone) {
        return { status: 'error', message: '이미 등록된 전화번호입니다.' };
      }
    }
    
    for (let i = 1; i < companyData.length; i++) {
      if (companyData[i][5] === data.email) {
        return { status: 'error', message: '이미 등록된 이메일입니다.' };
      }
    }
    
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    const newRow = [
      data.companyName,
      data.companyType,
      data.referrer,
      data.name,
      data.phone,
      data.email,
      data.password,
      now,
      '대기중',
      `[${timestamp}] 회원가입 완료`
    ];
    
    companySheet.appendRow(newRow);
    
    return { 
      status: 'success', 
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.' 
    };
    
  } catch (error) {
    return { status: 'error', message: '회원가입 처리 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 컨설턴트 가입
 */
function registerConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CONSULTANT);
    
    if (!data.name || !data.phone || !data.email || !data.position) {
      return { status: 'error', message: '필수 항목을 모두 입력해주세요.' };
    }
    
    const sheetData = sheet.getDataRange().getValues();
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][1] === data.phone) {
        return { status: 'error', message: '이미 등록된 전화번호입니다.' };
      }
    }
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][2] === data.email) {
        return { status: 'error', message: '이미 등록된 이메일입니다.' };
      }
    }
    
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    const newRow = [
      data.name,
      data.phone,
      data.email,
      data.position,
      data.businessUnit || '',
      data.branchOffice || '',
      '12345',
      now,
      '대기중',
      `[${timestamp}] 컨설턴트 가입 완료`
    ];
    
    sheet.appendRow(newRow);
    
    return { 
      status: 'success', 
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다. 비밀번호는 12345입니다.' 
    };
    
  } catch (error) {
    return { status: 'error', message: '회원가입 처리 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 기업회원 로그인
 */
function loginCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.COMPANY);
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      const phone = sheetData[i][4];
      const password = sheetData[i][6];
      const approvalStatus = sheetData[i][8];
      
      if (phone === data.phone) {
        if (approvalStatus !== '승인완료') {
          return { status: 'error', message: '관리자 승인 대기 중입니다.' };
        }
        
        if (password === data.password) {
          addLog(sheet, i + 1, 10, '로그인 성공');
          
          return {
            status: 'success',
            user: {
              userType: 'company',
              companyName: sheetData[i][0],
              companyType: sheetData[i][1],
              referrer: sheetData[i][2],
              name: sheetData[i][3],
              phone: sheetData[i][4],
              email: sheetData[i][5]
            }
          };
        } else {
          addLog(sheet, i + 1, 10, '로그인 실패 - 비밀번호 오류');
          return { status: 'error', message: '비밀번호가 올바르지 않습니다.' };
        }
      }
    }
    
    return { status: 'error', message: '등록되지 않은 전화번호입니다.' };
    
  } catch (error) {
    return { status: 'error', message: '로그인 처리 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 컨설턴트 로그인
 */
function loginConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CONSULTANT);
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      const phone = sheetData[i][1];
      const password = sheetData[i][6];
      const approvalStatus = sheetData[i][8];
      
      if (phone === data.phone) {
        if (approvalStatus !== '승인완료') {
          return { status: 'error', message: '관리자 승인 대기 중입니다.' };
        }
        
        if (data.password === password) {
          addLog(sheet, i + 1, 10, '로그인 성공');
          
          return {
            status: 'success',
            user: {
              userType: 'consultant',
              name: sheetData[i][0],
              phone: sheetData[i][1],
              email: sheetData[i][2],
              position: sheetData[i][3],
              businessUnit: sheetData[i][4],
              branchOffice: sheetData[i][5]
            }
          };
        } else {
          addLog(sheet, i + 1, 10, '로그인 실패 - 비밀번호 오류');
          return { status: 'error', message: '비밀번호가 올바르지 않습니다.' };
        }
      }
    }
    
    return { status: 'error', message: '등록되지 않은 전화번호입니다.' };
    
  } catch (error) {
    return { status: 'error', message: '로그인 처리 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * ID 찾기
 */
function findUserId(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companySheet = ss.getSheetByName(SHEETS.COMPANY);
    const companyData = companySheet.getDataRange().getValues();
    
    for (let i = 1; i < companyData.length; i++) {
      if (companyData[i][3] === data.name && companyData[i][5] === data.email) {
        addLog(companySheet, i + 1, 10, 'ID 찾기 요청');
        
        return {
          status: 'success',
          message: `회원님의 ID(전화번호)는 ${companyData[i][4]} 입니다.`
        };
      }
    }
    
    return { status: 'error', message: '일치하는 정보가 없습니다.' };
    
  } catch (error) {
    return { status: 'error', message: 'ID 찾기 처리 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 비밀번호 찾기
 */
function findPassword(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companySheet = ss.getSheetByName(SHEETS.COMPANY);
    const companyData = companySheet.getDataRange().getValues();
    
    for (let i = 1; i < companyData.length; i++) {
      if (companyData[i][4] === data.phone && companyData[i][5] === data.email) {
        addLog(companySheet, i + 1, 10, '비밀번호 찾기 요청');
        
        return {
          status: 'success',
          message: `회원님의 비밀번호는 ${companyData[i][6]} 입니다.`
        };
      }
    }
    
    return { status: 'error', message: '일치하는 정보가 없습니다.' };
    
  } catch (error) {
    return { status: 'error', message: '비밀번호 찾기 처리 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * CORS Preflight 요청 처리 (OPTIONS) ⭐ 중요!
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP GET 요청 처리 (테스트용)
 */
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({
    status: 'ok',
    message: '사근복 AI 백엔드 API가 정상 작동 중입니다.',
    version: '2.2',
    features: ['로그기록', '승인여부', '추천인검증', '컨설턴트비밀번호저장', 'CORS지원'],
    timestamp: new Date().toISOString()
  }));
  return output;
}
```

---

### 4단계: 재배포 (매우 중요!)

코드를 저장한 후 **반드시 재배포**해야 합니다!

**재배포 방법:**

1. **배포** 메뉴 클릭 (상단)
2. **배포 관리** 클릭
3. 기존 배포 항목 찾기
4. **연필 아이콘** (편집) 클릭
5. **"버전"** 드롭다운 → **"새 버전"** 선택 ⭐ 중요!
6. **"배포"** 버튼 클릭
7. **"완료"** 버튼 클릭

---

### 5단계: 재배포 확인

브라우저에서 이 URL을 열어서 확인:
```
https://script.google.com/macros/s/AKfycbwB26bKC8LI0MVYdmGptMYEXeiD4XtbrI5jsbxWheQbpBstq4ECHGQ_YfrhvEoOFKIM4g/exec
```

**올바른 응답:**
```json
{
  "status": "ok",
  "message": "사근복 AI 백엔드 API가 정상 작동 중입니다.",
  "version": "2.2",  ← 이게 2.2여야 함!
  "features": ["로그기록", "승인여부", "추천인검증", "컨설턴트비밀번호저장", "CORS지원"],
  "timestamp": "..."
}
```

---

### 6단계: 재테스트

재배포 후 자동 테스트 페이지 새로고침:
```
https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai/auto-test.html
```

**예상 결과:**
- ✅ 백엔드 버전: 2.2
- ✅ 컨설턴트 가입: 성공
- ✅ 기업회원 가입: 성공
- ⚠️ 로그인: 승인 필요

---

## ✅ 체크리스트

- [ ] Google Sheets 열기
- [ ] Apps Script 편집기 열기
- [ ] `doOptions` 함수 확인/추가
- [ ] `version: '2.2'` 확인
- [ ] 코드 저장 (Ctrl+S)
- [ ] **재배포** (배포 → 배포 관리 → 편집 → 새 버전)
- [ ] 백엔드 URL에서 버전 2.2 확인
- [ ] 자동 테스트 페이지 새로고침
- [ ] CORS 오류 없는지 확인

---

## 🚨 주의사항

**재배포하지 않으면:**
- 코드를 수정해도 적용 안 됨
- 여전히 버전 2.1로 표시됨
- CORS 오류 계속 발생

**재배포는 필수입니다!** ⭐
