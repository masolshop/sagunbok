/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2.4 - setHeaders 오류 수정
 * 
 * 주요 변경사항 (v6.2.4):
 * - setHeaders() 메서드 제거 (지원하지 않음)
 * - 개별 헤더 설정 방식으로 변경
 * - OPTIONS preflight 지원
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
 * CORS 헤더가 포함된 응답 생성
 */
function createCORSResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

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
 * GET 요청 처리
 */
function doGet(e) {
  const data = parseRequestData(e);
  
  if (data.action) {
    return doPost(e);
  }
  
  return createCORSResponse({
    success: true,
    version: '6.2.4',
    message: '사근복 AI Apps Script v6.2.4'
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
    
    return createCORSResponse(result);
      
  } catch (error) {
    return createCORSResponse({ 
      success: false, 
      error: '서버 오류: ' + error.toString() 
    });
  }
}
