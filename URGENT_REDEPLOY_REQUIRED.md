# 🚨 긴급: Google Apps Script 재배포 필요!

## 📍 현재 상태

### ❌ 문제 발생
- **백엔드 버전**: v2.1 (CORS 지원 없음)
- **증상**: 회원가입 시 "회원가입 중 오류가 발생했습니다" 알림
- **원인**: Google Apps Script가 POST 요청을 제대로 처리하지 못함

### ✅ 필요한 조치
**Google Apps Script를 v2.2로 재배포해야 합니다!**

---

## 🔧 재배포 방법 (5분 소요)

### 1️⃣ Google Sheets 열기
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

### 2️⃣ Apps Script 편집기 열기
1. 상단 메뉴 → **확장 프로그램** (Extensions)
2. **Apps Script** 클릭

### 3️⃣ 코드 교체
1. 기존 코드 **전체 선택** (Ctrl+A 또는 Cmd+A)
2. **삭제** (Delete)
3. 아래 **v2.2 신버전 코드 전체 복사**
4. **붙여넣기** (Ctrl+V 또는 Cmd+V)
5. **저장** (Ctrl+S 또는 Cmd+S)

---

## 📋 v2.2 신버전 코드

**중요**: 아래 코드를 **전체 복사**하세요!

\`\`\`javascript
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
    const newLog = \`[\${timestamp}] \${message}\`;
    const updatedLog = currentLog ? \`\${currentLog}\\n\${newLog}\` : newLog;
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
    version: '2.2', // ✅ 버전 2.2
    features: ['로그기록', '승인여부', '추천인검증', '컨설턴트비밀번호저장', 'CORS지원'], // ✅ CORS지원 추가!
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
    
    // 필수 필드 검사
    if (!data.companyName || !data.companyType || !data.referrer || !data.name || !data.phone || !data.email || !data.password) {
      return { status: 'error', message: '필수 필드가 누락되었습니다.' };
    }
    
    // 추천인 검증
    const consultantSheet = ss.getSheetByName(SHEETS.CONSULTANT);
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
      \`[\${timestamp}] 회원가입\` // J: 로그기록
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
      \`[\${timestamp}] 회원가입\`       // J: 로그기록
    ];
    
    sheet.appendRow(newRow);
    
    return { 
      status: 'success', 
      message: \`회원가입이 완료되었습니다. 임시 비밀번호: \${defaultPassword}\\n관리자 승인 후 로그인하실 수 있습니다.\`
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
    const companyData = companySheet.getDataRange().getValues();
    
    for (let i = 1; i < companyData.length; i++) {
      const name = companyData[i][3];   // D열: 이름
      const email = companyData[i][5];  // F열: 이메일
      const phone = companyData[i][4];  // E열: 전화번호
      
      if (name === data.name && email === data.email) {
        addLog(companySheet, i + 1, 10, 'ID 찾기 성공');
        return { 
          status: 'success', 
          message: \`귀하의 ID(전화번호)는 \${phone} 입니다.\`
        };
      }
    }
    
    // 컨설턴트 시트에서 검색
    const consultantSheet = ss.getSheetByName(SHEETS.CONSULTANT);
    const consultantData = consultantSheet.getDataRange().getValues();
    
    for (let i = 1; i < consultantData.length; i++) {
      const name = consultantData[i][0];   // A열: 이름
      const email = consultantData[i][2];  // C열: 이메일
      const phone = consultantData[i][1];  // B열: 전화번호
      
      if (name === data.name && email === data.email) {
        addLog(consultantSheet, i + 1, 10, 'ID 찾기 성공');
        return { 
          status: 'success', 
          message: \`귀하의 ID(전화번호)는 \${phone} 입니다.\`
        };
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
    const companyData = companySheet.getDataRange().getValues();
    
    for (let i = 1; i < companyData.length; i++) {
      const name = companyData[i][3];   // D열: 이름
      const phone = companyData[i][4];  // E열: 전화번호
      const password = companyData[i][6]; // G열: 비밀번호
      
      if (name === data.name && phone === data.phone) {
        addLog(companySheet, i + 1, 10, '비밀번호 찾기 성공');
        return { 
          status: 'success', 
          message: \`귀하의 비밀번호는 \${password} 입니다.\`
        };
      }
    }
    
    // 컨설턴트 시트에서 검색
    const consultantSheet = ss.getSheetByName(SHEETS.CONSULTANT);
    const consultantData = consultantSheet.getDataRange().getValues();
    
    for (let i = 1; i < consultantData.length; i++) {
      const name = consultantData[i][0];   // A열: 이름
      const phone = consultantData[i][1];  // B열: 전화번호
      const password = consultantData[i][6]; // G열: 비밀번호
      
      if (name === data.name && phone === data.phone) {
        addLog(consultantSheet, i + 1, 10, '비밀번호 찾기 성공');
        return { 
          status: 'success', 
          message: \`귀하의 비밀번호는 \${password} 입니다.\`
        };
      }
    }
    
    return { status: 'error', message: '일치하는 정보를 찾을 수 없습니다.' };
    
  } catch (error) {
    Logger.log('findPassword 오류: ' + error.message);
    return { status: 'error', message: '비밀번호 찾기 중 오류가 발생했습니다: ' + error.message };
  }
}
\`\`\`

---

## 4️⃣ 재배포 실행

### 방법 A: 기존 배포 업데이트 (권장)
1. 상단 메뉴 → **배포** (Deploy)
2. **배포 관리** (Manage deployments) 클릭
3. 기존 배포 옆 **연필 아이콘** (편집) 클릭
4. **버전** 드롭다운 → **새 버전** (New version) 선택
5. **배포** (Deploy) 클릭
6. ✅ 완료!

### 방법 B: 새 배포 만들기
1. 상단 메뉴 → **배포** (Deploy)
2. **새 배포** (New deployment) 클릭
3. **유형 선택** → **웹 앱** (Web app)
4. 설정:
   - **실행 사용자**: 나 (Me)
   - **액세스 권한**: 모든 사용자 (Anyone)
5. **배포** (Deploy) 클릭
6. ✅ 완료!

---

## 5️⃣ 재배포 확인

### ✅ 버전 확인
재배포 후 아래 URL을 브라우저에서 열어보세요:

```
https://script.google.com/macros/s/AKfycbxp9oaC3BjVmZGBCHhza9hgYXSiYeSm4qMkVRErDR8nBhVZ2vhO8UNRUjZa_pIorhlpLg/exec
```

**올바른 응답 예시** (버전 2.2 확인):
```json
{
  "status": "ok",
  "message": "사근복 AI 백엔드 API가 정상 작동 중입니다.",
  "version": "2.2",  ← ✅ 이 부분이 2.2로 표시되어야 함!
  "features": ["로그기록", "승인여부", "추천인검증", "컨설턴트비밀번호저장", "CORS지원"],
  "timestamp": "..."
}
```

---

## 6️⃣ 재배포 후 테스트

재배포가 완료되면 다음 URL에서 회원가입 테스트:

```
https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai
```

### 테스트 시나리오:
1. **기업회원 가입** 선택
2. 정보 입력:
   - 회사명: 테스트회사
   - 기업회원분류: 법인
   - 추천인: 홍길동 (반드시 Google Sheets의 사근복컨설턴트 시트에 있어야 함!)
   - 이름: 김대표
   - 전화번호: 010-1234-5678
   - 이메일: ceo@femayeon.com
   - 비밀번호: test1234
   - 비밀번호 확인: test1234
3. **회원가입** 버튼 클릭
4. ✅ "회원가입이 완료되었습니다. 관리자 승인 후 로그인하실 수 있습니다." 메시지 확인

---

## 📌 중요 체크리스트

재배포 전 확인사항:
- [ ] Google Sheets에 **사근복컨설턴트** 시트가 있나요?
- [ ] 사근복컨설턴트 시트에 **홍길동** (또는 다른 컨설턴트) 데이터가 있나요?
- [ ] 홍길동의 **승인여부**가 **"승인완료"**로 설정되어 있나요?
- [ ] 시트 헤더가 **10개 열 (A~J)** 모두 설정되어 있나요?

---

## 🚨 재배포 안 하면?

- ❌ 회원가입 계속 실패
- ❌ "회원가입 중 오류가 발생했습니다" 메시지 반복
- ❌ CORS 오류 지속
- ❌ POST 요청 처리 안 됨

---

## 💡 도움말

### Q1: Apps Script 편집기가 안 보여요
**A**: Google Sheets 상단 메뉴 → 확장 프로그램 → Apps Script 클릭

### Q2: 배포 버튼이 안 보여요
**A**: 코드를 먼저 저장하세요 (Ctrl+S)

### Q3: 배포 후에도 v2.1로 나와요
**A**: 브라우저 캐시를 지우거나 시크릿 모드로 다시 확인하세요

### Q4: 컨설턴트 시트에 데이터가 없어요
**A**: 먼저 컨설턴트를 추가하거나, 테스트용 컨설턴트를 수동으로 입력하세요:
```
이름: 홍길동
전화번호: 010-8765-4321
이메일: hong@sagunbok.com
직함: 수석 컨설턴트
소속사업단: 서울사업단
소속지사: 강남지사
비밀번호: 12345
가입일: 2026-01-21
승인여부: 승인완료
로그기록: [2026-01-21] 테스트 계정
```

---

## 🎯 다음 단계

재배포 완료 후:
1. ✅ 버전 2.2 확인
2. ✅ 회원가입 테스트
3. ✅ Google Sheets 데이터 확인
4. ✅ 로그인 테스트 (승인 후)
5. 🚀 EC2 운영 서버 배포

---

**지금 바로 재배포를 진행해주세요!** 🚀
