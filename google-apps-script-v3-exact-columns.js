/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 3.0 - 정확한 컬럼 구조 반영
 * 
 * 시트 구조:
 * - 기업회원: 10개 컬럼 (회사명/기업회원분류/추천인/이름/전화번호/이메일/비밀번호/가입일/승인여부/로그기록)
 * - 사근복컨설턴트: 10개 컬럼 (이름/전화번호/이메일/직함/소속사업단/소속지사/비밀번호/가입일/승인여부/로그기록)
 * - 로그기록: 8개 컬럼 (타임스탬프/액션유형/사용자유형/사용자ID/상세내용/IP주소/상태/에러메시지)
 */

// 스프레드시트 ID
const SPREADSHEET_ID = '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc';

// 시트 이름
const SHEET_COMPANIES = '기업회원';
const SHEET_CONSULTANTS = '사근복컨설턴트';
const SHEET_LOGS = '로그기록';

// 승인 상태
const STATUS_PENDING = '승인대기';
const STATUS_APPROVED = '승인완료';
const STATUS_REJECTED = '승인거부';

/**
 * 로그 기록 함수
 * 로그기록 시트에 기록
 */
function writeLog(actionType, userType, userId, details, status = '성공', errorMsg = '') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName(SHEET_LOGS);
    
    // 로그 시트가 없으면 생성
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEET_LOGS);
      // 헤더 행 (8개 컬럼)
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
    
    const timestamp = new Date().toISOString();
    const ipAddress = ''; // Apps Script에서는 직접 IP를 얻기 어려움
    
    // 로그 데이터 추가 (8개 컬럼)
    logSheet.appendRow([
      timestamp,      // A: 타임스탬프
      actionType,     // B: 액션유형
      userType,       // C: 사용자유형
      userId,         // D: 사용자ID
      details,        // E: 상세내용
      ipAddress,      // F: IP주소
      status,         // G: 상태
      errorMsg        // H: 에러메시지
    ]);
    
  } catch (error) {
    console.error('로그 기록 실패:', error);
  }
}

/**
 * 기업회원 로그인
 * 기업회원 시트 컬럼: 회사명(A)/기업회원분류(B)/추천인(C)/이름(D)/전화번호(E)/이메일(F)/비밀번호(G)/가입일(H)/승인여부(I)/로그기록(J)
 */
function loginCompany(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_COMPANIES);
    const data = sheet.getDataRange().getValues();
    
    // 첫 행은 헤더이므로 제외
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // 인덱스: 0:회사명, 1:기업회원분류, 2:추천인, 3:이름, 4:전화번호, 5:이메일, 6:비밀번호, 7:가입일, 8:승인여부, 9:로그기록
      const rowPhone = String(row[4]).trim(); // E열: 전화번호
      const rowPassword = String(row[6]).trim(); // G열: 비밀번호
      const approvalStatus = String(row[8]).trim(); // I열: 승인여부
      
      if (rowPhone === phone) {
        // 승인 상태 확인
        if (approvalStatus !== STATUS_APPROVED) {
          writeLog('로그인', '기업회원', phone, '승인대기 상태', '실패', '관리자 승인이 필요합니다');
          return {
            success: false,
            error: '관리자 승인 후 로그인이 가능합니다.'
          };
        }
        
        // 비밀번호 확인
        if (rowPassword === password) {
          const user = {
            userType: 'company',
            companyName: row[0],        // A: 회사명
            companyType: row[1],        // B: 기업회원분류
            referrer: row[2],           // C: 추천인
            name: row[3],               // D: 이름
            phone: row[4],              // E: 전화번호
            email: row[5]               // F: 이메일
          };
          
          writeLog('로그인', '기업회원', phone, `로그인 성공: ${row[0]}`, '성공');
          
          return {
            success: true,
            user: user
          };
        } else {
          writeLog('로그인', '기업회원', phone, '비밀번호 불일치', '실패', '비밀번호가 일치하지 않습니다');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    writeLog('로그인', '기업회원', phone, '사용자 없음', '실패', '등록되지 않은 전화번호입니다');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
    
  } catch (error) {
    writeLog('로그인', '기업회원', phone, 'API 오류', '실패', String(error));
    return {
      success: false,
      error: '로그인 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

/**
 * 사근복 컨설턴트 로그인
 * 사근복컨설턴트 시트 컬럼: 이름(A)/전화번호(B)/이메일(C)/직함(D)/소속사업단(E)/소속지사(F)/비밀번호(G)/가입일(H)/승인여부(I)/로그기록(J)
 */
function loginConsultant(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_CONSULTANTS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // 인덱스: 0:이름, 1:전화번호, 2:이메일, 3:직함, 4:소속사업단, 5:소속지사, 6:비밀번호, 7:가입일, 8:승인여부, 9:로그기록
      const rowPhone = String(row[1]).trim(); // B열: 전화번호
      const rowPassword = String(row[6]).trim(); // G열: 비밀번호
      const approvalStatus = String(row[8]).trim(); // I열: 승인여부
      
      if (rowPhone === phone) {
        if (approvalStatus !== STATUS_APPROVED) {
          writeLog('로그인', '컨설턴트', phone, '승인대기 상태', '실패', '관리자 승인이 필요합니다');
          return {
            success: false,
            error: '관리자 승인 후 로그인이 가능합니다.'
          };
        }
        
        if (rowPassword === password) {
          const user = {
            userType: 'consultant',
            name: row[0],               // A: 이름
            phone: row[1],              // B: 전화번호
            email: row[2],              // C: 이메일
            position: row[3],           // D: 직함
            businessUnit: row[4],       // E: 소속사업단
            branchOffice: row[5]        // F: 소속지사
          };
          
          writeLog('로그인', '컨설턴트', phone, `로그인 성공: ${row[0]}`, '성공');
          
          return {
            success: true,
            user: user
          };
        } else {
          writeLog('로그인', '컨설턴트', phone, '비밀번호 불일치', '실패', '비밀번호가 일치하지 않습니다');
          return {
            success: false,
            error: '비밀번호가 일치하지 않습니다.'
          };
        }
      }
    }
    
    writeLog('로그인', '컨설턴트', phone, '사용자 없음', '실패', '등록되지 않은 전화번호입니다');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
    
  } catch (error) {
    writeLog('로그인', '컨설턴트', phone, 'API 오류', '실패', String(error));
    return {
      success: false,
      error: '로그인 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

/**
 * 기업회원 가입
 * 10개 컬럼: 회사명/기업회원분류/추천인/이름/전화번호/이메일/비밀번호/가입일/승인여부/로그기록(비움)
 */
function registerCompany(companyName, companyType, referrer, name, phone, email, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const consultantSheet = ss.getSheetByName(SHEET_CONSULTANTS);
    const companySheet = ss.getSheetByName(SHEET_COMPANIES);
    
    // 추천인 검증 (사근복컨설턴트 시트에서)
    const consultantData = consultantSheet.getDataRange().getValues();
    let referrerFound = false;
    
    for (let i = 1; i < consultantData.length; i++) {
      const row = consultantData[i];
      const consultantName = String(row[0]).trim(); // A열: 이름
      const approvalStatus = String(row[8]).trim(); // I열: 승인여부
      
      if (consultantName === referrer && approvalStatus === STATUS_APPROVED) {
        referrerFound = true;
        break;
      }
    }
    
    if (!referrerFound) {
      writeLog('회원가입', '기업회원', phone, `추천인 검증 실패: ${referrer}`, '실패', '등록되지 않은 추천인');
      return {
        success: false,
        error: '등록되지 않은 추천인입니다. 승인완료된 사근복 컨설턴트 이름을 입력해주세요.'
      };
    }
    
    // 중복 확인
    const companyData = companySheet.getDataRange().getValues();
    for (let i = 1; i < companyData.length; i++) {
      const existingPhone = String(companyData[i][4]).trim(); // E열: 전화번호
      if (existingPhone === phone) {
        writeLog('회원가입', '기업회원', phone, '중복 전화번호', '실패', '이미 가입된 전화번호');
        return {
          success: false,
          error: '이미 가입된 전화번호입니다.'
        };
      }
    }
    
    // 신규 가입 (10개 컬럼)
    const now = new Date().toISOString();
    companySheet.appendRow([
      companyName,        // A: 회사명
      companyType,        // B: 기업회원분류
      referrer,           // C: 추천인
      name,               // D: 이름
      phone,              // E: 전화번호
      email,              // F: 이메일
      password,           // G: 비밀번호
      now,                // H: 가입일
      STATUS_PENDING,     // I: 승인여부
      ''                  // J: 로그기록 (비움)
    ]);
    
    writeLog('회원가입', '기업회원', phone, `신규 가입: ${companyName}`, '성공');
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.'
    };
    
  } catch (error) {
    writeLog('회원가입', '기업회원', phone, 'API 오류', '실패', String(error));
    return {
      success: false,
      error: '회원가입 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

/**
 * 사근복 컨설턴트 가입
 * 10개 컬럼: 이름/전화번호/이메일/직함/소속사업단/소속지사/비밀번호/가입일/승인여부/로그기록(비움)
 */
function registerConsultant(name, phone, email, position, businessUnit, branchOffice, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_CONSULTANTS);
    const data = sheet.getDataRange().getValues();
    
    // 중복 확인
    for (let i = 1; i < data.length; i++) {
      const existingPhone = String(data[i][1]).trim(); // B열: 전화번호
      if (existingPhone === phone) {
        writeLog('회원가입', '컨설턴트', phone, '중복 전화번호', '실패', '이미 가입된 전화번호');
        return {
          success: false,
          error: '이미 가입된 전화번호입니다.'
        };
      }
    }
    
    // 신규 가입 (10개 컬럼)
    const now = new Date().toISOString();
    sheet.appendRow([
      name,               // A: 이름
      phone,              // B: 전화번호
      email,              // C: 이메일
      position,           // D: 직함
      businessUnit,       // E: 소속사업단
      branchOffice,       // F: 소속지사
      password,           // G: 비밀번호
      now,                // H: 가입일
      STATUS_PENDING,     // I: 승인여부
      ''                  // J: 로그기록 (비움)
    ]);
    
    writeLog('회원가입', '컨설턴트', phone, `신규 가입: ${name}`, '성공');
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다. 비밀번호는 12345입니다.'
    };
    
  } catch (error) {
    writeLog('회원가입', '컨설턴트', phone, 'API 오류', '실패', String(error));
    return {
      success: false,
      error: '회원가입 중 오류가 발생했습니다: ' + error.toString()
    };
  }
}

/**
 * POST 요청 처리
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
        result = registerCompany(
          params.companyName,
          params.companyType,
          params.referrer,
          params.name,
          params.phone,
          params.email,
          params.password
        );
        break;
        
      case 'registerConsultant':
        result = registerConsultant(
          params.name,
          params.phone,
          params.email,
          params.position,
          params.businessUnit,
          params.branchOffice,
          params.password
        );
        break;
        
      default:
        writeLog('알 수 없는 액션', '알 수 없음', '', `액션: ${action}`, '실패', '지원하지 않는 액션');
        result = {
          success: false,
          error: '알 수 없는 액션입니다.'
        };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    writeLog('API 오류', '알 수 없음', '', 'doPost 오류', '실패', String(error));
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'API 오류: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET 요청 처리 (테스트용)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: '사근복 AI 백엔드 API',
    version: '3.0 - 정확한 컬럼 구조',
    timestamp: new Date().toISOString(),
    sheets: {
      companies: '기업회원 (10개 컬럼)',
      consultants: '사근복컨설턴트 (10개 컬럼)',
      logs: '로그기록 (8개 컬럼)'
    }
  })).setMimeType(ContentService.MimeType.JSON);
}
