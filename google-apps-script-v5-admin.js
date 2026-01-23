/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 5.0 - 관리자 대시보드 API 추가
 * 
 * 주요 변경사항:
 * - 전체 회원 조회 API 추가 (getAllMembers)
 * - 회원 승인 상태 업데이트 API 추가 (updateMemberStatus)
 * 
 * 시트 구조:
 * - 기업회원: 9개 컬럼 (회사명/기업회원분류/추천인/이름/전화번호/이메일/비밀번호/가입일/승인여부)
 * - 사근복컨설턴트: 9개 컬럼 (이름/전화번호/이메일/직함/소속사업단/소속지사/비밀번호/가입일/승인여부)
 * - 로그기록: 8개 컬럼 (타임스탬프/액션유형/사용자유형/사용자ID/상세내용/IP주소/상태/에러메시지)
 */

// 스프레드시트 ID
const SPREADSHEET_ID = '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc';

// 시트 이름
const SHEET_COMPANIES = '기업회원';
const SHEET_CONSULTANTS = '사근복컨설턴트';
const SHEET_LOGS = '로그기록';

// 승인 상태
const STATUS_PENDING = '승인대기';
const STATUS_APPROVED = '승인완료';
const STATUS_REJECTED = '승인거부';

/**
 * 한국 시간(KST) 문자열 반환
 * UTC+9로 변환하여 "YYYY-MM-DD HH:mm:ss" 형식 반환
 */
function getKSTTimestamp() {
  const now = new Date();
  // UTC 시간에 9시간(32400000ms) 추가
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const year = kstTime.getUTCFullYear();
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getUTCDate()).padStart(2, '0');
  const hour = String(kstTime.getUTCHours()).padStart(2, '0');
  const minute = String(kstTime.getUTCMinutes()).padStart(2, '0');
  const second = String(kstTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 로그 기록 함수
 * 로그기록 시트에 기록 (한국 시간 사용)
 */
function writeLog(actionType, userType, userId, details, status = '성공', errorMsg = '') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName(SHEET_LOGS);
    
    // 로그 시트가 없으면 생성
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEET_LOGS);
      // 헤더 행 (8개 컬럼)
      logSheet.appendRow([
        '타임스탬프',
        '액션유형',
        '사용자유형',
        '사용자ID',
        '상세내용',
        'IP주소',
        '상태',
        '에러메시지'
      ]);
    }
    
    const timestamp = getKSTTimestamp(); // 한국 시간으로 변경
    const ipAddress = ''; // Apps Script에서는 직접 IP를 얻기 어려움
    
    // 로그 데이터 추가 (8개 컬럼)
    logSheet.appendRow([
      timestamp,      // A: 타임스탬프 (KST)
      actionType,     // B: 액션유형
      userType,       // C: 사용자유형
      userId,         // D: 사용자ID
      details,        // E: 상세내용
      ipAddress,      // F: IP주소
      status,         // G: 상태
      errorMsg        // H: 에러메시지
    ]);
    
  } catch (error) {
    console.error('로그 기록 실패:', error);
  }
}

/**
 * 전체 회원 조회 (관리자용)
 */
function getAllMembers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const members = [];
    
    // 1. 기업회원 조회
    const companySheet = ss.getSheetByName(SHEET_COMPANIES);
    if (companySheet) {
      const companyData = companySheet.getDataRange().getValues();
      for (let i = 1; i < companyData.length; i++) { // 헤더 제외
        const row = companyData[i];
        if (row[4]) { // 전화번호가 있는 경우만
          members.push({
            type: 'company',
            companyName: String(row[0] || ''),
            companyType: String(row[1] || ''),
            referrer: String(row[2] || ''),
            name: String(row[3] || ''),
            phone: String(row[4] || ''),
            email: String(row[5] || ''),
            registeredAt: String(row[7] || ''),
            status: String(row[8] || STATUS_PENDING)
          });
        }
      }
    }
    
    // 2. 사근복컨설턴트 조회
    const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
    if (consultantSheet) {
      const consultantData = consultantSheet.getDataRange().getValues();
      for (let i = 1; i < consultantData.length; i++) { // 헤더 제외
        const row = consultantData[i];
        if (row[1]) { // 전화번호가 있는 경우만
          members.push({
            type: 'consultant',
            name: String(row[0] || ''),
            phone: String(row[1] || ''),
            email: String(row[2] || ''),
            position: String(row[3] || ''),
            division: String(row[4] || ''),
            branch: String(row[5] || ''),
            registeredAt: String(row[7] || ''),
            status: String(row[8] || STATUS_PENDING)
          });
        }
      }
    }
    
    writeLog('회원조회', '관리자', 'ADMIN', `총 ${members.length}명 조회`, '성공');
    
    return {
      success: true,
      members: members
    };
    
  } catch (error) {
    writeLog('회원조회', '관리자', 'ADMIN', 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '회원 조회 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 회원 승인 상태 업데이트 (관리자용)
 */
function updateMemberStatus(phone, type, newStatus) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 상태 값 검증
    if (![STATUS_PENDING, STATUS_APPROVED, STATUS_REJECTED].includes(newStatus)) {
      return {
        success: false,
        error: '유효하지 않은 상태 값입니다.'
      };
    }
    
    // 시트 선택
    const sheetName = (type === 'company') ? SHEET_COMPANIES : SHEET_CONSULTANTS;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        error: '시트를 찾을 수 없습니다.'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const phoneCol = (type === 'company') ? 4 : 1; // 기업회원: E열(4), 컨설턴트: B열(1)
    const statusCol = 8; // 승인여부: I열(8)
    
    // 전화번호로 행 찾기
    for (let i = 1; i < data.length; i++) {
      const existingPhone = String(data[i][phoneCol]).trim();
      if (existingPhone === phone) {
        // 상태 업데이트 (I열)
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        
        const userName = (type === 'company') ? data[i][3] : data[i][0]; // 이름
        writeLog(
          '승인상태변경', 
          type === 'company' ? '기업회원' : '사근복컨설턴트', 
          phone, 
          `${userName} 상태 변경: ${newStatus}`, 
          '성공'
        );
        
        return {
          success: true,
          message: '승인 상태가 업데이트되었습니다.'
        };
      }
    }
    
    return {
      success: false,
      error: '해당 전화번호를 가진 회원을 찾을 수 없습니다.'
    };
    
  } catch (error) {
    writeLog('승인상태변경', type, phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '상태 업데이트 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 기업회원 로그인
 * 기업회원 시트 컬럼: 회사명(A)/기업회원분류(B)/추천인(C)/이름(D)/전화번호(E)/이메일(F)/비밀번호(G)/가입일(H)/승인여부(I)
 */
function loginCompany(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_COMPANIES);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const existingPhone = String(row[4]).trim(); // E열: 전화번호
      
      if (existingPhone === phone) {
        const status = String(row[8]).trim(); // I열: 승인여부
        
        // 승인 상태 확인
        if (status !== STATUS_APPROVED) {
          writeLog('로그인', '기업회원', phone, '승인되지 않은 계정', '실패', `현재 상태: ${status}`);
          return {
            success: false,
            error: '관리자 승인이 필요합니다. 현재 상태: ' + status
          };
        }
        
        const storedPassword = String(row[6]).trim(); // G열: 비밀번호
        
        if (storedPassword === password) {
          writeLog('로그인', '기업회원', phone, '로그인 성공', '성공');
          return {
            success: true,
            user: {
              userType: 'company',
              companyName: String(row[0]),
              companyType: String(row[1]),
              referrer: String(row[2]),
              name: String(row[3]),
              phone: String(row[4]),
              email: String(row[5])
            }
          };
        } else {
          writeLog('로그인', '기업회원', phone, '비밀번호 불일치', '실패');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    writeLog('로그인', '기업회원', phone, '등록되지 않은 전화번호', '실패');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
    
  } catch (error) {
    writeLog('로그인', '기업회원', phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 컨설턴트 로그인
 * 사근복컨설턴트 시트 컬럼: 이름(A)/전화번호(B)/이메일(C)/직함(D)/소속사업단(E)/소속지사(F)/비밀번호(G)/가입일(H)/승인여부(I)
 */
function loginConsultant(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_CONSULTANTS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const existingPhone = String(row[1]).trim(); // B열: 전화번호
      
      if (existingPhone === phone) {
        const status = String(row[8]).trim(); // I열: 승인여부
        
        // 승인 상태 확인
        if (status !== STATUS_APPROVED) {
          writeLog('로그인', '사근복컨설턴트', phone, '승인되지 않은 계정', '실패', `현재 상태: ${status}`);
          return {
            success: false,
            error: '관리자 승인이 필요합니다. 현재 상태: ' + status
          };
        }
        
        const storedPassword = String(row[6]).trim(); // G열: 비밀번호
        
        if (storedPassword === password) {
          writeLog('로그인', '사근복컨설턴트', phone, '로그인 성공', '성공');
          return {
            success: true,
            user: {
              userType: 'consultant',
              name: String(row[0]),
              phone: String(row[1]),
              email: String(row[2]),
              position: String(row[3]),
              division: String(row[4]),
              branch: String(row[5])
            }
          };
        } else {
          writeLog('로그인', '사근복컨설턴트', phone, '비밀번호 불일치', '실패');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    writeLog('로그인', '사근복컨설턴트', phone, '등록되지 않은 전화번호', '실패');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
    
  } catch (error) {
    writeLog('로그인', '사근복컨설턴트', phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 기업회원 회원가입
 * 기업회원 시트 컬럼: 회사명(A)/기업회원분류(B)/추천인(C)/이름(D)/전화번호(E)/이메일(F)/비밀번호(G)/가입일(H)/승인여부(I)
 */
function registerCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companySheet = ss.getSheetByName(SHEET_COMPANIES);
    
    // 1. 중복 전화번호 확인
    const companyData = companySheet.getDataRange().getValues();
    for (let i = 1; i < companyData.length; i++) {
      const existingPhone = String(companyData[i][4]).trim(); // E열: 전화번호
      if (existingPhone === data.phone) {
        writeLog('회원가입', '기업회원', data.phone, '중복 전화번호', '실패', '이미 등록된 전화번호입니다');
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    // 2. 회원가입 처리 (9개 컬럼)
    const timestamp = getKSTTimestamp(); // 한국 시간
    
    companySheet.appendRow([
      data.companyName,    // A: 회사명
      data.companyType,    // B: 기업회원분류
      data.referrer,       // C: 추천인
      data.name,           // D: 이름
      data.phone,          // E: 전화번호
      data.email,          // F: 이메일
      data.password,       // G: 비밀번호
      timestamp,           // H: 가입일 (KST)
      STATUS_PENDING       // I: 승인여부
    ]);
    
    writeLog('회원가입', '기업회원', data.phone, `회원가입 완료: ${data.companyName}`, '성공');
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.',
      debug: {
        passwordLength: data.password ? data.password.length : 0,
        passwordType: typeof data.password
      }
    };
    
  } catch (error) {
    writeLog('회원가입', '기업회원', data.phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '회원가입 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 컨설턴트 회원가입
 * 사근복컨설턴트 시트 컬럼: 이름(A)/전화번호(B)/이메일(C)/직함(D)/소속사업단(E)/소속지사(F)/비밀번호(G)/가입일(H)/승인여부(I)
 */
function registerConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
    
    // 1. 중복 전화번호 확인
    const consultantData = consultantSheet.getDataRange().getValues();
    for (let i = 1; i < consultantData.length; i++) {
      const existingPhone = String(consultantData[i][1]).trim(); // B열: 전화번호
      if (existingPhone === data.phone) {
        writeLog('회원가입', '사근복컨설턴트', data.phone, '중복 전화번호', '실패', '이미 등록된 전화번호입니다');
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    // 2. 회원가입 처리 (9개 컬럼 - J열 제거, 비밀번호는 12345 고정)
    const timestamp = getKSTTimestamp(); // 한국 시간
    const defaultPassword = '12345';
    
    consultantSheet.appendRow([
      data.name,           // A: 이름
      data.phone,          // B: 전화번호
      data.email,          // C: 이메일
      data.position,       // D: 직함
      data.division,       // E: 소속사업단
      data.branch,         // F: 소속지사
      defaultPassword,     // G: 비밀번호 (12345 고정)
      timestamp,           // H: 가입일 (KST)
      STATUS_PENDING       // I: 승인여부
    ]);
    
    writeLog('회원가입', '사근복컨설턴트', data.phone, `회원가입 완료: ${data.name}`, '성공');
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다. 비밀번호는 12345입니다.'
    };
    
  } catch (error) {
    writeLog('회원가입', '사근복컨설턴트', data.phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '회원가입 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * GET 요청 처리
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      version: '5.0',
      timestamp: getKSTTimestamp(),
      message: '사근복 AI Apps Script v5.0 - 관리자 대시보드 API 추가'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'loginCompany') {
      return ContentService
        .createTextOutput(JSON.stringify(loginCompany(data.phone, data.password)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'loginConsultant') {
      return ContentService
        .createTextOutput(JSON.stringify(loginConsultant(data.phone, data.password)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'registerCompany') {
      return ContentService
        .createTextOutput(JSON.stringify(registerCompany(data)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'registerConsultant') {
      return ContentService
        .createTextOutput(JSON.stringify(registerConsultant(data)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'getAllMembers') {
      return ContentService
        .createTextOutput(JSON.stringify(getAllMembers()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'updateMemberStatus') {
      return ContentService
        .createTextOutput(JSON.stringify(updateMemberStatus(data.phone, data.type, data.status)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: '알 수 없는 액션입니다.' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
