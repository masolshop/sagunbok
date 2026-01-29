/**
 * 🚨 긴급 핫픽스 - doGet 파라미터 null 체크 추가
 * 
 * 문제: TypeError: Cannot read properties of undefined (reading 'parameter')
 * 원인: e 또는 e.parameter가 undefined일 때 크래시
 * 해결: null 체크 추가
 */

function doGet(e) {
  // e 또는 e.parameter가 없는 경우 에러 처리
  if (!e || !e.parameter) {
    Logger.log('doGet 호출 오류: e 또는 e.parameter가 없음');
    return createResponse({ 
      success: false, 
      error: 'Invalid request: missing parameters' 
    });
  }
  
  var action = e.parameter.action;
  
  if (!action) {
    Logger.log('doGet 호출 오류: action 파라미터가 없음');
    return createResponse({ 
      success: false, 
      error: 'Invalid request: missing action parameter' 
    });
  }
  
  try {
    // 회원가입
    if (action === 'registerCompany') {
      return createResponse(registerCompany(e.parameter));
    }
    if (action === 'registerManager') {
      return createResponse(registerManager(e.parameter));
    }
    if (action === 'registerConsultant') {
      return createResponse(registerConsultant(e.parameter));
    }
    
    // 로그인
    if (action === 'loginCompany') {
      return createResponse(loginCompany(e.parameter.phone, e.parameter.password));
    }
    if (action === 'loginConsultant') {
      return createResponse(loginConsultant(e.parameter.phone, e.parameter.password, e.parameter.userType));
    }
    
    // 승인/반려
    if (action === 'approveMember') {
      return createResponse(approveMember(e.parameter.userType, e.parameter.phone));
    }
    if (action === 'rejectMember') {
      return createResponse(rejectMember(e.parameter.userType, e.parameter.phone, e.parameter.reason));
    }
    
    // ID/비밀번호 찾기
    if (action === 'findId') {
      return createResponse(findId(e.parameter.name, e.parameter.email));
    }
    if (action === 'findPassword') {
      return createResponse(findPassword(e.parameter.name, e.parameter.phone));
    }
    
    // 사업자번호 조회
    if (action === 'lookupBusinessNumber') {
      return createResponse(lookupBusinessNumber(e.parameter.businessNumber));
    }
    
    // 알 수 없는 액션
    return createResponse({ 
      success: false, 
      error: 'Unknown action: ' + action 
    });
    
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return createResponse({ 
      success: false, 
      error: 'Server error: ' + error.toString() 
    });
  }
}
