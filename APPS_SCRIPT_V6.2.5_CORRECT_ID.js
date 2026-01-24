/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2.5 - 올바른 Spreadsheet ID로 수정
 * 
 * 주요 변경사항 (v6.2.5):
 * - Spreadsheet ID 업데이트: 1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc
 */

// ========================================
// 설정
// ========================================

const CONFIG = {
  SPREADSHEET_ID: '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc',
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
// 테스트 함수
// ========================================

/**
 * 권한 테스트 함수 - Apps Script에서 실행
 */
function testSpreadsheetAccess() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    Logger.log('✅ 성공! 스프레드시트: ' + ss.getName());
    
    const sheet = ss.getSheetByName('기업회원');
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      Logger.log('✅ 기업회원 행 수: ' + data.length);
    } else {
      Logger.log('⚠️ 기업회원 시트를 찾을 수 없습니다.');
    }
    
    return '성공';
  } catch (e) {
    Logger.log('❌ 오류: ' + e.toString());
    return '실패';
  }
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
    
    if (!sheet) {
      return {
        success: false,
        error: '기업회원 시트를 찾을 수 없습니다.'
      };
    }
    
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
    if (managerSheet) {
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
    }
    
    // 컨설턴트 확인
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    if (consultantSheet) {
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
    
    if (!sheet) {
      return {
        success: false,
        error: '기업회원 시트를 찾을 수 없습니다.'
      };
    }
    
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
    if (!consultantSheet) {
      return {
        success: false,
        error: '사근복컨설턴트 시트를 찾을 수 없습니다.'
      };
    }
    
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
    
    if (!sheet) {
      return {
        success: false,
        error: '사근복컨설턴트 시트를 찾을 수 없습니다.'
      };
    }
    
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
    
    if (!sheet) {
      return {
        success: false,
        error: '사근복컨설턴트(매니저) 시트를 찾을 수 없습니다.'
      };
    }
    
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
    version: '6.2.5',
    message: '사근복 AI Apps Script v6.2.5 - 올바른 시트 연결'
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
