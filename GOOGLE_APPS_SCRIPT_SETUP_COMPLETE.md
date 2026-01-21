# 🚨 Google Apps Script 완전 재설정 가이드

## 📍 현재 상황

### ❌ 문제:
- Apps Script 편집기가 열리지 않음
- 확장 프로그램 → Apps Script 클릭 시 샌드박스 URL로 리다이렉트
- 회원가입 시 "회원가입 중 오류가 발생했습니다" 알림

### ✅ 해결:
**Google Apps Script를 새로 생성하고 코드를 배포합니다**

---

## 🔧 **1단계: 기존 스크립트 확인 및 삭제**

### 1️⃣ Google Sheets 열기
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

### 2️⃣ Apps Script 접근 시도

**방법 A**: 상단 메뉴 → **확장 프로그램** → **Apps Script**

만약 샌드박스 URL로 리다이렉트되면 → **X로 닫기**

**방법 B**: 직접 Apps Script 대시보드 열기
```
https://script.google.com/home
```

### 3️⃣ 기존 프로젝트 찾기

Apps Script 대시보드에서:
1. "사근복 회원관리 V2" 또는 관련 프로젝트 찾기
2. 프로젝트 클릭
3. **삭제하지 말고** 코드를 교체할 예정

---

## 🆕 **2단계: 새 Apps Script 프로젝트 생성** (기존 프로젝트가 없는 경우)

### 1️⃣ Google Sheets에서 직접 생성

1. Google Sheets 열기:
   ```
   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
   ```

2. 상단 메뉴 → **확장 프로그램** → **Apps Script**

3. 편집기가 열리지 않으면:
   - 브라우저 새 탭에서 직접 열기:
     ```
     https://script.google.com/home/projects/create?template=sheets
     ```

4. 새 프로젝트 이름: **사근복 AI 백엔드 v2.2**

---

## 📝 **3단계: v2.2 코드 입력**

### 1️⃣ 편집기가 열리면

기존 코드를 모두 삭제하고 아래 코드를 붙여넣으세요:

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
 * CORS 프리플라이트 요청 처리 (v2.2 신규 추가!)
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify({ status: 'ok' }));
}

/**
 * HTTP GET 요청 처리 (테스트용)
 */
function doGet(e) {
  const response = {
    status: 'ok',
    message: '사근복 AI 백엔드 API가 정상 작동 중입니다.',
    version: '2.2',
    features: ['로그기록', '승인여부', '추천인검증', '컨설턴트비밀번호저장', 'CORS지원'],
    timestamp: new Date().toISOString()
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
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
      case 'health':
        result = {
          status: 'ok',
          message: '사근복 AI 백엔드 API가 정상 작동 중입니다.',
          version: '2.2',
          features: ['로그기록', '승인여부', '추천인검증', '컨설턴트비밀번호저장', 'CORS지원'],
          timestamp: new Date().toISOString()
        };
        break;
      default:
        result = { status: 'error', message: '알 수 없는 action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doPost 오류: ' + error.message);
    const errorResult = {
      status: 'error',
      message: '서버 오류가 발생했습니다: ' + error.message
    };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 기업회원 가입
 */
function registerCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.COMPANY);
    
    if (!sheet) {
      return { status: 'error', message: '기업회원 시트를 찾을 수 없습니다.' };
    }
    
    // 필수 필드 검사
    if (!data.companyName || !data.companyType || !data.referrer || !data.name || !data.phone || !data.email || !data.password) {
      return { status: 'error', message: '필수 필드가 누락되었습니다.' };
    }
    
    // 추천인 검증
    const consultantSheet = ss.getSheetByName(SHEETS.CONSULTANT);
    if (!consultantSheet) {
      return { status: 'error', message: '사근복컨설턴트 시트를 찾을 수 없습니다.' };
    }
    
    const consultantData = consultantSheet.getDataRange().getValues();
    
    let referrerFound = false;
    let referrerApproved = false;
    
    for (let i = 1; i < consultantData.length; i++) {
      const consultantName = consultantData[i][0]; // A열: 이름
      const approvalStatus = consultantData[i][8]; // I열: 승인여부
      
      if (consultantName === data.referrer) {
        referrerFound = true;
        if (approvalStatus === '승인완료') {
          referrerApproved = true;
        }
        break;
      }
    }
    
    if (!referrerFound) {
      return { status: 'error', message: '추천인을 찾을 수 없습니다. 정확한 컨설턴트 이름을 입력해주세요.' };
    }
    
    if (!referrerApproved) {
      return { status: 'error', message: '추천인이 아직 승인되지 않았습니다. 승인된 컨설턴트의 이름을 입력해주세요.' };
    }
    
    // 중복 검사 (전화번호)
    const companyData = sheet.getDataRange().getValues();
    for (let i = 1; i < companyData.length; i++) {
      if (companyData[i][4] === data.phone) { // E열: 전화번호
        return { status: 'error', message: '이미 등록된 전화번호입니다.' };
      }
      if (companyData[i][5] === data.email) { // F열: 이메일
        return { status: 'error', message: '이미 등록된 이메일입니다.' };
      }
    }
    
    // 새 행 추가
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    const newRow = [
      data.companyName,        // A: 회사명
      data.companyType,        // B: 기업회원분류
      data.referrer,           // C: 추천인
      data.name,               // D: 이름
      data.phone,              // E: 전화번호
      data.email,              // F: 이메일
      data.password,           // G: 비밀번호
      timestamp,               // H: 가입일
      '대기중',                // I: 승인여부
      `[${timestamp}] 회원가입` // J: 로그기록
    ];
    
    sheet.appendRow(newRow);
    
    return { 
      status: 'success', 
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인하실 수 있습니다.' 
    };
    
  } catch (error) {
    Logger.log('registerCompany 오류: ' + error.message);
    return { status: 'error', message: '회원가입 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 컨설턴트 가입
 */
function registerConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CONSULTANT);
    
    if (!sheet) {
      return { status: 'error', message: '사근복컨설턴트 시트를 찾을 수 없습니다.' };
    }
    
    // 필수 필드 검사
    if (!data.name || !data.phone || !data.email || !data.position) {
      return { status: 'error', message: '필수 필드가 누락되었습니다.' };
    }
    
    // 중복 검사
    const consultantData = sheet.getDataRange().getValues();
    for (let i = 1; i < consultantData.length; i++) {
      if (consultantData[i][1] === data.phone) { // B열: 전화번호
        return { status: 'error', message: '이미 등록된 전화번호입니다.' };
      }
      if (consultantData[i][2] === data.email) { // C열: 이메일
        return { status: 'error', message: '이미 등록된 이메일입니다.' };
      }
    }
    
    // 새 행 추가
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    const defaultPassword = '12345'; // 기본 비밀번호
    
    const newRow = [
      data.name,                        // A: 이름
      data.phone,                       // B: 전화번호
      data.email,                       // C: 이메일
      data.position,                    // D: 직함
      data.businessUnit || '',          // E: 소속사업단
      data.branchOffice || '',          // F: 소속지사
      defaultPassword,                  // G: 비밀번호 (기본값: 12345)
      timestamp,                        // H: 가입일
      '대기중',                         // I: 승인여부
      `[${timestamp}] 회원가입`       // J: 로그기록
    ];
    
    sheet.appendRow(newRow);
    
    return { 
      status: 'success', 
      message: `회원가입이 완료되었습니다. 임시 비밀번호: ${defaultPassword}\n관리자 승인 후 로그인하실 수 있습니다.`
    };
    
  } catch (error) {
    Logger.log('registerConsultant 오류: ' + error.message);
    return { status: 'error', message: '회원가입 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 기업회원 로그인
 */
function loginCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.COMPANY);
    
    if (!sheet) {
      return { status: 'error', message: '기업회원 시트를 찾을 수 없습니다.' };
    }
    
    const companyData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < companyData.length; i++) {
      const phone = companyData[i][4];        // E열: 전화번호
      const password = companyData[i][6];     // G열: 비밀번호
      const approvalStatus = companyData[i][8]; // I열: 승인여부
      
      if (phone === data.phone) {
        // 승인 여부 확인
        if (approvalStatus !== '승인완료') {
          addLog(sheet, i + 1, 10, '로그인 시도 실패 (미승인)');
          return { status: 'error', message: '계정이 아직 승인되지 않았습니다. 관리자에게 문의하세요.' };
        }
        
        // 비밀번호 확인
        if (password === data.password) {
          addLog(sheet, i + 1, 10, '로그인 성공');
          
          return {
            status: 'success',
            message: '로그인 성공!',
            user: {
              type: 'company',
              companyName: companyData[i][0],
              companyType: companyData[i][1],
              referrer: companyData[i][2],
              name: companyData[i][3],
              phone: companyData[i][4],
              email: companyData[i][5]
            }
          };
        } else {
          addLog(sheet, i + 1, 10, '로그인 시도 실패 (비밀번호 불일치)');
          return { status: 'error', message: '비밀번호가 일치하지 않습니다.' };
        }
      }
    }
    
    return { status: 'error', message: '등록되지 않은 전화번호입니다.' };
    
  } catch (error) {
    Logger.log('loginCompany 오류: ' + error.message);
    return { status: 'error', message: '로그인 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 컨설턴트 로그인
 */
function loginConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.CONSULTANT);
    
    if (!sheet) {
      return { status: 'error', message: '사근복컨설턴트 시트를 찾을 수 없습니다.' };
    }
    
    const consultantData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < consultantData.length; i++) {
      const phone = consultantData[i][1];        // B열: 전화번호
      const password = consultantData[i][6];     // G열: 비밀번호
      const approvalStatus = consultantData[i][8]; // I열: 승인여부
      
      if (phone === data.phone) {
        // 승인 여부 확인
        if (approvalStatus !== '승인완료') {
          addLog(sheet, i + 1, 10, '로그인 시도 실패 (미승인)');
          return { status: 'error', message: '계정이 아직 승인되지 않았습니다. 관리자에게 문의하세요.' };
        }
        
        // 비밀번호 확인
        if (password === data.password) {
          addLog(sheet, i + 1, 10, '로그인 성공');
          
          return {
            status: 'success',
            message: '로그인 성공!',
            user: {
              type: 'consultant',
              name: consultantData[i][0],
              phone: consultantData[i][1],
              email: consultantData[i][2],
              position: consultantData[i][3],
              businessUnit: consultantData[i][4],
              branchOffice: consultantData[i][5]
            }
          };
        } else {
          addLog(sheet, i + 1, 10, '로그인 시도 실패 (비밀번호 불일치)');
          return { status: 'error', message: '비밀번호가 일치하지 않습니다.' };
        }
      }
    }
    
    return { status: 'error', message: '등록되지 않은 전화번호입니다.' };
    
  } catch (error) {
    Logger.log('loginConsultant 오류: ' + error.message);
    return { status: 'error', message: '로그인 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 사용자 ID 찾기
 */
function findUserId(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 기업회원 시트에서 검색
    const companySheet = ss.getSheetByName(SHEETS.COMPANY);
    if (companySheet) {
      const companyData = companySheet.getDataRange().getValues();
      
      for (let i = 1; i < companyData.length; i++) {
        const name = companyData[i][3];   // D열: 이름
        const email = companyData[i][5];  // F열: 이메일
        const phone = companyData[i][4];  // E열: 전화번호
        
        if (name === data.name && email === data.email) {
          addLog(companySheet, i + 1, 10, 'ID 찾기 성공');
          return { 
            status: 'success', 
            message: `귀하의 ID(전화번호)는 ${phone} 입니다.`
          };
        }
      }
    }
    
    // 컨설턴트 시트에서 검색
    const consultantSheet = ss.getSheetByName(SHEETS.CONSULTANT);
    if (consultantSheet) {
      const consultantData = consultantSheet.getDataRange().getValues();
      
      for (let i = 1; i < consultantData.length; i++) {
        const name = consultantData[i][0];   // A열: 이름
        const email = consultantData[i][2];  // C열: 이메일
        const phone = consultantData[i][1];  // B열: 전화번호
        
        if (name === data.name && email === data.email) {
          addLog(consultantSheet, i + 1, 10, 'ID 찾기 성공');
          return { 
            status: 'success', 
            message: `귀하의 ID(전화번호)는 ${phone} 입니다.`
          };
        }
      }
    }
    
    return { status: 'error', message: '일치하는 정보를 찾을 수 없습니다.' };
    
  } catch (error) {
    Logger.log('findUserId 오류: ' + error.message);
    return { status: 'error', message: 'ID 찾기 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 비밀번호 찾기
 */
function findPassword(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 기업회원 시트에서 검색
    const companySheet = ss.getSheetByName(SHEETS.COMPANY);
    if (companySheet) {
      const companyData = companySheet.getDataRange().getValues();
      
      for (let i = 1; i < companyData.length; i++) {
        const name = companyData[i][3];   // D열: 이름
        const phone = companyData[i][4];  // E열: 전화번호
        const password = companyData[i][6]; // G열: 비밀번호
        
        if (name === data.name && phone === data.phone) {
          addLog(companySheet, i + 1, 10, '비밀번호 찾기 성공');
          return { 
            status: 'success', 
            message: `귀하의 비밀번호는 ${password} 입니다.`
          };
        }
      }
    }
    
    // 컨설턴트 시트에서 검색
    const consultantSheet = ss.getSheetByName(SHEETS.CONSULTANT);
    if (consultantSheet) {
      const consultantData = consultantSheet.getDataRange().getValues();
      
      for (let i = 1; i < consultantData.length; i++) {
        const name = consultantData[i][0];   // A열: 이름
        const phone = consultantData[i][1];  // B열: 전화번호
        const password = consultantData[i][6]; // G열: 비밀번호
        
        if (name === data.name && phone === data.phone) {
          addLog(consultantSheet, i + 1, 10, '비밀번호 찾기 성공');
          return { 
            status: 'success', 
            message: `귀하의 비밀번호는 ${password} 입니다.`
          };
        }
      }
    }
    
    return { status: 'error', message: '일치하는 정보를 찾을 수 없습니다.' };
    
  } catch (error) {
    Logger.log('findPassword 오류: ' + error.message);
    return { status: 'error', message: '비밀번호 찾기 중 오류가 발생했습니다: ' + error.message };
  }
}
```

### 2️⃣ 저장

- **Ctrl+S** (Windows) 또는 **Cmd+S** (Mac)
- 또는 상단 **💾 저장** 버튼 클릭

---

## 🚀 **4단계: 웹 앱으로 배포**

### 1️⃣ 배포 메뉴 클릭

- 상단 메뉴 → **배포** (Deploy) → **새 배포** (New deployment)

### 2️⃣ 배포 유형 선택

- **유형 선택** (Select type) → **웹 앱** (Web app)

### 3️⃣ 배포 설정

- **설명** (Description): `사근복 AI 백엔드 v2.2 - 회원가입 시스템`
- **실행 사용자** (Execute as): **나** (Me)
- **액세스 권한** (Who has access): **모든 사용자** (Anyone)

### 4️⃣ 배포 버튼 클릭

- **배포** (Deploy) 클릭
- 권한 승인 창이 나타나면:
  1. **권한 검토** 클릭
  2. Google 계정 선택
  3. **고급** 클릭 (Advanced)
  4. **[프로젝트 이름](안전하지 않은 페이지로 이동)** 클릭
  5. **허용** 클릭

### 5️⃣ 배포 URL 복사

배포가 완료되면 **웹 앱 URL**이 표시됩니다:

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**⚠️ 이 URL을 복사해두세요!** (나중에 프론트엔드에 연결)

---

## ✅ **5단계: 배포 확인**

### 1️⃣ 브라우저에서 URL 테스트

복사한 URL을 브라우저 주소창에 붙여넣고 Enter:

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### 2️⃣ 올바른 응답 확인

```json
{
  "status": "ok",
  "message": "사근복 AI 백엔드 API가 정상 작동 중입니다.",
  "version": "2.2",
  "features": ["로그기록", "승인여부", "추천인검증", "컨설턴트비밀번호저장", "CORS지원"],
  "timestamp": "2026-01-21T..."
}
```

✅ **version: "2.2"** 와 **"CORS지원"** 이 보이면 성공!

---

## 🔗 **6단계: 프론트엔드 연결**

### 배포 URL을 알려주시면:

1. React 앱의 `BACKEND_URL` 업데이트
2. 빌드 및 재배포
3. 회원가입 테스트

---

## 📌 **중요 체크리스트**

배포 전 확인:
- [ ] Google Sheets에 **"사근복컨설턴트"** 시트 존재
- [ ] Google Sheets에 **"기업회원"** 시트 존재
- [ ] 각 시트 헤더 10개 (A~J)
- [ ] 사근복컨설턴트 시트에 **이종근** 데이터 존재
- [ ] 이종근의 **승인여부**가 **"승인완료"**

배포 후 확인:
- [ ] 배포 URL 브라우저 테스트 (version: 2.2 확인)
- [ ] CORS지원 기능 확인
- [ ] 프론트엔드 BACKEND_URL 업데이트

---

## 🎯 **다음 단계**

1. ✅ Apps Script 편집기에서 v2.2 코드 입력
2. ✅ 웹 앱으로 배포
3. ✅ 배포 URL 복사 및 확인
4. 📤 **배포 URL을 저에게 알려주세요!**
5. 🔗 프론트엔드 연결
6. 🧪 회원가입 테스트

---

## 💡 **문제 해결**

### Q1: Apps Script 편집기가 여전히 안 열려요
**A**: 직접 Apps Script 대시보드로 이동:
```
https://script.google.com/home
```

### Q2: 권한 승인 창에서 막혀요
**A**: "고급" → "프로젝트로 이동(안전하지 않음)" → "허용" 클릭

### Q3: 배포 URL이 안 나와요
**A**: 배포 → 배포 관리 → 방금 생성한 배포 클릭 → URL 복사

### Q4: 시트 이름을 어떻게 확인하나요?
**A**: Google Sheets 하단 탭에서 시트 이름 확인
- 정확히: **"사근복컨설턴트"** 와 **"기업회원"**

---

**지금 바로 Apps Script를 새로 생성하고 배포해주세요!** 🚀

배포 URL을 알려주시면 바로 프론트엔드를 연결해드리겠습니다! 😊
