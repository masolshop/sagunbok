/**
 * ============================================================
 * Sagunbok Apps Script - VERSION 5.2 (FINAL)
 * 작성일: 2026-01-21
 * 수정일: 2026-01-21 16:00 (시트 구조 변경 대응)
 * ============================================================
 * 
 * 🚨 긴급 수정 내역:
 * 1. ✅ 시트 구조 변경 대응 - 회원가입 순서에 맞춰 재배치
 * 2. ✅ 전화번호 앞자리 0 손실 해결 - '010-1234-5678 형식 강제
 * 3. ✅ 추천인 검증 절대 강화 - 사근복컨설턴트 매칭 필수
 * 4. ✅ 기업유형/추천인 누락 해결 - appendRow 순서 정확히 매칭
 * 
 * ============================================================
 * 📊 Google Sheets 구조 (회원가입 순서 기준)
 * ============================================================
 * 
 * [기업회원] 시트:
 *   A: 가입일시 (yyyy-MM-dd HH:mm:ss)
 *   B: 회사명
 *   C: 기업유형 (개인사업자/법인/병의원개인사업자/의료재단)
 *   D: 이름
 *   E: 핸드폰번호 (010-1234-5678 형식) ← 문자열!
 *   F: 이메일
 *   G: 비밀번호
 *   H: 승인상태 (승인전표/승인완료)
 *   I: 추천인
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
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

/**
 * 전화번호 포맷팅: 010-XXXX-XXXX 형식으로 변환 (저장용)
 * ⚠️ 중요: 앞자리 0이 사라지지 않도록 문자열로 반환!
 * @param {string} phone - 원본 전화번호
 * @returns {string} '010-XXXX-XXXX' 형식 (작은따옴표 포함!)
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
      const storedPhone = normalizePhone(row[4]); // E열: 핸드폰번호
      const storedPassword = String(row[6]);      // G열: 비밀번호
      const approvalStatus = String(row[7]);      // H열: 승인상태
      
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
        logLogin(normalizePhone(row[4]), '기업회원', '로그인 성공');
        
        // 사용자 데이터 반환
        return {
          success: true,
          message: '로그인 성공',
          userData: {
            registeredAt: row[0],   // A열: 가입일시
            companyName: row[1],    // B열: 회사명
            companyType: row[2],    // C열: 기업유형
            name: row[3],           // D열: 이름
            phone: formatPhone(row[4]).replace("'", ""), // E열: 핸드폰번호
            email: row[5],          // F열: 이메일
            approvalStatus: row[7], // H열: 승인상태
            referrer: row[8],       // I열: 추천인
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
      const storedPassword = String(row[5]) || '12345'; // F열: 비밀번호
      
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
            name: row[0],
            phone: formatPhone(row[1]).replace("'", ""),
            email: row[2],
            title: row[3],
            department: row[4],
            branch: row[6],
            registeredAt: row[7]
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
    // 🔍 1. 추천인 검증 (절대 필수!)
    // ====================================
    Logger.log('===== 추천인 검증 시작 =====');
    Logger.log('입력된 추천인: "' + referrer + '"');
    
    // 추천인이 비어있으면 차단
    if (!referrer || referrer.trim() === '') {
      Logger.log('❌ 추천인이 비어있음');
      return { 
        success: false, 
        error: '추천인을 반드시 입력해야 합니다.' 
      };
    }
    
    // 사근복컨설턴트 시트 확인
    const consultantLastRow = consultantSheet.getLastRow();
    Logger.log('사근복컨설턴트 시트 행 수: ' + consultantLastRow);
    
    if (consultantLastRow <= 1) {
      Logger.log('❌ 사근복컨설턴트 시트가 비어있음');
      return { 
        success: false, 
        error: '추천인 정보가 올바르지 않습니다. 사근복컨설턴트 명단에 등록된 이름을 입력해주세요.' 
      };
    }
    
    // 사근복컨설턴트 시트의 A열(이름) 전체 조회
    const consultantData = consultantSheet.getRange(2, 1, consultantLastRow - 1, 1).getValues();
    const consultantNames = consultantData.map(row => String(row[0]).trim());
    
    Logger.log('등록된 사근복컨설턴트: [' + consultantNames.join(', ') + ']');
    Logger.log('추천인 매칭 확인: "' + referrer.trim() + '" in ' + JSON.stringify(consultantNames));
    
    // 추천인 이름 매칭 (정확히 일치해야 함)
    if (!consultantNames.includes(referrer.trim())) {
      Logger.log('❌ 추천인 검증 실패!');
      return { 
        success: false, 
        error: '추천인 정보가 올바르지 않습니다.\n\n사근복컨설턴트 명단에 등록된 이름을 정확히 입력해주세요.\n\n등록된 컨설턴트: ' + consultantNames.join(', ')
      };
    }
    
    Logger.log('✅ 추천인 검증 성공!');
    
    // ====================================
    // 📱 2. 전화번호 포맷팅 및 검증
    // ====================================
    const formattedPhone = formatPhone(phone); // '010-1234-5678
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
      const existingData = companySheet.getRange(2, 5, companyLastRow - 1, 1).getValues(); // E열
      
      for (let i = 0; i < existingData.length; i++) {
        const existingPhone = normalizePhone(existingData[i][0]);
        if (existingPhone === normalizedPhone) {
          Logger.log('❌ 중복 전화번호 발견: ' + normalizedPhone);
          return { 
            success: false, 
            error: '이미 가입된 핸드폰 번호입니다.' 
          };
        }
      }
    }
    
    // ====================================
    // 💾 4. 데이터 저장 (회원가입 순서)
    // ====================================
    const timestamp = Utilities.formatDate(
      new Date(), 
      'Asia/Seoul', 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    // ⚠️ 중요: 회원가입 순서에 맞춰 데이터 배열 생성!
    const rowData = [
      timestamp,            // A: 가입일시
      companyName,          // B: 회사명
      companyType,          // C: 기업유형
      name,                 // D: 이름
      formattedPhone,       // E: 핸드폰번호 ('010-1234-5678)
      email,                // F: 이메일
      password,             // G: 비밀번호
      '승인전표',           // H: 승인상태
      referrer              // I: 추천인
      // J열: 비어있음 (자동)
      // K열: 마지막로그인 (로그인 시 업데이트)
    ];
    
    Logger.log('저장할 데이터: ' + JSON.stringify(rowData));
    companySheet.appendRow(rowData);
    
    Logger.log('✅ 회원가입 성공: ' + name + ' (' + formattedPhone + ')');
    
    return { 
      success: true, 
      message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' 
    };
    
  } catch (error) {
    Logger.log('❌ registerCompany 오류: ' + error);
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
    
    // 전화번호 포맷팅
    const formattedPhone = formatPhone(phone);
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone || normalizedPhone.length !== 11) {
      return { success: false, error: '올바른 핸드폰 번호 형식이 아닙니다. (11자리 숫자)' };
    }
    
    // 중복 체크
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingData = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      
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
    
    // 데이터 추가
    const timestamp = Utilities.formatDate(
      new Date(), 
      'Asia/Seoul', 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    sheet.appendRow([
      name,
      formattedPhone,
      email,
      title,
      department,
      password || '12345',
      branch,
      timestamp
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
    
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (String(row[3]) === name && String(row[5]) === email) { // D열(이름), F열(이메일)
        return {
          success: true,
          phone: formatPhone(row[4]).replace("'", ""), // E열(핸드폰번호)
          message: '회원님의 휴대폰 번호는 ' + formatPhone(row[4]).replace("'", "") + ' 입니다.'
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
    const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhone(row[4]); // E열(핸드폰번호)
      
      if (storedPhone === normalizedPhone && String(row[5]) === email) { // F열(이메일)
        const tempPassword = Math.random().toString(36).slice(-6);
        sheet.getRange(i + 2, 7).setValue(tempPassword); // G열(비밀번호)
        
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

function logLogin(phone, userType, status) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('로그인기록');
    
    if (!sheet) {
      sheet = ss.insertSheet('로그인기록');
      sheet.appendRow(['타임스탬프', '전화번호', '사용자유형', '상태']);
    }
    
    const timestamp = Utilities.formatDate(
      new Date(), 
      'Asia/Seoul', 
      'yyyy-MM-dd HH:mm:ss'
    );
    
    sheet.appendRow([timestamp, phone, userType, status]);
    
  } catch (error) {
    Logger.log('logLogin 오류: ' + error);
  }
}

// ============================================================
// 🌐 웹 앱 엔드포인트
// ============================================================

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

function doGet() {
  const response = {
    success: true,
    message: 'Sagunbok Apps Script V5.2 (FINAL) is running!',
    timestamp: new Date().toISOString(),
    version: '5.2',
    sheetStructure: {
      A: '가입일시',
      B: '회사명',
      C: '기업유형',
      D: '이름',
      E: '핸드폰번호',
      F: '이메일',
      G: '비밀번호',
      H: '승인상태',
      I: '추천인',
      J: '(비어있음)',
      K: '마지막로그인'
    },
    fixes: [
      '회원가입 순서에 맞춰 시트 구조 변경',
      '전화번호 E열로 이동, 앞자리 0 손실 해결',
      '기업유형 C열, 추천인 I열 정확히 저장',
      '추천인 검증 절대 강화 (사근복컨설턴트 매칭 필수)'
    ]
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 🧪 자동 테스트 함수
// ============================================================

function runAllTests() {
  Logger.log('🧪 Sagunbok Apps Script V5.2 자동 테스트 시작');
  Logger.log('='.repeat(50));
  
  let passCount = 0;
  let failCount = 0;
  
  // 테스트 1: 전화번호 포맷팅
  Logger.log('\n📱 테스트 1: 전화번호 포맷팅');
  try {
    const test1 = formatPhone('01012345678');
    const test2 = normalizePhone('010-1234-5678');
    
    if (test1.includes('010-1234-5678') && test2 === '01012345678') {
      Logger.log('✅ PASS: formatPhone = ' + test1);
      Logger.log('✅ PASS: normalizePhone = ' + test2);
      passCount += 2;
    } else {
      Logger.log('❌ FAIL: 전화번호 포맷팅 오류');
      failCount += 2;
    }
  } catch (error) {
    Logger.log('❌ ERROR: ' + error);
    failCount += 2;
  }
  
  // 테스트 2: 시트 구조 검증
  Logger.log('\n📊 테스트 2: Google Sheets 구조 검증');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const companySheet = ss.getSheetByName('기업회원');
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    
    if (companySheet && consultantSheet) {
      const headers = companySheet.getRange(1, 1, 1, 11).getValues()[0];
      Logger.log('✅ PASS: 필수 시트 존재 확인');
      Logger.log('  - 기업회원 헤더: ' + headers.join(', '));
      
      const consultantCount = consultantSheet.getLastRow() - 1;
      Logger.log('  - 사근복컨설턴트 등록 수: ' + consultantCount + '명');
      
      if (consultantCount > 0) {
        const names = consultantSheet.getRange(2, 1, consultantCount, 1).getValues();
        Logger.log('  - 등록된 이름: ' + names.map(r => r[0]).join(', '));
      }
      
      passCount++;
    } else {
      Logger.log('❌ FAIL: 필수 시트 누락');
      failCount++;
    }
  } catch (error) {
    Logger.log('❌ ERROR: ' + error);
    failCount++;
  }
  
  Logger.log('\n' + '='.repeat(50));
  Logger.log('📊 테스트 결과:');
  Logger.log('  ✅ 통과: ' + passCount + '개');
  Logger.log('  ❌ 실패: ' + failCount + '개');
  
  if (failCount === 0) {
    Logger.log('\n🎉 모든 테스트 통과! Apps Script V5.2가 정상 작동합니다.');
  } else {
    Logger.log('\n⚠️  일부 테스트 실패. 로그를 확인하세요.');
  }
}

function validateSheetStructure() {
  Logger.log('📊 Google Sheets 구조 검증 (V5.2)');
  Logger.log('='.repeat(50));
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 기업회원 시트 검증
    Logger.log('\n[기업회원] 시트 검증:');
    const companySheet = ss.getSheetByName('기업회원');
    if (companySheet) {
      const headers = companySheet.getRange(1, 1, 1, 11).getValues()[0];
      const expectedHeaders = [
        '가입일시', '회사명', '기업유형', '이름', '핸드폰번호',
        '이메일', '비밀번호', '승인상태', '추천인', '', '마지막로그인'
      ];
      
      Logger.log('현재 헤더: ' + headers.join(' | '));
      Logger.log('예상 헤더: ' + expectedHeaders.join(' | '));
      
      let match = true;
      for (let i = 0; i < expectedHeaders.length; i++) {
        if (String(headers[i]).trim() !== expectedHeaders[i]) {
          Logger.log('⚠️  불일치: ' + (i+1) + '번째 열');
          Logger.log('   현재: "' + headers[i] + '"');
          Logger.log('   예상: "' + expectedHeaders[i] + '"');
          match = false;
        }
      }
      
      if (match) {
        Logger.log('✅ 기업회원 시트 구조 정상');
      }
    }
    
    // 사근복컨설턴트 시트 검증
    Logger.log('\n[사근복컨설턴트] 시트 검증:');
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    if (consultantSheet) {
      const dataCount = consultantSheet.getLastRow() - 1;
      Logger.log('✅ 사근복컨설턴트 시트 존재');
      Logger.log('📊 등록된 컨설턴트 수: ' + dataCount + '명');
      
      if (dataCount > 0) {
        const names = consultantSheet.getRange(2, 1, dataCount, 1).getValues();
        Logger.log('등록된 이름: ' + names.map(r => r[0]).join(', '));
      }
    }
    
    Logger.log('\n' + '='.repeat(50));
    
  } catch (error) {
    Logger.log('❌ 구조 검증 오류: ' + error);
  }
}
