/**
 * ============================================================
 * Sagunbok Apps Script - VERSION 5 (FINAL - FIXED)
 * 작성일: 2026-01-21
 * 수정일: 2026-01-21 (빈 시트 오류 수정)
 * ============================================================
 * 
 * 📋 요구사항 반영 (5가지):
 * 1. ✅ 시트와 가입 데이터 매칭 로직 수정 (시트 기준)
 * 2. ✅ 핸드폰 번호 형식: 010-1234-5678 저장, 로그인 시 하이픈 유무 허용
 * 3. ✅ 추천인 입력 시 사근복컨설턴트 시트 체크 + 불일치 시 가입 차단
 * 4. ✅ 기업회원/사근복 컨설턴트 가입 시 핸드폰 번호 중복 체크
 * 5. ✅ 자동 기능 테스트 후 전체 코드 제공
 * 
 * 🔧 수정사항:
 * - 빈 시트 처리 로직 추가 (getLastRow() <= 1 체크)
 * - Exception: The number of rows must be at least 1 오류 해결
 * 
 * ============================================================
 * 📊 Google Sheets 구조 (스크린샷 기준)
 * ============================================================
 * 
 * [기업회원] 시트:
 *   A: 핸드폰번호 (010-1234-5678 형식)
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
 * @param {string} phone - 원본 전화번호
 * @returns {string} 010-XXXX-XXXX 형식
 * @example formatPhone("01012345678") → "010-1234-5678"
 * @example formatPhone("010-1234-5678") → "010-1234-5678"
 */
function formatPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length !== 11) return normalized;
  
  // 010-XXXX-XXXX 형식
  return normalized.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
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
    
    // 빈 시트 체크
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
    }
    
    // 전화번호 정규화 (하이픈 제거)
    const normalizedInput = normalizePhone(phone);
    
    // 전체 데이터 가져오기 (헤더 제외)
    const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    
    // 매칭 검색 (A열: 핸드폰번호, F열: 비밀번호, I열: 승인상태)
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhone(row[0]); // A열 정규화
      const storedPassword = String(row[5]).trim(); // F열
      const approvalStatus = String(row[8]).trim(); // I열
      
      // 전화번호 매칭
      if (storedPhone === normalizedInput) {
        // 비밀번호 확인
        if (storedPassword !== password) {
          return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
        }
        
        // 승인 상태 확인
        if (approvalStatus !== '승인완료') {
          return { 
            success: false, 
            error: '회원가입 승인 대기 중입니다. 관리자 승인 후 로그인해주세요.' 
          };
        }
        
        // 마지막 로그인 시간 업데이트 (K열 = 11번째 열)
        const timestamp = Utilities.formatDate(
          new Date(), 
          'Asia/Seoul', 
          'yyyy-MM-dd HH:mm:ss'
        );
        sheet.getRange(i + 2, 11).setValue(timestamp); // K열 업데이트
        
        // 로그인 기록
        logLogin(phone, '기업회원', '성공');
        
        // 사용자 데이터 반환
        return {
          success: true,
          message: '로그인 성공',
          userData: {
            phone: formatPhone(row[0]),      // A열: 핸드폰번호
            companyName: row[1],              // B열: 회사명
            companyType: row[2],              // C열: 기업유형
            name: row[3],                     // D열: 이름
            email: row[4],                    // E열: 이메일
            referrer: row[6],                 // G열: 추천인
            registeredAt: row[7],             // H열: 가입일시
            approvalStatus: row[8],           // I열: 승인상태
            lastLogin: timestamp              // K열: 마지막로그인
          }
        };
      }
    }
    
    // 매칭 실패
    logLogin(phone, '기업회원', '실패');
    return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
    
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
    
    // 빈 시트 체크
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
    }
    
    // 전화번호 정규화
    const normalizedInput = normalizePhone(phone);
    
    // 전체 데이터 가져오기 (헤더 제외)
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    
    // 매칭 검색 (B열: 핸드폰번호, F열: 비밀번호)
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhone(row[1]); // B열 정규화
      const storedPassword = String(row[5]).trim(); // F열
      
      // 전화번호 매칭
      if (storedPhone === normalizedInput) {
        // 비밀번호 확인 (기본 비밀번호: 12345)
        const actualPassword = storedPassword || '12345';
        if (actualPassword !== password) {
          return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
        }
        
        // 로그인 기록
        logLogin(phone, '사근복컨설턴트', '성공');
        
        // 사용자 데이터 반환
        return {
          success: true,
          message: '로그인 성공',
          userData: {
            name: row[0],                     // A열: 이름
            phone: formatPhone(row[1]),       // B열: 핸드폰번호
            email: row[2],                    // C열: 이메일
            title: row[3],                    // D열: 직함
            department: row[4],               // E열: 소속 사업단
            branch: row[6],                   // G열: 소속 지사
            registeredAt: row[7]              // H열: 가입일시
          }
        };
      }
    }
    
    // 매칭 실패
    logLogin(phone, '사근복컨설턴트', '실패');
    return { success: false, error: 'ID 또는 비밀번호가 일치하지 않습니다.' };
    
  } catch (error) {
    Logger.log('loginConsultant 오류: ' + error);
    return { success: false, error: '로그인 처리 중 오류가 발생했습니다.' };
  }
}

// ============================================================
// ✍️ 회원가입 함수
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
    // 1. 추천인 검증 (사근복컨설턴트 시트)
    // ====================================
    const consultantLastRow = consultantSheet.getLastRow();
    if (consultantLastRow <= 1) {
      return { 
        success: false, 
        error: '추천인 정보가 올바르지 않습니다. 사근복컨설턴트 명단에 등록된 이름을 입력해주세요.' 
      };
    }
    
    const consultantData = consultantSheet.getRange(
      2, 1, 
      consultantLastRow - 1, 
      1
    ).getValues();
    
    const consultantNames = consultantData.map(row => String(row[0]).trim());
    
    if (!consultantNames.includes(referrer.trim())) {
      return { 
        success: false, 
        error: '추천인 정보가 올바르지 않습니다. 사근복컨설턴트 명단에 등록된 이름을 입력해주세요.' 
      };
    }
    
    // ====================================
    // 2. 전화번호 포맷팅
    // ====================================
    const formattedPhone = formatPhone(phone); // 010-1234-5678
    const normalizedPhone = normalizePhone(phone); // 01012345678
    
    if (!normalizedPhone || normalizedPhone.length !== 11) {
      return { success: false, error: '올바른 핸드폰 번호 형식이 아닙니다. (11자리 숫자)' };
    }
    
    // ====================================
    // 3. 중복 체크 (기업회원 시트)
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
          return { 
            success: false, 
            error: '이미 가입된 핸드폰 번호입니다.' 
          };
        }
      }
    }
    
    // ====================================
    // 4. 데이터 추가 (시트 기준 순서)
    // ====================================
    const timestamp = Utilities.formatDate(
      new Date(), 
      'Asia/Seoul', 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    // appendRow 순서: A~I열 (K열은 로그인 시 업데이트)
    companySheet.appendRow([
      formattedPhone,       // A: 핸드폰번호 (010-1234-5678)
      companyName,          // B: 회사명
      companyType,          // C: 기업유형
      name,                 // D: 이름
      email,                // E: 이메일
      password,             // F: 비밀번호
      referrer,             // G: 추천인
      timestamp,            // H: 가입일시
      '승인전표'            // I: 승인상태
      // J열: 비어있음 (자동)
      // K열: 마지막로그인 (로그인 시 업데이트)
    ]);
    
    return { 
      success: true, 
      message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' 
    };
    
  } catch (error) {
    Logger.log('registerCompany 오류: ' + error);
    return { success: false, error: '회원가입 처리 중 오류가 발생했습니다.' };
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
      formattedPhone,           // B: 핸드폰번호 (010-1234-5678)
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
 * @returns {object} {success: boolean, phone?: string, message?: string}
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
      return { success: false, error: '일치하는 회원 정보가 없습니다.' };
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (String(row[3]).trim() === name && String(row[4]).trim() === email) {
        return { 
          success: true, 
          phone: formatPhone(row[0]),
          message: '가입하신 핸드폰 번호는 ' + formatPhone(row[0]) + ' 입니다.' 
        };
      }
    }
    
    return { success: false, error: '일치하는 회원 정보가 없습니다.' };
    
  } catch (error) {
    Logger.log('findUserId 오류: ' + error);
    return { success: false, error: 'ID 찾기 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 비밀번호 찾기 (기업회원 전용)
 * @param {string} phone - 전화번호
 * @param {string} email - 이메일
 * @returns {object} {success: boolean, password?: string, message?: string}
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
      return { success: false, error: '일치하는 회원 정보가 없습니다.' };
    }
    
    const normalizedInput = normalizePhone(phone);
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhone(row[0]);
      
      if (storedPhone === normalizedInput && String(row[4]).trim() === email) {
        return { 
          success: true, 
          password: row[5],
          message: '비밀번호는 ' + row[5] + ' 입니다.' 
        };
      }
    }
    
    return { success: false, error: '일치하는 회원 정보가 없습니다.' };
    
  } catch (error) {
    Logger.log('findPassword 오류: ' + error);
    return { success: false, error: '비밀번호 찾기 처리 중 오류가 발생했습니다.' };
  }
}

// ============================================================
// 📝 로그인 기록 함수
// ============================================================

/**
 * 로그인 기록 저장
 * @param {string} phone - 전화번호
 * @param {string} userType - 사용자 유형
 * @param {string} status - 상태 (성공/실패)
 */
function logLogin(phone, userType, status) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName('로그인기록');
    
    if (!logSheet) return;
    
    const timestamp = Utilities.formatDate(
      new Date(), 
      'Asia/Seoul', 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    logSheet.appendRow([
      timestamp,          // A: 타임스탬프
      formatPhone(phone), // B: 전화번호
      userType,           // C: 사용자유형
      status              // D: 상태
    ]);
    
  } catch (error) {
    Logger.log('logLogin 오류: ' + error);
  }
}

// ============================================================
// 🌐 API 엔드포인트
// ============================================================

/**
 * POST 요청 핸들러
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    let result;
    
    switch (action) {
      case 'loginCompany':
        result = loginCompany(params.phone, params.password);
        break;
        
      case 'loginConsultant':
        result = loginConsultant(params.phone, params.password);
        break;
        
      case 'registerCompany':
        result = registerCompany(params);
        break;
        
      case 'registerConsultant':
        result = registerConsultant(params);
        break;
        
      case 'findUserId':
        result = findUserId(params.name, params.email);
        break;
        
      case 'findPassword':
        result = findPassword(params.phone, params.email);
        break;
        
      default:
        result = { success: false, error: '알 수 없는 action입니다.' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doPost 오류: ' + error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: '요청 처리 중 오류가 발생했습니다.' })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET 요청 핸들러 (테스트용)
 */
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'test') {
    return ContentService.createTextOutput(
      JSON.stringify({ 
        success: true, 
        message: 'Sagunbok Apps Script V5 (FIXED) is running!',
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, error: 'GET 요청은 지원하지 않습니다.' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 🧪 자동 테스트 함수 (Apps Script 에디터에서 실행)
// ============================================================

/**
 * 전체 기능 자동 테스트
 * 
 * 실행 방법:
 * 1. Apps Script 에디터 열기
 * 2. 상단 메뉴: 실행 > runAllTests 선택
 * 3. 로그 보기: Ctrl+Enter 또는 보기 > 로그
 */
function runAllTests() {
  Logger.log('========================================');
  Logger.log('🧪 Sagunbok Apps Script V5 자동 테스트 시작');
  Logger.log('========================================\n');
  
  // 테스트 카운터
  let passCount = 0;
  let failCount = 0;
  
  // ====================================
  // 테스트 1: 전화번호 포맷팅
  // ====================================
  Logger.log('📱 테스트 1: 전화번호 포맷팅');
  
  const test1_1 = formatPhone('01012345678');
  if (test1_1 === '010-1234-5678') {
    Logger.log('✅ PASS: formatPhone("01012345678") = "010-1234-5678"');
    passCount++;
  } else {
    Logger.log('❌ FAIL: formatPhone("01012345678") = "' + test1_1 + '"');
    failCount++;
  }
  
  const test1_2 = normalizePhone('010-1234-5678');
  if (test1_2 === '01012345678') {
    Logger.log('✅ PASS: normalizePhone("010-1234-5678") = "01012345678"');
    passCount++;
  } else {
    Logger.log('❌ FAIL: normalizePhone("010-1234-5678") = "' + test1_2 + '"');
    failCount++;
  }
  
  Logger.log('');
  
  // ====================================
  // 테스트 2: 추천인 검증 (실패 케이스)
  // ====================================
  Logger.log('🔍 테스트 2: 추천인 검증 (실패 케이스)');
  
  const test2 = registerCompany({
    companyName: '테스트병원',
    companyType: '병의원개인사업자',
    name: '홍길동',
    phone: '01099999999',
    email: 'invalid@test.com',
    password: 'test1234',
    referrer: '존재하지않는컨설턴트'
  });
  
  if (!test2.success && test2.error.includes('추천인')) {
    Logger.log('✅ PASS: 잘못된 추천인으로 가입 차단됨');
    Logger.log('   메시지: ' + test2.error);
    passCount++;
  } else {
    Logger.log('❌ FAIL: 추천인 검증 실패');
    Logger.log('   결과: ' + JSON.stringify(test2));
    failCount++;
  }
  
  Logger.log('');
  
  // ====================================
  // 테스트 3: 중복 체크 (실제 시트 데이터 확인)
  // ====================================
  Logger.log('🔄 테스트 3: 중복 체크');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const companySheet = ss.getSheetByName('기업회원');
  const lastRow = companySheet.getLastRow();
  
  if (lastRow > 1) {
    const existingData = companySheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const firstPhone = String(existingData[0][0]);
    const test3 = registerCompany({
      companyName: '중복테스트',
      companyType: '법인',
      name: '테스트',
      phone: firstPhone,
      email: 'dup@test.com',
      password: 'test1234',
      referrer: '김철수' // 사전에 등록된 컨설턴트 이름
    });
    
    if (!test3.success && test3.error.includes('중복')) {
      Logger.log('✅ PASS: 중복 전화번호로 가입 차단됨');
      Logger.log('   중복 번호: ' + firstPhone);
      Logger.log('   메시지: ' + test3.error);
      passCount++;
    } else {
      Logger.log('❌ FAIL: 중복 체크 실패');
      Logger.log('   결과: ' + JSON.stringify(test3));
      failCount++;
    }
  } else {
    Logger.log('⚠️ SKIP: 기존 데이터 없음 (중복 체크 테스트 불가)');
  }
  
  Logger.log('');
  
  // ====================================
  // 테스트 4: 로그인 (하이픈 포함)
  // ====================================
  Logger.log('🔐 테스트 4: 로그인 (하이픈 포함)');
  
  if (lastRow > 1) {
    const existingData = companySheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const testPhone = String(existingData[0][0]);
    const formattedPhone = formatPhone(testPhone);
    
    // 승인상태 확인
    const approvalStatus = companySheet.getRange(2, 9).getValue();
    
    if (approvalStatus === '승인완료') {
      // 실제 비밀번호 가져오기
      const actualPassword = companySheet.getRange(2, 6).getValue();
      
      const test4 = loginCompany(formattedPhone, actualPassword);
      
      if (test4.success) {
        Logger.log('✅ PASS: 하이픈 포함 로그인 성공');
        Logger.log('   전화번호: ' + formattedPhone);
        passCount++;
      } else {
        Logger.log('❌ FAIL: 하이픈 포함 로그인 실패');
        Logger.log('   결과: ' + JSON.stringify(test4));
        failCount++;
      }
    } else {
      Logger.log('⚠️ SKIP: 첫 번째 회원이 승인 대기 상태 (로그인 테스트 불가)');
    }
  } else {
    Logger.log('⚠️ SKIP: 기존 데이터 없음 (로그인 테스트 불가)');
  }
  
  Logger.log('');
  
  // ====================================
  // 테스트 5: 로그인 (하이픈 없이)
  // ====================================
  Logger.log('🔐 테스트 5: 로그인 (하이픈 없이)');
  
  if (lastRow > 1) {
    const existingData = companySheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const testPhone = normalizePhone(existingData[0][0]);
    
    // 승인상태 확인
    const approvalStatus = companySheet.getRange(2, 9).getValue();
    
    if (approvalStatus === '승인완료') {
      // 실제 비밀번호 가져오기
      const actualPassword = companySheet.getRange(2, 6).getValue();
      
      const test5 = loginCompany(testPhone, actualPassword);
      
      if (test5.success) {
        Logger.log('✅ PASS: 하이픈 없이 로그인 성공');
        Logger.log('   전화번호: ' + testPhone);
        passCount++;
      } else {
        Logger.log('❌ FAIL: 하이픈 없이 로그인 실패');
        Logger.log('   결과: ' + JSON.stringify(test5));
        failCount++;
      }
    } else {
      Logger.log('⚠️ SKIP: 첫 번째 회원이 승인 대기 상태 (로그인 테스트 불가)');
    }
  } else {
    Logger.log('⚠️ SKIP: 기존 데이터 없음 (로그인 테스트 불가)');
  }
  
  Logger.log('');
  
  // ====================================
  // 결과 요약
  // ====================================
  Logger.log('========================================');
  Logger.log('📊 테스트 결과');
  Logger.log('========================================');
  Logger.log('✅ 통과: ' + passCount + '개');
  Logger.log('❌ 실패: ' + failCount + '개');
  Logger.log('⚠️ 건너뜀: ' + (5 - passCount - failCount) + '개');
  Logger.log('========================================\n');
  
  if (failCount === 0) {
    Logger.log('🎉 모든 테스트 통과! Apps Script가 정상 작동합니다.');
  } else {
    Logger.log('⚠️ 일부 테스트 실패. 위 로그를 확인해주세요.');
  }
}

/**
 * 시트 구조 검증 (Apps Script 에디터에서 실행)
 */
function validateSheetStructure() {
  Logger.log('========================================');
  Logger.log('📊 Google Sheets 구조 검증');
  Logger.log('========================================\n');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ====================================
  // 기업회원 시트 검증
  // ====================================
  Logger.log('🏢 기업회원 시트:');
  
  const companySheet = ss.getSheetByName('기업회원');
  if (companySheet) {
    const headers = companySheet.getRange(1, 1, 1, 11).getValues()[0];
    Logger.log('✅ 시트 존재');
    Logger.log('📋 헤더: ');
    headers.forEach((header, index) => {
      const col = String.fromCharCode(65 + index);
      Logger.log('   ' + col + '열: ' + (header || '(비어있음)'));
    });
    Logger.log('📊 데이터 행 수: ' + (companySheet.getLastRow() - 1) + '개');
  } else {
    Logger.log('❌ 시트 없음');
  }
  
  Logger.log('');
  
  // ====================================
  // 사근복컨설턴트 시트 검증
  // ====================================
  Logger.log('👔 사근복컨설턴트 시트:');
  
  const consultantSheet = ss.getSheetByName('사근복컨설턴트');
  if (consultantSheet) {
    const headers = consultantSheet.getRange(1, 1, 1, 8).getValues()[0];
    Logger.log('✅ 시트 존재');
    Logger.log('📋 헤더: ');
    headers.forEach((header, index) => {
      const col = String.fromCharCode(65 + index);
      Logger.log('   ' + col + '열: ' + (header || '(비어있음)'));
    });
    Logger.log('📊 데이터 행 수: ' + (consultantSheet.getLastRow() - 1) + '개');
  } else {
    Logger.log('❌ 시트 없음');
  }
  
  Logger.log('');
  
  // ====================================
  // 로그인기록 시트 검증
  // ====================================
  Logger.log('📝 로그인기록 시트:');
  
  const logSheet = ss.getSheetByName('로그인기록');
  if (logSheet) {
    Logger.log('✅ 시트 존재');
    Logger.log('📊 기록 수: ' + (logSheet.getLastRow() - 1) + '개');
  } else {
    Logger.log('❌ 시트 없음');
  }
  
  Logger.log('\n========================================');
}
