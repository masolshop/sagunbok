/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.1 - JSON DB 이중 백업 + Hybrid Request 지원
 * 
 * 주요 변경사항 (v6.1):
 * - POST와 GET 요청 모두 지원
 * - URL 파라미터로도 데이터 전달 가능
 * - CORS 문제 해결
 * 
 * 기존 기능 (v6.0):
 * - Google Drive JSON 파일 자동 생성/업데이트
 * - members_all.json: 전체 회원 DB
 * - members_by_consultant.json: 컨설턴트별 추천 회원 DB
 * - 회원가입/승인 시 자동 동기화
 */

// 스프레드시트 ID
const SPREADSHEET_ID = '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc';

// 시트 이름
const SHEET_COMPANIES = '기업회원';
const SHEET_CONSULTANTS = '사근복컨설턴트';
const SHEET_LOGS = '로그기록';

// JSON 파일 이름
const JSON_ALL_MEMBERS = 'sagunbok_members_all.json';
const JSON_BY_CONSULTANT = 'sagunbok_members_by_consultant.json';

// 승인 상태
const STATUS_PENDING = '승인대기';
const STATUS_APPROVED = '승인완료';
const STATUS_REJECTED = '승인거부';

/**
 * 요청 데이터 파싱 (POST + GET 통합)
 */
function parseRequestData(e) {
  try {
    // POST 데이터가 있으면 POST 우선
    if (e && e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
    
    // GET 파라미터 사용
    if (e && e.parameter) {
      return e.parameter;
    }
    
    return {};
  } catch (error) {
    console.error('데이터 파싱 실패:', error);
    return {};
  }
}

// ... (나머지 함수들은 동일)
/**
 * 한국 시간(KST) 문자열 반환
 */
function getKSTTimestamp() {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const year = kstTime.getUTCFullYear();
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getUTCDate()).padStart(2, '0');
  const hour = String(kstTime.getUTCHours()).padStart(2, '0');
  const minute = String(kstTime.getUTCMinutes()).padStart(2, '0');
  const second = String(kstTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 로그 기록 함수
 */
function writeLog(actionType, userType, userId, details, status = '성공', errorMsg = '') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName(SHEET_LOGS);
    
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEET_LOGS);
      logSheet.appendRow([
        '타임스탬프',
        '액션유형',
        '사용자유형',
        '사용자ID',
        '상세내용',
        'IP주소',
        '상태',
        '에러메시지'
      ]);
    }
    
    const timestamp = getKSTTimestamp();
    const ipAddress = '';
    
    logSheet.appendRow([
      timestamp,
      actionType,
      userType,
      userId,
      details,
      ipAddress,
      status,
      errorMsg
    ]);
    
  } catch (error) {
    console.error('로그 기록 실패:', error);
  }
}

/**
 * Google Drive에서 JSON 파일 찾기 또는 생성
 */
function getOrCreateJsonFile(fileName) {
  try {
    const files = DriveApp.getFilesByName(fileName);
    
    if (files.hasNext()) {
      return files.next();
    } else {
      // 파일이 없으면 새로 생성
      const initialData = (fileName === JSON_ALL_MEMBERS) 
        ? { members: [], lastUpdated: getKSTTimestamp() }
        : { consultants: {}, lastUpdated: getKSTTimestamp() };
      
      const blob = Utilities.newBlob(JSON.stringify(initialData, null, 2), 'application/json', fileName);
      return DriveApp.createFile(blob);
    }
  } catch (error) {
    console.error('JSON 파일 생성 실패:', error);
    return null;
  }
}

/**
 * Google Sheets에서 전체 회원 데이터 읽기
 */
function readAllMembersFromSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const members = [];
  
  // 1. 기업회원
  const companySheet = ss.getSheetByName(SHEET_COMPANIES);
  if (companySheet) {
    const companyData = companySheet.getDataRange().getValues();
    for (let i = 1; i < companyData.length; i++) {
      const row = companyData[i];
      if (row[4]) { // 전화번호가 있는 경우만
        members.push({
          type: 'company',
          companyName: String(row[0] || ''),
          companyType: String(row[1] || ''),
          referrer: String(row[2] || ''),
          name: String(row[3] || ''),
          phone: String(row[4] || ''),
          email: String(row[5] || ''),
          registeredAt: String(row[7] || ''),
          status: String(row[8] || STATUS_PENDING)
        });
      }
    }
  }
  
  // 2. 사근복컨설턴트
  const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
  if (consultantSheet) {
    const consultantData = consultantSheet.getDataRange().getValues();
    for (let i = 1; i < consultantData.length; i++) {
      const row = consultantData[i];
      if (row[1]) { // 전화번호가 있는 경우만
        members.push({
          type: 'consultant',
          name: String(row[0] || ''),
          phone: String(row[1] || ''),
          email: String(row[2] || ''),
          position: String(row[3] || ''),
          division: String(row[4] || ''),
          branch: String(row[5] || ''),
          registeredAt: String(row[7] || ''),
          status: String(row[8] || STATUS_PENDING)
        });
      }
    }
  }
  
  return members;
}

/**
 * 전체 회원 JSON 업데이트
 */
function updateAllMembersJson() {
  try {
    const members = readAllMembersFromSheets();
    
    const jsonData = {
      members: members,
      lastUpdated: getKSTTimestamp(),
      totalCount: members.length,
      companyCount: members.filter(m => m.type === 'company').length,
      consultantCount: members.filter(m => m.type === 'consultant').length,
      stats: {
        pending: members.filter(m => m.status === STATUS_PENDING).length,
        approved: members.filter(m => m.status === STATUS_APPROVED).length,
        rejected: members.filter(m => m.status === STATUS_REJECTED).length
      }
    };
    
    const file = getOrCreateJsonFile(JSON_ALL_MEMBERS);
    if (file) {
      file.setContent(JSON.stringify(jsonData, null, 2));
      writeLog('JSON업데이트', '시스템', 'AUTO', `전체 회원 JSON 업데이트 완료 (${members.length}명)`, '성공');
      return true;
    }
    
    return false;
  } catch (error) {
    writeLog('JSON업데이트', '시스템', 'AUTO', 'JSON 업데이트 실패', '실패', error.toString());
    return false;
  }
}

/**
 * 컨설턴트별 추천 회원 JSON 업데이트
 */
function updateByConsultantJson() {
  try {
    const members = readAllMembersFromSheets();
    const byConsultant = {};
    
    // 컨설턴트별로 그룹화
    members.forEach(member => {
      if (member.type === 'company' && member.referrer) {
        const referrer = member.referrer;
        if (!byConsultant[referrer]) {
          byConsultant[referrer] = {
            consultantName: referrer,
            members: [],
            totalCount: 0,
            stats: {
              pending: 0,
              approved: 0,
              rejected: 0
            }
          };
        }
        
        byConsultant[referrer].members.push(member);
        byConsultant[referrer].totalCount++;
        
        if (member.status === STATUS_PENDING) byConsultant[referrer].stats.pending++;
        if (member.status === STATUS_APPROVED) byConsultant[referrer].stats.approved++;
        if (member.status === STATUS_REJECTED) byConsultant[referrer].stats.rejected++;
      }
    });
    
    const jsonData = {
      consultants: byConsultant,
      lastUpdated: getKSTTimestamp(),
      consultantCount: Object.keys(byConsultant).length
    };
    
    const file = getOrCreateJsonFile(JSON_BY_CONSULTANT);
    if (file) {
      file.setContent(JSON.stringify(jsonData, null, 2));
      writeLog('JSON업데이트', '시스템', 'AUTO', `컨설턴트별 JSON 업데이트 완료 (${Object.keys(byConsultant).length}명)`, '성공');
      return true;
    }
    
    return false;
  } catch (error) {
    writeLog('JSON업데이트', '시스템', 'AUTO', 'JSON 업데이트 실패', '실패', error.toString());
    return false;
  }
}

/**
 * 전체 JSON 동기화
 */
function syncAllJsonFiles() {
  const result1 = updateAllMembersJson();
  const result2 = updateByConsultantJson();
  
  return {
    success: result1 && result2,
    message: result1 && result2 ? 'JSON 동기화 완료' : 'JSON 동기화 실패'
  };
}

/**
 * JSON 파일 다운로드 URL 가져오기
 */
function getJsonDownloadUrls() {
  try {
    const allMembersFile = getOrCreateJsonFile(JSON_ALL_MEMBERS);
    const byConsultantFile = getOrCreateJsonFile(JSON_BY_CONSULTANT);
    
    return {
      success: true,
      urls: {
        allMembers: allMembersFile ? `https://drive.google.com/uc?export=download&id=${allMembersFile.getId()}` : null,
        byConsultant: byConsultantFile ? `https://drive.google.com/uc?export=download&id=${byConsultantFile.getId()}` : null
      },
      fileIds: {
        allMembers: allMembersFile ? allMembersFile.getId() : null,
        byConsultant: byConsultantFile ? byConsultantFile.getId() : null
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 전체 회원 조회 (Google Sheets 기반)
 */
function getAllMembers() {
  try {
    const members = readAllMembersFromSheets();
    
    writeLog('회원조회', '관리자', 'ADMIN', `총 ${members.length}명 조회`, '성공');
    
    return {
      success: true,
      members: members
    };
    
  } catch (error) {
    writeLog('회원조회', '관리자', 'ADMIN', 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '회원 조회 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 회원 승인 상태 업데이트 + JSON 자동 동기화
 */
function updateMemberStatus(phone, type, newStatus) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (![STATUS_PENDING, STATUS_APPROVED, STATUS_REJECTED].includes(newStatus)) {
      return {
        success: false,
        error: '유효하지 않은 상태 값입니다.'
      };
    }
    
    const sheetName = (type === 'company') ? SHEET_COMPANIES : SHEET_CONSULTANTS;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        error: '시트를 찾을 수 없습니다.'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const phoneCol = (type === 'company') ? 4 : 1;
    const statusCol = 8;
    
    for (let i = 1; i < data.length; i++) {
      const existingPhone = String(data[i][phoneCol]).trim();
      if (existingPhone === phone) {
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        
        const userName = (type === 'company') ? data[i][3] : data[i][0];
        writeLog(
          '승인상태변경', 
          type === 'company' ? '기업회원' : '사근복컨설턴트', 
          phone, 
          `${userName} 상태 변경: ${newStatus}`, 
          '성공'
        );
        
        // JSON 자동 동기화
        syncAllJsonFiles();
        
        return {
          success: true,
          message: '승인 상태가 업데이트되었습니다.'
        };
      }
    }
    
    return {
      success: false,
      error: '해당 전화번호를 가진 회원을 찾을 수 없습니다.'
    };
    
  } catch (error) {
    writeLog('승인상태변경', type, phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '상태 업데이트 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 기업회원 로그인
 */
function loginCompany(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_COMPANIES);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const existingPhone = String(row[4]).trim();
      
      if (existingPhone === phone) {
        const status = String(row[8]).trim();
        
        if (status !== STATUS_APPROVED) {
          writeLog('로그인', '기업회원', phone, '승인되지 않은 계정', '실패', `현재 상태: ${status}`);
          return {
            success: false,
            error: '관리자 승인이 필요합니다. 현재 상태: ' + status
          };
        }
        
        const storedPassword = String(row[6]).trim();
        
        if (storedPassword === password) {
          writeLog('로그인', '기업회원', phone, '로그인 성공', '성공');
          return {
            success: true,
            user: {
              userType: 'company',
              companyName: String(row[0]),
              companyType: String(row[1]),
              referrer: String(row[2]),
              name: String(row[3]),
              phone: String(row[4]),
              email: String(row[5])
            }
          };
        } else {
          writeLog('로그인', '기업회원', phone, '비밀번호 불일치', '실패');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    writeLog('로그인', '기업회원', phone, '등록되지 않은 전화번호', '실패');
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
 * 컨설턴트 로그인
 */
function loginConsultant(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_CONSULTANTS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const existingPhone = String(row[1]).trim();
      
      if (existingPhone === phone) {
        const status = String(row[8]).trim();
        
        if (status !== STATUS_APPROVED) {
          writeLog('로그인', '사근복컨설턴트', phone, '승인되지 않은 계정', '실패', `현재 상태: ${status}`);
          return {
            success: false,
            error: '관리자 승인이 필요합니다. 현재 상태: ' + status
          };
        }
        
        const storedPassword = String(row[6]).trim();
        
        if (storedPassword === password) {
          writeLog('로그인', '사근복컨설턴트', phone, '로그인 성공', '성공');
          return {
            success: true,
            user: {
              userType: 'consultant',
              name: String(row[0]),
              phone: String(row[1]),
              email: String(row[2]),
              position: String(row[3]),
              division: String(row[4]),
              branch: String(row[5])
            }
          };
        } else {
          writeLog('로그인', '사근복컨설턴트', phone, '비밀번호 불일치', '실패');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    writeLog('로그인', '사근복컨설턴트', phone, '등록되지 않은 전화번호', '실패');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
    
  } catch (error) {
    writeLog('로그인', '사근복컨설턴트', phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 기업회원 회원가입 + JSON 자동 동기화
 */
function registerCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companySheet = ss.getSheetByName(SHEET_COMPANIES);
    
    const companyData = companySheet.getDataRange().getValues();
    for (let i = 1; i < companyData.length; i++) {
      const existingPhone = String(companyData[i][4]).trim();
      if (existingPhone === data.phone) {
        writeLog('회원가입', '기업회원', data.phone, '중복 전화번호', '실패', '이미 등록된 전화번호입니다');
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    const timestamp = getKSTTimestamp();
    
    companySheet.appendRow([
      data.companyName,
      data.companyType,
      data.referrer,
      data.name,
      data.phone,
      data.email,
      data.password,
      timestamp,
      STATUS_PENDING
    ]);
    
    writeLog('회원가입', '기업회원', data.phone, `회원가입 완료: ${data.companyName}`, '성공');
    
    // JSON 자동 동기화
    syncAllJsonFiles();
    
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
 * 컨설턴트 회원가입 + JSON 자동 동기화
 */
function registerConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
    
    const consultantData = consultantSheet.getDataRange().getValues();
    for (let i = 1; i < consultantData.length; i++) {
      const existingPhone = String(consultantData[i][1]).trim();
      if (existingPhone === data.phone) {
        writeLog('회원가입', '사근복컨설턴트', data.phone, '중복 전화번호', '실패', '이미 등록된 전화번호입니다');
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    const timestamp = getKSTTimestamp();
    const defaultPassword = '12345';
    
    consultantSheet.appendRow([
      data.name,
      data.phone,
      data.email,
      data.position,
      data.division,
      data.branch,
      defaultPassword,
      timestamp,
      STATUS_PENDING
    ]);
    
    writeLog('회원가입', '사근복컨설턴트', data.phone, `회원가입 완료: ${data.name}`, '성공');
    
    // JSON 자동 동기화
    syncAllJsonFiles();
    
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
 * GET 요청 처리
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      version: '6.0',
      timestamp: getKSTTimestamp(),
      message: '사근복 AI Apps Script v6.0 - JSON DB 이중 백업 시스템'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리
 */

/**
 * GET 요청 처리 (확장)
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
      version: '6.1',
      timestamp: getKSTTimestamp(),
      message: '사근복 AI Apps Script v6.1 - Hybrid Request 지원'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리 (GET도 지원)
 */
function doPost(e) {
  try {
    const data = parseRequestData(e);
    
    if (data.action === 'loginCompany') {
      return ContentService
        .createTextOutput(JSON.stringify(loginCompany(data.phone, data.password)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'loginConsultant') {
      return ContentService
        .createTextOutput(JSON.stringify(loginConsultant(data.phone, data.password)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'registerCompany') {
      return ContentService
        .createTextOutput(JSON.stringify(registerCompany(data)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'registerConsultant') {
      return ContentService
        .createTextOutput(JSON.stringify(registerConsultant(data)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'getAllMembers') {
      return ContentService
        .createTextOutput(JSON.stringify(getAllMembers()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'updateMemberStatus') {
      return ContentService
        .createTextOutput(JSON.stringify(updateMemberStatus(data.phone, data.type, data.status)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'syncJson') {
      return ContentService
        .createTextOutput(JSON.stringify(syncAllJsonFiles()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'getJsonUrls') {
      return ContentService
        .createTextOutput(JSON.stringify(getJsonDownloadUrls()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: '알 수 없는 액션입니다.' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
/**
 * 사근복 AI - 이메일 알림 시스템 v6.2
 * 
 * 알림 종류:
 * 1. 컨설턴트 회원가입 → 관리자, 컨설턴트 본인
 * 2. 컨설턴트 승인 → 컨설턴트 본인
 * 3. 기업회원 가입 → 관리자, 기업회원 본인, 추천인 컨설턴트
 * 4. 기업회원 승인 → 기업회원 본인
 */

// ========================================
// 설정
// ========================================

// 관리자 이메일
const ADMIN_EMAIL = 'admin@sagunbok.com'; // TODO: 실제 관리자 이메일로 변경

// 이메일 발신자 이름
const SENDER_NAME = '사근복 AI';

// ========================================
// 이메일 템플릿
// ========================================

/**
 * 이메일 HTML 공통 스타일
 */
function getEmailStyle() {
  return `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Segoe UI', sans-serif;
        line-height: 1.6;
        color: #333333;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .email-container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .email-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 30px;
        text-align: center;
      }
      .email-header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }
      .email-header p {
        margin: 10px 0 0 0;
        font-size: 16px;
        opacity: 0.95;
      }
      .email-body {
        padding: 40px 30px;
      }
      .info-box {
        background-color: #f8f9fa;
        border-left: 4px solid #667eea;
        padding: 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .info-row {
        margin: 12px 0;
      }
      .info-label {
        font-weight: 600;
        color: #555;
        display: inline-block;
        width: 120px;
      }
      .info-value {
        color: #333;
      }
      .status-badge {
        display: inline-block;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
      }
      .status-pending {
        background-color: #fff3cd;
        color: #856404;
      }
      .status-approved {
        background-color: #d4edda;
        color: #155724;
      }
      .cta-button {
        display: inline-block;
        padding: 14px 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 20px 0;
        text-align: center;
      }
      .email-footer {
        background-color: #f8f9fa;
        padding: 30px;
        text-align: center;
        color: #666;
        font-size: 14px;
      }
      .divider {
        height: 1px;
        background-color: #e0e0e0;
        margin: 30px 0;
      }
    </style>
  `;
}

/**
 * 1. 컨설턴트 회원가입 - 관리자용
 */
function getConsultantSignupAdminEmail(consultantData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${getEmailStyle()}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🔔 새로운 컨설턴트 가입</h1>
      <p>승인 대기 중인 컨설턴트가 있습니다</p>
    </div>
    <div class="email-body">
      <p><strong>관리자님, 안녕하세요!</strong></p>
      <p>새로운 사근복컨설턴트가 가입했습니다. 승인이 필요합니다.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">이름:</span>
          <span class="info-value">${consultantData.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">전화번호:</span>
          <span class="info-value">${consultantData.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">이메일:</span>
          <span class="info-value">${consultantData.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">직함:</span>
          <span class="info-value">${consultantData.position}</span>
        </div>
        <div class="info-row">
          <span class="info-label">소속사업단:</span>
          <span class="info-value">${consultantData.division}</span>
        </div>
        <div class="info-row">
          <span class="info-label">소속지사:</span>
          <span class="info-value">${consultantData.branch}</span>
        </div>
        <div class="info-row">
          <span class="info-label">가입일:</span>
          <span class="info-value">${consultantData.registeredAt}</span>
        </div>
        <div class="info-row">
          <span class="info-label">상태:</span>
          <span class="status-badge status-pending">승인대기</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="http://3.34.186.174/" class="cta-button">
          관리자 대시보드에서 승인하기
        </a>
      </div>
      
      <div class="divider"></div>
      
      <p style="color: #666; font-size: 14px;">
        💡 <strong>알림:</strong> 컨설턴트 승인 후 회원님이 추천하는 기업회원을 관리할 수 있습니다.
      </p>
    </div>
    <div class="email-footer">
      <p>이 이메일은 사근복 AI 시스템에서 자동으로 발송되었습니다.</p>
      <p>© 2026 사근복 AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 2. 컨설턴트 회원가입 - 본인용
 */
function getConsultantSignupUserEmail(consultantData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${getEmailStyle()}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🎉 회원가입 신청 완료</h1>
      <p>사근복 AI에 오신 것을 환영합니다</p>
    </div>
    <div class="email-body">
      <p><strong>${consultantData.name}님, 안녕하세요!</strong></p>
      <p>사근복컨설턴트 회원가입 신청이 완료되었습니다.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">이름:</span>
          <span class="info-value">${consultantData.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">전화번호:</span>
          <span class="info-value">${consultantData.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">이메일:</span>
          <span class="info-value">${consultantData.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">직함:</span>
          <span class="info-value">${consultantData.position}</span>
        </div>
        <div class="info-row">
          <span class="info-label">소속사업단:</span>
          <span class="info-value">${consultantData.division}</span>
        </div>
        <div class="info-row">
          <span class="info-label">소속지사:</span>
          <span class="info-value">${consultantData.branch}</span>
        </div>
        <div class="info-row">
          <span class="info-label">초기 비밀번호:</span>
          <span class="info-value" style="background-color: #fff3cd; padding: 4px 8px; border-radius: 4px; font-weight: 600;">12345</span>
        </div>
        <div class="info-row">
          <span class="info-label">상태:</span>
          <span class="status-badge status-pending">승인대기</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: #667eea;">📌 다음 단계</h3>
      <ol style="line-height: 2;">
        <li><strong>관리자 승인 대기:</strong> 관리자가 회원님의 정보를 확인하고 승인합니다.</li>
        <li><strong>승인 완료 알림:</strong> 승인이 완료되면 이메일로 알림을 받습니다.</li>
        <li><strong>로그인:</strong> 승인 후 초기 비밀번호(12345)로 로그인하세요.</li>
        <li><strong>비밀번호 변경:</strong> 로그인 후 반드시 비밀번호를 변경해주세요.</li>
      </ol>
      
      <div class="divider"></div>
      
      <p style="color: #666; font-size: 14px;">
        ⚠️ <strong>보안 안내:</strong> 초기 비밀번호는 보안을 위해 로그인 후 즉시 변경해주시기 바랍니다.
      </p>
    </div>
    <div class="email-footer">
      <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
      <p>© 2026 사근복 AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 3. 컨설턴트 승인 완료 - 본인용
 */
function getConsultantApprovedEmail(consultantData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${getEmailStyle()}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>✅ 회원 승인 완료</h1>
      <p>이제 사근복 AI를 이용하실 수 있습니다</p>
    </div>
    <div class="email-body">
      <p><strong>${consultantData.name}님, 축하합니다! 🎉</strong></p>
      <p>사근복컨설턴트 회원 승인이 완료되었습니다. 이제 모든 기능을 이용하실 수 있습니다.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">이름:</span>
          <span class="info-value">${consultantData.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">전화번호:</span>
          <span class="info-value">${consultantData.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">이메일:</span>
          <span class="info-value">${consultantData.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">직함:</span>
          <span class="info-value">${consultantData.position}</span>
        </div>
        <div class="info-row">
          <span class="info-label">상태:</span>
          <span class="status-badge status-approved">승인완료</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="http://3.34.186.174/" class="cta-button">
          지금 로그인하기
        </a>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: #667eea;">🚀 이용 가능한 기능</h3>
      <ul style="line-height: 2;">
        <li>✅ 기업회원 추천 및 관리</li>
        <li>✅ 추천한 기업회원 현황 조회</li>
        <li>✅ 회원 데이터 다운로드</li>
        <li>✅ 실시간 통계 확인</li>
      </ul>
      
      <div class="divider"></div>
      
      <p style="color: #666; font-size: 14px;">
        💡 <strong>Tip:</strong> 로그인 후 프로필에서 비밀번호를 변경하세요.
      </p>
    </div>
    <div class="email-footer">
      <p>사근복 AI와 함께 성공적인 비즈니스를 만들어가세요!</p>
      <p>© 2026 사근복 AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 4. 기업회원 가입 - 관리자용
 */
function getCompanySignupAdminEmail(companyData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${getEmailStyle()}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🔔 새로운 기업회원 가입</h1>
      <p>승인 대기 중인 기업회원이 있습니다</p>
    </div>
    <div class="email-body">
      <p><strong>관리자님, 안녕하세요!</strong></p>
      <p>새로운 기업회원이 가입했습니다. 승인이 필요합니다.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">회사명:</span>
          <span class="info-value">${companyData.companyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">회원분류:</span>
          <span class="info-value">${companyData.companyType}</span>
        </div>
        <div class="info-row">
          <span class="info-label">추천인:</span>
          <span class="info-value">${companyData.referrer || '없음'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">담당자:</span>
          <span class="info-value">${companyData.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">전화번호:</span>
          <span class="info-value">${companyData.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">이메일:</span>
          <span class="info-value">${companyData.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">가입일:</span>
          <span class="info-value">${companyData.registeredAt}</span>
        </div>
        <div class="info-row">
          <span class="info-label">상태:</span>
          <span class="status-badge status-pending">승인대기</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="http://3.34.186.174/" class="cta-button">
          관리자 대시보드에서 승인하기
        </a>
      </div>
    </div>
    <div class="email-footer">
      <p>이 이메일은 사근복 AI 시스템에서 자동으로 발송되었습니다.</p>
      <p>© 2026 사근복 AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 5. 기업회원 가입 - 본인용
 */
function getCompanySignupUserEmail(companyData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${getEmailStyle()}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🎉 회원가입 신청 완료</h1>
      <p>사근복 AI에 오신 것을 환영합니다</p>
    </div>
    <div class="email-body">
      <p><strong>${companyData.name}님, 안녕하세요!</strong></p>
      <p>기업회원 가입 신청이 완료되었습니다.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">회사명:</span>
          <span class="info-value">${companyData.companyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">회원분류:</span>
          <span class="info-value">${companyData.companyType}</span>
        </div>
        <div class="info-row">
          <span class="info-label">추천인:</span>
          <span class="info-value">${companyData.referrer || '없음'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">담당자:</span>
          <span class="info-value">${companyData.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">전화번호:</span>
          <span class="info-value">${companyData.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">이메일:</span>
          <span class="info-value">${companyData.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">상태:</span>
          <span class="status-badge status-pending">승인대기</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: #667eea;">📌 다음 단계</h3>
      <ol style="line-height: 2;">
        <li><strong>관리자 승인 대기:</strong> 관리자가 회원님의 정보를 확인하고 승인합니다.</li>
        <li><strong>승인 완료 알림:</strong> 승인이 완료되면 이메일로 알림을 받습니다.</li>
        <li><strong>로그인:</strong> 승인 후 설정한 비밀번호로 로그인하세요.</li>
        <li><strong>서비스 이용:</strong> 사근복 AI의 모든 기능을 이용하실 수 있습니다.</li>
      </ol>
    </div>
    <div class="email-footer">
      <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
      <p>© 2026 사근복 AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 6. 기업회원 가입 - 추천인 컨설턴트용
 */
function getCompanySignupReferrerEmail(companyData, consultantEmail) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${getEmailStyle()}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>🎯 추천한 기업회원 가입</h1>
      <p>회원님이 추천한 기업회원이 가입했습니다</p>
    </div>
    <div class="email-body">
      <p><strong>${companyData.referrer}님, 안녕하세요!</strong></p>
      <p>회원님을 추천인으로 하여 새로운 기업회원이 가입했습니다.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">회사명:</span>
          <span class="info-value">${companyData.companyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">회원분류:</span>
          <span class="info-value">${companyData.companyType}</span>
        </div>
        <div class="info-row">
          <span class="info-label">담당자:</span>
          <span class="info-value">${companyData.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">전화번호:</span>
          <span class="info-value">${companyData.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">이메일:</span>
          <span class="info-value">${companyData.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">가입일:</span>
          <span class="info-value">${companyData.registeredAt}</span>
        </div>
        <div class="info-row">
          <span class="info-label">상태:</span>
          <span class="status-badge status-pending">승인대기</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="http://3.34.186.174/" class="cta-button">
          내 추천 회원 보기
        </a>
      </div>
      
      <div class="divider"></div>
      
      <p style="color: #666; font-size: 14px;">
        💡 <strong>알림:</strong> 관리자가 승인하면 회원님의 추천 목록에 추가됩니다.
      </p>
    </div>
    <div class="email-footer">
      <p>사근복 AI와 함께 성공적인 비즈니스를 만들어가세요!</p>
      <p>© 2026 사근복 AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 7. 기업회원 승인 완료 - 본인용
 */
function getCompanyApprovedEmail(companyData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${getEmailStyle()}
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>✅ 회원 승인 완료</h1>
      <p>이제 사근복 AI를 이용하실 수 있습니다</p>
    </div>
    <div class="email-body">
      <p><strong>${companyData.name}님, 축하합니다! 🎉</strong></p>
      <p>기업회원 승인이 완료되었습니다. 이제 모든 기능을 이용하실 수 있습니다.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">회사명:</span>
          <span class="info-value">${companyData.companyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">회원분류:</span>
          <span class="info-value">${companyData.companyType}</span>
        </div>
        <div class="info-row">
          <span class="info-label">담당자:</span>
          <span class="info-value">${companyData.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">전화번호:</span>
          <span class="info-value">${companyData.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">상태:</span>
          <span class="status-badge status-approved">승인완료</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="http://3.34.186.174/" class="cta-button">
          지금 로그인하기
        </a>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="color: #667eea;">🚀 이용 가능한 기능</h3>
      <ul style="line-height: 2;">
        <li>✅ AI 컨설팅 서비스</li>
        <li>✅ 비즈니스 분석 도구</li>
        <li>✅ 맞춤형 추천 시스템</li>
        <li>✅ 실시간 데이터 확인</li>
      </ul>
      
      <div class="divider"></div>
      
      <p style="color: #666; font-size: 14px;">
        💡 <strong>Tip:</strong> 로그인 후 프로필에서 비밀번호를 변경하세요.
      </p>
    </div>
    <div class="email-footer">
      <p>사근복 AI와 함께 성공적인 비즈니스를 만들어가세요!</p>
      <p>© 2026 사근복 AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ========================================
// 이메일 발송 함수
// ========================================

/**
 * 이메일 발송 (공통)
 */
function sendEmail(to, subject, htmlBody) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: SENDER_NAME
    });
    
    writeLog('이메일발송', '시스템', to, `${subject} 발송 성공`, '성공');
    return true;
  } catch (error) {
    writeLog('이메일발송', '시스템', to, `${subject} 발송 실패`, '실패', error.toString());
    return false;
  }
}

/**
 * 컨설턴트 회원가입 시 이메일 발송
 */
function sendConsultantSignupEmails(consultantData) {
  // 1. 관리자에게 알림
  sendEmail(
    ADMIN_EMAIL,
    '[사근복 AI] 새로운 컨설턴트 가입 - 승인 필요',
    getConsultantSignupAdminEmail(consultantData)
  );
  
  // 2. 컨설턴트 본인에게 알림
  sendEmail(
    consultantData.email,
    '[사근복 AI] 회원가입 신청이 완료되었습니다',
    getConsultantSignupUserEmail(consultantData)
  );
}

/**
 * 컨설턴트 승인 시 이메일 발송
 */
function sendConsultantApprovedEmail(consultantData) {
  sendEmail(
    consultantData.email,
    '[사근복 AI] 회원 승인이 완료되었습니다 🎉',
    getConsultantApprovedEmail(consultantData)
  );
}

/**
 * 기업회원 가입 시 이메일 발송
 */
function sendCompanySignupEmails(companyData) {
  // 1. 관리자에게 알림
  sendEmail(
    ADMIN_EMAIL,
    '[사근복 AI] 새로운 기업회원 가입 - 승인 필요',
    getCompanySignupAdminEmail(companyData)
  );
  
  // 2. 기업회원 본인에게 알림
  sendEmail(
    companyData.email,
    '[사근복 AI] 회원가입 신청이 완료되었습니다',
    getCompanySignupUserEmail(companyData)
  );
  
  // 3. 추천인 컨설턴트에게 알림 (추천인이 있는 경우)
  if (companyData.referrer) {
    const consultantEmail = getConsultantEmailByName(companyData.referrer);
    if (consultantEmail) {
      sendEmail(
        consultantEmail,
        '[사근복 AI] 추천한 기업회원이 가입했습니다',
        getCompanySignupReferrerEmail(companyData, consultantEmail)
      );
    }
  }
}

/**
 * 기업회원 승인 시 이메일 발송
 */
function sendCompanyApprovedEmail(companyData) {
  sendEmail(
    companyData.email,
    '[사근복 AI] 회원 승인이 완료되었습니다 🎉',
    getCompanyApprovedEmail(companyData)
  );
}

/**
 * 컨설턴트 이름으로 이메일 찾기
 */
function getConsultantEmailByName(name) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_CONSULTANTS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === name) {
        return String(data[i][2]); // 이메일 컬럼
      }
    }
    
    return null;
  } catch (error) {
    console.error('컨설턴트 이메일 조회 실패:', error);
    return null;
  }
}

// ========================================
// 기존 함수 수정 (이메일 발송 추가)
// ========================================

/**
 * 컨설턴트 회원가입 (이메일 발송 추가)
 */
function registerConsultantWithEmail(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
    
    const consultantData = consultantSheet.getDataRange().getValues();
    for (let i = 1; i < consultantData.length; i++) {
      const existingPhone = String(consultantData[i][1]).trim();
      if (existingPhone === data.phone) {
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    const timestamp = getKSTTimestamp();
    const defaultPassword = '12345';
    
    consultantSheet.appendRow([
      data.name,
      data.phone,
      data.email,
      data.position,
      data.division,
      data.branch,
      defaultPassword,
      timestamp,
      STATUS_PENDING
    ]);
    
    writeLog('회원가입', '사근복컨설턴트', data.phone, `회원가입 완료: ${data.name}`, '성공');
    
    // 이메일 발송
    const emailData = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      position: data.position,
      division: data.division,
      branch: data.branch,
      registeredAt: timestamp
    };
    sendConsultantSignupEmails(emailData);
    
    // JSON 자동 동기화
    syncAllJsonFiles();
    
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
 * 기업회원 회원가입 (이메일 발송 추가)
 */
function registerCompanyWithEmail(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companySheet = ss.getSheetByName(SHEET_COMPANIES);
    
    const companyData = companySheet.getDataRange().getValues();
    for (let i = 1; i < companyData.length; i++) {
      const existingPhone = String(companyData[i][4]).trim();
      if (existingPhone === data.phone) {
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    const timestamp = getKSTTimestamp();
    
    companySheet.appendRow([
      data.companyName,
      data.companyType,
      data.referrer,
      data.name,
      data.phone,
      data.email,
      data.password,
      timestamp,
      STATUS_PENDING
    ]);
    
    writeLog('회원가입', '기업회원', data.phone, `회원가입 완료: ${data.companyName}`, '성공');
    
    // 이메일 발송
    const emailData = {
      companyName: data.companyName,
      companyType: data.companyType,
      referrer: data.referrer,
      name: data.name,
      phone: data.phone,
      email: data.email,
      registeredAt: timestamp
    };
    sendCompanySignupEmails(emailData);
    
    // JSON 자동 동기화
    syncAllJsonFiles();
    
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
 * 회원 승인 상태 업데이트 (이메일 발송 추가)
 */
function updateMemberStatusWithEmail(phone, type, newStatus) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (![STATUS_PENDING, STATUS_APPROVED, STATUS_REJECTED].includes(newStatus)) {
      return {
        success: false,
        error: '유효하지 않은 상태 값입니다.'
      };
    }
    
    const sheetName = (type === 'company') ? SHEET_COMPANIES : SHEET_CONSULTANTS;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        error: '시트를 찾을 수 없습니다.'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const phoneCol = (type === 'company') ? 4 : 1;
    const statusCol = 8;
    
    for (let i = 1; i < data.length; i++) {
      const existingPhone = String(data[i][phoneCol]).trim();
      if (existingPhone === phone) {
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        
        const userName = (type === 'company') ? data[i][3] : data[i][0];
        const userEmail = (type === 'company') ? data[i][5] : data[i][2];
        
        writeLog(
          '승인상태변경', 
          type === 'company' ? '기업회원' : '사근복컨설턴트', 
          phone, 
          `${userName} 상태 변경: ${newStatus}`, 
          '성공'
        );
        
        // 승인 완료 시 이메일 발송
        if (newStatus === STATUS_APPROVED) {
          if (type === 'company') {
            const emailData = {
              companyName: data[i][0],
              companyType: data[i][1],
              name: data[i][3],
              phone: data[i][4],
              email: userEmail
            };
            sendCompanyApprovedEmail(emailData);
          } else {
            const emailData = {
              name: data[i][0],
              phone: data[i][1],
              email: userEmail,
              position: data[i][3]
            };
            sendConsultantApprovedEmail(emailData);
          }
        }
        
        // JSON 자동 동기화
        syncAllJsonFiles();
        
        return {
          success: true,
          message: '승인 상태가 업데이트되었습니다.'
        };
      }
    }
    
    return {
      success: false,
      error: '해당 전화번호를 가진 회원을 찾을 수 없습니다.'
    };
    
  } catch (error) {
    writeLog('승인상태변경', type, phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '상태 업데이트 중 오류가 발생했습니다.'
    };
  }
}
