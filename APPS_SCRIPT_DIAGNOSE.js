/**
 * 구글 시트 진단 스크립트
 * Apps Script 에디터에 이 함수를 추가하고 실행하세요
 */

function diagnoseSheet() {
  const SPREADSHEET_ID = '1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc';
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ 스프레드시트 접근 성공: ' + ss.getName());
    
    const sheet = ss.getSheetByName('기업회원');
    if (!sheet) {
      Logger.log('❌ 기업회원 시트를 찾을 수 없습니다.');
      Logger.log('사용 가능한 시트:');
      ss.getSheets().forEach(s => Logger.log('  - ' + s.getName()));
      return;
    }
    
    Logger.log('✅ 기업회원 시트 찾음');
    
    const data = sheet.getDataRange().getValues();
    Logger.log('\n총 행 수: ' + data.length);
    
    // 헤더 출력
    Logger.log('\n=== 헤더 (1행) ===');
    for (let i = 0; i < data[0].length; i++) {
      Logger.log('컬럼 ' + i + ': ' + data[0][i]);
    }
    
    // 모든 데이터 행 출력
    Logger.log('\n=== 모든 데이터 ===');
    for (let i = 1; i < data.length; i++) {
      Logger.log('\n--- 행 ' + i + ' ---');
      for (let j = 0; j < data[i].length; j++) {
        Logger.log('  [' + j + '] ' + data[0][j] + ': ' + data[i][j]);
      }
    }
    
    // 전화번호 01063529091 찾기
    Logger.log('\n=== 전화번호 01063529091 검색 ===');
    const targetPhone = '01063529091';
    let found = false;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      for (let j = 0; j < row.length; j++) {
        const normalized = String(row[j]).replace(/[^0-9]/g, '');
        if (normalized === targetPhone) {
          Logger.log('✅ 찾음! 행: ' + i + ', 컬럼: ' + j + ' (' + data[0][j] + ')');
          Logger.log('해당 행 전체 데이터:');
          for (let k = 0; k < row.length; k++) {
            Logger.log('  [' + k + '] ' + data[0][k] + ': ' + row[k]);
          }
          found = true;
          break;
        }
      }
      if (found) break;
    }
    
    if (!found) {
      Logger.log('❌ 전화번호를 찾을 수 없습니다.');
    }
    
    return '진단 완료';
    
  } catch (e) {
    Logger.log('❌ 오류: ' + e.toString());
    return '실패';
  }
}
