/**
 * Apps Script 업데이트 코드 (v7.0 - 전화번호 정규화 + 승인제 + 이메일)
 * 
 * 아빠가 구글 시트 Apps Script 에디터에 복사-붙여넣기 해주세요!
 * 
 * 업데이트 내용:
 * 1. 전화번호 정규화 함수 추가
 * 2. 추천인 전화번호 매칭
 * 3. 사업단 필드 추가
 * 4. approvalStatus 필드 추가
 * 5. 이메일 알림 시스템
 */

// ===============================
// 1. 전화번호 정규화 함수
// ===============================

/**
 * 전화번호를 01012345678 형식으로 정규화
 */
function normalizePhone(phone) {
  if (!phone) return '';
  
  // 문자열로 변환
  var cleaned = String(phone).replace(/[-\s()]/g, '');
  
  // 숫자만 남김
  cleaned = cleaned.replace(/\D/g, '');
  
  // 작은따옴표 제거 (시트에서 텍스트로 저장된 경우)
  cleaned = cleaned.replace(/'/g, '');
  
  // 10자리인 경우 (앞의 0이 없는 경우) 0 추가
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  // 11자리 검증
  if (cleaned.length !== 11 || !cleaned.startsWith('0')) {
    return '';
  }
  
  // 작은따옴표 추가 (시트에 텍스트로 저장)
  return "'" + cleaned;
}

/**
 * 두 전화번호가 동일한지 비교
 */
function isSamePhone(phone1, phone2) {
  var normalized1 = normalizePhone(phone1).replace(/'/g, '');
  var normalized2 = normalizePhone(phone2).replace(/'/g, '');
  return normalized1 === normalized2;
}

// ===============================
// 2. 이메일 발송 함수
// ===============================

/**
 * HTML 승인 완료 이메일 발송
 */
function sendApprovalEmail(userType, name, email, phone) {
  var subject = '[AI사근복닷컴] 🎉 회원 승인이 완료되었습니다!';
  
  var typeLabel = '';
  if (userType === 'company') typeLabel = '기업회원';
  else if (userType === 'manager') typeLabel = '사근복매니저';
  else if (userType === 'consultant') typeLabel = '사근복컨설턴트';
  
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
    '<a href="https://sagunbok.com" class="button">지금 로그인하기</a>' +
    '</p>' +
    '<p>궁금하신 점이 있으시면 언제든 문의해주세요.</p>' +
    '</div>' +
    '<div class="footer">' +
    '<p>AI사근복닷컴<br>문의: 010-6352-9091</p>' +
    '</div>' +
    '</div></body></html>';
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * HTML 반려 이메일 발송
 */
function sendRejectionEmail(userType, name, email, reason) {
  var subject = '[AI사근복닷컴] 회원 승인이 보류되었습니다';
  
  var typeLabel = '';
  if (userType === 'company') typeLabel = '기업회원';
  else if (userType === 'manager') typeLabel = '사근복매니저';
  else if (userType === 'consultant') typeLabel = '사근복컨설턴트';
  
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
    '<p>AI사근복닷컴</p>' +
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
  var adminEmail = 'tysagunbok@gmail.com';
  var subject = '[AI사근복닷컴] ⚠️ 새로운 회원 승인 요청';
  
  var typeLabel = '';
  if (userType === 'company') typeLabel = '기업회원';
  else if (userType === 'manager') typeLabel = '사근복매니저';
  else if (userType === 'consultant') typeLabel = '사근복컨설턴트';
  
  var body = '관리자님,\n\n' +
    '새로운 ' + typeLabel + '이 가입을 신청했습니다.\n\n' +
    '• 이름/회사명: ' + name + '\n' +
    '• 전화번호: ' + phone + '\n' +
    '• 신청 시간: ' + new Date().toLocaleString('ko-KR') + '\n\n' +
    '👉 승인 처리: https://sagunbok.com\n' +
    '(로그인 → ADMIN DASHBOARD → 승인 대기 목록)\n\n' +
    'AI사근복닷컴 시스템';
  
  MailApp.sendEmail(adminEmail, subject, body);
}

// ===============================
// 3. 회원가입 함수 (업데이트)
// ===============================

/**
 * 기업회원 가입 (업데이트)
 */
function registerCompany(data) {
  var sheet = ss.getSheetByName('기업회원');
  
  // 전화번호 정규화
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
  
  // 추천인 검증 (필수)
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
    'pending' // approvalStatus
  ]);
  
  // 관리자 알림 발송
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
 * 매니저 가입 (업데이트)
 */
function registerManager(data) {
  var sheet = ss.getSheetByName('사근복매니저');
  
  // 전화번호 정규화
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
  
  // 추천인 검증 (필수)
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
    data.region, // 사업단
    normalizedReferrer,
    'pending', // approvalStatus
    new Date().toLocaleString('ko-KR')
  ]);
  
  // 관리자 알림 발송
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
 * 컨설턴트 가입 (업데이트)
 */
function registerConsultant(data) {
  var sheet = ss.getSheetByName('사근복컨설턴트');
  
  // 전화번호 정규화
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
  
  // 추천인 검증 (필수)
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
    data.region, // 사업단
    normalizedReferrer,
    'pending', // approvalStatus
    new Date().toLocaleString('ko-KR')
  ]);
  
  // 관리자 알림 발송
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

// ===============================
// 4. 로그인 함수 (업데이트)
// ===============================

/**
 * 기업회원 로그인 (승인 체크 추가)
 */
function loginCompany(phone, password) {
  var normalizedPhone = normalizePhone(phone);
  var sheet = ss.getSheetByName('기업회원');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][2], phone) && data[i][3] === password) {
      // approvalStatus 체크
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
          companyType: data[i][6]
        }
      };
    }
  }
  
  return { success: false, error: '전화번호 또는 비밀번호가 일치하지 않습니다' };
}

/**
 * 매니저/컨설턴트 로그인 (승인 체크 추가)
 */
function loginConsultant(phone, password, userType) {
  var normalizedPhone = normalizePhone(phone);
  var sheetName = (userType === 'manager') ? '사근복매니저' : '사근복컨설턴트';
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][1], phone) && data[i][2] === password) {
      // approvalStatus 체크
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
          region: data[i][5]
        }
      };
    }
  }
  
  return { success: false, error: '전화번호 또는 비밀번호가 일치하지 않습니다' };
}

// ===============================
// 5. 승인 함수 (새로 추가)
// ===============================

/**
 * 회원 승인
 */
function approveMember(userType, phone) {
  var sheetName = '';
  var approvalColumn = 0;
  var emailColumn = 0;
  var nameColumn = 0;
  
  if (userType === 'company') {
    sheetName = '기업회원';
    approvalColumn = 9; // I열
    emailColumn = 6; // F열
    nameColumn = 2; // B열
  } else if (userType === 'manager') {
    sheetName = '사근복매니저';
    approvalColumn = 8; // H열
    emailColumn = 4; // D열
    nameColumn = 1; // A열
  } else if (userType === 'consultant') {
    sheetName = '사근복컨설턴트';
    approvalColumn = 8; // H열
    emailColumn = 4; // D열
    nameColumn = 1; // A열
  }
  
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  var normalizedPhone = normalizePhone(phone);
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][2] || data[i][1], phone)) {
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
  
  if (userType === 'company') {
    sheetName = '기업회원';
    approvalColumn = 9;
    emailColumn = 6;
    nameColumn = 2;
  } else if (userType === 'manager') {
    sheetName = '사근복매니저';
    approvalColumn = 8;
    emailColumn = 4;
    nameColumn = 1;
  } else if (userType === 'consultant') {
    sheetName = '사근복컨설턴트';
    approvalColumn = 8;
    emailColumn = 4;
    nameColumn = 1;
  }
  
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  var normalizedPhone = normalizePhone(phone);
  
  for (var i = 1; i < data.length; i++) {
    if (isSamePhone(data[i][2] || data[i][1], phone)) {
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

// ===============================
// 6. 시트 컬럼 추가 가이드
// ===============================

/**
 * 시트 구조 업데이트 필요:
 * 
 * [기업회원] 시트:
 * A: 가입일시
 * B: 회사명
 * C: 전화번호
 * D: 비밀번호
 * E: 대표자명
 * F: 이메일 (NEW!)
 * G: 기업분류
 * H: 추천인 (전화번호로 변경!)
 * I: approvalStatus (NEW! - pending/approved/rejected)
 * 
 * [사근복매니저] 시트:
 * A: 이름
 * B: 전화번호
 * C: 비밀번호
 * D: 이메일 (NEW!)
 * E: 직함
 * F: 사업단 (NEW! - region)
 * G: 추천인 (NEW! - 전화번호)
 * H: approvalStatus (NEW!)
 * I: 가입일시
 * 
 * [사근복컨설턴트] 시트:
 * A: 이름
 * B: 전화번호
 * C: 비밀번호
 * D: 이메일 (NEW!)
 * E: 직함
 * F: 사업단 (NEW! - region)
 * G: 추천인 (NEW! - 전화번호)
 * H: approvalStatus (NEW!)
 * I: 가입일시
 */
