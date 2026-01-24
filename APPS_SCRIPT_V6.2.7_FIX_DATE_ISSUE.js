/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2.7 - 승인상태 날짜 이슈 대응
 * 
 * 주요 변경사항 (v6.2.7):
 * - 승인상태가 날짜 형식일 경우 "승인"으로 자동 변환
 * - 더 유연한 승인상태 검사
 * - 디버깅 로그 개선
 */

// ========================================
// 설정
// ========================================

const CONFIG = {
  SPREADSHEET_ID: '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc',
  DEFAULT_PASSWORD: '12345'
};

// ========================================
// 유틸리티 함수
// ========================================

/**
 * CORS 헤더가 포함된 응답 생성
 */
function createCORSResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * 전화번호 정규화
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

/**
 * 요청 데이터 파싱
 */
function parseRequestData(e) {
  let data = {};
  
  if (e.parameter) {
    data = Object.assign(data, e.parameter);
  }
  
  if (e.postData && e.postData.contents) {
    try {
      const postData = JSON.parse(e.postData.contents);
      data = Object.assign(data, postData);
    } catch (err) {
      // JSON 파싱 실패 시 무시
    }
  }
  
  return data;
}

/**
 * 승인상태 확인 (유연한 검사)
 * "승인", "승인완료"를 허용하고, 날짜 형식은 무시
 */
function isApproved(approvalValue) {
  if (!approvalValue) return false;
  
  // Date 객체인 경우 (구글 시트에서 날짜로 인식된 경우)
  if (approvalValue instanceof Date) {
    Logger.log('⚠️ 승인상태가 Date 객체입니다. 구글 시트 H열 수정 필요!');
    return false;
  }
  
  const statusStr = String(approvalValue).trim();
  
  // 날짜 형식 문자열 감지 (GMT, 요일 포함)
  if (statusStr.includes('GMT') || statusStr.includes('Mon ') || 
      statusStr.includes('Tue ') || statusStr.includes('Wed ') || 
      statusStr.includes('Thu ') || statusStr.includes('Fri ') || 
      statusStr.includes('Sat ') || statusStr.includes('Sun ')) {
    Logger.log('⚠️ 승인상태가 날짜 문자열입니다: ' + statusStr);
    return false;
  }
  
  // "승인" 또는 "승인완료"
  return statusStr === '승인' || statusStr === '승인완료';
}

/**
 * 로그 기록 함수
 */
function writeLog(action, category, target, details, result) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const logSheet = ss.getSheetByName('로그');
    
    if (!logSheet) {
      // 로그 시트가 없으면 생성
      const newLogSheet = ss.insertSheet('로그');
      newLogSheet.appendRow(['타임스탬프', '액션', '구분', '대상', '세부정보', '결과']);
      return; // 첫 실행 시는 헤더만 생성
    }
    
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    logSheet.appendRow([timestamp, action, category, target, details, result]);
  } catch (error) {
    // 로그 기록 실패 시 무시 (메인 기능에 영향 없도록)
    Logger.log('로그 기록 실패: ' + error.toString());
  }
}

/**
 * 승인상태 자동 수정 함수
 */
function fixApprovalStatus(sheetName, rowIndex) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) return false;
    
    // H열(8번째 컬럼) = 승인상태
    const approvalCell = sheet.getRange(rowIndex + 1, 8); // +1은 1-based index
    approvalCell.setValue('승인');
    
    Logger.log('✅ 승인상태 자동 수정 완료: 행 ' + rowIndex);
    return true;
  } catch (error) {
    Logger.log('❌ 승인상태 수정 실패: ' + error.toString());
    return false;
  }
}

// ========================================
// 테스트 함수
// ========================================

/**
 * 권한 테스트 함수 - Apps Script에서 실행
 */
function testSpreadsheetAccess() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    Logger.log('✅ 성공! 스프레드시트: ' + ss.getName());
    
    const sheet = ss.getSheetByName('기업회원');
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      Logger.log('✅ 기업회원 행 수: ' + data.length);
      
      // 첫 번째 데이터 행 확인
      if (data.length > 1) {
        Logger.log('\n=== 첫 번째 데이터 행 ===');
        for (let i = 0; i < data[0].length; i++) {
          const cellValue = data[1][i];
          const valueType = typeof cellValue;
          const isDate = cellValue instanceof Date;
          Logger.log('[' + i + '] ' + data[0][i] + ': "' + cellValue + '" (타입: ' + valueType + ', Date: ' + isDate + ')');
        }
      }
    } else {
      Logger.log('⚠️ 기업회원 시트를 찾을 수 없습니다.');
    }
    
    return '성공';
  } catch (e) {
    Logger.log('❌ 오류: ' + e.toString());
    return '실패';
  }
}

/**
 * 진단 함수 - 특정 전화번호 찾기
 */
function diagnoseSheet() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('기업회원');
    const data = sheet.getDataRange().getValues();
    
    Logger.log('=== 헤더 ===');
    Logger.log(data[0].join(' | '));
    
    Logger.log('\n=== 전화번호 01063529091 찾기 ===');
    for (let i = 1; i < data.length; i++) {
      const phone = String(data[i][4]).replace(/[^0-9]/g, '');
      if (phone === '01063529091') {
        Logger.log('찾음! 행: ' + i);
        for (let j = 0; j < data[i].length; j++) {
          const cellValue = data[i][j];
          const valueType = typeof cellValue;
          const isDate = cellValue instanceof Date;
          Logger.log('  [' + j + '] ' + data[0][j] + ': "' + cellValue + '" (타입: ' + valueType + ', Date: ' + isDate + ')');
        }
      }
    }
    
    return '진단 완료';
  } catch (e) {
    Logger.log('❌ 오류: ' + e.toString());
    return '실패';
  }
}

/**
 * 모든 승인상태 수정 함수
 */
function fixAllApprovalStatuses() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheets = ['기업회원', '사근복컨설턴트', '사근복컨설턴트(매니저)'];
    let totalFixed = 0;
    
    for (const sheetName of sheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      Logger.log('\n=== ' + sheetName + ' 처리 중 ===');
      
      for (let i = 1; i < data.length; i++) {
        const approvalValue = data[i][7]; // H열 (8번째 컬럼, 0-based)
        
        // Date 객체이거나 날짜 문자열인 경우
        if (approvalValue instanceof Date || 
            (typeof approvalValue === 'string' && approvalValue.includes('GMT'))) {
          
          Logger.log('행 ' + i + ': 날짜 형식 발견 → "승인"으로 변경');
          const cell = sheet.getRange(i + 1, 8); // 1-based index
          cell.setValue('승인');
          totalFixed++;
        }
      }
    }
    
    Logger.log('\n✅ 총 ' + totalFixed + '개 행 수정 완료!');
    return '수정 완료: ' + totalFixed + '개';
  } catch (e) {
    Logger.log('❌ 오류: ' + e.toString());
    return '실패';
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
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('기업회원');
    
    if (!sheet) {
      writeLog('로그인', '기업회원', phone, '시트 없음', '실패');
      return {
        success: false,
        error: '기업회원 시트를 찾을 수 없습니다.'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const normalizedPhone = normalizePhoneNumber(phone);
    
    Logger.log('=== 로그인 시도 ===');
    Logger.log('전화번호: ' + normalizedPhone);
    Logger.log('총 데이터 행: ' + (data.length - 1));
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const storedPhone = normalizePhoneNumber(row[4]);
      
      if (storedPhone === normalizedPhone) {
        Logger.log('전화번호 찾음! 행: ' + i);
        
        const approvalValue = row[7];
        const isDate = approvalValue instanceof Date;
        const statusStr = String(approvalValue);
        
        Logger.log('승인상태 원본값: "' + approvalValue + '"');
        Logger.log('승인상태 타입: ' + typeof approvalValue);
        Logger.log('Date 객체 여부: ' + isDate);
        Logger.log('문자열 변환: "' + statusStr + '"');
        
        // 날짜 형식이면 자동 수정 시도
        if (isDate || statusStr.includes('GMT')) {
          Logger.log('⚠️ 승인상태가 날짜 형식입니다. 자동 수정 시도...');
          fixApprovalStatus('기업회원', i);
          
          writeLog('로그인', '기업회원', phone, '승인상태 날짜오류(수정됨)', '재시도필요');
          return {
            success: false,
            error: '승인상태가 날짜 형식으로 저장되어 있어 수정했습니다. 다시 로그인해 주세요.'
          };
        }
        
        // 승인상태 확인
        if (!isApproved(approvalValue)) {
          const trimmed = String(approvalValue).trim();
          writeLog('로그인', '기업회원', phone, '승인상태: ' + trimmed, '승인대기');
          return {
            success: false,
            error: '승인 대기 중입니다. (현재 상태: ' + trimmed + ')'
          };
        }
        
        Logger.log('✅ 승인상태 확인 통과!');
        
        const storedPassword = String(row[6]).trim();
        if (storedPassword === String(password).trim()) {
          writeLog('로그인', '기업회원', phone, row[0], '성공');
          return {
            success: true,
            user: {
              userType: 'company',
              companyName: row[0],
              companyType: row[1],
              referrer: row[2],
              name: row[3],
              phone: row[4],
              email: row[5]
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
    
    writeLog('로그인', '기업회원', phone, '전화번호 없음', '실패');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
  } catch (error) {
    writeLog('로그인', '기업회원', phone, error.toString(), '오류');
    return {
      success: false,
      error: '로그인 처리 중 오류: ' + error.toString()
    };
  }
}

/**
 * 컨설턴트 로그인
 */
function loginConsultant(phone, password) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // 매니저 확인
    const managerSheet = ss.getSheetByName('사근복컨설턴트(매니저)');
    if (managerSheet) {
      const managerData = managerSheet.getDataRange().getValues();
      
      for (let i = 1; i < managerData.length; i++) {
        const row = managerData[i];
        const storedPhone = normalizePhoneNumber(row[1]);
        
        if (storedPhone === normalizedPhone) {
          const approvalValue = row[6];
          
          // 날짜 형식이면 자동 수정
          if (approvalValue instanceof Date || String(approvalValue).includes('GMT')) {
            fixApprovalStatus('사근복컨설턴트(매니저)', i);
            return {
              success: false,
              error: '승인상태가 날짜 형식으로 저장되어 있어 수정했습니다. 다시 로그인해 주세요.'
            };
          }
          
          if (!isApproved(approvalValue)) {
            writeLog('로그인', '매니저', phone, '승인상태: ' + String(approvalValue).trim(), '승인대기');
            return {
              success: false,
              error: '승인 대기 중입니다.'
            };
          }
          
          if (String(password).trim() === CONFIG.DEFAULT_PASSWORD) {
            writeLog('로그인', '매니저', phone, row[0], '성공');
            return {
              success: true,
              user: {
                userType: 'manager',
                name: row[0],
                phone: row[1],
                email: row[2],
                position: row[3],
                businessUnit: row[4],
                branch: row[5]
              }
            };
          } else {
            writeLog('로그인', '매니저', phone, '비밀번호 불일치', '실패');
            return {
              success: false,
              error: '비밀번호가 일치하지 않습니다.'
            };
          }
        }
      }
    }
    
    // 컨설턴트 확인
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    if (consultantSheet) {
      const consultantData = consultantSheet.getDataRange().getValues();
      
      for (let i = 1; i < consultantData.length; i++) {
        const row = consultantData[i];
        const storedPhone = normalizePhoneNumber(row[1]);
        
        if (storedPhone === normalizedPhone) {
          const approvalValue = row[6];
          
          // 날짜 형식이면 자동 수정
          if (approvalValue instanceof Date || String(approvalValue).includes('GMT')) {
            fixApprovalStatus('사근복컨설턴트', i);
            return {
              success: false,
              error: '승인상태가 날짜 형식으로 저장되어 있어 수정했습니다. 다시 로그인해 주세요.'
            };
          }
          
          if (!isApproved(approvalValue)) {
            writeLog('로그인', '컨설턴트', phone, '승인상태: ' + String(approvalValue).trim(), '승인대기');
            return {
              success: false,
              error: '승인 대기 중입니다.'
            };
          }
          
          if (String(password).trim() === CONFIG.DEFAULT_PASSWORD) {
            writeLog('로그인', '컨설턴트', phone, row[0], '성공');
            return {
              success: true,
              user: {
                userType: 'consultant',
                name: row[0],
                phone: row[1],
                email: row[2],
                position: row[3],
                businessUnit: row[4],
                branch: row[5]
              }
            };
          } else {
            writeLog('로그인', '컨설턴트', phone, '비밀번호 불일치', '실패');
            return {
              success: false,
              error: '비밀번호가 일치하지 않습니다.'
            };
          }
        }
      }
    }
    
    writeLog('로그인', '컨설턴트', phone, '전화번호 없음', '실패');
    return {
      success: false,
      error: '등록되지 않은 전화번호입니다.'
    };
  } catch (error) {
    writeLog('로그인', '컨설턴트', phone, error.toString(), '오류');
    return {
      success: false,
      error: '로그인 처리 중 오류: ' + error.toString()
    };
  }
}

// ========================================
// 회원가입 함수
// ========================================

/**
 * 기업회원 등록
 */
function registerCompany(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('기업회원');
    
    if (!sheet) {
      writeLog('회원가입', '기업회원', data.phone, '시트 없음', '실패');
      return {
        success: false,
        error: '기업회원 시트를 찾을 수 없습니다.'
      };
    }
    
    // 중복 확인
    const existingData = sheet.getDataRange().getValues();
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    for (let i = 1; i < existingData.length; i++) {
      const storedPhone = normalizePhoneNumber(existingData[i][4]);
      if (storedPhone === normalizedPhone) {
        writeLog('회원가입', '기업회원', data.phone, '중복', '실패');
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    // 신규 등록
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    const newRow = [
      data.companyName || '',
      data.companyType || '',
      data.referrer || '',
      data.name || '',
      data.phone || '',
      data.email || '',
      data.password || CONFIG.DEFAULT_PASSWORD,
      '승인',  // 승인상태는 텍스트로 명시
      timestamp
    ];
    
    sheet.appendRow(newRow);
    
    // H열(승인상태)을 텍스트 형식으로 강제 설정
    const lastRow = sheet.getLastRow();
    const approvalCell = sheet.getRange(lastRow, 8);
    approvalCell.setNumberFormat('@'); // 텍스트 형식
    approvalCell.setValue('승인');
    
    writeLog('회원가입', '기업회원', data.phone, data.companyName, '성공');
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다.'
    };
  } catch (error) {
    writeLog('회원가입', '기업회원', data.phone, error.toString(), '오류');
    return {
      success: false,
      error: '회원가입 처리 중 오류: ' + error.toString()
    };
  }
}

/**
 * 컨설턴트 등록
 */
function registerConsultant(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('사근복컨설턴트');
    
    if (!sheet) {
      writeLog('회원가입', '컨설턴트', data.phone, '시트 없음', '실패');
      return {
        success: false,
        error: '컨설턴트 시트를 찾을 수 없습니다.'
      };
    }
    
    // 중복 확인
    const existingData = sheet.getDataRange().getValues();
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    for (let i = 1; i < existingData.length; i++) {
      const storedPhone = normalizePhoneNumber(existingData[i][1]);
      if (storedPhone === normalizedPhone) {
        writeLog('회원가입', '컨설턴트', data.phone, '중복', '실패');
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    // 신규 등록
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    const newRow = [
      data.name || '',
      data.phone || '',
      data.email || '',
      data.position || '',
      data.businessUnit || '',
      data.branch || '',
      '승인',
      timestamp
    ];
    
    sheet.appendRow(newRow);
    
    // G열(승인상태)을 텍스트 형식으로 강제 설정
    const lastRow = sheet.getLastRow();
    const approvalCell = sheet.getRange(lastRow, 7);
    approvalCell.setNumberFormat('@');
    approvalCell.setValue('승인');
    
    writeLog('회원가입', '컨설턴트', data.phone, data.name, '성공');
    
    return {
      success: true,
      message: '컨설턴트 등록이 완료되었습니다.'
    };
  } catch (error) {
    writeLog('회원가입', '컨설턴트', data.phone, error.toString(), '오류');
    return {
      success: false,
      error: '컨설턴트 등록 처리 중 오류: ' + error.toString()
    };
  }
}

/**
 * 매니저 등록
 */
function registerManager(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName('사근복컨설턴트(매니저)');
    
    if (!sheet) {
      writeLog('회원가입', '매니저', data.phone, '시트 없음', '실패');
      return {
        success: false,
        error: '매니저 시트를 찾을 수 없습니다.'
      };
    }
    
    // 중복 확인
    const existingData = sheet.getDataRange().getValues();
    const normalizedPhone = normalizePhoneNumber(data.phone);
    
    for (let i = 1; i < existingData.length; i++) {
      const storedPhone = normalizePhoneNumber(existingData[i][1]);
      if (storedPhone === normalizedPhone) {
        writeLog('회원가입', '매니저', data.phone, '중복', '실패');
        return {
          success: false,
          error: '이미 등록된 전화번호입니다.'
        };
      }
    }
    
    // 신규 등록
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    const newRow = [
      data.name || '',
      data.phone || '',
      data.email || '',
      data.position || '',
      data.businessUnit || '',
      data.branch || '',
      '승인',
      timestamp
    ];
    
    sheet.appendRow(newRow);
    
    // G열(승인상태)을 텍스트 형식으로 강제 설정
    const lastRow = sheet.getLastRow();
    const approvalCell = sheet.getRange(lastRow, 7);
    approvalCell.setNumberFormat('@');
    approvalCell.setValue('승인');
    
    writeLog('회원가입', '매니저', data.phone, data.name, '성공');
    
    return {
      success: true,
      message: '매니저 등록이 완료되었습니다.'
    };
  } catch (error) {
    writeLog('회원가입', '매니저', data.phone, error.toString(), '오류');
    return {
      success: false,
      error: '매니저 등록 처리 중 오류: ' + error.toString()
    };
  }
}

// ========================================
// HTTP 핸들러
// ========================================

/**
 * GET 요청 처리
 */
function doGet(e) {
  const data = parseRequestData(e);
  
  // 액션이 있으면 doPost와 동일하게 처리
  if (data.action) {
    return doPost(e);
  }
  
  // 기본 응답
  return createCORSResponse({
    success: true,
    version: '6.2.7',
    message: '사근복 AI Apps Script v6.2.7 - 승인상태 날짜 이슈 대응'
  });
}

/**
 * POST 요청 처리
 */
function doPost(e) {
  try {
    const data = parseRequestData(e);
    const action = data.action;
    
    if (!action) {
      return createCORSResponse({
        success: false,
        error: '액션이 지정되지 않았습니다.'
      });
    }
    
    let result;
    
    switch (action) {
      case 'loginCompany':
        result = loginCompany(data.phone, data.password);
        break;
        
      case 'loginConsultant':
        result = loginConsultant(data.phone, data.password);
        break;
        
      case 'registerCompany':
        result = registerCompany(data);
        break;
        
      case 'registerConsultant':
        result = registerConsultant(data);
        break;
        
      case 'registerManager':
        result = registerManager(data);
        break;
        
      default:
        result = {
          success: false,
          error: '알 수 없는 액션입니다: ' + action
        };
    }
    
    return createCORSResponse(result);
    
  } catch (error) {
    return createCORSResponse({
      success: false,
      error: '요청 처리 중 오류: ' + error.toString()
    });
  }
}

/**
 * OPTIONS 요청 처리 (CORS preflight)
 */
function doOptions(e) {
  return createCORSResponse({
    success: true,
    message: 'CORS preflight OK'
  });
}
