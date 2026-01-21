/**
 * ============================================================
 * Google Sheets 초기화 스크립트
 * 작성일: 2026-01-21
 * 목적: 기업회원 시트 헤더 재설정
 * ============================================================
 */

function resetCompanySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = '기업회원';
  
  // 기존 시트 삭제 (있으면)
  const existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    Logger.log('기존 "기업회원" 시트 삭제 중...');
    ss.deleteSheet(existingSheet);
  }
  
  // 새 시트 생성
  Logger.log('새 "기업회원" 시트 생성 중...');
  const sheet = ss.insertSheet(sheetName);
  
  // 헤더 설정
  const headers = [
    '가입일시',        // A
    '회사명',          // B
    '기업유형',        // C
    '이름',            // D
    '핸드폰번호',      // E
    '이메일',          // F
    '비밀번호',        // G
    '추천인',          // H
    '승인상태',        // I
    '',                // J (비어있음)
    '마지막로그인'     // K
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 헤더 스타일 설정
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4A90E2');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // E열(핸드폰번호)을 일반 텍스트로 설정
  Logger.log('E열 일반 텍스트 형식 설정 중...');
  sheet.getRange(2, 5, 1000, 1).setNumberFormat('@');
  
  // 열 너비 자동 조정
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
  
  Logger.log('✅ "기업회원" 시트 초기화 완료!');
  Logger.log('헤더: ' + headers.join(' | '));
  
  return {
    success: true,
    message: '기업회원 시트가 성공적으로 초기화되었습니다.',
    headers: headers
  };
}

function resetConsultantSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = '사근복컨설턴트';
  
  // 기존 시트 삭제 (있으면)
  const existingSheet = ss.getSheetByName(sheetName);
  if (existingSheet) {
    Logger.log('기존 "사근복컨설턴트" 시트 삭제 중...');
    ss.deleteSheet(existingSheet);
  }
  
  // 새 시트 생성
  Logger.log('새 "사근복컨설턴트" 시트 생성 중...');
  const sheet = ss.insertSheet(sheetName);
  
  // 헤더 설정
  const headers = [
    '이름',            // A
    '핸드폰번호',      // B
    '이메일',          // C
    '직함',            // D
    '소속 사업단',     // E
    '비밀번호',        // F
    '소속 지사',       // G
    '가입일시'         // H
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 헤더 스타일 설정
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2ECC71');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // B열(핸드폰번호)을 일반 텍스트로 설정
  Logger.log('B열 일반 텍스트 형식 설정 중...');
  sheet.getRange(2, 2, 1000, 1).setNumberFormat('@');
  
  // 열 너비 자동 조정
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
  
  Logger.log('✅ "사근복컨설턴트" 시트 초기화 완료!');
  Logger.log('헤더: ' + headers.join(' | '));
  
  return {
    success: true,
    message: '사근복컨설턴트 시트가 성공적으로 초기화되었습니다.',
    headers: headers
  };
}

function addTestConsultants() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('사근복컨설턴트');
  
  if (!sheet) {
    Logger.log('❌ "사근복컨설턴트" 시트를 찾을 수 없습니다.');
    return { success: false, error: '사근복컨설턴트 시트가 없습니다.' };
  }
  
  const timestamp = Utilities.formatDate(
    new Date(), 
    'Asia/Seoul', 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  // 테스트 데이터
  const testData = [
    ['김철수', "'010-1234-5678", 'kim@sagunbok.com', '팀장', '서울사업단', '12345', '서울지사', timestamp],
    ['이영희', "'010-5678-1234", 'lee@sagunbok.com', '과장', '부산사업단', '12345', '부산지사', timestamp],
    ['박민수', "'010-9876-5432", 'park@sagunbok.com', '대리', '대구사업단', '12345', '대구지사', timestamp]
  ];
  
  // 데이터 추가
  testData.forEach(row => {
    sheet.appendRow(row);
  });
  
  Logger.log('✅ 테스트 컨설턴트 3명 추가 완료!');
  Logger.log('등록된 이름: 김철수, 이영희, 박민수');
  
  return {
    success: true,
    message: '테스트 컨설턴트 3명이 추가되었습니다.',
    consultants: ['김철수', '이영희', '박민수']
  };
}

function resetAllSheets() {
  Logger.log('===== 전체 시트 초기화 시작 =====');
  
  // 1. 기업회원 시트 초기화
  const result1 = resetCompanySheet();
  Logger.log(JSON.stringify(result1));
  
  // 2. 사근복컨설턴트 시트 초기화
  const result2 = resetConsultantSheet();
  Logger.log(JSON.stringify(result2));
  
  // 3. 테스트 컨설턴트 추가
  const result3 = addTestConsultants();
  Logger.log(JSON.stringify(result3));
  
  Logger.log('===== 전체 시트 초기화 완료 =====');
  
  return {
    success: true,
    message: '모든 시트가 초기화되었습니다.',
    results: [result1, result2, result3]
  };
}
