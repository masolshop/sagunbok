/**
 * 사근복 AI - Google Apps Script 백엔드 (CORS 수정 버전 v2.3)
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
 * CORS 헤더 설정
 */
function setCorsHeaders(output) {
  // 모든 출력에 CORS 헤더 추가
  return output;
}

/**
 * CORS Preflight 요청 처리 (OPTIONS) - 중요!
 */
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * HTTP GET 요청 처리 (테스트용)
 */
function doGet(e) {
  const response = {
    status: 'ok',
    message: '사근복 AI 백엔드 API가 정상 작동 중입니다.',
    version: '2.3',
    features: ['로그기록', '승인여부', '추천인검증', '컨설턴트비밀번호저장', 'CORS지원'],
    timestamp: new Date().toISOString()
  };
  
  const output = ContentService.createTextOutput(JSON.stringify(response));
  output.setMimeType(ContentService.MimeType.JSON);
  return setCorsHeaders(output);
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
    
    const output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return setCorsHeaders(output);
    
  } catch (error) {
    Logger.log('doPost 오류: ' + error.message);
    const errorResult = {
      success: false,
      error: '서버 오류: ' + error.message
    };
    const output = ContentService.createTextOutput(JSON.stringify(errorResult));
    output.setMimeType(ContentService.MimeType.JSON);
    return setCorsHeaders(output);
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
