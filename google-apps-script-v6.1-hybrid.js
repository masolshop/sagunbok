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
