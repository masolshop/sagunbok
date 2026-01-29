/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 7.3.0 - 사업자등록번호 조회 및 기업평판분석 API 추가
 * 
 * 시트 구조:
 * [기업회원]: 사업자번호/회사명/대표자명/기업회원분류/직함/이름/전화번호/이메일/비밀번호/가입일/승인여부/추천인
 * [매니저/컨설턴트]: 이름/전화번호/이메일/직함/소속사업단/소속지사/비밀번호/가입일/승인여부/추천인
 * [로그]: 타임스탬프/액션/회원타입/전화번호/상태/메시지
 * 
 * 주요 변경 (v7.3.0):
 * - 🆕 국세청 사업자등록번호 조회 API 추가 (lookupBusinessNumber)
 * - 🆕 사람인 구직 정보 분석 API 추가 (analyzeJobSites) - 구현 예정
 * - 🆕 블라인드 리뷰 분석 API 추가 (analyzeReviewSites) - 구현 예정
 * - CORS 헤더 추가
 * 
 * 이전 변경 (v7.2.3):
 * - 🚨 긴급 핫픽스: doGet 함수에 null 체크 추가
 * - TypeError: Cannot read properties of undefined (reading 'parameter') 해결
 * 
 * 이전 변경 (v7.2.2):
 * - 로그인 비밀번호 매칭 문제 수정
 * - 슈퍼 어드민 전화번호 추가 (01063529091)
 * - 로그인 디버깅 로그 강화
 */

// ========================================
// 설정
// ========================================

var CONFIG = {
  SPREADSHEET_ID: '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc',
  ADMIN_EMAIL: 'tysagunbok@gmail.com',
  COMPANY_NAME: 'AI사근복닷컴',
  COMPANY_URL: 'https://sagunbok.com',
  
  // 국세청 사업자등록번호 조회 API
  NTS_API_KEY: 'c1ae465883fe093d1392e88bbd13b0cd998bba3ee21fae4322b1b6e394405bed',
  NTS_API_URL: 'https://api.odcloud.kr/api/nts-businessman/v1/status'
};

var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

// ========================================
// 로그 함수
// ========================================

function writeLog(action, userType, phone, status, message) {
  try {
    var logSheet = ss.getSheetByName('로그');
    
    // 로그 시트가 없으면 생성
    if (!logSheet) {
      logSheet = ss.insertSheet('로그');
      logSheet.appendRow(['타임스탬프', '액션', '회원타입', '전화번호', '상태', '메시지']);
      logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }
    
    // 로그 추가
    var timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    logSheet.appendRow([timestamp, action, userType, phone, status, message]);
    
  } catch (e) {
    Logger.log('Log error: ' + e);
  }
}

// ========================================
// 전화번호 정규화 함수
// ========================================

function normalizePhone(phone) {
  if (!phone) return '';
  var cleaned = String(phone).replace(/[-\s()]/g, '').replace(/\D/g, '').replace(/'/g, '');
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  if (cleaned.length !== 11 || !cleaned.startsWith('0')) {
    return '';
  }
  return "'" + cleaned;
}

function isSamePhone(phone1, phone2) {
  var n1 = normalizePhone(phone1).replace(/'/g, '');
  var n2 = normalizePhone(phone2).replace(/'/g, '');
  return n1 === n2;
}

// ========================================
// 이메일 발송 함수
// ========================================

function sendApprovalEmail(userType, name, email, phone) {
  var subject = '[AI사근복닷컴] 🎉 회원 승인이 완료되었습니다!';
  var typeLabel = userType === 'company' ? '기업회원' : 
                  userType === 'manager' ? '사근복매니저' : '사근복컨설턴트';
  
  var htmlBody = '<!DOCTYPE html>' +
    '<html><head><style>' +
    'body { font-family: "Malgun Gothic", sans-serif; }' +
    '.container { max-width: 600px; margin: 0 auto; padding: 20px; }' +
    '.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }' +
    '.content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }' +
    '.button { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }' +
    '.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }' +
    '</style></head><body>' +
    '<div class="container">' +
    '<div class="header"><h1>🎉 승인 완료!</h1></div>' +
    '<div class="content">' +
    '<p>안녕하세요, <strong>' + name + '</strong> 님</p>' +
    '<p>' + typeLabel + ' 승인이 완료되었습니다!<br>지금 바로 로그인하여 모든 서비스를 이용하실 수 있습니다.</p>' +
    '<ul>' +
    '<li><strong>승인 일시:</strong> ' + new Date().toLocaleString('ko-KR') + '</li>' +
    '<li><strong>전화번호:</strong> ' + phone + '</li>' +
    '</ul>' +
    '<p style="text-align: center;">' +
    '<a href="' + CONFIG.COMPANY_URL + '" class="button">지금 로그인하기</a>' +
    '</p>' +
    '</div>' +
    '<div class="footer"><p>' + CONFIG.COMPANY_NAME + '<br>문의: 010-6352-9091</p></div>' +
    '</div></body></html>';
  
  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
}

function sendRejectionEmail(userType, name, email, reason) {
  var subject = '[AI사근복닷컴] 회원 승인이 보류되었습니다';
  var typeLabel = userType === 'company' ? '기업회원' : 
                  userType === 'manager' ? '사근복매니저' : '사근복컨설턴트';
  
  var htmlBody = '<!DOCTYPE html>' +
    '<html><head><style>' +
    'body { font-family: "Malgun Gothic", sans-serif; }' +
    '.container { max-width: 600px; margin: 0 auto; padding: 20px; }' +
    '.header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }' +
    '.content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }' +
    '.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }' +
    '</style></head><body>' +
    '<div class="container">' +
    '<div class="header"><h1>승인 보류</h1></div>' +
    '<div class="content">' +
    '<p>안녕하세요, <strong>' + name + '</strong> 님</p>' +
    '<p>죄송하지만 ' + typeLabel + ' 승인이 보류되었습니다.</p>' +
    '<ul>' +
    '<li><strong>반려 사유:</strong> ' + reason + '</li>' +
    '<li><strong>조치 사항:</strong> 올바른 정보로 재가입 부탁드립니다</li>' +
    '</ul>' +
    '<p>문의: 010-6352-9091</p>' +
    '</div>' +
    '<div class="footer"><p>' + CONFIG.COMPANY_NAME + '</p></div>' +
    '</div></body></html>';
  
  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
}

function sendAdminNotification(userType, name, phone) {
  var subject = '[AI사근복닷컴] ⚠️ 새로운 회원 승인 요청';
  var typeLabel = userType === 'company' ? '기업회원' : 
                  userType === 'manager' ? '사근복매니저' : '사근복컨설턴트';
  
  var body = '관리자님,\n\n' +
    '새로운 ' + typeLabel + '이 가입을 신청했습니다.\n\n' +
    '• 이름/회사명: ' + name + '\n' +
    '• 전화번호: ' + phone + '\n' +
    '• 신청 시간: ' + new Date().toLocaleString('ko-KR') + '\n\n' +
    '👉 승인 처리: ' + CONFIG.COMPANY_URL + '\n' +
    '(로그인 → ADMIN DASHBOARD → 승인 대기 목록)\n\n' +
    CONFIG.COMPANY_NAME + ' 시스템';
  
  MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
}

// ========================================
// 회원가입 함수
// ========================================

/**
 * 기업회원 가입
 * 시트 구조: A:사업자번호 B:회사명 C:대표자명 D:기업회원분류 E:직함 F:이름 G:전화번호 H:이메일 I:비밀번호 J:가입일 K:승인여부 L:추천인
 */
function registerCompany(data) {
  var sheet = ss.getSheetByName('기업회원');
  var normalizedPhone = normalizePhone(data.phone);
  var normalizedReferrer = normalizePhone(data.referrer);
  
  writeLog('registerCompany', 'company', data.phone, 'START', '기업회원 가입 시도');
  
  if (!normalizedPhone) {
    writeLog('registerCompany', 'company', data.phone, 'FAIL', '잘못된 전화번호 형식');
    return { success: false, error: '잘못된 전화번호 형식입니다' };
  }
  
  // 중복 체크 (G열: 전화번호)
  var dataRange = sheet.getDataRange().getValues();
  for (var i = 1; i < dataRange.length; i++) {
    if (isSamePhone(dataRange[i][6], data.phone)) {
      writeLog('registerCompany', 'company', data.phone, 'FAIL', '중복 전화번호');
      return { success: false, error: '이미 등록된 전화번호입니다' };
    }
  }
  
  // 추천인 검증 (필수)
  if (!normalizedReferrer) {
    writeLog('registerCompany', 'company', data.phone, 'FAIL', '추천인 미입력');
    return { success: false, error: '추천인 전화번호를 입력해주세요' };
  }
  
  var referrerExists = false;
  var managerSheet = ss.getSheetByName('사근복매니저');
  var consultantSheet = ss.getSheetByName('사근복컨설턴트');
  
  // 매니저 시트에서 추천인 확인 (B열: 전화번호)
  var managers = managerSheet.getDataRange().getValues();
  for (var i = 1; i < managers.length; i++) {
    if (isSamePhone(managers[i][1], data.referrer)) {
      referrerExists = true;
      break;
    }
  }
  
  // 컨설턴트 시트에서 추천인 확인 (B열: 전화번호)
  if (!referrerExists) {
    var consultants = consultantSheet.getDataRange().getValues();
    for (var i = 1; i < consultants.length; i++) {
      if (isSamePhone(consultants[i][1], data.referrer)) {
        referrerExists = true;
        break;
      }
    }
  }
  
  if (!referrerExists) {
    writeLog('registerCompany', 'company', data.phone, 'FAIL', '등록되지 않은 추천인: ' + data.referrer);
    return { success: false, error: '등록되지 않은 추천인 전화번호입니다' };
  }
  
  // 데이터 추가
  sheet.appendRow([
    data.businessNumber || '',      // A: 사업자번호
    data.companyName,               // B: 회사명
    data.ceoName || '',             // C: 대표자명
    data.companyType,               // D: 기업회원분류
    data.position || '',            // E: 직함
    data.name,                      // F: 이름
    normalizedPhone,                // G: 전화번호
    data.email,                     // H: 이메일
    data.password,                  // I: 비밀번호
    new Date().toLocaleString('ko-KR'), // J: 가입일
    '승인대기',                     // K: 승인여부
    normalizedReferrer              // L: 추천인
  ]);
  
  writeLog('registerCompany', 'company', data.phone, 'SUCCESS', '기업회원 가입 완료: ' + data.companyName);
  
  // 관리자 알림
  try {
    sendAdminNotification('company', data.companyName, data.phone);
    writeLog('registerCompany', 'company', data.phone, 'EMAIL', '관리자 알림 발송 완료');
  } catch (e) {
    writeLog('registerCompany', 'company', data.phone, 'EMAIL_FAIL', '관리자 알림 실패: ' + e);
  }
  
  return { 
    success: true, 
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' 
  };
}

/**
 * 매니저 가입
 * 시트 구조: A:이름 B:전화번호 C:이메일 D:직함 E:소속사업단 F:소속지사 G:비밀번호 H:가입일 I:승인여부 J:추천인
 */
function registerManager(data) {
  var sheet = ss.getSheetByName('사근복매니저');
  var normalizedPhone = normalizePhone(data.phone);
  var normalizedReferrer = normalizePhone(data.referrer);
  
  writeLog('registerManager', 'manager', data.phone, 'START', '매니저 가입 시도');
  
  if (!normalizedPhone) {
    writeLog('registerManager', 'manager', data.phone, 'FAIL', '잘못된 전화번호 형식');
    return { success: false, error: '잘못된 전화번호 형식입니다' };
  }
  
  // 중복 체크 (B열: 전화번호)
  var dataRange = sheet.getDataRange().getValues();
  for (var i = 1; i < dataRange.length; i++) {
    if (isSamePhone(dataRange[i][1], data.phone)) {
      writeLog('registerManager', 'manager', data.phone, 'FAIL', '중복 전화번호');
      return { success: false, error: '이미 등록된 전화번호입니다' };
    }
  }
  
  // 추천인 검증 (필수)
  if (!normalizedReferrer) {
    writeLog('registerManager', 'manager', data.phone, 'FAIL', '추천인 미입력');
    return { success: false, error: '추천인 전화번호를 입력해주세요' };
  }
  
  // 데이터 추가
  sheet.appendRow([
    data.name,                  // A: 이름
    normalizedPhone,            // B: 전화번호
    data.email,                 // C: 이메일
    data.position,              // D: 직함
    data.region,                // E: 소속사업단
    '',                         // F: 소속지사 (빈값)
    data.password,              // G: 비밀번호
    new Date().toLocaleString('ko-KR'), // H: 가입일
    '승인대기',                 // I: 승인여부
    normalizedReferrer          // J: 추천인
  ]);
  
  writeLog('registerManager', 'manager', data.phone, 'SUCCESS', '매니저 가입 완료: ' + data.name);
  
  // 관리자 알림
  try {
    sendAdminNotification('manager', data.name, data.phone);
    writeLog('registerManager', 'manager', data.phone, 'EMAIL', '관리자 알림 발송 완료');
  } catch (e) {
    writeLog('registerManager', 'manager', data.phone, 'EMAIL_FAIL', '관리자 알림 실패: ' + e);
  }
  
  return { 
    success: true, 
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' 
  };
}

/**
 * 컨설턴트 가입
 * 시트 구조: A:이름 B:전화번호 C:이메일 D:직함 E:소속사업단 F:소속지사 G:비밀번호 H:가입일 I:승인여부 J:추천인
 */
function registerConsultant(data) {
  var sheet = ss.getSheetByName('사근복컨설턴트');
  var normalizedPhone = normalizePhone(data.phone);
  var normalizedReferrer = normalizePhone(data.referrer);
  
  writeLog('registerConsultant', 'consultant', data.phone, 'START', '컨설턴트 가입 시도');
  
  if (!normalizedPhone) {
    writeLog('registerConsultant', 'consultant', data.phone, 'FAIL', '잘못된 전화번호 형식');
    return { success: false, error: '잘못된 전화번호 형식입니다' };
  }
  
  // 중복 체크 (B열: 전화번호)
  var dataRange = sheet.getDataRange().getValues();
  for (var i = 1; i < dataRange.length; i++) {
    if (isSamePhone(dataRange[i][1], data.phone)) {
      writeLog('registerConsultant', 'consultant', data.phone, 'FAIL', '중복 전화번호');
      return { success: false, error: '이미 등록된 전화번호입니다' };
    }
  }
  
  // 추천인 검증 (필수)
  if (!normalizedReferrer) {
    writeLog('registerConsultant', 'consultant', data.phone, 'FAIL', '추천인 미입력');
    return { success: false, error: '추천인 전화번호를 입력해주세요' };
  }
  
  // 데이터 추가
  sheet.appendRow([
    data.name,                  // A: 이름
    normalizedPhone,            // B: 전화번호
    data.email,                 // C: 이메일
    data.position,              // D: 직함
    data.region,                // E: 소속사업단
    '',                         // F: 소속지사 (빈값)
    data.password,              // G: 비밀번호
    new Date().toLocaleString('ko-KR'), // H: 가입일
    '승인대기',                 // I: 승인여부
    normalizedReferrer          // J: 추천인
  ]);
  
  writeLog('registerConsultant', 'consultant', data.phone, 'SUCCESS', '컨설턴트 가입 완료: ' + data.name);
  
  // 관리자 알림
  try {
    sendAdminNotification('consultant', data.name, data.phone);
    writeLog('registerConsultant', 'consultant', data.phone, 'EMAIL', '관리자 알림 발송 완료');
  } catch (e) {
    writeLog('registerConsultant', 'consultant', data.phone, 'EMAIL_FAIL', '관리자 알림 실패: ' + e);
  }
  
  return { 
    success: true, 
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' 
  };
}

// ========================================
// 로그인 함수
// ========================================

/**
 * 기업회원 로그인
 * 시트 구조: G:전화번호 I:비밀번호 K:승인여부
 */
function loginCompany(phone, password) {
  writeLog('loginCompany', 'company', phone, 'START', '기업회원 로그인 시도');
  
  var normalizedPhone = normalizePhone(phone);
  var sheet = ss.getSheetByName('기업회원');
  var data = sheet.getDataRange().getValues();
  
  writeLog('loginCompany', 'company', phone, 'DEBUG', '전체 데이터 행 수: ' + data.length);
  
  for (var i = 1; i < data.length; i++) {
    var rowPhone = data[i][6];  // G열: 전화번호 (인덱스 6)
    var rowPassword = data[i][8];  // I열: 비밀번호 (인덱스 8)
    
    // 디버깅: 현재 행의 전화번호와 비밀번호 로그
    writeLog('loginCompany', 'company', phone, 'DEBUG', 
      '행 ' + i + ': 전화=' + rowPhone + ', 비밀번호매칭=' + (String(rowPassword) === String(password)));
    
    if (isSamePhone(rowPhone, phone)) {
      writeLog('loginCompany', 'company', phone, 'DEBUG', 
        '전화번호 매칭 성공! 입력비밀번호=' + password + ', DB비밀번호=' + rowPassword);
      
      // 비밀번호 비교 (문자열로 변환 후 비교)
      if (String(rowPassword).trim() === String(password).trim()) {
        var approvalStatus = data[i][10] || '승인대기';  // K열: 승인여부 (인덱스 10)
        
        // 슈퍼 어드민 체크 (전화번호 01063529091)
        var isSuperAdmin = (normalizedPhone.replace(/[^0-9]/g, '') === '01063529091');
        
        if (approvalStatus !== '승인' && !isSuperAdmin) {
          writeLog('loginCompany', 'company', phone, 'FAIL', '승인 대기 중 (상태: ' + approvalStatus + ')');
          return { 
            success: false, 
            error: '관리자 승인 대기 중입니다. 승인 후 로그인 가능합니다.' 
          };
        }
        
        writeLog('loginCompany', 'company', phone, 'SUCCESS', '로그인 성공: ' + data[i][1] + (isSuperAdmin ? ' (슈퍼 어드민)' : ''));
        
        return {
          success: true,
          userData: {
            businessNumber: data[i][0] || '',  // A: 사업자번호 (인덱스 0)
            companyName: data[i][1],           // B: 회사명 (인덱스 1)
            ceoName: data[i][2] || '',         // C: 대표자명 (인덱스 2)
            companyType: data[i][3],           // D: 기업회원분류 (인덱스 3)
            position: data[i][4] || '',        // E: 직함 (인덱스 4)
            name: data[i][5],                  // F: 이름 (인덱스 5)
            phone: normalizedPhone.replace(/'/g, ''),
            email: data[i][7],                 // H: 이메일 (인덱스 7)
            isSuperAdmin: isSuperAdmin,
            userType: 'company'
          }
        };
      } else {
        writeLog('loginCompany', 'company', phone, 'FAIL', '비밀번호 불일치: 입력=' + password + ', DB=' + rowPassword);
      }
    }
  }
  
  writeLog('loginCompany', 'company', phone, 'FAIL', '전화번호 또는 비밀번호 불일치');
  return { success: false, error: '전화번호 또는 비밀번호가 일치하지 않습니다' };
}

/**
 * 매니저/컨설턴트 로그인
 * 시트 구조: B:전화번호 G:비밀번호 I:승인여부
 */
function loginConsultant(phone, password, userType) {
  writeLog('loginConsultant', userType, phone, 'START', '로그인 시도');
  
  var normalizedPhone = normalizePhone(phone);
  var sheetName = (userType === 'manager') ? '사근복매니저' : '사근복컨설턴트';
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][1], phone) && String(data[i][6]) === String(password)) {
      var approvalStatus = data[i][8] || '승인대기';
      
      if (approvalStatus !== '승인') {
        writeLog('loginConsultant', userType, phone, 'FAIL', '승인 대기 중');
        return { 
          success: false, 
          error: '관리자 승인 대기 중입니다. 승인 후 로그인 가능합니다.' 
        };
      }
      
      writeLog('loginConsultant', userType, phone, 'SUCCESS', '로그인 성공: ' + data[i][0]);
      
      return {
        success: true,
        userData: {
          name: data[i][0],                  // A: 이름
          phone: normalizedPhone.replace(/'/g, ''),
          email: data[i][2],                 // C: 이메일
          position: data[i][3],              // D: 직함
          region: data[i][4],                // E: 소속사업단
          userType: userType
        }
      };
    }
  }
  
  writeLog('loginConsultant', userType, phone, 'FAIL', '전화번호 또는 비밀번호 불일치');
  return { success: false, error: '전화번호 또는 비밀번호가 일치하지 않습니다' };
}

// ========================================
// 승인/반려 함수
// ========================================

/**
 * 회원 승인
 */
function approveMember(userType, phone) {
  writeLog('approveMember', userType, phone, 'START', '회원 승인 시도');
  
  var sheetName = '';
  var phoneColumn = 0;
  var approvalColumn = 0;
  var emailColumn = 0;
  var nameColumn = 0;
  
  if (userType === 'company') {
    sheetName = '기업회원';
    phoneColumn = 5;      // E열 (전화번호)
    approvalColumn = 9;   // I열 (승인여부)
    emailColumn = 6;      // F열 (이메일)
    nameColumn = 4;       // D열 (이름)
  } else if (userType === 'manager' || userType === 'consultant') {
    sheetName = (userType === 'manager') ? '사근복매니저' : '사근복컨설턴트';
    phoneColumn = 2;      // B열 (전화번호)
    approvalColumn = 9;   // I열 (승인여부)
    emailColumn = 3;      // C열 (이메일)
    nameColumn = 1;       // A열 (이름)
  }
  
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][phoneColumn - 1], phone)) {
      // 승인 상태 업데이트
      sheet.getRange(i + 1, approvalColumn).setValue('승인');
      
      writeLog('approveMember', userType, phone, 'SUCCESS', '회원 승인 완료: ' + data[i][nameColumn - 1]);
      
      // 이메일 발송
      try {
        var name = data[i][nameColumn - 1];
        var email = data[i][emailColumn - 1];
        sendApprovalEmail(userType, name, email, phone);
        writeLog('approveMember', userType, phone, 'EMAIL', '승인 이메일 발송 완료');
      } catch (e) {
        writeLog('approveMember', userType, phone, 'EMAIL_FAIL', '승인 이메일 실패: ' + e);
      }
      
      return { success: true, message: '승인이 완료되었습니다' };
    }
  }
  
  writeLog('approveMember', userType, phone, 'FAIL', '회원을 찾을 수 없음');
  return { success: false, error: '회원을 찾을 수 없습니다' };
}

/**
 * 회원 반려
 */
function rejectMember(userType, phone, reason) {
  writeLog('rejectMember', userType, phone, 'START', '회원 반려 시도: ' + reason);
  
  var sheetName = '';
  var phoneColumn = 0;
  var approvalColumn = 0;
  var emailColumn = 0;
  var nameColumn = 0;
  
  if (userType === 'company') {
    sheetName = '기업회원';
    phoneColumn = 5;
    approvalColumn = 9;
    emailColumn = 6;
    nameColumn = 4;
  } else if (userType === 'manager' || userType === 'consultant') {
    sheetName = (userType === 'manager') ? '사근복매니저' : '사근복컨설턴트';
    phoneColumn = 2;
    approvalColumn = 9;
    emailColumn = 3;
    nameColumn = 1;
  }
  
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][phoneColumn - 1], phone)) {
      // 반려 상태 업데이트
      sheet.getRange(i + 1, approvalColumn).setValue('거부');
      
      writeLog('rejectMember', userType, phone, 'SUCCESS', '회원 반려 완료: ' + data[i][nameColumn - 1]);
      
      // 이메일 발송
      try {
        var name = data[i][nameColumn - 1];
        var email = data[i][emailColumn - 1];
        sendRejectionEmail(userType, name, email, reason);
        writeLog('rejectMember', userType, phone, 'EMAIL', '반려 이메일 발송 완료');
      } catch (e) {
        writeLog('rejectMember', userType, phone, 'EMAIL_FAIL', '반려 이메일 실패: ' + e);
      }
      
      return { success: true, message: '반려 처리되었습니다' };
    }
  }
  
  writeLog('rejectMember', userType, phone, 'FAIL', '회원을 찾을 수 없음');
  return { success: false, error: '회원을 찾을 수 없습니다' };
}

// ========================================
// getAllMembers (AdminView용)
// ========================================

/**
 * 모든 회원 조회
 */
function getAllMembers() {
  writeLog('getAllMembers', 'system', '', 'START', '회원 목록 조회');
  
  var members = [];
  
  // 기업회원
  var companySheet = ss.getSheetByName('기업회원');
  var companyData = companySheet.getDataRange().getValues();
  for (var i = 1; i < companyData.length; i++) {
    members.push({
      userType: 'company',
      name: companyData[i][3],           // D: 이름
      phone: companyData[i][4],          // E: 전화번호
      email: companyData[i][5],          // F: 이메일
      companyName: companyData[i][0],    // A: 회사명
      referrer: companyData[i][2],       // C: 추천인
      approvalStatus: companyData[i][8] || '승인대기', // I: 승인여부
      registeredAt: companyData[i][7]    // H: 가입일
    });
  }
  
  // 매니저
  var managerSheet = ss.getSheetByName('사근복매니저');
  var managerData = managerSheet.getDataRange().getValues();
  for (var i = 1; i < managerData.length; i++) {
    members.push({
      userType: 'manager',
      name: managerData[i][0],           // A: 이름
      phone: managerData[i][1],          // B: 전화번호
      email: managerData[i][2],          // C: 이메일
      region: managerData[i][4],         // E: 소속사업단
      referrer: managerData[i][9] || '', // J: 추천인
      approvalStatus: managerData[i][8] || '승인대기', // I: 승인여부
      registeredAt: managerData[i][7]    // H: 가입일
    });
  }
  
  // 컨설턴트
  var consultantSheet = ss.getSheetByName('사근복컨설턴트');
  var consultantData = consultantSheet.getDataRange().getValues();
  for (var i = 1; i < consultantData.length; i++) {
    members.push({
      userType: 'consultant',
      name: consultantData[i][0],        // A: 이름
      phone: consultantData[i][1],       // B: 전화번호
      email: consultantData[i][2],       // C: 이메일
      region: consultantData[i][4],      // E: 소속사업단
      referrer: consultantData[i][9] || '', // J: 추천인
      approvalStatus: consultantData[i][8] || '승인대기', // I: 승인여부
      registeredAt: consultantData[i][7] // H: 가입일
    });
  }
  
  writeLog('getAllMembers', 'system', '', 'SUCCESS', '회원 목록 조회 완료: ' + members.length + '명');
  
  return { success: true, members: members };
}

// ========================================
// 사업자등록번호 조회 (국세청 API) - v7.3.0
// ========================================

/**
 * 국세청 사업자등록번호 조회
 * @param {string} businessNumber - 10자리 사업자등록번호
 * @returns {Object} { success, companyName, status, data }
 */
function lookupBusinessNumber(businessNumber) {
  writeLog('lookupBusinessNumber', 'system', '', 'START', '사업자번호 조회: ' + businessNumber);
  
  if (!businessNumber || String(businessNumber).length !== 10) {
    writeLog('lookupBusinessNumber', 'system', '', 'FAIL', '잘못된 사업자번호 형식');
    return { 
      success: false, 
      message: '사업자등록번호는 10자리 숫자여야 합니다.' 
    };
  }
  
  try {
    // 국세청 API 호출
    var url = CONFIG.NTS_API_URL + 
              '?serviceKey=' + CONFIG.NTS_API_KEY + 
              '&b_no=' + businessNumber;
    
    writeLog('lookupBusinessNumber', 'system', '', 'DEBUG', 'API URL: ' + url.substring(0, 100));
    
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });
    
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    writeLog('lookupBusinessNumber', 'system', '', 'DEBUG', 
      'API 응답 코드: ' + responseCode + ', 응답 길이: ' + responseText.length);
    
    if (responseCode !== 200) {
      writeLog('lookupBusinessNumber', 'system', '', 'FAIL', 'API 호출 실패: ' + responseCode);
      return { 
        success: false, 
        message: '사업자등록번호 조회 API 호출에 실패했습니다. (코드: ' + responseCode + ')' 
      };
    }
    
    var result = JSON.parse(responseText);
    
    // API 응답 구조 확인
    if (!result.data || result.data.length === 0) {
      writeLog('lookupBusinessNumber', 'system', '', 'FAIL', '조회 결과 없음');
      return { 
        success: false, 
        message: '해당 사업자등록번호를 찾을 수 없습니다.' 
      };
    }
    
    var businessData = result.data[0];
    
    // 사업자 상태 확인
    var status = businessData.b_stt || '알 수 없음';
    var statusCode = businessData.b_stt_cd || '';
    
    writeLog('lookupBusinessNumber', 'system', '', 'SUCCESS', 
      '조회 성공: 상태=' + status + ', 코드=' + statusCode);
    
    // 회사명은 Google Sheets의 기업회원 데이터에서 찾기
    var companyName = findCompanyNameByBusinessNumber(businessNumber);
    
    if (!companyName) {
      companyName = '회사명 정보 없음 (사업자번호는 유효함)';
    }
    
    return {
      success: true,
      message: '사업자등록번호 조회 완료',
      businessNumber: businessNumber,
      companyName: companyName,
      status: status,
      statusCode: statusCode,
      taxType: businessData.tax_type || '',
      data: businessData
    };
    
  } catch (error) {
    writeLog('lookupBusinessNumber', 'system', '', 'ERROR', 'Exception: ' + error.toString());
    return { 
      success: false, 
      message: '사업자등록번호 조회 중 오류가 발생했습니다: ' + error.toString() 
    };
  }
}

/**
 * Google Sheets에서 사업자번호로 회사명 찾기
 */
function findCompanyNameByBusinessNumber(businessNumber) {
  try {
    var sheet = ss.getSheetByName('기업회원');
    if (!sheet) return '';
    
    var data = sheet.getDataRange().getValues();
    
    // A열: 사업자번호, B열: 회사명
    for (var i = 1; i < data.length; i++) {
      var sheetBusinessNumber = String(data[i][0]).replace(/\D/g, '');
      var cleanBusinessNumber = String(businessNumber).replace(/\D/g, '');
      
      if (sheetBusinessNumber === cleanBusinessNumber) {
        return data[i][1]; // 회사명 반환
      }
    }
    
    return ''; // 찾지 못함
  } catch (error) {
    Logger.log('findCompanyNameByBusinessNumber error: ' + error);
    return '';
  }
}

// ========================================
// 사람인 구직 정보 분석 (구현 예정) - v7.3.0
// ========================================

/**
 * 사람인 구직 정보 분석
 * @param {string} companyName - 회사명
 * @returns {Object} { success, message, data }
 */
function analyzeJobSites(companyName) {
  writeLog('analyzeJobSites', 'system', '', 'START', '사람인 분석: ' + companyName);
  
  if (!companyName || !companyName.trim()) {
    return { 
      success: false, 
      message: '회사명을 입력해주세요.' 
    };
  }
  
  try {
    // TODO: 실제 사람인 API 연동 또는 크롤링 구현
    // 현재는 더미 데이터 반환
    
    writeLog('analyzeJobSites', 'system', '', 'SUCCESS', '사람인 분석 완료 (더미 데이터)');
    
    return {
      success: true,
      message: '사람인 분석이 완료되었습니다. (현재 개발 중 - 더미 데이터)',
      companyName: companyName,
      data: {
        status: 'under_development',
        note: '사람인 API 연동은 현재 개발 중입니다.',
        placeholder: {
          jobPostings: 0,
          averageSalary: '정보 없음',
          benefits: ['개발 중'],
          employeeReviews: []
        }
      }
    };
    
  } catch (error) {
    writeLog('analyzeJobSites', 'system', '', 'ERROR', 'Exception: ' + error.toString());
    return { 
      success: false, 
      message: '사람인 분석 중 오류가 발생했습니다: ' + error.toString() 
    };
  }
}

// ========================================
// 블라인드 리뷰 분석 (구현 예정) - v7.3.0
// ========================================

/**
 * 블라인드 리뷰 분석
 * @param {string} companyName - 회사명
 * @returns {Object} { success, message, data }
 */
function analyzeReviewSites(companyName) {
  writeLog('analyzeReviewSites', 'system', '', 'START', '블라인드 분석: ' + companyName);
  
  if (!companyName || !companyName.trim()) {
    return { 
      success: false, 
      message: '회사명을 입력해주세요.' 
    };
  }
  
  try {
    // TODO: 실제 블라인드 API 연동 또는 크롤링 구현
    // 현재는 더미 데이터 반환
    
    writeLog('analyzeReviewSites', 'system', '', 'SUCCESS', '블라인드 분석 완료 (더미 데이터)');
    
    return{
      success: true,
      message: '블라인드 분석이 완료되었습니다. (현재 개발 중 - 더미 데이터)',
      companyName: companyName,
      data: {
        status: 'under_development',
        note: '블라인드 API 연동은 현재 개발 중입니다.',
        placeholder: {
          totalReviews: 0,
          averageRating: 0,
          pros: ['개발 중'],
          cons: ['개발 중'],
          workLifeBalance: 0,
          culture: 0,
          salary: 0
        }
      }
    };
    
  } catch (error) {
    writeLog('analyzeReviewSites', 'system', '', 'ERROR', 'Exception: ' + error.toString());
    return { 
      success: false, 
      message: '블라인드 분석 중 오류가 발생했습니다: ' + error.toString() 
    };
  }
}

// ========================================
// doGet - 메인 핸들러 (v7.2.3 수정)
// ========================================

/**
 * POST 요청 처리
 */
function doPost(e) {
  return doGet(e);
}

/**
 * GET 요청 처리
 * v7.2.3: null 체크 추가
 */
function doGet(e) {
  // 🚨 긴급 핫픽스: e 또는 e.parameter가 없는 경우 에러 처리
  if (!e || !e.parameter) {
    Logger.log('doGet 호출 오류: e 또는 e.parameter가 없음');
    return createResponse({ 
      success: false, 
      error: 'Invalid request: missing parameters' 
    });
  }
  
  var action = e.parameter.action;
  
  // 🚨 긴급 핫픽스: action 파라미터 null 체크
  if (!action) {
    Logger.log('doGet 호출 오류: action 파라미터가 없음');
    return createResponse({ 
      success: false, 
      error: 'Invalid request: missing action parameter' 
    });
  }
  
  try {
    // 🆕 사업자등록번호 조회 (v7.3.0)
    if (action === 'lookupBusinessNumber') {
      return createResponse(lookupBusinessNumber(e.parameter.businessNumber));
    }
    
    // 🆕 사람인 분석 (v7.3.0)
    if (action === 'analyzeJobSites') {
      return createResponse(analyzeJobSites(e.parameter.companyName));
    }
    
    // 🆕 블라인드 분석 (v7.3.0)
    if (action === 'analyzeReviewSites') {
      return createResponse(analyzeReviewSites(e.parameter.companyName));
    }
    
    // 회원가입
    if (action === 'registerCompany') {
      return createResponse(registerCompany(e.parameter));
    }
    if (action === 'registerManager') {
      return createResponse(registerManager(e.parameter));
    }
    if (action === 'registerConsultant') {
      return createResponse(registerConsultant(e.parameter));
    }
    
    // 로그인
    if (action === 'loginCompany') {
      return createResponse(loginCompany(e.parameter.phone, e.parameter.password));
    }
    if (action === 'loginConsultant') {
      return createResponse(loginConsultant(e.parameter.phone, e.parameter.password, e.parameter.userType));
    }
    
    // 승인/반려
    if (action === 'approveMember') {
      return createResponse(approveMember(e.parameter.userType, e.parameter.phone));
    }
    if (action === 'rejectMember') {
      return createResponse(rejectMember(e.parameter.userType, e.parameter.phone, e.parameter.reason));
    }
    
    // 회원 목록
    if (action === 'getAllMembers') {
      return createResponse(getAllMembers());
    }
    
    // 알 수 없는 액션
    writeLog('doGet', 'system', '', 'ERROR', '알 수 없는 액션: ' + action);
    return createResponse({ 
      success: false, 
      error: 'Unknown action: ' + action 
    });
    
  } catch (error) {
    // 🚨 긴급 핫픽스: 에러 핸들링 강화
    Logger.log('doGet error: ' + error.toString());
    writeLog('doGet', 'system', '', 'ERROR', 'Exception: ' + error.toString());
    return createResponse({ 
      success: false, 
      error: 'Server error: ' + error.toString() 
    });
  }
}

/**
 * 응답 생성 (v7.3.0: CORS 헤더 추가)
 */
function createResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // CORS 허용
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  return output;
}
