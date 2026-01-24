/**
 * 권한 테스트 함수 - Apps Script 에디터에서 실행하세요
 * 
 * 사용법:
 * 1. Apps Script 에디터 상단의 함수 드롭다운에서 "testSpreadsheetAccess" 선택
 * 2. 실행 버튼(▶) 클릭
 * 3. 권한 요청 팝업이 나타나면 승인
 */
function testSpreadsheetAccess() {
  try {
    const ss = SpreadsheetApp.openById('1jdQ88Np2xK0qQ4c6t5J9-GXNP6PVkZ6b5MgKlIwEpBI');
    Logger.log('✅ 성공! 스프레드시트 이름: ' + ss.getName());
    
    // 시트 확인
    const sheet = ss.getSheetByName('기업회원');
    const data = sheet.getDataRange().getValues();
    Logger.log('✅ 기업회원 시트 행 수: ' + data.length);
    
    return '성공';
  } catch (e) {
    Logger.log('❌ 오류: ' + e.toString());
    return '실패';
  }
}

/**
 * 로그인 테스트
 */
function testLogin() {
  const result = loginCompany('01063529091', '12345');
  Logger.log('로그인 결과: ' + JSON.stringify(result));
  return result;
}
