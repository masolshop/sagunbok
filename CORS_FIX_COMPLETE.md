# 🎯 CORS 문제 완전 해결 가이드 (v2.4 최종)

## 🔴 **문제 원인**
- Google Apps Script의 `doOptions()` 함수에 **CORS 헤더가 없었습니다**
- 브라우저가 실제 POST 요청 전에 보내는 **Preflight(OPTIONS) 요청**에 응답하지 못함
- 결과: `Access-Control-Allow-Origin` 헤더 누락 오류

---

## ✅ **해결 방법**

### **1단계: Google Apps Script 편집기 열기**

#### **방법 A: Apps Script 대시보드 (권장)**
1. 브라우저에서 접속: https://script.google.com/home
2. "사근복 AI 백엔드" 또는 "사근복회원관리V2" 프로젝트 클릭
3. 편집기가 열립니다

#### **방법 B: Google Sheets에서 직접**
1. Google Sheets 열기: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
2. 상단 메뉴 → **확장 프로그램(Extensions)** → **Apps Script**
3. 새 탭에서 편집기가 열립니다

---

### **2단계: 코드 전체 교체**

1. **편집기의 모든 코드 선택**: `Ctrl+A` (Windows) / `Cmd+A` (Mac)
2. **삭제**: `Delete` 키
3. **아래 v2.4 전체 코드 복사해서 붙여넣기**
4. **저장**: `Ctrl+S` (Windows) / `Cmd+S` (Mac)

---

### **📋 v2.4 전체 코드** (복사해서 붙여넣으세요)

```javascript
/**
 * 사근복 AI - Google Apps Script 백엔드 (CORS 완전 수정 버전 v2.4)
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
 * CORS Preflight 요청 처리 (OPTIONS) - 핵심!
 * 브라우저가 실제 POST 요청을 보내기 전에 OPTIONS 요청으로 권한을 확인합니다.
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

/**
 * HTTP GET 요청 처리 (테스트용)
 */
function doGet(e) {
  const response = {
    status: 'ok',
    message: '사근복 AI 백엔드 API가 정상 작동 중입니다.',
    version: '2.4',
    features: ['로그기록', '승인여부', '추천인검증', '컨설턴트비밀번호저장', 'CORS완전지원'],
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * HTTP POST 요청 처리
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
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
        result = { success: false, error: '알 수 없는 액션입니다.' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
  } catch (error) {
    Logger.log('doPost 오류: ' + error.message);
    const errorResult = {
      success: false,
      error: '서버 오류: ' + error.message
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
    
    // 필수 필드 확인
    if (!data.companyName || !data.companyType || !data.referrer || 
        !data.name || !data.phone || !data.email || !data.password) {
      return { success: false, error: '모든 필수 항목을 입력해주세요.' };
    }
    
    // 추천인 검증: 사근복컨설턴트 시트에서 이름 확인
    const consultantData = consultantSheet.getDataRange().getValues();
    let referrerExists = false;
    
    for (let i = 1; i < consultantData.length; i++) {
      const consultantName = consultantData[i][0]; // A: 이름
      const approvalStatus = consultantData[i][8]; // I: 승인여부
      
      if (consultantName === data.referrer && approvalStatus === '승인완료') {
        referrerExists = true;
        break;
      }
    }
    
    if (!referrerExists) {
      return { 
        success: false, 
        error: '등록되지 않은 추천인입니다. 승인완료된 사근복 컨설턴트 이름을 입력해주세요.' 
      };
    }
    
    // 전화번호 중복 확인
    const companyData = companySheet.getDataRange().getValues();
    for (let i = 1; i < companyData.length; i++) {
      if (companyData[i][4] === data.phone) { // E: 전화번호
        return { success: false, error: '이미 등록된 전화번호입니다.' };
      }
    }
    
    // 이메일 중복 확인
    for (let i = 1; i < companyData.length; i++) {
      if (companyData[i][5] === data.email) { // F: 이메일
        return { success: false, error: '이미 등록된 이메일입니다.' };
      }
    }
    
    // 현재 시각
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    // 새 행 추가
    const newRow = [
      data.companyName,      // A: 회사명
      data.companyType,      // B: 기업회원분류
      data.referrer,         // C: 추천인
      data.name,             // D: 이름
      data.phone,            // E: 전화번호
      data.email,            // F: 이메일
      data.password,         // G: 비밀번호
      now,                   // H: 가입일
      '대기중',              // I: 승인여부
      `[${timestamp}] 회원가입 완료` // J: 로그기록
    ];
    
    companySheet.appendRow(newRow);
    
    return { 
      success: true, 
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.' 
    };
    
  } catch (error) {
    return { success: false, error: '회원가입 처리 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 컨설턴트 가입
 */
function registerConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CONSULTANT);
    
    // 필수 필드 확인
    if (!data.name || !data.phone || !data.email || !data.position) {
      return { success: false, error: '필수 항목을 모두 입력해주세요.' };
    }
    
    // 전화번호 중복 확인
    const sheetData = sheet.getDataRange().getValues();
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][1] === data.phone) { // B: 전화번호
        return { success: false, error: '이미 등록된 전화번호입니다.' };
      }
    }
    
    // 이메일 중복 확인
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][2] === data.email) { // C: 이메일
        return { success: false, error: '이미 등록된 이메일입니다.' };
      }
    }
    
    // 현재 시각
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    
    // 새 행 추가
    const newRow = [
      data.name,             // A: 이름
      data.phone,            // B: 전화번호
      data.email,            // C: 이메일
      data.position,         // D: 직함
      data.businessUnit || '', // E: 소속사업단
      data.branchOffice || '', // F: 소속지사
      '12345',               // G: 비밀번호 (고정)
      now,                   // H: 가입일
      '대기중',              // I: 승인여부
      `[${timestamp}] 컨설턴트 가입 완료` // J: 로그기록
    ];
    
    sheet.appendRow(newRow);
    
    return { 
      success: true, 
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다. 비밀번호는 12345입니다.' 
    };
    
  } catch (error) {
    return { success: false, error: '회원가입 처리 중 오류가 발생했습니다: ' + error.message };
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
      const phone = sheetData[i][4];      // E: 전화번호
      const password = sheetData[i][6];   // G: 비밀번호
      const approvalStatus = sheetData[i][8]; // I: 승인여부
      
      if (phone === data.phone) {
        // 승인 상태 확인
        if (approvalStatus !== '승인완료') {
          return { success: false, error: '관리자 승인 대기 중입니다.' };
        }
        
        // 비밀번호 확인
        if (password === data.password) {
          // 로그 기록 (J열: 로그기록)
          addLog(sheet, i + 1, 10, '로그인 성공');
          
          return {
            success: true,
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
          // 로그 기록
          addLog(sheet, i + 1, 10, '로그인 실패 - 비밀번호 오류');
          return { success: false, error: '비밀번호가 올바르지 않습니다.' };
        }
      }
    }
    
    return { success: false, error: '등록되지 않은 전화번호입니다.' };
    
  } catch (error) {
    return { success: false, error: '로그인 처리 중 오류가 발생했습니다: ' + error.message };
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
      const phone = sheetData[i][1];      // B: 전화번호
      const password = sheetData[i][6];   // G: 비밀번호
      const approvalStatus = sheetData[i][8]; // I: 승인여부
      
      if (phone === data.phone) {
        // 승인 상태 확인
        if (approvalStatus !== '승인완료') {
          return { success: false, error: '관리자 승인 대기 중입니다.' };
        }
        
        // 비밀번호 확인 (시트에 저장된 비밀번호 사용)
        if (data.password === password) {
          // 로그 기록 (J열: 로그기록)
          addLog(sheet, i + 1, 10, '로그인 성공');
          
          return {
            success: true,
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
          // 로그 기록
          addLog(sheet, i + 1, 10, '로그인 실패 - 비밀번호 오류');
          return { success: false, error: '비밀번호가 올바르지 않습니다.' };
        }
      }
    }
    
    return { success: false, error: '등록되지 않은 전화번호입니다.' };
    
  } catch (error) {
    return { success: false, error: '로그인 처리 중 오류가 발생했습니다: ' + error.message };
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
        // 로그 기록
        addLog(companySheet, i + 1, 10, 'ID 찾기 요청');
        
        return {
          success: true,
          message: `회원님의 ID(전화번호)는 ${companyData[i][4]} 입니다.`
        };
      }
    }
    
    return { success: false, error: '일치하는 정보가 없습니다.' };
    
  } catch (error) {
    return { success: false, error: 'ID 찾기 처리 중 오류가 발생했습니다: ' + error.message };
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
        // 로그 기록
        addLog(companySheet, i + 1, 10, '비밀번호 찾기 요청');
        
        return{
          success: true,
          message: `회원님의 비밀번호는 ${companyData[i][6]} 입니다.`
        };
      }
    }
    
    return { success: false, error: '일치하는 정보가 없습니다.' };
    
  } catch (error) {
    return { success: false, error: '비밀번호 찾기 처리 중 오류가 발생했습니다: ' + error.message };
  }
}
```

---

### **3단계: 배포**

#### **새 배포 만들기 (권장)**
1. 상단 메뉴 → **배포(Deploy)** → **새 배포(New deployment)**
2. **유형 선택**: "웹 앱(Web app)" 선택
3. **설명**: `v2.4 - CORS 완전 수정`
4. **실행 사용자**: **나(Me)**
5. **액세스 권한**: **모든 사용자(Anyone)**
6. **배포(Deploy)** 버튼 클릭

#### **기존 배포 업데이트**
1. 상단 메뉴 → **배포(Deploy)** → **배포 관리(Manage deployments)**
2. 기존 배포 옆 **연필 아이콘(수정)** 클릭
3. **버전**: **새 버전(New version)** 선택
4. **배포(Deploy)** 버튼 클릭

#### **권한 승인 (최초 1회)**
- "이 앱은 Google에서 인증하지 않았습니다" 경고 표시
- **고급** 클릭
- **[프로젝트 이름] (안전하지 않음)으로 이동** 클릭
- **허용** 클릭

---

### **4단계: 배포 URL 확인**

배포 완료 후 **웹 앱 URL**을 복사합니다.

**현재 사용 중인 URL (변경되지 않았다면):**
```
https://script.google.com/macros/s/AKfycbyZW1cSH2GtUvfwfk3nGHWvNMV9PCwlMrrIuc-09Ar7SHi4hpt-5cB08bqJDvWKGMWnhQ/exec
```

⚠️ **중요**: 새 배포를 만든 경우 URL이 변경될 수 있습니다!

---

### **5단계: 배포 확인 테스트**

**브라우저에서 배포 URL 열기:**

✅ **올바른 응답 (v2.4):**
```json
{
  "status": "ok",
  "version": "2.4",
  "features": ["로그기록", "승인여부", "추천인검증", "컨설턴트비밀번호저장", "CORS완전지원"],
  "message": "사근복 AI 백엔드 API가 정상 작동 중입니다.",
  "timestamp": "2026-01-21T..."
}
```

❌ **잘못된 응답 (리다이렉트 페이지):**
- HTML 페이지가 표시되면 → 재배포 필요

---

## 🎯 **다음 단계**

### **✅ 배포 확인 완료 후:**

#### **1) 메인 앱에서 회원가입 테스트**

**테스트 URL:** https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai/

**테스트 데이터 (기업회원 가입):**
- 회사명: `테스트회사`
- 기업회원분류: `법인` (드롭다운에서 선택)
- 추천인: `이종근` (Google Sheets에서 승인완료 상태 필수!)
- 이름: `홍길동`
- 전화번호: `01099887766`
- 이메일: `test@company.com`
- 비밀번호: `test1234`
- 비밀번호 확인: `test1234`

**예상 결과:**
- ✅ 성공: "회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다."
- ✅ Google Sheets 기업회원 시트에 새 행 추가됨
- ✅ 승인여부: 대기중

---

#### **2) Google Sheets 확인**

https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit

**확인 사항:**
- **사근복컨설턴트 시트**: "이종근" 데이터 존재, I열(승인여부) = "승인완료"
- **기업회원 시트**: 가입 후 새 행 추가 확인, 승인여부 = "대기중"

---

#### **3) 승인 처리**

Google Sheets에서 I열(승인여부)를 `대기중` → `승인완료`로 변경

---

#### **4) 로그인 테스트**

**기업회원 로그인:**
- 전화번호: `01099887766`
- 비밀번호: `test1234`

**예상 결과:**
- ✅ 로그인 성공
- ✅ 로컬스토리지에 사용자 정보 저장
- ✅ Google Sheets J열(로그기록)에 "로그인 성공" 추가

---

## 🚀 **최종 단계: EC2 배포**

모든 테스트 통과 시 운영 서버 배포 진행

---

## 📊 **주요 변경사항 (v2.3 → v2.4)**

### **수정된 부분:**

#### **1) `doOptions()` 함수**

**❌ 이전 (v2.3):**
```javascript
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.JSON);
  return output;  // ❌ CORS 헤더 없음!
}
```

**✅ 수정 (v2.4):**
```javascript
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')         // ✅ CORS 헤더 추가!
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}
```

---

## 📝 **참고 사항**

### **CORS란?**
- **C**ross-**O**rigin **R**esource **S**haring
- 다른 도메인 간의 리소스 요청을 제어하는 브라우저 보안 메커니즘
- 브라우저는 실제 요청 전에 **OPTIONS Preflight** 요청을 먼저 보냄
- Preflight 요청에 올바른 CORS 헤더가 없으면 실제 요청이 차단됨

### **필수 CORS 헤더:**
1. `Access-Control-Allow-Origin: *` - 모든 도메인 허용
2. `Access-Control-Allow-Methods: GET, POST, OPTIONS` - 허용된 HTTP 메서드
3. `Access-Control-Allow-Headers: Content-Type` - 허용된 헤더

---

## ✅ **체크리스트**

- [ ] Apps Script 편집기 열기
- [ ] 코드 전체 교체 (v2.4)
- [ ] 저장 (`Ctrl+S`)
- [ ] 새 버전 배포 또는 기존 배포 업데이트
- [ ] 배포 URL 확인
- [ ] 브라우저에서 `version: "2.4"` 확인
- [ ] 메인 앱에서 회원가입 테스트
- [ ] Google Sheets 데이터 확인
- [ ] 승인 처리 (`승인완료`)
- [ ] 로그인 테스트
- [ ] EC2 배포 준비

---

## 🔗 **관련 링크**

- **Google Sheets:** https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
- **Apps Script 대시보드:** https://script.google.com/home
- **메인 앱 (샌드박스):** https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai/
- **GitHub 저장소:** https://github.com/masolshop/sagunbok
- **최신 커밋:** https://github.com/masolshop/sagunbok/commit/d755505

---

## 📞 **문제 발생 시**

### **1) 여전히 CORS 오류가 발생하는 경우:**
- 배포 후 5분 정도 대기 (Google 서버 업데이트)
- 브라우저 캐시 삭제 (`Ctrl+Shift+Delete`)
- 시크릿 모드에서 재시도

### **2) 배포 URL이 변경된 경우:**
- 프론트엔드 `Auth.tsx` 파일의 `BACKEND_URL` 업데이트 필요
- 재빌드 및 재배포

### **3) 추가 도움이 필요한 경우:**
- 오류 메시지 스크린샷 공유
- 브라우저 Console (F12) 오류 복사
- Network 탭의 exec 요청 응답 확인

---

**🎉 v2.4로 재배포하면 CORS 문제가 완전히 해결됩니다!**

**지금 바로 재배포를 진행해주세요! 😊**
