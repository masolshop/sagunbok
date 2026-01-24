/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2.1 - 로그인 버그 수정
 * 
 * 주요 변경사항 (v6.2.1):
 * - loginCompany 함수의 normalizedPhone, existingPhone 변수 정의 추가
 * - 로그인 로직 안정화
 * 
 * 기존 기능 (v6.2):
 * - 회원가입 시 이메일 자동 발송 (관리자, 본인, 추천인)
 * - 승인 시 이메일 자동 발송 (본인)
 * - POST와 GET 요청 모두 지원
 * - JSON DB 이중 백업
 */

// ========================================
// 설정
// ========================================

// 스프레드시트 ID
const SPREADSHEET_ID = '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc';

// 시트 이름
const SHEET_COMPANIES = '기업회원';
const SHEET_MANAGERS = '사근복매니저';
const SHEET_CONSULTANTS = '사근복컨설턴트';
const SHEET_LOGS = '로그기록';

// JSON 파일 이름
const JSON_ALL_MEMBERS = 'sagunbok_members_all.json';
const JSON_BY_CONSULTANT = 'sagunbok_members_by_consultant.json';

// 승인 상태
const STATUS_PENDING = '승인대기';
const STATUS_APPROVED = '승인완료';
const STATUS_REJECTED = '승인거부';

// 이메일 설정 (v6.2 추가)
const ADMIN_EMAIL = 'tysagunbok@gmail.com';
const SENDER_NAME = 'TY사근복헬스케어사업단';

// ========================================
// 기본 유틸리티 함수
// ========================================

/**
 * 요청 데이터 파싱 (POST + GET 통합)
 */
function parseRequestData(e) {
  try {
    // POST 데이터가 있으면 POST 우선
    if (e && e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
    
    // GET 파라미터 사용
    if (e && e.parameter) {
      return e.parameter;
    }
    
    return {};
  } catch (error) {
    console.error('데이터 파싱 실패:', error);
    return {};
  }
}

/**
 * 한국 시간(KST) 문자열 반환
 */
function getKSTTimestamp() {
  const now = new Date();
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
 * 전화번호 정규화 함수
 * 다양한 형식을 "010-XXXX-XXXX" 형식으로 통일
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  // 문자열로 변환 후 숫자만 추출
  let digitsOnly = String(phone).replace(/[^0-9]/g, '');
  
  // "10"으로 시작하고 10자리인 경우 "010"으로 변경
  if (digitsOnly.startsWith('10') && digitsOnly.length === 10) {
    digitsOnly = '0' + digitsOnly;
  }
  
  // 11자리 숫자를 010-XXXX-XXXX 형식으로 변환
  if (digitsOnly.length === 11 && digitsOnly.startsWith('010')) {
    return digitsOnly.substring(0, 3) + '-' + digitsOnly.substring(3, 7) + '-' + digitsOnly.substring(7);
  }
  
  // 변환 실패 시 원본 반환
  return digitsOnly;
}

/**
 * 로그인용 전화번호 비교 함수
 */
function comparePhoneNumbers(stored, input) {
  // 둘 다 숫자만 추출하여 비교
  const storedDigits = String(stored).replace(/[^0-9]/g, '');
  const inputDigits = String(input).replace(/[^0-9]/g, '');
  
  // "10"으로 시작하는 10자리를 "010"으로 변환
  let normalizedStored = storedDigits;
  let normalizedInput = inputDigits;
  
  if (normalizedStored.startsWith('10') && normalizedStored.length === 10) {
    normalizedStored = '0' + normalizedStored;
  }
  
  if (normalizedInput.startsWith('10') && normalizedInput.length === 10) {
    normalizedInput = '0' + normalizedInput;
  }
  
  return normalizedStored === normalizedInput;
}

/**
 * 로그 기록 함수
 */
function writeLog(actionType, userType, userId, details, status = '성공', errorMsg = '') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName(SHEET_LOGS);
    
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEET_LOGS);
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
    
    const timestamp = getKSTTimestamp();
    const ipAddress = '';
    
    logSheet.appendRow([
      timestamp,
      actionType,
      userType,
      userId,
      details,
      ipAddress,
      status,
      errorMsg
    ]);
    
  } catch (error) {
    console.error('로그 기록 실패:', error);
  }
}

// ========================================
// 로그인 함수 (v6.2.1 버그 수정)
// ========================================

/**
 * 기업회원 로그인 (v6.2.1 버그 수정)
 */
function loginCompany(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_COMPANIES);
    const data = sheet.getDataRange().getValues();
    
    // ✅ 수정: normalizedPhone 변수 정의
    const normalizedPhone = normalizePhoneNumber(phone);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const storedPhone = String(row[4]);
      
      // 전화번호 비교 (다양한 형식 허용)
      if (comparePhoneNumbers(storedPhone, phone)) {
        const status = String(row[8]).trim();
        
        if (status !== STATUS_APPROVED) {
          writeLog('로그인', '기업회원', normalizedPhone, '승인되지 않은 계정', '실패', `현재 상태: ${status}`);
          return {
            success: false,
            error: '관리자 승인이 필요합니다. 현재 상태: ' + status
          };
        }
        
        const storedPassword = String(row[6]).trim();
        
        if (storedPassword === password) {
          writeLog('로그인', '기업회원', normalizedPhone, '로그인 성공', '성공');
          return {
            success: true,
            user: {
              userType: 'company',
              companyName: String(row[0]),
              companyType: String(row[1]),
              referrer: String(row[2]),
              name: String(row[3]),
              phone: storedPhone, // ✅ 수정: existingPhone → storedPhone
              email: String(row[5])
            }
          };
        } else {
          writeLog('로그인', '기업회원', normalizedPhone, '비밀번호 불일치', '실패');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    writeLog('로그인', '기업회원', normalizedPhone, '등록되지 않은 전화번호', '실패');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
    
  } catch (error) {
    writeLog('로그인', '기업회원', phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

/**
 * 매니저 + 컨설턴트 통합 로그인
 */
function loginConsultant(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. 매니저 시트에서 검색
    const managerSheet = ss.getSheetByName(SHEET_MANAGERS);
    const managerData = managerSheet.getDataRange().getValues();
    
    for (let i = 1; i < managerData.length; i++) {
      const row = managerData[i];
      const storedPhone = String(row[1]);
      
      if (comparePhoneNumbers(storedPhone, phone)) {
        const status = String(row[8]).trim();
        
        if (status !== STATUS_APPROVED) {
          return {
            success: false,
            error: '관리자 승인이 필요합니다. 현재 상태: ' + status
          };
        }
        
        const storedPassword = String(row[6]).trim();
        
        if (storedPassword === password) {
          return {
            success: true,
            user: {
              userType: 'manager',
              name: String(row[0]),
              phone: storedPhone,
              email: String(row[2]),
              position: String(row[3]),
              division: String(row[4]),
              branch: String(row[5])
            }
          };
        } else {
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    // 2. 컨설턴트 시트에서 검색
    const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
    const consultantData = consultantSheet.getDataRange().getValues();
    
    for (let i = 1; i < consultantData.length; i++) {
      const row = consultantData[i];
      const storedPhone = String(row[1]);
      
      if (comparePhoneNumbers(storedPhone, phone)) {
        const status = String(row[8]).trim();
        
        if (status !== STATUS_APPROVED) {
          return {
            success: false,
            error: '관리자 승인이 필요합니다. 현재 상태: ' + status
          };
        }
        
        const storedPassword = String(row[6]).trim();
        
        if (storedPassword === password) {
          return {
            success: true,
            user: {
              userType: 'consultant',
              name: String(row[0]),
              phone: storedPhone,
              email: String(row[2]),
              position: String(row[3]),
              division: String(row[4]),
              branch: String(row[5])
            }
          };
        } else {
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
    
  } catch (error) {
    return {
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

// ========================================
// HTTP 요청 핸들러
// ========================================

/**
 * GET 요청 처리
 */
function doGet(e) {
  const data = parseRequestData(e);
  
  // 액션이 있으면 처리
  if (data.action) {
    return doPost(e); // POST 로직 재사용
  }
  
  // 기본 응답
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      version: '6.2.1',
      timestamp: getKSTTimestamp(),
      message: '사근복 AI Apps Script v6.2.1 - 로그인 버그 수정'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리
 */
function doPost(e) {
  try {
    const data = parseRequestData(e);
    
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
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: '알 수 없는 액션입니다.' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
