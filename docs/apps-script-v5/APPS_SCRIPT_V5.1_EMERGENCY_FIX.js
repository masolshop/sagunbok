/**
 * ============================================================
 * Sagunbok Apps Script - VERSION 5.1 (EMERGENCY FIX)
 * 작성일: 2026-01-21
 * 수정일: 2026-01-21 15:00 (긴급 수정 - 4가지 문제 해결)
 * ============================================================
 * 
 * 🚨 긴급 수정 내역:
 * 1. ✅ 시트 열 순서 불일치 해결 - 데이터가 올바른 열에 저장되도록 수정
 * 2. ✅ 전화번호 앞자리 0 손실 해결 - 문자열로 명시적 변환 ('010-1234-5678')
 * 3. ✅ 기업유형과 추천인 누락 해결 - appendRow 순서 재확인
 * 4. ✅ 추천인 검증 강화 - 사근복컨설턴트 시트 체크 후 가입 차단
 * 
 * ============================================================
 * 📊 Google Sheets 구조 (실제 시트 기준)
 * ============================================================
 * 
 * [기업회원] 시트:
 *   A: 핸드폰번호 (010-1234-5678 형식) ← 문자열로 저장!
 *   B: 회사명
 *   C: 기업유형 (개인사업자/법인/병의원개인사업자/의료재단)
 *   D: 이름
 *   E: 이메일
 *   F: 비밀번호
 *   G: 추천인
 *   H: 가입일시
 *   I: 승인상태 (승인전표/승인완료)
 *   J: (비어있음)
 *   K: 마지막로그인
 * 
 * [사근복컨설턴트] 시트:
 *   A: 이름
 *   B: 핸드폰번호 (010-1234-5678 형식)
 *   C: 이메일
 *   D: 직함
 *   E: 소속 사업단
 *   F: 비밀번호
 *   G: 소속 지사
 *   H: 가입일시
 * 
 * [로그인기록] 시트:
 *   A: 타임스탬프
 *   B: 전화번호
 *   C: 사용자유형
 *   D: 상태
 * 
 * ============================================================
 */

// ============================================================
// 📱 전화번호 처리 함수
// ============================================================

/**
 * 전화번호 정규화: 하이픈 제거 (로그인 비교용)
 * @param {string} phone - 원본 전화번호
 * @returns {string} 숫자만 남긴 전화번호
 * @example normalizePhone("010-1234-5678") → "01012345678"
 * @example normalizePhone("01012345678") → "01012345678"
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

/**
 * 전화번호 포맷팅: 010-XXXX-XXXX 형식으로 변환 (저장용)
 * ⚠️ 중요: 앞자리 0이 사라지지 않도록 문자열로 반환!
 * @param {string} phone - 원본 전화번호
 * @returns {string} '010-XXXX-XXXX' 형식 (문자열!)
 * @example formatPhone("01012345678") → "'010-1234-5678"
 * @example formatPhone("010-1234-5678") → "'010-1234-5678"
 */
function formatPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length !== 11) return normalized;
  
  // 010-XXXX-XXXX 형식으로 변환
  // ⚠️ 작은따옴표(')를 앞에 붙여서 Google Sheets가 문자열로 인식하도록!
  const formatted = normalized.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
  return "'" + formatted; // 예: '010-1234-5678
}

// ============================================================
// 🔐 로그인 함수
// ============================================================

/**
 * 기업회원 로그인
 * @param {string} phone - 전화번호 (하이픈 유무 무관)
 * @param {string} password - 비밀번호
 * @returns {object} {success: boolean, message: string, userData?: object}
 */
function loginCompany(phone, password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('기업회원');
    
    if (!sheet) {
      return { success: false, error: '기업회원 시트를 찾을 수 없습니다.' };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: false, error: '가입된 회원이 없습니다.' };
    }
    
    // 전화번호 정규화 (하이픈 제거)
    const normalizedPhone = normalizePhone(phone);
    
    // 전체 데이터 조회 (A~K열)
    const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhone(row[0]); // A열: 핸드폰번호
      const storedPassword = String(row[5]);      // F열: 비밀번호
      const approvalStatus = String(row[8]);      // I열: 승인상태
      
      // 전화번호 일치 확인
      if (storedPhone === normalizedPhone) {
        // 비밀번호 확인
        if (storedPassword !== password) {
          return { success: false, error: '비밀번호가 일치하지 않습니다.' };
        }
        
        // 승인 상태 확인
        if (approvalStatus !== '승인완료') {
          return { 
            success: false, 
            error: '관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.' 
          };
        }
        
        // 로그인 성공 - 마지막 로그인 시간 업데이트 (K열)
        const timestamp = Utilities.formatDate(
          new Date(), 
          'Asia/Seoul', 
          'yyyy-MM-dd HH:mm:ss'
        );
        sheet.getRange(i + 2, 11).setValue(timestamp); // K열 (11번째)
        
        // 로그인 기록 저장
        logLogin(normalizePhone(row[0]), '기업회원', '로그인 성공');
        
        // 사용자 데이터 반환
        return {
          success: true,
          message: '로그인 성공',
          userData: {
            phone: formatPhone(row[0]).replace("'", ""), // 작은따옴표 제거
            companyName: row[1],    // B열: 회사명
            companyType: row[2],    // C열: 기업유형
            name: row[3],           // D열: 이름
            email: row[4],          // E열: 이메일
            referrer: row[6],       // G열: 추천인
            registeredAt: row[7],   // H열: 가입일시
            approvalStatus: row[8], // I열: 승인상태
            lastLogin: timestamp    // K열: 마지막로그인
          }
        };
      }
    }
    
    return { success: false, error: '등록되지 않은 전화번호입니다.' };
    
  } catch (error) {
    Logger.log('loginCompany 오류: ' + error);
    return { success: false, error: '로그인 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 사근복컨설턴트 로그인
 * @param {string} phone - 전화번호 (하이픈 유무 무관)
 * @param {string} password - 비밀번호
 * @returns {object} {success: boolean, message: string, userData?: object}
 */
function loginConsultant(phone, password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('사근복컨설턴트');
    
    if (!sheet) {
      return { success: false, error: '사근복컨설턴트 시트를 찾을 수 없습니다.' };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: false, error: '가입된 컨설턴트가 없습니다.' };
    }
    
    // 전화번호 정규화 (하이픈 제거)
    const normalizedPhone = normalizePhone(phone);
    
    // 전체 데이터 조회 (A~H열)
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhone(row[1]); // B열: 핸드폰번호
      const storedPassword = String(row[5]) || '12345'; // F열: 비밀번호 (기본값: 12345)
      
      // 전화번호 일치 확인
      if (storedPhone === normalizedPhone) {
        // 비밀번호 확인
        if (storedPassword !== password) {
          return { success: false, error: '비밀번호가 일치하지 않습니다.' };
        }
        
        // 로그인 기록 저장
        logLogin(normalizePhone(row[1]), '사근복컨설턴트', '로그인 성공');
        
        // 사용자 데이터 반환
        return {
          success: true,
          message: '로그인 성공',
          userData: {
            name: row[0],           // A열: 이름
            phone: formatPhone(row[1]).replace("'", ""), // B열: 핸드폰번호
            email: row[2],          // C열: 이메일
            title: row[3],          // D열: 직함
            department: row[4],     // E열: 소속 사업단
            branch: row[6],         // G열: 소속 지사
            registeredAt: row[7]    // H열: 가입일시
          }
        };
      }
    }
    
    return { success: false, error: '등록되지 않은 전화번호입니다.' };
    
  } catch (error) {
    Logger.log('loginConsultant 오류: ' + error);
    return { success: false, error: '로그인 처리 중 오류가 발생했습니다.' };
  }
}

// ============================================================
// 📝 회원가입 함수
// ============================================================

/**
 * 기업회원 가입
 * @param {object} params - {companyName, companyType, name, phone, email, password, referrer}
 * @returns {object} {success: boolean, message: string}
 */
function registerCompany(params) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const companySheet = ss.getSheetByName('기업회원');
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    
    if (!companySheet || !consultantSheet) {
      return { success: false, error: '필수 시트를 찾을 수 없습니다.' };
    }
    
    const { companyName, companyType, name, phone, email, password, referrer } = params;
    
    // ====================================
    // 🔍 1. 추천인 검증 (사근복컨설턴트 시트)
    // ====================================
    Logger.log('추천인 검증 시작: ' + referrer);
    
    // 추천인이 비어있지 않은 경우에만 검증
    if (referrer && referrer.trim() !== '') {
      const consultantLastRow = consultantSheet.getLastRow();
      
      if (consultantLastRow <= 1) {
        Logger.log('사근복컨설턴트 시트가 비어있음');
        return { 
          success: false, 
          error: '추천인 정보가 올바르지 않습니다. 사근복컨설턴트 명단에 등록된 이름을 입력해주세요.' 
        };
      }
      
      // 사근복컨설턴트 시트의 A열(이름) 전체 조회
      const consultantData = consultantSheet.getRange(
        2, 1, 
        consultantLastRow - 1, 
        1
      ).getValues();
      
      const consultantNames = consultantData.map(row => String(row[0]).trim());
      Logger.log('사근복컨설턴트 명단: ' + consultantNames.join(', '));
      
      // 추천인 이름 매칭 (대소문자 구분, 공백 제거)
      if (!consultantNames.includes(referrer.trim())) {
        Logger.log('추천인 검증 실패: ' + referrer);
        return { 
          success: false, 
          error: '추천인 정보가 올바르지 않습니다. 사근복컨설턴트 명단에 등록된 이름을 입력해주세요.\n등록된 컨설턴트: ' + consultantNames.join(', ')
        };
      }
      
      Logger.log('추천인 검증 성공: ' + referrer);
    }
    
    // ====================================
    // 📱 2. 전화번호 포맷팅 및 검증
    // ====================================
    const formattedPhone = formatPhone(phone); // '010-1234-5678 (작은따옴표 포함)
    const normalizedPhone = normalizePhone(phone); // 01012345678
    
    Logger.log('전화번호 포맷팅: ' + phone + ' → ' + formattedPhone);
    
    if (!normalizedPhone || normalizedPhone.length !== 11) {
      return { success: false, error: '올바른 핸드폰 번호 형식이 아닙니다. (11자리 숫자)' };
    }
    
    // ====================================
    // 🔍 3. 중복 체크 (기업회원 시트)
    // ====================================
    const companyLastRow = companySheet.getLastRow();
    if (companyLastRow > 1) {
      const existingData = companySheet.getRange(
        2, 1, 
        companyLastRow - 1, 
        1
      ).getValues();
      
      for (let i = 0; i < existingData.length; i++) {
        const existingPhone = normalizePhone(existingData[i][0]);
        if (existingPhone === normalizedPhone) {
          Logger.log('중복 전화번호 발견: ' + normalizedPhone);
          return { 
            success: false, 
            error: '이미 가입된 핸드폰 번호입니다.' 
          };
        }
      }
    }
    
    // ====================================
    // 💾 4. 데이터 저장 (시트 기준 순서)
    // ====================================
    const timestamp = Utilities.formatDate(
      new Date(), 
      'Asia/Seoul', 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    // ⚠️ 중요: appendRow 순서를 시트 헤더와 정확히 일치시킴!
    const rowData = [
      formattedPhone,       // A: 핸드폰번호 ('010-1234-5678)
      companyName,          // B: 회사명
      companyType,          // C: 기업유형
      name,                 // D: 이름
      email,                // E: 이메일
      password,             // F: 비밀번호
      referrer || '',       // G: 추천인 (빈 값 허용)
      timestamp,            // H: 가입일시
      '승인전표'            // I: 승인상태
      // J열: 비어있음 (자동)
      // K열: 마지막로그인 (로그인 시 업데이트)
    ];
    
    Logger.log('저장할 데이터: ' + JSON.stringify(rowData));
    companySheet.appendRow(rowData);
    
    Logger.log('회원가입 성공: ' + name + ' (' + formattedPhone + ')');
    
    return { 
      success: true, 
      message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' 
    };
    
  } catch (error) {
    Logger.log('registerCompany 오류: ' + error);
    return { success: false, error: '회원가입 처리 중 오류가 발생했습니다: ' + error };
  }
}

/**
 * 사근복컨설턴트 가입
 * @param {object} params - {name, phone, email, title, department, password, branch}
 * @returns {object} {success: boolean, message: string}
 */
function registerConsultant(params) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('사근복컨설턴트');
    
    if (!sheet) {
      return { success: false, error: '사근복컨설턴트 시트를 찾을 수 없습니다.' };
    }
    
    const { name, phone, email, title, department, password, branch } = params;
    
    // ====================================
    // 1. 전화번호 포맷팅
    // ====================================
    const formattedPhone = formatPhone(phone);
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone || normalizedPhone.length !== 11) {
      return { success: false, error: '올바른 핸드폰 번호 형식이 아닙니다. (11자리 숫자)' };
    }
    
    // ====================================
    // 2. 중복 체크 (사근복컨설턴트 시트)
    // ====================================
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingData = sheet.getRange(
        2, 2, 
        lastRow - 1, 
        1
      ).getValues();
      
      for (let i = 0; i < existingData.length; i++) {
        const existingPhone = normalizePhone(existingData[i][0]);
        if (existingPhone === normalizedPhone) {
          return { 
            success: false, 
            error: '이미 가입된 핸드폰 번호입니다.' 
          };
        }
      }
    }
    
    // ====================================
    // 3. 데이터 추가
    // ====================================
    const timestamp = Utilities.formatDate(
      new Date(), 
      'Asia/Seoul', 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    // appendRow 순서: A~H열
    sheet.appendRow([
      name,                     // A: 이름
      formattedPhone,           // B: 핸드폰번호 ('010-1234-5678)
      email,                    // C: 이메일
      title,                    // D: 직함
      department,               // E: 소속 사업단
      password || '12345',      // F: 비밀번호 (기본값: 12345)
      branch,                   // G: 소속 지사
      timestamp                 // H: 가입일시
    ]);
    
    return { 
      success: true, 
      message: '사근복컨설턴트 가입이 완료되었습니다.' 
    };
    
  } catch (error) {
    Logger.log('registerConsultant 오류: ' + error);
    return { success: false, error: '회원가입 처리 중 오류가 발생했습니다.' };
  }
}

// ============================================================
// 🔍 ID/비밀번호 찾기 함수
// ============================================================

/**
 * ID 찾기 (기업회원 전용)
 * @param {string} name - 이름
 * @param {string} email - 이메일
 * @returns {object} {success: boolean, phone?: string, message: string}
 */
function findUserId(name, email) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('기업회원');
    
    if (!sheet) {
      return { success: false, error: '기업회원 시트를 찾을 수 없습니다.' };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: false, error: '가입된 회원이 없습니다.' };
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (String(row[3]) === name && String(row[4]) === email) {
        return {
          success: true,
          phone: formatPhone(row[0]).replace("'", ""), // A열: 핸드폰번호
          message: '회원님의 휴대폰 번호는 ' + formatPhone(row[0]).replace("'", "") + ' 입니다.'
        };
      }
    }
    
    return { success: false, error: '일치하는 회원 정보를 찾을 수 없습니다.' };
    
  } catch (error) {
    Logger.log('findUserId 오류: ' + error);
    return { success: false, error: 'ID 찾기 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 비밀번호 찾기 (임시 비밀번호 발급)
 * @param {string} phone - 전화번호
 * @param {string} email - 이메일
 * @returns {object} {success: boolean, tempPassword?: string, message: string}
 */
function findPassword(phone, email) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('기업회원');
    
    if (!sheet) {
      return { success: false, error: '기업회원 시트를 찾을 수 없습니다.' };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: false, error: '가입된 회원이 없습니다.' };
    }
    
    const normalizedPhone = normalizePhone(phone);
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhone(row[0]);
      
      if (storedPhone === normalizedPhone && String(row[4]) === email) {
        // 임시 비밀번호 생성 (6자리 랜덤)
        const tempPassword = Math.random().toString(36).slice(-6);
        
        // 비밀번호 업데이트 (F열)
        sheet.getRange(i + 2, 6).setValue(tempPassword);
        
        return {
          success: true,
          tempPassword: tempPassword,
          message: '임시 비밀번호: ' + tempPassword + '\n로그인 후 비밀번호를 변경해주세요.'
        };
      }
    }
    
    return { success: false, error: '일치하는 회원 정보를 찾을 수 없습니다.' };
    
  } catch (error) {
    Logger.log('findPassword 오류: ' + error);
    return { success: false, error: '비밀번호 찾기 처리 중 오류가 발생했습니다.' };
  }
}

// ============================================================
// 📊 로그인 기록 함수
// ============================================================

/**
 * 로그인 기록 저장
 * @param {string} phone - 전화번호
 * @param {string} userType - 사용자 유형 (기업회원/사근복컨설턴트)
 * @param {string} status - 상태 (로그인 성공/로그인 실패)
 */
function logLogin(phone, userType, status) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('로그인기록');
    
    // 로그인기록 시트가 없으면 생성
    if (!sheet) {
      sheet = ss.insertSheet('로그인기록');
      sheet.appendRow(['타임스탬프', '전화번호', '사용자유형', '상태']);
    }
    
    const timestamp = Utilities.formatDate(
      new Date(), 
      'Asia/Seoul', 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    sheet.appendRow([
      timestamp,
      phone,
      userType,
      status
    ]);
    
  } catch (error) {
    Logger.log('logLogin 오류: ' + error);
  }
}

// ============================================================
// 🌐 웹 앱 엔드포인트 (doPost, doGet)
// ============================================================

/**
 * POST 요청 핸들러
 * @param {object} e - 요청 객체
 * @returns {object} JSON 응답
 */
function doPost(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    
    Logger.log('doPost 요청: ' + action);
    Logger.log('파라미터: ' + JSON.stringify(params));
    
    let result;
    
    switch (action) {
      case 'loginCompany':
        result = loginCompany(params.phone, params.password);
        break;
        
      case 'loginConsultant':
        result = loginConsultant(params.phone, params.password);
        break;
        
      case 'registerCompany':
        result = registerCompany({
          companyName: params.companyName,
          companyType: params.companyType,
          name: params.name,
          phone: params.phone,
          email: params.email,
          password: params.password,
          referrer: params.referrer
        });
        break;
        
      case 'registerConsultant':
        result = registerConsultant({
          name: params.name,
          phone: params.phone,
          email: params.email,
          title: params.title,
          department: params.department,
          password: params.password,
          branch: params.branch
        });
        break;
        
      case 'findUserId':
        result = findUserId(params.name, params.email);
        break;
        
      case 'findPassword':
        result = findPassword(params.phone, params.email);
        break;
        
      default:
        result = { success: false, error: '알 수 없는 action입니다: ' + action };
    }
    
    Logger.log('응답: ' + JSON.stringify(result));
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doPost 오류: ' + error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: '요청 처리 중 오류가 발생했습니다: ' + error
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET 요청 핸들러 (상태 확인용)
 * @returns {object} JSON 응답
 */
function doGet() {
  const response = {
    success: true,
    message: 'Sagunbok Apps Script V5.1 (EMERGENCY FIX) is running!',
    timestamp: new Date().toISOString(),
    version: '5.1',
    fixes: [
      '시트 열 순서 불일치 해결',
      '전화번호 앞자리 0 손실 해결',
      '기업유형과 추천인 누락 해결',
      '추천인 검증 강화'
    ]
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 🧪 자동 테스트 함수
// ============================================================

/**
 * Apps Script 전체 기능 테스트
 * 사용법: Apps Script 에디터에서 실행 > runAllTests
 */
function runAllTests() {
  Logger.log('🧪 Sagunbok Apps Script V5.1 자동 테스트 시작');
  Logger.log('='.repeat(50));
  
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  // ====================================
  // 테스트 1: 전화번호 포맷팅
  // ====================================
  Logger.log('\n📱 테스트 1: 전화번호 포맷팅');
  try {
    const test1 = formatPhone('01012345678');
    const test2 = normalizePhone('010-1234-5678');
    
    if (test1.includes('010-1234-5678') && test2 === '01012345678') {
      Logger.log('✅ PASS: formatPhone("01012345678") = ' + test1);
      Logger.log('✅ PASS: normalizePhone("010-1234-5678") = ' + test2);
      passCount += 2;
    } else {
      Logger.log('❌ FAIL: 전화번호 포맷팅 오류');
      Logger.log('  - formatPhone 결과: ' + test1);
      Logger.log('  - normalizePhone 결과: ' + test2);
      failCount += 2;
    }
  } catch (error) {
    Logger.log('❌ ERROR: ' + error);
    failCount += 2;
  }
  
  // ====================================
  // 테스트 2: 추천인 검증 (실패 케이스)
  // ====================================
  Logger.log('\n🔎 테스트 2: 추천인 검증 (실패 케이스)');
  try {
    const result = registerCompany({
      companyName: '테스트병원',
      companyType: '병의원개인사업자',
      name: '테스터',
      phone: '01099999999',
      email: 'test@test.com',
      password: 'test1234',
      referrer: '존재하지않는추천인'
    });
    
    if (!result.success && result.error.includes('추천인')) {
      Logger.log('✅ PASS: 잘못된 추천인으로 가입 차단됨');
      Logger.log('  - 오류 메시지: ' + result.error);
      passCount++;
    } else {
      Logger.log('❌ FAIL: 추천인 검증 실패');
      Logger.log('  - 결과: ' + JSON.stringify(result));
      failCount++;
    }
  } catch (error) {
    Logger.log('❌ ERROR: ' + error);
    failCount++;
  }
  
  // ====================================
  // 테스트 3: 시트 구조 검증
  // ====================================
  Logger.log('\n📊 테스트 3: Google Sheets 구조 검증');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const companySheet = ss.getSheetByName('기업회원');
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    
    if (companySheet && consultantSheet) {
      const companyHeaders = companySheet.getRange(1, 1, 1, 11).getValues()[0];
      Logger.log('✅ PASS: 필수 시트 존재 확인');
      Logger.log('  - 기업회원 헤더: ' + companyHeaders.join(', '));
      passCount++;
    } else {
      Logger.log('❌ FAIL: 필수 시트 누락');
      failCount++;
    }
  } catch (error) {
    Logger.log('❌ ERROR: ' + error);
    failCount++;
  }
  
  // ====================================
  // 테스트 결과 요약
  // ====================================
  Logger.log('\n' + '='.repeat(50));
  Logger.log('📊 테스트 결과:');
  Logger.log('  ✅ 통과: ' + passCount + '개');
  Logger.log('  ❌ 실패: ' + failCount + '개');
  Logger.log('  ⏭️  건너뜀: ' + skipCount + '개');
  
  if (failCount === 0) {
    Logger.log('\n🎉 모든 테스트 통과! Apps Script가 정상 작동합니다.');
  } else {
    Logger.log('\n⚠️  일부 테스트 실패. 로그를 확인하세요.');
  }
  
  Logger.log('='.repeat(50));
}

/**
 * Google Sheets 구조 검증 (헤더 확인)
 * 사용법: Apps Script 에디터에서 실행 > validateSheetStructure
 */
function validateSheetStructure() {
  Logger.log('📊 Google Sheets 구조 검증 시작');
  Logger.log('='.repeat(50));
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ====================================
    // 기업회원 시트 검증
    // ====================================
    Logger.log('\n[기업회원] 시트 검증:');
    const companySheet = ss.getSheetByName('기업회원');
    if (companySheet) {
      const headers = companySheet.getRange(1, 1, 1, 11).getValues()[0];
      const expectedHeaders = [
        '핸드폰번호', '회사명', '기업유형', '이름', '이메일', 
        '비밀번호', '추천인', '가입일시', '승인상태', '', '마지막로그인'
      ];
      
      Logger.log('현재 헤더: ' + headers.join(' | '));
      Logger.log('예상 헤더: ' + expectedHeaders.join(' | '));
      
      let match = true;
      for (let i = 0; i < expectedHeaders.length; i++) {
        if (String(headers[i]).trim() !== expectedHeaders[i]) {
          Logger.log('⚠️  불일치 발견: ' + (i+1) + '번째 열');
          Logger.log('   현재: "' + headers[i] + '"');
          Logger.log('   예상: "' + expectedHeaders[i] + '"');
          match = false;
        }
      }
      
      if (match) {
        Logger.log('✅ 기업회원 시트 구조 정상');
      } else {
        Logger.log('❌ 기업회원 시트 구조 불일치');
      }
    } else {
      Logger.log('❌ 기업회원 시트를 찾을 수 없습니다.');
    }
    
    // ====================================
    // 사근복컨설턴트 시트 검증
    // ====================================
    Logger.log('\n[사근복컨설턴트] 시트 검증:');
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    if (consultantSheet) {
      const headers = consultantSheet.getRange(1, 1, 1, 8).getValues()[0];
      Logger.log('현재 헤더: ' + headers.join(' | '));
      Logger.log('✅ 사근복컨설턴트 시트 존재 확인');
      
      const dataCount = consultantSheet.getLastRow() - 1;
      Logger.log('📊 등록된 컨설턴트 수: ' + dataCount + '명');
      
      if (dataCount > 0) {
        const names = consultantSheet.getRange(2, 1, dataCount, 1).getValues();
        Logger.log('등록된 이름: ' + names.map(r => r[0]).join(', '));
      }
    } else {
      Logger.log('❌ 사근복컨설턴트 시트를 찾을 수 없습니다.');
    }
    
    Logger.log('\n' + '='.repeat(50));
    Logger.log('✅ 구조 검증 완료');
    
  } catch (error) {
    Logger.log('❌ 구조 검증 오류: ' + error);
  }
}
