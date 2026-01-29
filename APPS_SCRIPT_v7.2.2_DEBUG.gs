// 🔍 디버깅 전용: Google Sheets 구조 확인
function debugSheetStructure() {
  var ss = SpreadsheetApp.openById('1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc');
  var sheet = ss.getSheetByName('기업회원');
  var data = sheet.getDataRange().getValues();
  
  Logger.log('='.repeat(50));
  Logger.log('기업회원 시트 구조 디버깅');
  Logger.log('='.repeat(50));
  
  // 헤더 출력
  Logger.log('\n📋 헤더 (1행):');
  for (var col = 0; col < data[0].length; col++) {
    var colLetter = String.fromCharCode(65 + col); // A, B, C, ...
    Logger.log(colLetter + '열 (인덱스 ' + col + '): ' + data[0][col]);
  }
  
  // 슈퍼어드민 행 찾기
  Logger.log('\n🔍 슈퍼어드민 계정 찾기 (전화번호: 01063529091 또는 010-6352-9091)');
  
  for (var i = 1; i < data.length; i++) {
    var found = false;
    
    // 모든 열을 검색
    for (var col = 0; col < data[i].length; col++) {
      var cellValue = String(data[i][col]).replace(/[^0-9]/g, '');
      if (cellValue === '01063529091') {
        found = true;
        break;
      }
    }
    
    if (found) {
      Logger.log('\n✅ 발견! 행 ' + (i + 1) + ':');
      for (var col = 0; col < data[i].length; col++) {
        var colLetter = String.fromCharCode(65 + col);
        Logger.log('  ' + colLetter + '열 (인덱스 ' + col + '): ' + data[i][col]);
      }
    }
  }
  
  Logger.log('\n' + '='.repeat(50));
  Logger.log('디버깅 완료');
  Logger.log('='.repeat(50));
  
  return '로그를 확인하세요: View > Logs';
}

// 🧪 테스트 로그인 함수
function testLogin() {
  var phone = '01063529091';
  var password = '12345';
  
  var ss = SpreadsheetApp.openById('1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc');
  var sheet = ss.getSheetByName('기업회원');
  var data = sheet.getDataRange().getValues();
  
  Logger.log('='.repeat(50));
  Logger.log('🧪 로그인 테스트');
  Logger.log('입력: 전화번호=' + phone + ', 비밀번호=' + password);
  Logger.log('='.repeat(50));
  
  for (var i = 1; i < data.length; i++) {
    // 각 행의 모든 값 출력
    var rowPhone = data[i][6];  // G열
    var rowPassword = data[i][8];  // I열
    
    if (String(rowPhone).replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, '')) {
      Logger.log('\n✅ 전화번호 매칭! 행 ' + (i + 1));
      Logger.log('  G열 (인덱스 6): ' + rowPhone);
      Logger.log('  I열 (인덱스 8): ' + rowPassword);
      Logger.log('  비밀번호 매칭: ' + (String(rowPassword).trim() === password.trim()));
      
      Logger.log('\n📋 전체 행 데이터:');
      for (var col = 0; col < data[i].length; col++) {
        var colLetter = String.fromCharCode(65 + col);
        Logger.log('  ' + colLetter + '열 (인덱스 ' + col + '): ' + data[i][col]);
      }
      
      break;
    }
  }
  
  Logger.log('\n' + '='.repeat(50));
  return '로그를 확인하세요: View > Logs';
}
