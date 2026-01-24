/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2.3 - 로그 제거 버전 (권한 문제 해결)
 * 
 * 주요 변경사항 (v6.2.3):
 * - writeLog() 함수 제거 (권한 문제 해결)
 * - OPTIONS preflight 지원
 * - CORS 헤더 추가
 */

// ========================================
// 설정
// ========================================

const CONFIG = {
  SPREADSHEET_ID: '1jdQ88Np2xK0qQ4c6t5J9-GXNP6PVkZ6b5MgKlIwEpBI',
  DEFAULT_PASSWORD: '12345'
};

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 전화번호 정규화
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

/**
 * 요청 데이터 파싱
 */
function parseRequestData(e) {
  let data = {};
  
  if (e.parameter) {
    data = Object.assign(data, e.parameter);
  }
  
  if (e.postData && e.postData.contents) {
    try {
      const postData = JSON.parse(e.postData.contents);
      data = Object.assign(data, postData);
    } catch (err) {
      // JSON 파싱 실패 시 무시
    }
  }
  
  return data;
}

// ========================================
// 로그인 함수
// ========================================

/**
 * 기업회원 로그인
 */
function loginCompany(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('기업회원');
    const data = sheet.getDataRange().getValues();
    
    const normalizedPhone = normalizePhoneNumber(phone);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhoneNumber(row[4]);
      
      if (storedPhone === normalizedPhone) {
        const approvalStatus = String(row[7]).trim();
        
        if (approvalStatus !== '승인') {
          return {
            success: false,
            error: '승인 대기 중입니다.'
          };
        }
        
        const storedPassword = String(row[6]).trim();
        if (storedPassword === String(password).trim()) {
          return {
            success: true,
            user: {
              userType: 'company',
              companyName: row[0],
              companyType: row[1],
              referrer: row[2],
              name: row[3],
              phone: row[4],
              email: row[5]
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
      error: '로그인 처리 중 오류: ' + error.toString()
    };
  }
}

/**
 * 컨설턴트 로그인
 */
function loginConsultant(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // 매니저 확인
    const managerSheet = ss.getSheetByName('사근복컨설턴트(매니저)');
    const managerData = managerSheet.getDataRange().getValues();
    
    for (let i = 1; i < managerData.length; i++) {
      const row = managerData[i];
      const storedPhone = normalizePhoneNumber(row[1]);
      
      if (storedPhone === normalizedPhone) {
        const approvalStatus = String(row[6]).trim();
        
        if (approvalStatus !== '승인') {
          return {
            success: false,
            error: '승인 대기 중입니다.'
          };
        }
        
        if (String(password).trim() === CONFIG.DEFAULT_PASSWORD) {
          return {
            success: true,
            user: {
              userType: 'manager',
              name: row[0],
              phone: row[1],
              email: row[2],
              position: row[3],
              division: row[4],
              branch: row[5]
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
    
    // 컨설턴트 확인
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    const consultantData = consultantSheet.getDataRange().getValues();
    
    for (let i = 1; i < consultantData.length; i++) {
      const row = consultantData[i];
      const storedPhone = normalizePhoneNumber(row[1]);
      
      if (storedPhone === normalizedPhone) {
        const approvalStatus = String(row[6]).trim();
        
        if (approvalStatus !== '승인') {
          return {
            success: false,
            error: '승인 대기 중입니다.'
          };
        }
        
        if (String(password).trim() === CONFIG.DEFAULT_PASSWORD) {
          return {
            success: true,
            user: {
              userType: 'consultant',
              name: row[0],
              phone: row[1],
              email: row[2],
              position: row[3],
              division: row[4],
              branch: row[5]
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
      error: '로그인 처리 중 오류: ' + error.toString()
    };
  }
}

/**
 * 기업회원 가입
 */
function registerCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('기업회원');
    const existingData = sheet.getDataRange().getValues();
    
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    // 중복 확인
    for (let i = 1; i < existingData.length; i++) {
      const existingPhone = normalizePhoneNumber(existingData[i][4]);
      if (existingPhone === normalizedPhone) {
        return {
          success: false,
          error: '이미 가입된 전화번호입니다.'
        };
      }
    }
    
    // 추천인 확인
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    const consultantData = consultantSheet.getDataRange().getValues();
    let referrerFound = false;
    
    for (let i = 1; i < consultantData.length; i++) {
      if (String(consultantData[i][0]).trim() === String(data.referrer).trim()) {
        referrerFound = true;
        break;
      }
    }
    
    if (!referrerFound) {
      return {
        success: false,
        error: '추천인이 등록된 컨설턴트가 아닙니다.'
      };
    }
    
    // 회원 추가
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'GMT+9', 'yyyy-MM-dd HH:mm:ss');
    
    sheet.appendRow([
      data.companyName,
      data.companyType,
      data.referrer,
      data.name,
      data.phone,
      data.email,
      data.password,
      '대기',
      timestamp
    ]);
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.'
    };
  } catch (error) {
    return {
      success: false,
      error: '회원가입 처리 중 오류: ' + error.toString()
    };
  }
}

/**
 * 컨설턴트 가입
 */
function registerConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('사근복컨설턴트');
    const existingData = sheet.getDataRange().getValues();
    
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    // 중복 확인
    for (let i = 1; i < existingData.length; i++) {
      const existingPhone = normalizePhoneNumber(existingData[i][1]);
      if (existingPhone === normalizedPhone) {
        return {
          success: false,
          error: '이미 가입된 전화번호입니다.'
        };
      }
    }
    
    // 회원 추가
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'GMT+9', 'yyyy-MM-dd HH:mm:ss');
    
    sheet.appendRow([
      data.name,
      data.phone,
      data.email,
      data.position,
      data.division || '',
      data.branch || '',
      '대기',
      timestamp
    ]);
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 비밀번호는 12345입니다.'
    };
  } catch (error) {
    return {
      success: false,
      error: '회원가입 처리 중 오류: ' + error.toString()
    };
  }
}

/**
 * 매니저 가입
 */
function registerManager(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('사근복컨설턴트(매니저)');
    const existingData = sheet.getDataRange().getValues();
    
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    // 중복 확인
    for (let i = 1; i < existingData.length; i++) {
      const existingPhone = normalizePhoneNumber(existingData[i][1]);
      if (existingPhone === normalizedPhone) {
        return {
          success: false,
          error: '이미 가입된 전화번호입니다.'
        };
      }
    }
    
    // 회원 추가
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'GMT+9', 'yyyy-MM-dd HH:mm:ss');
    
    sheet.appendRow([
      data.name,
      data.phone,
      data.email,
      data.position,
      data.division || '',
      data.branch || '',
      '대기',
      timestamp
    ]);
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 비밀번호는 12345입니다.'
    };
  } catch (error) {
    return {
      success: false,
      error: '회원가입 처리 중 오류: ' + error.toString()
    };
  }
}

// ========================================
// HTTP 요청 핸들러
// ========================================

/**
 * OPTIONS 요청 처리 (CORS Preflight)
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
}

/**
 * GET 요청 처리
 */
function doGet(e) {
  const data = parseRequestData(e);
  
  if (data.action) {
    return doPost(e);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      version: '6.2.3',
      message: '사근복 AI Apps Script v6.2.3'
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * POST 요청 처리
 */
function doPost(e) {
  try {
    const data = parseRequestData(e);
    
    let result;
    
    if (data.action === 'loginCompany') {
      result = loginCompany(data.phone, data.password);
    } else if (data.action === 'loginConsultant') {
      result = loginConsultant(data.phone, data.password);
    } else if (data.action === 'registerCompany') {
      result = registerCompany(data);
    } else if (data.action === 'registerConsultant') {
      result = registerConsultant(data);
    } else if (data.action === 'registerManager') {
      result = registerManager(data);
    } else {
      result = { success: false, error: '알 수 없는 액션입니다.' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: '서버 오류: ' + error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}
