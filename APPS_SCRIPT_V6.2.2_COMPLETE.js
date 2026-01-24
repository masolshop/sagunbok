/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2.2 - CORS OPTIONS preflight 지원 추가
 * 
 * 주요 변경사항 (v6.2.2):
 * - OPTIONS 메서드 핸들러 추가 (CORS preflight 지원)
 * - CORS 헤더 자동 추가
 * 
 * 이전 버전 변경사항:
 * - v6.2.1: 로그인 버그 수정 (normalizedPhone 정의 누락)
 * - v6.2: 이메일 알림 시스템 추가
 * - 회원가입 시 이메일 자동 발송 (관리자, 본인, 추천인)
 * - 승인 시 이메일 자동 발송 (본인)
 * - 관리자: tysagunbok@gmail.com
 * 
 * 시트 구조:
 * 1. 기업회원: 회사명, 기업회원분류, 추천인, 이름, 전화번호, 이메일, 비밀번호, 승인상태, 가입일
 * 2. 사근복컨설턴트(매니저): 이름, 전화번호, 이메일, 직함, 소속 사업단, 소속 지사, 승인상태, 가입일
 * 3. 사근복컨설턴트: 이름, 전화번호, 이메일, 직함, 소속 사업단, 소속 지사, 승인상태, 가입일
 * 4. 로그: 타임스탬프(KST), 액션, 구분, 대상, 세부정보, 결과
 */

// ========================================
// 설정
// ========================================

const CONFIG = {
  SPREADSHEET_ID: '1jdQ88Np2xK0qQ4c6t5J9-GXNP6PVkZ6b5MgKlIwEpBI',
  ADMIN_EMAIL: 'tysagunbok@gmail.com',
  DEFAULT_PASSWORD: '12345', // 매니저/컨설턴트 기본 비밀번호
  SHEETS: {
    COMPANY: '기업회원',
    MANAGER: '사근복컨설턴트(매니저)',
    CONSULTANT: '사근복컨설턴트',
    LOG: '로그'
  }
};

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 한국 표준시(KST) 타임스탬프 생성
 */
function getKSTTimestamp() {
  const now = new Date();
  const kstOffset = 9 * 60; // KST는 UTC+9
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  return Utilities.formatDate(kstTime, 'GMT', 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 로그 기록
 */
function writeLog(action, category, target, detail, result, error = '') {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const logSheet = ss.getSheetByName(CONFIG.SHEETS.LOG);
    
    const timestamp = getKSTTimestamp();
    const errorMsg = error ? `ERROR: ${error}` : '';
    
    logSheet.appendRow([
      timestamp,
      action,
      category,
      target,
      detail,
      result,
      errorMsg
    ]);
  } catch (e) {
    console.error('로그 기록 실패:', e);
  }
}

/**
 * 전화번호 정규화 (하이픈 제거)
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

/**
 * 이메일 발송 (HTML 형식)
 */
function sendEmail(to, subject, htmlBody) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody
    });
    writeLog('이메일발송', '시스템', to, subject, '성공');
  } catch (error) {
    writeLog('이메일발송', '시스템', to, subject, '실패', error.toString());
    throw error;
  }
}

/**
 * 회원가입 알림 이메일 (관리자용)
 */
function sendAdminNotificationEmail(memberData, memberType) {
  const typeLabel = memberType === 'company' ? '기업회원' : '사근복컨설턴트';
  const subject = `[사근복 AI] 새로운 ${typeLabel} 가입 승인 요청`;
  
  let htmlBody = `
    <h2>새로운 ${typeLabel} 가입 승인 요청</h2>
    <p>새로운 회원이 가입했습니다. 승인해주세요.</p>
    <hr>
  `;
  
  if (memberType === 'company') {
    htmlBody += `
      <p><strong>회사명:</strong> ${memberData.companyName}</p>
      <p><strong>기업회원분류:</strong> ${memberData.companyType}</p>
      <p><strong>추천인:</strong> ${memberData.referrer}</p>
      <p><strong>이름:</strong> ${memberData.name}</p>
      <p><strong>전화번호:</strong> ${memberData.phone}</p>
      <p><strong>이메일:</strong> ${memberData.email}</p>
      <p><strong>가입일:</strong> ${getKSTTimestamp()}</p>
    `;
  } else {
    htmlBody += `
      <p><strong>이름:</strong> ${memberData.name}</p>
      <p><strong>전화번호:</strong> ${memberData.phone}</p>
      <p><strong>이메일:</strong> ${memberData.email}</p>
      <p><strong>직함:</strong> ${memberData.position}</p>
      <p><strong>소속 사업단:</strong> ${memberData.division || '미입력'}</p>
      <p><strong>소속 지사:</strong> ${memberData.branch || '미입력'}</p>
      <p><strong>가입일:</strong> ${getKSTTimestamp()}</p>
    `;
  }
  
  sendEmail(CONFIG.ADMIN_EMAIL, subject, htmlBody);
}

/**
 * 회원가입 완료 이메일 (신청자용)
 */
function sendMemberWelcomeEmail(email, name, memberType) {
  const typeLabel = memberType === 'company' ? '기업회원' : '사근복컨설턴트';
  const subject = `[사근복 AI] ${typeLabel} 가입 신청이 완료되었습니다`;
  
  const htmlBody = `
    <h2>환영합니다, ${name}님!</h2>
    <p>${typeLabel} 가입 신청이 정상적으로 접수되었습니다.</p>
    <p>관리자 승인 후 로그인이 가능합니다.</p>
    <p>승인 완료 시 별도 안내 이메일을 보내드립니다.</p>
    <hr>
    <p><strong>가입일:</strong> ${getKSTTimestamp()}</p>
    <p><em>문의사항이 있으시면 관리자(${CONFIG.ADMIN_EMAIL})에게 연락해주세요.</em></p>
  `;
  
  sendEmail(email, subject, htmlBody);
}

/**
 * 추천인 알림 이메일 (추천인용 - 기업회원 가입 시)
 */
function sendReferrerNotificationEmail(referrerEmail, referrerName, newMemberName, companyName) {
  const subject = `[사근복 AI] ${newMemberName}님이 회원가입 시 귀하를 추천인으로 선택했습니다`;
  
  const htmlBody = `
    <h2>안녕하세요, ${referrerName}님!</h2>
    <p>${newMemberName}님(${companyName})이 기업회원 가입 시 귀하를 추천인으로 선택했습니다.</p>
    <p>관리자 승인 후 해당 회원이 활동을 시작합니다.</p>
    <hr>
    <p><strong>신규 회원:</strong> ${newMemberName}</p>
    <p><strong>회사명:</strong> ${companyName}</p>
    <p><strong>가입일:</strong> ${getKSTTimestamp()}</p>
  `;
  
  sendEmail(referrerEmail, subject, htmlBody);
}

/**
 * 승인 완료 이메일 (승인된 회원용)
 */
function sendApprovalEmail(email, name, memberType, phone) {
  const typeLabel = memberType === 'company' ? '기업회원' : '사근복컨설턴트';
  const subject = `[사근복 AI] ${typeLabel} 승인 완료 - 로그인 가능`;
  
  let loginInfo = `
    <p><strong>ID (전화번호):</strong> ${phone}</p>
  `;
  
  if (memberType !== 'company') {
    loginInfo += `<p><strong>비밀번호:</strong> ${CONFIG.DEFAULT_PASSWORD}</p>`;
  }
  
  const htmlBody = `
    <h2>축하합니다, ${name}님!</h2>
    <p>${typeLabel} 가입이 승인되었습니다.</p>
    <p>이제 사근복 AI 스튜디오에 로그인하실 수 있습니다.</p>
    <hr>
    <h3>로그인 정보</h3>
    ${loginInfo}
    <p><em>보안을 위해 최초 로그인 후 비밀번호를 변경해주세요.</em></p>
  `;
  
  sendEmail(email, subject, htmlBody);
}

// ========================================
// 요청 데이터 파싱
// ========================================

/**
 * GET 및 POST 요청 데이터 통합 파싱
 */
function parseRequestData(e) {
  let data = {};
  
  // GET 파라미터
  if (e.parameter) {
    data = Object.assign(data, e.parameter);
  }
  
  // POST 바디 (JSON)
  if (e.postData && e.postData.contents) {
    try {
      const postData = JSON.parse(e.postData.contents);
      data = Object.assign(data, postData);
    } catch (err) {
      writeLog('파싱', 'POST', 'postData', 'JSON 파싱 실패', '실패', err.toString());
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
    const sheet = ss.getSheetByName(CONFIG.SHEETS.COMPANY);
    const data = sheet.getDataRange().getValues();
    
    const normalizedPhone = normalizePhoneNumber(phone);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhoneNumber(row[4]);
      
      if (storedPhone === normalizedPhone) {
        const approvalStatus = String(row[7]).trim();
        
        if (approvalStatus !== '승인') {
          writeLog('로그인', '기업회원', normalizedPhone, '미승인 계정', '실패');
          return {
            success: false,
            error: '승인 대기 중입니다. 관리자 승인 후 로그인이 가능합니다.'
          };
        }
        
        const storedPassword = String(row[6]).trim();
        if (storedPassword === String(password).trim()) {
          writeLog('로그인', '기업회원', normalizedPhone, '로그인 성공', '성공');
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
      error: '로그인 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 컨설턴트 로그인 (매니저 + 컨설턴트)
 */
function loginConsultant(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // 1. 매니저 시트 확인
    const managerSheet = ss.getSheetByName(CONFIG.SHEETS.MANAGER);
    const managerData = managerSheet.getDataRange().getValues();
    
    for (let i = 1; i < managerData.length; i++) {
      const row = managerData[i];
      const storedPhone = normalizePhoneNumber(row[1]);
      
      if (storedPhone === normalizedPhone) {
        const approvalStatus = String(row[6]).trim();
        
        if (approvalStatus !== '승인') {
          writeLog('로그인', '매니저', normalizedPhone, '미승인 계정', '실패');
          return {
            success: false,
            error: '승인 대기 중입니다. 관리자 승인 후 로그인이 가능합니다.'
          };
        }
        
        if (String(password).trim() === CONFIG.DEFAULT_PASSWORD) {
          writeLog('로그인', '매니저', normalizedPhone, '로그인 성공', '성공');
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
          writeLog('로그인', '매니저', normalizedPhone, '비밀번호 불일치', '실패');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    // 2. 컨설턴트 시트 확인
    const consultantSheet = ss.getSheetByName(CONFIG.SHEETS.CONSULTANT);
    const consultantData = consultantSheet.getDataRange().getValues();
    
    for (let i = 1; i < consultantData.length; i++) {
      const row = consultantData[i];
      const storedPhone = normalizePhoneNumber(row[1]);
      
      if (storedPhone === normalizedPhone) {
        const approvalStatus = String(row[6]).trim();
        
        if (approvalStatus !== '승인') {
          writeLog('로그인', '컨설턴트', normalizedPhone, '미승인 계정', '실패');
          return {
            success: false,
            error: '승인 대기 중입니다. 관리자 승인 후 로그인이 가능합니다.'
          };
        }
        
        if (String(password).trim() === CONFIG.DEFAULT_PASSWORD) {
          writeLog('로그인', '컨설턴트', normalizedPhone, '로그인 성공', '성공');
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
          writeLog('로그인', '컨설턴트', normalizedPhone, '비밀번호 불일치', '실패');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    writeLog('로그인', '컨설턴트', normalizedPhone, '등록되지 않은 전화번호', '실패');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
  } catch (error) {
    writeLog('로그인', '컨설턴트', phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.'
    };
  }
}

// ========================================
// 회원가입 함수
// ========================================

/**
 * 기업회원 가입
 */
function registerCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.COMPANY);
    const existingData = sheet.getDataRange().getValues();
    
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    // 중복 확인
    for (let i = 1; i < existingData.length; i++) {
      const existingPhone = normalizePhoneNumber(existingData[i][4]);
      if (existingPhone === normalizedPhone) {
        writeLog('회원가입', '기업회원', normalizedPhone, '이미 가입된 전화번호', '실패');
        return {
          success: false,
          error: '이미 가입된 전화번호입니다.'
        };
      }
    }
    
    // 추천인 확인 (컨설턴트 시트에서)
    const consultantSheet = ss.getSheetByName(CONFIG.SHEETS.CONSULTANT);
    const consultantData = consultantSheet.getDataRange().getValues();
    let referrerFound = false;
    let referrerEmail = '';
    
    for (let i = 1; i < consultantData.length; i++) {
      if (String(consultantData[i][0]).trim() === String(data.referrer).trim()) {
        referrerFound = true;
        referrerEmail = consultantData[i][2]; // 이메일
        break;
      }
    }
    
    if (!referrerFound) {
      writeLog('회원가입', '기업회원', normalizedPhone, '추천인 미등록', '실패');
      return {
        success: false,
        error: '추천인이 등록된 컨설턴트가 아닙니다.'
      };
    }
    
    // 회원 추가
    const timestamp = getKSTTimestamp();
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
    
    // 이메일 발송
    sendAdminNotificationEmail(data, 'company');
    sendMemberWelcomeEmail(data.email, data.name, 'company');
    sendReferrerNotificationEmail(referrerEmail, data.referrer, data.name, data.companyName);
    
    writeLog('회원가입', '기업회원', normalizedPhone, '가입 완료', '성공');
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.'
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
 * 컨설턴트 가입
 */
function registerConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.CONSULTANT);
    const existingData = sheet.getDataRange().getValues();
    
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    // 중복 확인
    for (let i = 1; i < existingData.length; i++) {
      const existingPhone = normalizePhoneNumber(existingData[i][1]);
      if (existingPhone === normalizedPhone) {
        writeLog('회원가입', '사근복컨설턴트', normalizedPhone, '이미 가입된 전화번호', '실패');
        return {
          success: false,
          error: '이미 가입된 전화번호입니다.'
        };
      }
    }
    
    // 회원 추가
    const timestamp = getKSTTimestamp();
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
    
    // 이메일 발송
    sendAdminNotificationEmail(data, 'consultant');
    sendMemberWelcomeEmail(data.email, data.name, 'consultant');
    
    writeLog('회원가입', '사근복컨설턴트', normalizedPhone, '가입 완료', '성공');
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
 * 매니저 가입
 */
function registerManager(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.MANAGER);
    const existingData = sheet.getDataRange().getValues();
    
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    // 중복 확인
    for (let i = 1; i < existingData.length; i++) {
      const existingPhone = normalizePhoneNumber(existingData[i][1]);
      if (existingPhone === normalizedPhone) {
        writeLog('회원가입', '사근복컨설턴트(매니저)', normalizedPhone, '이미 가입된 전화번호', '실패');
        return {
          success: false,
          error: '이미 가입된 전화번호입니다.'
        };
      }
    }
    
    // 회원 추가
    const timestamp = getKSTTimestamp();
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
    
    // 이메일 발송
    sendAdminNotificationEmail(data, 'manager');
    sendMemberWelcomeEmail(data.email, data.name, 'manager');
    
    writeLog('회원가입', '사근복컨설턴트(매니저)', normalizedPhone, '가입 완료', '성공');
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다. 비밀번호는 12345입니다.'
    };
    
  } catch (error) {
    writeLog('회원가입', '사근복컨설턴트(매니저)', data.phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '회원가입 처리 중 오류가 발생했습니다.'
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
  
  // 액션이 있으면 처리
  if (data.action) {
    return doPost(e); // POST 로직 재사용
  }
  
  // 기본 응답
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      version: '6.2.2',
      timestamp: getKSTTimestamp(),
      message: '사근복 AI Apps Script v6.2.2 - CORS preflight 지원 추가'
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
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}
