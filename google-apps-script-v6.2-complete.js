/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2 - 이메일 알림 시스템 추가
 * 
 * 주요 변경사항 (v6.2):
 * - 회원가입 시 이메일 자동 발송 (관리자, 본인, 추천인)
 * - 승인 시 이메일 자동 발송 (본인)
 * - HTML 템플릿 기반 이메일 디자인
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
const SHEET_CONSULTANTS = '사근복컨설턴트';
const SHEET_LOGS = '로그기록';

// JSON 파일 이름
const JSON_ALL_MEMBERS = 'sagunbok_members_all.json';
const JSON_BY_CONSULTANT = 'sagunbok_members_by_consultant.json';

// 승인 상태
const STATUS_PENDING = '승인대기';
const STATUS_APPROVED = '승인완료';
const STATUS_REJECTED = '승인거부';

// 관리자 이메일
const ADMIN_EMAIL = 'tysagunbok@gmail.com';

// 이메일 발신자 이름
const SENDER_NAME = '사근복 AI';

// ========================================
// 기본 함수
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

