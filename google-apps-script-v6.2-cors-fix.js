/**
 * 사근복 AI - Google Apps Script 백엔드
 * 버전 6.2 - CORS 헤더 추가
 */

// ... (기존 코드 동일) ...

/**
 * GET 요청 처리 (CORS 헤더 추가)
 */
function doGet(e) {
  const data = parseRequestData(e);
  
  let result;
  
  // 액션이 있으면 처리
  if (data.action) {
    result = handleAction(e);
  } else {
    // 기본 응답
    result = {
      success: true,
      version: '6.2',
      timestamp: getKSTTimestamp(),
      message: '사근복 AI Apps Script v6.2 - CORS 지원'
    };
  }
  
  // CORS 헤더 추가
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리 (CORS 헤더 추가)
 */
function doPost(e) {
  const result = handleAction(e);
  
  // CORS 헤더 추가
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 액션 처리 (공통)
 */
function handleAction(e) {
  try {
    const data = parseRequestData(e);
    
    if (data.action === 'loginCompany') {
      return loginCompany(data.phone, data.password);
    }
    
    if (data.action === 'loginConsultant') {
      return loginConsultant(data.phone, data.password);
    }
    
    if (data.action === 'registerCompany') {
      return registerCompany(data);
    }
    
    if (data.action === 'registerConsultant') {
      return registerConsultant(data);
    }
    
    if (data.action === 'getAllMembers') {
      return getAllMembers();
    }
    
    if (data.action === 'updateMemberStatus') {
      return updateMemberStatus(data.phone, data.type, data.status);
    }
    
    if (data.action === 'syncJson') {
      return syncAllJsonFiles();
    }
    
    if (data.action === 'getJsonUrls') {
      return getJsonDownloadUrls();
    }
    
    return { success: false, error: '알 수 없는 액션입니다.' };
      
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
