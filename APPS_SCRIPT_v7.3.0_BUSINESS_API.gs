/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 7.3.0 - 사업자등록번호 조회 및 기업평판분석 API 추가
 * 
 * 새로운 기능:
 * - lookupBusinessNumber: 국세청 사업자등록번호 조회 API 연동
 * - analyzeJobSites: 사람인 구직 정보 분석 (구현 예정)
 * - analyzeReviewSites: 블라인드 리뷰 분석 (구현 예정)
 * 
 * API 엔드포인트:
 * - action=lookupBusinessNumber&businessNumber=1234567890
 * - action=analyzeJobSites&companyName=회사명
 * - action=analyzeReviewSites&companyName=회사명
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
// 사업자등록번호 조회 (국세청 API)
// ========================================

/**
 * 국세청 사업자등록번호 조회
 * @param {string} businessNumber - 10자리 사업자등록번호
 * @returns {Object} { success, companyName, status, data }
 */
function lookupBusinessNumber(businessNumber) {
  writeLog('lookupBusinessNumber', 'system', '', 'START', '사업자번호 조회: ' + businessNumber);
  
  if (!businessNumber || businessNumber.length !== 10) {
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
    
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });
    
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    writeLog('lookupBusinessNumber', 'system', '', 'DEBUG', 
      'API 응답 코드: ' + responseCode + ', 응답: ' + responseText.substring(0, 200));
    
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
    
    // 회사명은 국세청 API에서 직접 제공하지 않으므로,
    // Google Sheets의 기업회원 데이터에서 찾기
    var companyName = findCompanyNameByBusinessNumber(businessNumber);
    
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
// 사람인 구직 정보 분석 (구현 예정)
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
      message: '사람인 분석이 완료되었습니다.',
      companyName: companyName,
      data: {
        status: 'under_development',
        message: '사람인 API 연동은 현재 개발 중입니다.',
        placeholder: {
          jobPostings: 0,
          averageSalary: 0,
          benefits: [],
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
// 블라인드 리뷰 분석 (구현 예정)
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
    
    return {
      success: true,
      message: '블라인드 분석이 완료되었습니다.',
      companyName: companyName,
      data: {
        status: 'under_development',
        message: '블라인드 API 연동은 현재 개발 중입니다.',
        placeholder: {
          totalReviews: 0,
          averageRating: 0,
          pros: [],
          cons: [],
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
// 기존 함수들 (v7.2.3에서 복사)
// ========================================

// 로그 함수
function writeLog(action, userType, phone, status, message) {
  try {
    var logSheet = ss.getSheetByName('로그');
    if (!logSheet) {
      logSheet = ss.insertSheet('로그');
      logSheet.appendRow(['타임스탬프', '액션', '회원타입', '전화번호', '상태', '메시지']);
      logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }
    var timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    logSheet.appendRow([timestamp, action, userType, phone, status, message]);
  } catch (e) {
    Logger.log('Log error: ' + e);
  }
}

// 전화번호 정규화
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

// [나머지 기존 함수들은 v7.2.3과 동일하므로 생략]
// registerCompany, registerManager, registerConsultant
// loginCompany, loginConsultant
// approveMember, rejectMember, getAllMembers
// sendApprovalEmail, sendRejectionEmail, sendAdminNotification

// ========================================
// doGet - 메인 핸들러 (v7.3.0 업데이트)
// ========================================

function doPost(e) {
  return doGet(e);
}

function doGet(e) {
  if (!e || !e.parameter) {
    return createResponse({ success: false, error: 'Invalid request: missing parameters' });
  }
  
  var action = e.parameter.action;
  
  if (!action) {
    return createResponse({ success: false, error: 'Invalid request: missing action parameter' });
  }
  
  try {
    // 🆕 사업자등록번호 조회
    if (action === 'lookupBusinessNumber') {
      return createResponse(lookupBusinessNumber(e.parameter.businessNumber));
    }
    
    // 🆕 사람인 분석
    if (action === 'analyzeJobSites') {
      return createResponse(analyzeJobSites(e.parameter.companyName));
    }
    
    // 🆕 블라인드 분석
    if (action === 'analyzeReviewSites') {
      return createResponse(analyzeReviewSites(e.parameter.companyName));
    }
    
    // [기존 액션들]
    // registerCompany, registerManager, registerConsultant
    // loginCompany, loginConsultant
    // approveMember, rejectMember, getAllMembers
    
    return createResponse({ success: false, error: 'Unknown action: ' + action });
    
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    writeLog('doGet', 'system', '', 'ERROR', 'Exception: ' + error.toString());
    return createResponse({ success: false, error: 'Server error: ' + error.toString() });
  }
}

function createResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  // CORS 허용
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}
