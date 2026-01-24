/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2 - 이메일 알림 시스템 추가
 * 
 * 주요 변경사항 (v6.2):
 * - 회원가입 시 이메일 자동 발송 (관리자, 본인, 추천인)
 * - 승인 시 이메일 자동 발송 (본인)
 * - 관리자: tysagunbok@gmail.com
 * 
 * 기존 기능 (v6.1):
 * - POST와 GET 요청 모두 지원
 * - URL 파라미터로도 데이터 전달 가능
 * - JSON DB 이중 백업
 * - 회원가입/승인 시 자동 동기화
 */

// ========================================
// 설정
// ========================================

// 스프레드시트 ID
const SPREADSHEET_ID = '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc';

// 시트 이름
const SHEET_COMPANIES = '기업회원';
const SHEET_MANAGERS = '사근복매니저';
const SHEET_CONSULTANTS = '사근복컨설턴트';
const SHEET_LOGS = '로그기록';

// JSON 파일 이름
const JSON_ALL_MEMBERS = 'sagunbok_members_all.json';
const JSON_BY_CONSULTANT = 'sagunbok_members_by_consultant.json';

// 승인 상태
const STATUS_PENDING = '승인대기';
const STATUS_APPROVED = '승인완료';
const STATUS_REJECTED = '승인거부';

// 이메일 설정 (v6.2 추가)
const ADMIN_EMAIL = 'tysagunbok@gmail.com';
const SENDER_NAME = 'TY사근복헬스케어사업단';

// ========================================
// 기본 유틸리티 함수
// ========================================

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
 * 전화번호 정규화 함수
 * 다양한 형식을 "010-XXXX-XXXX" 형식으로 통일
 * 입력 예: "1012345678", "01012345678", "010-1234-5678", "010 1234 5678"
 * 출력: "010-1234-5678"
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  // 문자열로 변환 후 숫자만 추출
  let digitsOnly = String(phone).replace(/[^0-9]/g, '');
  
  // "10"으로 시작하고 10자리인 경우 "010"으로 변경
  if (digitsOnly.startsWith('10') && digitsOnly.length === 10) {
    digitsOnly = '0' + digitsOnly;
  }
  
  // 11자리 숫자를 010-XXXX-XXXX 형식으로 변환
  if (digitsOnly.length === 11 && digitsOnly.startsWith('010')) {
    return digitsOnly.substring(0, 3) + '-' + digitsOnly.substring(3, 7) + '-' + digitsOnly.substring(7);
  }
  
  // 변환 실패 시 원본 반환
  return digitsOnly;
}

/**
 * 로그인용 전화번호 비교 함수
 * 저장된 번호와 입력된 번호를 정규화하여 비교
 */
function comparePhoneNumbers(stored, input) {
  // 둘 다 숫자만 추출하여 비교
  const storedDigits = String(stored).replace(/[^0-9]/g, '');
  const inputDigits = String(input).replace(/[^0-9]/g, '');
  
  // "10"으로 시작하는 10자리를 "010"으로 변환
  let normalizedStored = storedDigits;
  let normalizedInput = inputDigits;
  
  if (normalizedStored.startsWith('10') && normalizedStored.length === 10) {
    normalizedStored = '0' + normalizedStored;
  }
  
  if (normalizedInput.startsWith('10') && normalizedInput.length === 10) {
    normalizedInput = '0' + normalizedInput;
  }
  
  return normalizedStored === normalizedInput;
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

// ========================================
// JSON 백업 시스템
// ========================================

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
  
  // 2. 사근복매니저
  const managerSheet = ss.getSheetByName(SHEET_MANAGERS);
  if (managerSheet) {
    const managerData = managerSheet.getDataRange().getValues();
    for (let i = 1; i < managerData.length; i++) {
      const row = managerData[i];
      if (row[1]) { // 전화번호가 있는 경우만
        members.push({
          type: 'manager',
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
  
  // 3. 사근복컨설턴트
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
      managerCount: members.filter(m => m.type === 'manager').length,
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

// ========================================
// 이메일 알림 시스템 (v6.2)
// ========================================

/**
 * 이메일 발송 (공통)
 */
function sendEmail(to, subject, message) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: message,
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
 * 컨설턴트 회원가입 이메일
 */
/**
 * 매니저 가입 이메일
 */
function sendManagerSignupEmails(data) {
  // 관리자에게
  sendEmail(
    ADMIN_EMAIL,
    '[사근복 AI] 새로운 매니저 가입 - 승인 필요',
    `새로운 사근복매니저가 가입했습니다.\n\n이름: ${data.name}\n전화번호: ${data.phone}\n이메일: ${data.email}\n직함: ${data.position}\n소속: ${data.division} - ${data.branch}\n가입일: ${data.registeredAt}\n\n승인이 필요합니다.\n관리자 대시보드: http://3.34.186.174/`
  );
  
  // 본인에게
  sendEmail(
    data.email,
    '[사근복 AI] 회원가입 신청이 완료되었습니다',
    `${data.name}님, 안녕하세요!\n\n사근복매니저 회원가입 신청이 완료되었습니다.\n\n이름: ${data.name}\n전화번호: ${data.phone}\n이메일: ${data.email}\n직함: ${data.position}\n소속: ${data.division} - ${data.branch}\n초기 비밀번호: 12345\n상태: 승인대기\n\n관리자 승인 후 로그인이 가능합니다.\n로그인 후 반드시 비밀번호를 변경해주세요.\n\n사근복 AI`
  );
}

/**
function sendConsultantSignupEmails(data) {
  // 관리자에게
  sendEmail(
    ADMIN_EMAIL,
    '[사근복 AI] 새로운 컨설턴트 가입 - 승인 필요',
    `새로운 사근복컨설턴트가 가입했습니다.\n\n이름: ${data.name}\n전화번호: ${data.phone}\n이메일: ${data.email}\n직함: ${data.position}\n소속: ${data.division} - ${data.branch}\n가입일: ${data.registeredAt}\n\n승인이 필요합니다.\n관리자 대시보드: http://3.34.186.174/`
  );
  
  // 본인에게
  sendEmail(
    data.email,
    '[사근복 AI] 회원가입 신청이 완료되었습니다',
    `${data.name}님, 안녕하세요!\n\n사근복컨설턴트 회원가입 신청이 완료되었습니다.\n\n이름: ${data.name}\n전화번호: ${data.phone}\n이메일: ${data.email}\n직함: ${data.position}\n소속: ${data.division} - ${data.branch}\n초기 비밀번호: 12345\n상태: 승인대기\n\n관리자 승인 후 로그인이 가능합니다.\n로그인 후 반드시 비밀번호를 변경해주세요.\n\n사근복 AI`
  );
}

/**
 * 컨설턴트 승인 이메일
 */
/**
 * 매니저 승인 이메일
 */
function sendManagerApprovedEmail(data) {
  sendEmail(
    data.email,
    '[사근복 AI] 회원 승인이 완료되었습니다 🎉',
    `${data.name}님, 축하합니다!\n\n사근복매니저 회원 승인이 완료되었습니다.\n이제 모든 기능을 이용하실 수 있습니다.\n\n이름: ${data.name}\n전화번호: ${data.phone}\n상태: 승인완료\n\n로그인하기: http://3.34.186.174/\n\n사근복 AI와 함께 성공적인 비즈니스를 만들어가세요!`
  );
}

/**
 * 컨설턴트 승인 이메일
 */
function sendConsultantApprovedEmail(data) {
  sendEmail(
    data.email,
    '[사근복 AI] 회원 승인이 완료되었습니다 🎉',
    `${data.name}님, 축하합니다!\n\n사근복컨설턴트 회원 승인이 완료되었습니다.\n이제 모든 기능을 이용하실 수 있습니다.\n\n이름: ${data.name}\n전화번호: ${data.phone}\n상태: 승인완료\n\n로그인하기: http://3.34.186.174/\n\n사근복 AI와 함께 성공적인 비즈니스를 만들어가세요!`
  );
}

/**
 * 기업회원 가입 이메일
 */
function sendCompanySignupEmails(data) {
  // 관리자에게
  sendEmail(
    ADMIN_EMAIL,
    '[사근복 AI] 새로운 기업회원 가입 - 승인 필요',
    `새로운 기업회원이 가입했습니다.\n\n회사명: ${data.companyName}\n회원분류: ${data.companyType}\n추천인: ${data.referrer || '없음'}\n담당자: ${data.name}\n전화번호: ${data.phone}\n이메일: ${data.email}\n가입일: ${data.registeredAt}\n\n승인이 필요합니다.\n관리자 대시보드: http://3.34.186.174/`
  );
  
  // 본인에게
  sendEmail(
    data.email,
    '[사근복 AI] 회원가입 신청이 완료되었습니다',
    `${data.name}님, 안녕하세요!\n\n기업회원 가입 신청이 완료되었습니다.\n\n회사명: ${data.companyName}\n회원분류: ${data.companyType}\n추천인: ${data.referrer || '없음'}\n담당자: ${data.name}\n전화번호: ${data.phone}\n상태: 승인대기\n\n관리자 승인 후 로그인이 가능합니다.\n\n사근복 AI`
  );
  
  // 추천인에게 (추천인이 있는 경우)
  if (data.referrer) {
    const consultantEmail = getConsultantEmailByName(data.referrer);
    if (consultantEmail) {
      sendEmail(
        consultantEmail,
        '[사근복 AI] 추천한 기업회원이 가입했습니다',
        `${data.referrer}님, 안녕하세요!\n\n회원님을 추천인으로 하여 새로운 기업회원이 가입했습니다.\n\n회사명: ${data.companyName}\n담당자: ${data.name}\n전화번호: ${data.phone}\n가입일: ${data.registeredAt}\n상태: 승인대기\n\n관리자 승인 후 추천 목록에 추가됩니다.\n\n사근복 AI`
      );
    }
  }
}

/**
 * 기업회원 승인 이메일
 */
function sendCompanyApprovedEmail(data) {
  sendEmail(
    data.email,
    '[사근복 AI] 회원 승인이 완료되었습니다 🎉',
    `${data.name}님, 축하합니다!\n\n기업회원 승인이 완료되었습니다.\n이제 모든 기능을 이용하실 수 있습니다.\n\n회사명: ${data.companyName}\n담당자: ${data.name}\n전화번호: ${data.phone}\n상태: 승인완료\n\n로그인하기: http://3.34.186.174/\n\n사근복 AI와 함께 성공적인 비즈니스를 만들어가세요!`
  );
}

/**
 * 컨설턴트 이름으로 이메일 찾기
 */
function getConsultantEmailByName(name) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. 매니저 시트에서 검색
    const managerSheet = ss.getSheetByName(SHEET_MANAGERS);
    if (managerSheet) {
      const managerData = managerSheet.getDataRange().getValues();
      for (let i = 1; i < managerData.length; i++) {
        if (String(managerData[i][0]).trim() === name) {
          return String(managerData[i][2]); // 이메일 컬럼
        }
      }
    }
    
    // 2. 컨설턴트 시트에서 검색
    const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
    if (consultantSheet) {
      const consultantData = consultantSheet.getDataRange().getValues();
      for (let i = 1; i < consultantData.length; i++) {
        if (String(consultantData[i][0]).trim() === name) {
          return String(consultantData[i][2]); // 이메일 컬럼
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('추천인 이메일 조회 실패:', error);
    return null;
  }
}

// ========================================
// 회원 관리 함수
// ========================================

/**
 * 전체 회원 조회
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
 * 회원 승인 상태 업데이트 + 이메일 발송 (v6.2)
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
    
    let sheetName;
    if (type === 'company') {
      sheetName = SHEET_COMPANIES;
    } else if (type === 'manager') {
      sheetName = SHEET_MANAGERS;
    } else {
      sheetName = SHEET_CONSULTANTS;
    }
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
        const userTypeKorean = (type === 'company') ? '기업회원' : (type === 'manager' ? '사근복매니저' : '사근복컨설턴트');
        
        writeLog(
          '승인상태변경', 
          userTypeKorean, 
          phone, 
          `${userName} 상태 변경: ${newStatus}`, 
          '성공'
        );
        
        // 승인 완료 시 이메일 발송 (v6.2 추가)
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
          } else if (type === 'manager') {
            const emailData = {
              name: data[i][0],
              phone: data[i][1],
              email: userEmail,
              position: data[i][3]
            };
            sendManagerApprovedEmail(emailData);
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

// ========================================
// 로그인 함수
// ========================================

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
      const storedPhone = String(row[4]);
      
      // 전화번호 비교 (다양한 형식 허용)
      if (comparePhoneNumbers(storedPhone, phone)) {
        const status = String(row[8]).trim();
        
        if (status !== STATUS_APPROVED) {
          writeLog('로그인', '기업회원', normalizedPhone, '승인되지 않은 계정', '실패', `현재 상태: ${status}`);
          return {
            success: false,
            error: '관리자 승인이 필요합니다. 현재 상태: ' + status
          };
        }
        
        const storedPassword = String(row[6]).trim();
        
        if (storedPassword === password) {
          writeLog('로그인', '기업회원', normalizedPhone, '로그인 성공', '성공');
          return {
            success: true,
            user: {
              userType: 'company',
              companyName: String(row[0]),
              companyType: String(row[1]),
              referrer: String(row[2]),
              name: String(row[3]),
              phone: existingPhone,
              email: String(row[5])
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
 * 매니저 + 컨설턴트 통합 로그인
 */
function loginConsultant(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. 매니저 시트에서 검색
    const managerSheet = ss.getSheetByName(SHEET_MANAGERS);
    const managerData = managerSheet.getDataRange().getValues();
    
    for (let i = 1; i < managerData.length; i++) {
      const row = managerData[i];
      const storedPhone = String(row[1]);
      
      // 전화번호 비교 (다양한 형식 허용)
      if (comparePhoneNumbers(storedPhone, phone)) {
        const status = String(row[8]).trim();
        
        if (status !== STATUS_APPROVED) {
          writeLog('로그인', '사근복매니저', phone, '승인되지 않은 계정', '실패', `현재 상태: ${status}`);
          return {
            success: false,
            error: '관리자 승인이 필요합니다. 현재 상태: ' + status
          };
        }
        
        const storedPassword = String(row[6]).trim();
        
        if (storedPassword === password) {
          writeLog('로그인', '사근복매니저', phone, '로그인 성공', '성공');
          return {
            success: true,
            user: {
              userType: 'manager',
              name: String(row[0]),
              phone: storedPhone,
              email: String(row[2]),
              position: String(row[3]),
              division: String(row[4]),
              branch: String(row[5])
            }
          };
        } else {
          writeLog('로그인', '사근복매니저', phone, '비밀번호 불일치', '실패');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    // 2. 컨설턴트 시트에서 검색
    const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
    const consultantData = consultantSheet.getDataRange().getValues();
    
    for (let i = 1; i < consultantData.length; i++) {
      const row = consultantData[i];
      const storedPhone = String(row[1]);
      
      // 전화번호 비교 (다양한 형식 허용)
      if (comparePhoneNumbers(storedPhone, phone)) {
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
              phone: storedPhone,
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
    
    writeLog('로그인', '사근복매니저/컨설턴트', phone, '등록되지 않은 전화번호', '실패');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
    
  } catch (error) {
    writeLog('로그인', '사근복매니저/컨설턴트', phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.'
    };
  }
}

// ========================================
// 회원가입 함수 + 이메일 발송 (v6.2)
// ========================================

/**
 * 기업회원 회원가입 + 이메일 발송
 */
function registerCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const companySheet = ss.getSheetByName(SHEET_COMPANIES);
    
    // 전화번호 정규화
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    const companyData = companySheet.getDataRange().getValues();
    for (let i = 1; i < companyData.length; i++) {
      const existingPhone = normalizePhoneNumber(String(companyData[i][4]));
      if (existingPhone === normalizedPhone) {
        writeLog('회원가입', '기업회원', normalizedPhone, '중복 전화번호', '실패', '이미 등록된 전화번호입니다');
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
      normalizedPhone,
      data.email,
      data.password,
      timestamp,
      STATUS_PENDING
    ]);
    
    writeLog('회원가입', '기업회원', normalizedPhone, `회원가입 완료: ${data.companyName}`, '성공');
    
    // 이메일 발송 (v6.2 추가)
    const emailData = {
      companyName: data.companyName,
      companyType: data.companyType,
      referrer: data.referrer,
      name: data.name,
      phone: normalizedPhone,
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
 * 매니저 회원가입 + 이메일 발송
 */
function registerManager(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const managerSheet = ss.getSheetByName(SHEET_MANAGERS);
    
    // 전화번호 정규화
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    const managerData = managerSheet.getDataRange().getValues();
    for (let i = 1; i < managerData.length; i++) {
      const existingPhone = normalizePhoneNumber(String(managerData[i][1]));
      if (existingPhone === normalizedPhone) {
        writeLog('회원가입', '사근복매니저', normalizedPhone, '중복 전화번호', '실패', '이미 등록된 전화번호입니다');
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    const timestamp = getKSTTimestamp();
    const defaultPassword = '12345';
    
    managerSheet.appendRow([
      data.name,
      normalizedPhone,
      data.email,
      data.position,
      data.division,
      data.branch,
      defaultPassword,
      timestamp,
      STATUS_PENDING
    ]);
    
    writeLog('회원가입', '사근복매니저', normalizedPhone, `회원가입 완료: ${data.name}`, '성공');
    
    // 이메일 발송 (v6.2 추가)
    const emailData = {
      name: data.name,
      phone: normalizedPhone,
      email: data.email,
      position: data.position,
      division: data.division,
      branch: data.branch,
      registeredAt: timestamp,
      userType: 'manager'
    };
    sendManagerSignupEmails(emailData);
    
    // JSON 자동 동기화
    syncAllJsonFiles();
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다. 비밀번호는 12345입니다.'
    };
    
  } catch (error) {
    writeLog('회원가입', '사근복매니저', data.phone, 'API 오류', '실패', error.toString());
    return {
      success: false,
      error: '회원가입 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 컨설턴트 회원가입 + 이메일 발송
 */
function registerConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
    
    // 전화번호 정규화
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    const consultantData = consultantSheet.getDataRange().getValues();
    for (let i = 1; i < consultantData.length; i++) {
      const existingPhone = normalizePhoneNumber(String(consultantData[i][1]));
      if (existingPhone === normalizedPhone) {
        writeLog('회원가입', '사근복컨설턴트', normalizedPhone, '중복 전화번호', '실패', '이미 등록된 전화번호입니다');
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
      normalizedPhone,
      data.email,
      data.position,
      data.division,
      data.branch,
      defaultPassword,
      timestamp,
      STATUS_PENDING
    ]);
    
    writeLog('회원가입', '사근복컨설턴트', normalizedPhone, `회원가입 완료: ${data.name}`, '성공');
    
    // 이메일 발송 (v6.2 추가)
    const emailData = {
      name: data.name,
      phone: normalizedPhone,
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

// ========================================
// HTTP 요청 핸들러
// ========================================

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
      version: '6.2',
      timestamp: getKSTTimestamp(),
      message: '사근복 AI Apps Script v6.2 - 이메일 알림 시스템'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리
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
    
    if (data.action === 'registerManager') {
      return ContentService
        .createTextOutput(JSON.stringify(registerManager(data)))
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
