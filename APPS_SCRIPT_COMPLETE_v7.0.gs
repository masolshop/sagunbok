/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 7.0 COMPLETE - 전화번호 정규화 + 승인제 + 이메일 + doGet 포함
 * 
 * 업데이트 내용:
 * 1. 전화번호 정규화 함수 (normalizePhone)
 * 2. 추천인 전화번호 매칭
 * 3. 사업단 필드 추가 (region)
 * 4. approvalStatus 필드 추가
 * 5. 이메일 알림 시스템 (HTML)
 * 6. approveMember/rejectMember 함수
 * 7. doGet() 메인 핸들러
 */

// ========================================
// 설정
// ========================================

var CONFIG = {
  SPREADSHEET_ID: '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc',
  ADMIN_EMAIL: 'tysagunbok@gmail.com',
  COMPANY_NAME: 'AI사근복닷컴',
  COMPANY_URL: 'https://sagunbok.com'
};

var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

// ========================================
// 전화번호 정규화 함수
// ========================================

/**
 * 전화번호를 01012345678 형식으로 정규화
 */
function normalizePhone(phone) {
  if (!phone) return '';
  
  // 문자열로 변환
  var cleaned = String(phone).replace(/[-\s()]/g, '');
  
  // 숫자만 남김
  cleaned = cleaned.replace(/\D/g, '');
  
  // 작은따옴표 제거
  cleaned = cleaned.replace(/'/g, '');
  
  // 10자리인 경우 0 추가
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  // 11자리 검증
  if (cleaned.length !== 11 || !cleaned.startsWith('0')) {
    return '';
  }
  
  // 작은따옴표 추가 (시트 저장용)
  return "'" + cleaned;
}

/**
 * 두 전화번호 비교
 */
function isSamePhone(phone1, phone2) {
  var n1 = normalizePhone(phone1).replace(/'/g, '');
  var n2 = normalizePhone(phone2).replace(/'/g, '');
  return n1 === n2;
}

// ========================================
// 이메일 발송 함수
// ========================================

/**
 * 승인 완료 이메일 (HTML)
 */
function sendApprovalEmail(userType, name, email, phone) {
  var subject = '[AI사근복닷컴] 🎉 회원 승인이 완료되었습니다!';
  
  var typeLabel = userType === 'company' ? '기업회원' : 
                  userType === 'manager' ? '사근복매니저' : '사근복컨설턴트';
  
  var htmlBody = '<!DOCTYPE html>' +
    '<html><head><style>' +
    'body { font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; }' +
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
    '<div class="footer">' +
    '<p>' + CONFIG.COMPANY_NAME + '<br>문의: 010-6352-9091</p>' +
    '</div>' +
    '</div></body></html>';
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * 반려 이메일 (HTML)
 */
function sendRejectionEmail(userType, name, email, reason) {
  var subject = '[AI사근복닷컴] 회원 승인이 보류되었습니다';
  
  var typeLabel = userType === 'company' ? '기업회원' : 
                  userType === 'manager' ? '사근복매니저' : '사근복컨설턴트';
  
  var htmlBody = '<!DOCTYPE html>' +
    '<html><head><style>' +
    'body { font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; }' +
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
    '<div class="footer">' +
    '<p>' + CONFIG.COMPANY_NAME + '</p>' +
    '</div>' +
    '</div></body></html>';
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * 관리자 알림 이메일
 */
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
 */
function registerCompany(data) {
  var sheet = ss.getSheetByName('기업회원');
  
  var normalizedPhone = normalizePhone(data.phone);
  var normalizedReferrer = normalizePhone(data.referrer);
  
  if (!normalizedPhone) {
    return { success: false, error: '잘못된 전화번호 형식입니다' };
  }
  
  // 중복 체크
  var dataRange = sheet.getDataRange().getValues();
  for (var i = 1; i < dataRange.length; i++) {
    if (isSamePhone(dataRange[i][2], data.phone)) {
      return { success: false, error: '이미 등록된 전화번호입니다' };
    }
  }
  
  // 추천인 검증
  if (!normalizedReferrer) {
    return { success: false, error: '추천인 전화번호를 입력해주세요' };
  }
  
  var referrerExists = false;
  var managerSheet = ss.getSheetByName('사근복매니저');
  var consultantSheet = ss.getSheetByName('사근복컨설턴트');
  
  var managers = managerSheet.getDataRange().getValues();
  for (var i = 1; i < managers.length; i++) {
    if (isSamePhone(managers[i][1], data.referrer)) {
      referrerExists = true;
      break;
    }
  }
  
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
    return { success: false, error: '등록되지 않은 추천인 전화번호입니다' };
  }
  
  // 데이터 추가
  sheet.appendRow([
    new Date().toLocaleString('ko-KR'),
    data.companyName,
    normalizedPhone,
    data.password,
    data.name,
    data.email,
    data.companyType,
    normalizedReferrer,
    'pending'
  ]);
  
  // 관리자 알림
  try {
    sendAdminNotification('company', data.companyName, data.phone);
  } catch (e) {
    Logger.log('Admin email failed: ' + e);
  }
  
  return { 
    success: true, 
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' 
  };
}

/**
 * 매니저 가입
 */
function registerManager(data) {
  var sheet = ss.getSheetByName('사근복매니저');
  
  var normalizedPhone = normalizePhone(data.phone);
  var normalizedReferrer = normalizePhone(data.referrer);
  
  if (!normalizedPhone) {
    return { success: false, error: '잘못된 전화번호 형식입니다' };
  }
  
  // 중복 체크
  var dataRange = sheet.getDataRange().getValues();
  for (var i = 1; i < dataRange.length; i++) {
    if (isSamePhone(dataRange[i][1], data.phone)) {
      return { success: false, error: '이미 등록된 전화번호입니다' };
    }
  }
  
  // 추천인 검증
  if (!normalizedReferrer) {
    return { success: false, error: '추천인 전화번호를 입력해주세요' };
  }
  
  // 데이터 추가
  sheet.appendRow([
    data.name,
    normalizedPhone,
    data.password,
    data.email,
    data.position,
    data.region,
    normalizedReferrer,
    'pending',
    new Date().toLocaleString('ko-KR')
  ]);
  
  // 관리자 알림
  try {
    sendAdminNotification('manager', data.name, data.phone);
  } catch (e) {
    Logger.log('Admin email failed: ' + e);
  }
  
  return { 
    success: true, 
    message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' 
  };
}

/**
 * 컨설턴트 가입
 */
function registerConsultant(data) {
  var sheet = ss.getSheetByName('사근복컨설턴트');
  
  var normalizedPhone = normalizePhone(data.phone);
  var normalizedReferrer = normalizePhone(data.referrer);
  
  if (!normalizedPhone) {
    return { success: false, error: '잘못된 전화번호 형식입니다' };
  }
  
  // 중복 체크
  var dataRange = sheet.getDataRange().getValues();
  for (var i = 1; i < dataRange.length; i++) {
    if (isSamePhone(dataRange[i][1], data.phone)) {
      return { success: false, error: '이미 등록된 전화번호입니다' };
    }
  }
  
  // 추천인 검증
  if (!normalizedReferrer) {
    return { success: false, error: '추천인 전화번호를 입력해주세요' };
  }
  
  // 데이터 추가
  sheet.appendRow([
    data.name,
    normalizedPhone,
    data.password,
    data.email,
    data.position,
    data.region,
    normalizedReferrer,
    'pending',
    new Date().toLocaleString('ko-KR')
  ]);
  
  // 관리자 알림
  try {
    sendAdminNotification('consultant', data.name, data.phone);
  } catch (e) {
    Logger.log('Admin email failed: ' + e);
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
 */
function loginCompany(phone, password) {
  var normalizedPhone = normalizePhone(phone);
  var sheet = ss.getSheetByName('기업회원');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][2], phone) && data[i][3] === password) {
      var approvalStatus = data[i][8] || 'pending';
      
      if (approvalStatus !== 'approved') {
        return { 
          success: false, 
          error: '관리자 승인 대기 중입니다. 승인 후 로그인 가능합니다.' 
        };
      }
      
      return {
        success: true,
        userData: {
          companyName: data[i][1],
          phone: normalizedPhone.replace(/'/g, ''),
          name: data[i][4],
          email: data[i][5],
          companyType: data[i][6],
          userType: 'company'
        }
      };
    }
  }
  
  return { success: false, error: '전화번호 또는 비밀번호가 일치하지 않습니다' };
}

/**
 * 매니저/컨설턴트 로그인
 */
function loginConsultant(phone, password, userType) {
  var normalizedPhone = normalizePhone(phone);
  var sheetName = (userType === 'manager') ? '사근복매니저' : '사근복컨설턴트';
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][1], phone) && data[i][2] === password) {
      var approvalStatus = data[i][7] || 'pending';
      
      if (approvalStatus !== 'approved') {
        return { 
          success: false, 
          error: '관리자 승인 대기 중입니다. 승인 후 로그인 가능합니다.' 
        };
      }
      
      return {
        success: true,
        userData: {
          name: data[i][0],
          phone: normalizedPhone.replace(/'/g, ''),
          email: data[i][3],
          position: data[i][4],
          region: data[i][5],
          userType: userType
        }
      };
    }
  }
  
  return { success: false, error: '전화번호 또는 비밀번호가 일치하지 않습니다' };
}

// ========================================
// 승인/반려 함수
// ========================================

/**
 * 회원 승인
 */
function approveMember(userType, phone) {
  var sheetName = '';
  var approvalColumn = 0;
  var emailColumn = 0;
  var nameColumn = 0;
  var phoneColumn = 0;
  
  if (userType === 'company') {
    sheetName = '기업회원';
    phoneColumn = 3; // C열
    approvalColumn = 9; // I열
    emailColumn = 6; // F열
    nameColumn = 2; // B열 (회사명)
  } else if (userType === 'manager') {
    sheetName = '사근복매니저';
    phoneColumn = 2; // B열
    approvalColumn = 8; // H열
    emailColumn = 4; // D열
    nameColumn = 1; // A열
  } else if (userType === 'consultant') {
    sheetName = '사근복컨설턴트';
    phoneColumn = 2; // B열
    approvalColumn = 8; // H열
    emailColumn = 4; // D열
    nameColumn = 1; // A열
  }
  
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][phoneColumn - 1], phone)) {
      // 승인 상태 업데이트
      sheet.getRange(i + 1, approvalColumn).setValue('approved');
      
      // 이메일 발송
      try {
        var name = data[i][nameColumn - 1];
        var email = data[i][emailColumn - 1];
        sendApprovalEmail(userType, name, email, phone);
      } catch (e) {
        Logger.log('Email failed: ' + e);
      }
      
      return { success: true, message: '승인이 완료되었습니다' };
    }
  }
  
  return { success: false, error: '회원을 찾을 수 없습니다' };
}

/**
 * 회원 반려
 */
function rejectMember(userType, phone, reason) {
  var sheetName = '';
  var approvalColumn = 0;
  var emailColumn = 0;
  var nameColumn = 0;
  var phoneColumn = 0;
  
  if (userType === 'company') {
    sheetName = '기업회원';
    phoneColumn = 3;
    approvalColumn = 9;
    emailColumn = 6;
    nameColumn = 2;
  } else if (userType === 'manager') {
    sheetName = '사근복매니저';
    phoneColumn = 2;
    approvalColumn = 8;
    emailColumn = 4;
    nameColumn = 1;
  } else if (userType === 'consultant') {
    sheetName = '사근복컨설턴트';
    phoneColumn = 2;
    approvalColumn = 8;
    emailColumn = 4;
    nameColumn = 1;
  }
  
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][phoneColumn - 1], phone)) {
      // 반려 상태 업데이트
      sheet.getRange(i + 1, approvalColumn).setValue('rejected');
      
      // 이메일 발송
      try {
        var name = data[i][nameColumn - 1];
        var email = data[i][emailColumn - 1];
        sendRejectionEmail(userType, name, email, reason);
      } catch (e) {
        Logger.log('Email failed: ' + e);
      }
      
      return { success: true, message: '반려 처리되었습니다' };
    }
  }
  
  return { success: false, error: '회원을 찾을 수 없습니다' };
}

// ========================================
// getAllMembers (AdminView용)
// ========================================

/**
 * 모든 회원 조회
 */
function getAllMembers() {
  var members = [];
  
  // 기업회원
  var companySheet = ss.getSheetByName('기업회원');
  var companyData = companySheet.getDataRange().getValues();
  for (var i = 1; i < companyData.length; i++) {
    members.push({
      userType: 'company',
      name: companyData[i][4], // 대표자명
      phone: companyData[i][2],
      email: companyData[i][5],
      companyName: companyData[i][1],
      referrer: companyData[i][7],
      approvalStatus: companyData[i][8] || 'pending',
      registeredAt: companyData[i][0]
    });
  }
  
  // 매니저
  var managerSheet = ss.getSheetByName('사근복매니저');
  var managerData = managerSheet.getDataRange().getValues();
  for (var i = 1; i < managerData.length; i++) {
    members.push({
      userType: 'manager',
      name: managerData[i][0],
      phone: managerData[i][1],
      email: managerData[i][3],
      region: managerData[i][5],
      referrer: managerData[i][6],
      approvalStatus: managerData[i][7] || 'pending',
      registeredAt: managerData[i][8]
    });
  }
  
  // 컨설턴트
  var consultantSheet = ss.getSheetByName('사근복컨설턴트');
  var consultantData = consultantSheet.getDataRange().getValues();
  for (var i = 1; i < consultantData.length; i++) {
    members.push({
      userType: 'consultant',
      name: consultantData[i][0],
      phone: consultantData[i][1],
      email: consultantData[i][3],
      region: consultantData[i][5],
      referrer: consultantData[i][6],
      approvalStatus: consultantData[i][7] || 'pending',
      registeredAt: consultantData[i][8]
    });
  }
  
  return { success: true, members: members };
}

// ========================================
// doGet - 메인 핸들러
// ========================================

function doGet(e) {
  var action = e.parameter.action;
  
  try {
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
    
    return createResponse({ success: false, error: '알 수 없는 액션입니다' });
    
  } catch (error) {
    Logger.log('Error: ' + error);
    return createResponse({ success: false, error: error.toString() });
  }
}

function createResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
