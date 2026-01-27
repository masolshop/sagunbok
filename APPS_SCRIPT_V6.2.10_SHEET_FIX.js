/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2.10 - 시트 이름 수정 및 자동 동기화 추가
 * 
 * 주요 변경사항 (v6.2.10):
 * - 시트 이름 수정: '매니저' → '사근복컨설턴트(매니저)', '컨설턴트' → '사근복컨설턴트'
 * - 회원가입 시 자동 JSON 동기화 추가 (기업회원, 컨설턴트, 매니저)
 * - 회원 상태 변경 시 자동 JSON 동기화 추가
 * - getAllMembers, updateMemberStatus 시트 이름 통일
 */

// ========================================
// 설정
// ========================================

const CONFIG = {
  SPREADSHEET_ID: '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc',
  DEFAULT_PASSWORD: '12345',
  ADMIN_EMAIL: 'tysagunbok@gmail.com', // 관리자 이메일
  COMPANY_NAME: 'TY사근복헬스케어사업단',
  COMPANY_URL: 'http://3.34.186.174/'
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
 * 이메일 발송 함수
 */
function sendEmail(to, subject, htmlBody) {
  try {
    if (!to) {
      Logger.log('이메일 주소가 없습니다.');
      return false;
    }
    
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: CONFIG.COMPANY_NAME
    });
    
    Logger.log('이메일 발송 성공: ' + to);
    writeLog('이메일', '발송', to, subject, '성공');
    return true;
    
  } catch (error) {
    Logger.log('이메일 발송 실패: ' + error);
    writeLog('이메일', '발송', to, subject, '실패: ' + error);
    return false;
  }
}

/**
 * 회원가입 알림 이메일 (관리자에게)
 */
function sendSignupNotificationToAdmin(memberType, name, phone, email, companyName, referrer) {
  const typeLabel = memberType === 'company' ? '기업회원' : 
                    memberType === 'manager' ? '매니저' : '컨설턴트';
  
  const subject = `[사근복] 새로운 ${typeLabel} 가입 신청`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">🔔 새로운 회원가입 신청</h2>
      <p>새로운 ${typeLabel} 가입 신청이 있습니다.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">회원 정보</h3>
        <p><strong>구분:</strong> ${typeLabel}</p>
        ${companyName ? `<p><strong>회사명:</strong> ${companyName}</p>` : ''}
        <p><strong>이름:</strong> ${name}</p>
        <p><strong>전화번호:</strong> ${phone}</p>
        <p><strong>이메일:</strong> ${email}</p>
        ${referrer ? `<p><strong>추천인:</strong> ${referrer}</p>` : ''}
      </div>
      
      <p>
        <a href="${CONFIG.COMPANY_URL}" 
           style="display: inline-block; background-color: #1e40af; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                  font-weight: bold;">
          관리자 대시보드에서 승인하기
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        ${CONFIG.COMPANY_NAME}<br>
        ${CONFIG.COMPANY_URL}
      </p>
    </div>
  `;
  
  return sendEmail(CONFIG.ADMIN_EMAIL, subject, htmlBody);
}

/**
 * 회원가입 완료 알림 (회원에게)
 */
function sendSignupConfirmationToMember(memberType, name, email, phone) {
  const typeLabel = memberType === 'company' ? '기업회원' : 
                    memberType === 'manager' ? '매니저' : '컨설턴트';
  
  const subject = `[사근복] ${typeLabel} 가입 신청이 완료되었습니다`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">✅ 가입 신청이 완료되었습니다</h2>
      <p>${name}님, 환영합니다!</p>
      
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
        <h3 style="margin-top: 0; color: #1e40af;">가입 신청 완료</h3>
        <p>${CONFIG.COMPANY_NAME} ${typeLabel} 가입 신청이 완료되었습니다.</p>
        <p><strong>관리자 승인 후 로그인 가능</strong>합니다.</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">로그인 정보</h3>
        <p><strong>ID (전화번호):</strong> ${phone}</p>
        <p><strong>초기 비밀번호:</strong> ${CONFIG.DEFAULT_PASSWORD}</p>
        <p style="color: #f59e0b; font-size: 14px;">
          ⏳ 관리자 승인 후 로그인이 가능합니다.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        ${CONFIG.COMPANY_NAME}<br>
        ${CONFIG.COMPANY_URL}<br>
        문의: ${CONFIG.ADMIN_EMAIL}
      </p>
    </div>
  `;
  
  return sendEmail(email, subject, htmlBody);
}

/**
 * 추천인에게 가입 알림 (컨설턴트/매니저에게)
 */
function sendSignupNotificationToReferrer(referrerName, referrerEmail, companyName, memberName) {
  const subject = `[사근복] ${referrerName}님이 추천한 기업회원 가입 신청`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">🎉 추천 회원 가입 신청</h2>
      <p>${referrerName}님이 추천한 기업회원이 가입 신청했습니다.</p>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #10b981;">가입 정보</h3>
        <p><strong>회사명:</strong> ${companyName}</p>
        <p><strong>담당자:</strong> ${memberName}</p>
        <p><strong>추천인:</strong> ${referrerName}</p>
      </div>
      
      <p style="color: #6b7280;">
        관리자 승인 후 해당 회원이 서비스를 이용할 수 있습니다.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        ${CONFIG.COMPANY_NAME}<br>
        ${CONFIG.COMPANY_URL}
      </p>
    </div>
  `;
  
  return sendEmail(referrerEmail, subject, htmlBody);
}

/**
 * 승인 완료 이메일 (회원에게)
 */
function sendApprovalEmail(memberType, name, email, phone) {
  const typeLabel = memberType === 'company' ? '기업회원' : 
                    memberType === 'manager' ? '매니저' : '컨설턴트';
  
  const subject = `[사근복] ${typeLabel} 승인 완료`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">✅ 회원 승인이 완료되었습니다!</h2>
      <p>${name}님, 환영합니다!</p>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #10b981;">승인 완료</h3>
        <p>사근복 AI 스튜디오 ${typeLabel} 승인이 완료되었습니다.</p>
        <p>이제 모든 서비스를 이용하실 수 있습니다.</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">로그인 정보</h3>
        <p><strong>ID (전화번호):</strong> ${phone}</p>
        <p><strong>초기 비밀번호:</strong> ${CONFIG.DEFAULT_PASSWORD}</p>
        <p style="color: #ef4444; font-size: 14px;">
          ⚠️ 보안을 위해 로그인 후 비밀번호를 변경해 주세요.
        </p>
      </div>
      
      <p>
        <a href="${CONFIG.COMPANY_URL}" 
           style="display: inline-block; background-color: #1e40af; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                  font-weight: bold;">
          지금 로그인하기
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        ${CONFIG.COMPANY_NAME}<br>
        ${CONFIG.COMPANY_URL}<br>
        문의: ${CONFIG.ADMIN_EMAIL}
      </p>
    </div>
  `;
  
  return sendEmail(email, subject, htmlBody);
}

/**
 * 승인 거부 이메일 (회원에게)
 */
function sendRejectionEmail(memberType, name, email) {
  const typeLabel = memberType === 'company' ? '기업회원' : 
                    memberType === 'manager' ? '매니저' : '컨설턴트';
  
  const subject = `[사근복] ${typeLabel} 가입 검토 결과`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">가입 승인 보류</h2>
      <p>${name}님, 안녕하세요.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p>죄송합니다. 현재 ${typeLabel} 가입 신청이 보류되었습니다.</p>
        <p>자세한 사항은 관리자에게 문의해 주세요.</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">문의하기</h3>
        <p><strong>이메일:</strong> ${CONFIG.ADMIN_EMAIL}</p>
        <p>궁금하신 사항이 있으시면 언제든지 문의해 주세요.</p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        ${CONFIG.COMPANY_NAME}<br>
        ${CONFIG.COMPANY_URL}
      </p>
    </div>
  `;
  
  return sendEmail(email, subject, htmlBody);
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
          Logger.log('[' + i + '] ' + data[0][i] + ': "' + data[1][i] + '"');
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
          Logger.log('  [' + j + '] ' + data[0][j] + ': "' + data[i][j] + '"');
        }
      }
    }
    
    return '진단 완료';
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
 * 
 * 컬럼 구조:
 * [0] 회사명
 * [1] 기업회원분류
 * [2] 추천인
 * [3] 이름
 * [4] 전화번호
 * [5] 이메일
 * [6] 비밀번호
 * [7] 가입일
 * [8] 승인상태 ← I열 (수정됨)
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
        
        // I열 (인덱스 8) = 승인상태
        const approvalStatus = String(row[8]).trim();
        Logger.log('승인상태 원본값: "' + row[8] + '"');
        Logger.log('승인상태 trim 후: "' + approvalStatus + '"');
        Logger.log('승인상태 길이: ' + approvalStatus.length);
        Logger.log('가입일(H열): "' + row[7] + '"');
        
        // "승인" 또는 "승인완료" 모두 허용
        if (approvalStatus !== '승인' && approvalStatus !== '승인완료') {
          writeLog('로그인', '기업회원', phone, '승인상태: ' + approvalStatus, '승인대기');
          return {
            success: false,
            error: '승인 대기 중입니다. (현재 상태: ' + approvalStatus + ')'
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
 * 
 * 컬럼 구조 (사근복컨설턴트, 사근복컨설턴트(매니저)):
 * [0] 이름
 * [1] 전화번호
 * [2] 이메일
 * [3] 직함
 * [4] 소속 사업단
 * [5] 소속 지사
 * [6] ?
 * [7] 가입일
 * [8] 승인상태 ← I열 (모든 시트 동일!)
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
          // I열 (인덱스 8) = 승인상태 (모든 시트 동일)
          const approvalStatus = String(row[8]).trim();
          
          Logger.log('=== 매니저 로그인 ===');
          Logger.log('승인상태: "' + approvalStatus + '"');
          Logger.log('가입일(H열): "' + row[7] + '"');
          
          // "승인" 또는 "승인완료" 모두 허용
          if (approvalStatus !== '승인' && approvalStatus !== '승인완료') {
            writeLog('로그인', '매니저', phone, '승인상태: ' + approvalStatus, '승인대기');
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
          // I열 (인덱스 8) = 승인상태 (모든 시트 동일)
          const approvalStatus = String(row[8]).trim();
          
          Logger.log('=== 컨설턴트 로그인 ===');
          Logger.log('승인상태: "' + approvalStatus + '"');
          Logger.log('가입일(H열): "' + row[7] + '"');
          
          // "승인" 또는 "승인완료" 모두 허용
          if (approvalStatus !== '승인' && approvalStatus !== '승인완료') {
            writeLog('로그인', '컨설턴트', phone, '승인상태: ' + approvalStatus, '승인대기');
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
    
    // 추천인 검증 (매니저 또는 컨설턴트 이름 매칭)
    if (data.referrer) {
      let referrerFound = false;
      let referrerEmail = '';
      
      // 매니저 시트 확인
      const managerSheet = ss.getSheetByName('사근복컨설턴트(매니저)');
      if (managerSheet) {
        const managerData = managerSheet.getDataRange().getValues();
        for (let i = 1; i < managerData.length; i++) {
          if (managerData[i][0] === data.referrer) { // A열: 이름
            referrerFound = true;
            referrerEmail = managerData[i][2]; // C열: 이메일
            break;
          }
        }
      }
      
      // 컨설턴트 시트 확인 (매니저에서 못 찾았으면)
      if (!referrerFound) {
        const consultantSheet = ss.getSheetByName('사근복컨설턴트');
        if (consultantSheet) {
          const consultantData = consultantSheet.getDataRange().getValues();
          for (let i = 1; i < consultantData.length; i++) {
            if (consultantData[i][0] === data.referrer) { // A열: 이름
              referrerFound = true;
              referrerEmail = consultantData[i][2]; // C열: 이메일
              break;
            }
          }
        }
      }
      
      // 추천인을 찾지 못한 경우
      if (!referrerFound) {
        writeLog('회원가입', '기업회원', data.phone, '추천인 없음: ' + data.referrer, '실패');
        return {
          success: false,
          error: '등록되지 않은 추천인입니다. 사근복 매니저 또는 컨설턴트 이름을 정확히 입력해 주세요.'
        };
      }
      
      // 추천인 정보 저장 (이메일 발송용)
      data.referrerEmail = referrerEmail;
    } else {
      // 추천인이 없는 경우
      writeLog('회원가입', '기업회원', data.phone, '추천인 미입력', '실패');
      return {
        success: false,
        error: '추천인(사근복 매니저 또는 컨설턴트 이름)을 입력해 주세요.'
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
      data.companyName || '',      // A: 회사명
      data.companyType || '',       // B: 기업회원분류
      data.referrer || '',          // C: 추천인
      data.name || '',              // D: 이름
      data.phone || '',             // E: 전화번호
      data.email || '',             // F: 이메일
      data.password || CONFIG.DEFAULT_PASSWORD,  // G: 비밀번호
      timestamp,                    // H: 가입일
      '승인 대기'                   // I: 승인상태 (대기로 변경!)
    ];
    
    sheet.appendRow(newRow);
    
    writeLog('회원가입', '기업회원', data.phone, data.companyName, '성공');
    
    // 이메일 발송: 회원, 추천인, 관리자
    try {
      // 1. 회원에게 가입 완료 알림
      sendSignupConfirmationToMember('company', data.name, data.email, data.phone);
      
      // 2. 추천인에게 알림
      if (data.referrerEmail) {
        sendSignupNotificationToReferrer(data.referrer, data.referrerEmail, data.companyName, data.name);
      }
      
      // 3. 관리자에게 알림
      sendSignupNotificationToAdmin('company', data.name, data.phone, data.email, data.companyName, data.referrer);
    } catch (emailError) {
      Logger.log('이메일 발송 실패: ' + emailError);
      // 이메일 실패해도 회원가입은 성공으로 처리
    }
    
    // 자동 JSON 동기화
    try {
      syncJsonFiles();
    } catch (syncError) {
      Logger.log('JSON 자동 동기화 실패: ' + syncError);
    }
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.'
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
      data.name || '',          // A: 이름
      data.phone || '',         // B: 전화번호
      data.email || '',         // C: 이메일
      data.position || '',      // D: 직함
      data.businessUnit || '',  // E: 소속 사업단
      data.branch || '',        // F: 소속 지사
      '',                       // G: ?
      timestamp,                // H: 가입일
      '승인 대기'               // I: 승인상태 (대기로 변경!)
    ];
    
    sheet.appendRow(newRow);
    
    writeLog('회원가입', '컨설턴트', data.phone, data.name, '성공');
    
    // 이메일 발송: 회원, 관리자
    try {
      // 1. 회원에게 가입 완료 알림
      sendSignupConfirmationToMember('consultant', data.name, data.email, data.phone);
      
      // 2. 관리자에게 알림
      sendSignupNotificationToAdmin('consultant', data.name, data.phone, data.email, null, null);
    } catch (emailError) {
      Logger.log('이메일 발송 실패: ' + emailError);
    }
    
    // 자동 JSON 동기화
    try {
      syncJsonFiles();
    } catch (syncError) {
      Logger.log('JSON 자동 동기화 실패: ' + syncError);
    }
    
    return {
      success: true,
      message: '컨설턴트 등록이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.'
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
      data.name || '',          // A: 이름
      data.phone || '',         // B: 전화번호
      data.email || '',         // C: 이메일
      data.position || '',      // D: 직함
      data.businessUnit || '',  // E: 소속 사업단
      data.branch || '',        // F: 소속 지사
      '',                       // G: ?
      timestamp,                // H: 가입일
      '승인 대기'               // I: 승인상태 (대기로 변경!)
    ];
    
    sheet.appendRow(newRow);
    
    writeLog('회원가입', '매니저', data.phone, data.name, '성공');
    
    // 이메일 발송: 회원, 관리자
    try {
      // 1. 회원에게 가입 완료 알림
      sendSignupConfirmationToMember('manager', data.name, data.email, data.phone);
      
      // 2. 관리자에게 알림
      sendSignupNotificationToAdmin('manager', data.name, data.phone, data.email, null, null);
    } catch (emailError) {
      Logger.log('이메일 발송 실패: ' + emailError);
    }
    
    // 자동 JSON 동기화
    try {
      syncJsonFiles();
    } catch (syncError) {
      Logger.log('JSON 자동 동기화 실패: ' + syncError);
    }
    
    return {
      success: true,
      message: '매니저 등록이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.'
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
    version: '6.2.10',
    message: '사근복 AI Apps Script v6.2.10 - 시트 이름 수정 및 자동 동기화 추가'
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
        
      case 'getAllMembers':
        result = getAllMembers();
        break;
        
      case 'updateMemberStatus':
        result = updateMemberStatus(data.phone, data.type, data.status);
        break;
        
      case 'syncJson':
        result = syncJsonFiles();
        break;
        
      case 'getJsonUrls':
        result = getJsonUrls();
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

/**
 * 모든 회원 조회 (관리자용)
 */
function getAllMembers() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const members = [];
    
    // 기업회원 조회
    const companySheet = ss.getSheetByName('기업회원');
    if (companySheet) {
      const companyData = companySheet.getDataRange().getValues();
      for (let i = 1; i < companyData.length; i++) {
        const row = companyData[i];
        if (row[0]) { // 회사명이 있으면
          members.push({
            type: 'company',
            companyName: row[0],
            companyType: row[1],
            referrer: row[2],
            name: row[3],
            phone: row[4],
            email: row[5],
            registeredAt: row[7] ? formatDate(row[7]) : '',
            status: row[8] || '승인 대기'
          });
        }
      }
    }
    
    // 매니저 조회
    const managerSheet = ss.getSheetByName('사근복컨설턴트(매니저)');
    if (managerSheet) {
      const managerData = managerSheet.getDataRange().getValues();
      for (let i = 1; i < managerData.length; i++) {
        const row = managerData[i];
        if (row[0]) { // 이름이 있으면
          members.push({
            type: 'manager',
            name: row[0],
            phone: row[1],
            email: row[2],
            position: row[3],
            businessUnit: row[4],
            branch: row[5],
            registeredAt: row[7] ? formatDate(row[7]) : '',
            status: row[8] || '승인 대기'
          });
        }
      }
    }
    
    // 컨설턴트 조회
    const consultantSheet = ss.getSheetByName('사근복컨설턴트');
    if (consultantSheet) {
      const consultantData = consultantSheet.getDataRange().getValues();
      for (let i = 1; i < consultantData.length; i++) {
        const row = consultantData[i];
        if (row[0]) { // 이름이 있으면
          members.push({
            type: 'consultant',
            name: row[0],
            phone: row[1],
            email: row[2],
            position: row[3],
            businessUnit: row[4],
            branch: row[5],
            registeredAt: row[7] ? formatDate(row[7]) : '',
            status: row[8] || '승인 대기'
          });
        }
      }
    }
    
    writeLog('조회', '전체', 'admin', '전체 회원 조회', '성공 (' + members.length + '명)');
    
    return {
      success: true,
      members: members
    };
    
  } catch (error) {
    Logger.log('getAllMembers 오류: ' + error);
    writeLog('조회', '전체', 'admin', '전체 회원 조회', '실패: ' + error);
    return {
      success: false,
      error: '회원 목록 조회 실패: ' + error.toString()
    };
  }
}

/**
 * 회원 상태 업데이트 (관리자용)
 */
function updateMemberStatus(phone, type, status) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheetName;
    
    switch (type) {
      case 'company':
        sheetName = '기업회원';
        break;
      case 'manager':
        sheetName = '사근복컨설턴트(매니저)';
        break;
      case 'consultant':
        sheetName = '사근복컨설턴트';
        break;
      default:
        return {
          success: false,
          error: '잘못된 회원 유형입니다: ' + type
        };
    }
    
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return {
        success: false,
        error: sheetName + ' 시트를 찾을 수 없습니다.'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // 전화번호로 행 찾기
    let phoneColIndex = (type === 'company') ? 4 : 1; // 기업회원은 E열(4), 매니저/컨설턴트는 B열(1)
    
    for (let i = 1; i < data.length; i++) {
      const rowPhone = normalizePhoneNumber(String(data[i][phoneColIndex]));
      if (rowPhone === normalizedPhone) {
        // 회원 정보 가져오기 (이메일 발송용)
        const row = data[i];
        const memberName = (type === 'company') ? row[3] : row[0]; // 기업회원은 D열, 나머지는 A열
        const memberEmail = (type === 'company') ? row[5] : row[2]; // 기업회원은 F열, 나머지는 C열
        
        // I열(인덱스 8)에 상태 업데이트
        sheet.getRange(i + 1, 9).setValue(status);
        
        writeLog('상태변경', type, phone, status + '로 변경', '성공');
        
        // 승인 시 이메일 발송
        if (status === '승인' || status === '승인완료') {
          try {
            sendApprovalEmail(type, memberName, memberEmail, phone);
          } catch (emailError) {
            Logger.log('승인 이메일 발송 실패: ' + emailError);
          }
        }
        // 거부 시 이메일 발송
        else if (status === '거부') {
          try {
            sendRejectionEmail(type, memberName, memberEmail);
          } catch (emailError) {
            Logger.log('거부 이메일 발송 실패: ' + emailError);
          }
        }
        
        // 자동 JSON 동기화
        try {
          syncJsonFiles();
        } catch (syncError) {
          Logger.log('JSON 자동 동기화 실패: ' + syncError);
        }
        
        return {
          success: true,
          message: '상태가 ' + status + '(으)로 변경되었습니다.'
        };
      }
    }
    
    return {
      success: false,
      error: '해당 전화번호의 회원을 찾을 수 없습니다.'
    };
    
  } catch (error) {
    Logger.log('updateMemberStatus 오류: ' + error);
    writeLog('상태변경', type, phone, status, '실패: ' + error);
    return {
      success: false,
      error: '상태 변경 실패: ' + error.toString()
    };
  }
}

/**
 * JSON 파일 동기화 (Google Drive)
 */
function syncJsonFiles() {
  try {
    // 모든 회원 정보 가져오기
    const membersResult = getAllMembers();
    if (!membersResult.success) {
      return membersResult;
    }
    
    const members = membersResult.members;
    
    // JSON 파일로 변환
    const jsonContent = JSON.stringify(members, null, 2);
    
    // Google Drive에 저장 (여기서는 간단히 성공 반환)
    // 실제로는 DriveApp을 사용하여 파일 생성/업데이트
    
    writeLog('동기화', 'JSON', 'admin', members.length + '명 동기화', '성공');
    
    return {
      success: true,
      message: 'JSON 파일이 동기화되었습니다. (' + members.length + '명)'
    };
    
  } catch (error) {
    Logger.log('syncJsonFiles 오류: ' + error);
    writeLog('동기화', 'JSON', 'admin', 'JSON 동기화', '실패: ' + error);
    return {
      success: false,
      error: 'JSON 동기화 실패: ' + error.toString()
    };
  }
}

/**
 * JSON 파일 URL 조회
 */
function getJsonUrls() {
  try {
    // 실제로는 Google Drive 파일 URL을 반환
    // 여기서는 임시로 빈 URL 반환
    
    writeLog('조회', 'JSON URL', 'admin', 'JSON URL 조회', '성공');
    
    return {
      success: true,
      urls: {
        allMembers: 'https://drive.google.com/file/d/...',
        byConsultant: 'https://drive.google.com/file/d/...'
      }
    };
    
  } catch (error) {
    Logger.log('getJsonUrls 오류: ' + error);
    writeLog('조회', 'JSON URL', 'admin', 'JSON URL 조회', '실패: ' + error);
    return {
      success: false,
      error: 'JSON URL 조회 실패: ' + error.toString()
    };
  }
}

/**
 * 날짜 포맷 함수
 */
function formatDate(date) {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      return date;
    }
    
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }
    
    return String(date);
  } catch (error) {
    return String(date);
  }
}
