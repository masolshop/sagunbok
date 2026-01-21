/**
 * Google Apps Script 내부에서 직접 실행할 테스트 함수
 * 
 * 사용 방법:
 * 1. Google Sheets의 Apps Script 편집기 열기
 * 2. 이 코드를 Code-Final.gs 파일 맨 아래에 추가
 * 3. 상단 메뉴에서 testRegisterConsultant 함수 선택
 * 4. 실행 버튼 클릭
 * 5. 로그 확인 (Ctrl+Enter 또는 보기 > 로그)
 */

/**
 * 테스트 1: 컨설턴트 회원가입
 */
function testRegisterConsultant() {
  Logger.log('🧪 컨설턴트 회원가입 테스트 시작');
  
  const testData = {
    action: 'registerConsultant',
    name: '홍길동',
    phone: '010-8765-4321',
    email: 'hong@sagunbok.com',
    position: '수석 컨설턴트',
    businessUnit: '서울사업단',
    branchOffice: '강남지사'
  };
  
  try {
    // doPost 함수 직접 호출
    const mockEvent = {
      postData: {
        contents: JSON.stringify(testData),
        type: 'application/json'
      }
    };
    
    const result = doPost(mockEvent);
    const response = JSON.parse(result.getContent());
    
    Logger.log('✅ 응답: ' + JSON.stringify(response, null, 2));
    
    if (response.status === 'success') {
      Logger.log('✅ 컨설턴트 가입 성공!');
      Logger.log('📝 사근복컨설턴트 시트를 확인하세요');
    } else {
      Logger.log('❌ 실패: ' + response.message);
    }
    
    return response;
  } catch (error) {
    Logger.log('❌ 오류: ' + error.message);
    Logger.log(error.stack);
    throw error;
  }
}

/**
 * 테스트 2: 기업회원 가입
 */
function testRegisterCompany() {
  Logger.log('🧪 기업회원 가입 테스트 시작');
  
  const testData = {
    action: 'registerCompany',
    companyName: '테스트주식회사',
    companyType: '법인',
    referrer: '홍길동',
    name: '김철수',
    phone: '010-1234-5678',
    email: 'test@company.com',
    password: 'test1234'
  };
  
  try {
    const mockEvent = {
      postData: {
        contents: JSON.stringify(testData),
        type: 'application/json'
      }
    };
    
    const result = doPost(mockEvent);
    const response = JSON.parse(result.getContent());
    
    Logger.log('✅ 응답: ' + JSON.stringify(response, null, 2));
    
    if (response.status === 'success') {
      Logger.log('✅ 기업회원 가입 성공!');
      Logger.log('📝 기업회원 시트를 확인하세요');
    } else {
      Logger.log('❌ 실패: ' + response.message);
    }
    
    return response;
  } catch (error) {
    Logger.log('❌ 오류: ' + error.message);
    Logger.log(error.stack);
    throw error;
  }
}

/**
 * 테스트 3: 컨설턴트 로그인
 */
function testLoginConsultant() {
  Logger.log('🧪 컨설턴트 로그인 테스트 시작');
  Logger.log('⚠️  먼저 사근복컨설턴트 시트에서 승인여부를 "승인완료"로 변경하세요!');
  
  const testData = {
    action: 'loginConsultant',
    phone: '010-8765-4321',
    password: '12345'
  };
  
  try {
    const mockEvent = {
      postData: {
        contents: JSON.stringify(testData),
        type: 'application/json'
      }
    };
    
    const result = doPost(mockEvent);
    const response = JSON.parse(result.getContent());
    
    Logger.log('✅ 응답: ' + JSON.stringify(response, null, 2));
    
    if (response.status === 'success') {
      Logger.log('✅ 로그인 성공!');
      Logger.log('👤 사용자: ' + response.user.name);
    } else {
      Logger.log('❌ 실패: ' + response.message);
    }
    
    return response;
  } catch (error) {
    Logger.log('❌ 오류: ' + error.message);
    Logger.log(error.stack);
    throw error;
  }
}

/**
 * 테스트 4: 기업회원 로그인
 */
function testLoginCompany() {
  Logger.log('🧪 기업회원 로그인 테스트 시작');
  Logger.log('⚠️  먼저 기업회원 시트에서 승인여부를 "승인완료"로 변경하세요!');
  
  const testData = {
    action: 'loginCompany',
    phone: '010-1234-5678',
    password: 'test1234'
  };
  
  try {
    const mockEvent = {
      postData: {
        contents: JSON.stringify(testData),
        type: 'application/json'
      }
    };
    
    const result = doPost(mockEvent);
    const response = JSON.parse(result.getContent());
    
    Logger.log('✅ 응답: ' + JSON.stringify(response, null, 2));
    
    if (response.status === 'success') {
      Logger.log('✅ 로그인 성공!');
      Logger.log('👤 사용자: ' + response.user.name);
      Logger.log('🏢 회사: ' + response.user.companyName);
    } else {
      Logger.log('❌ 실패: ' + response.message);
    }
    
    return response;
  } catch (error) {
    Logger.log('❌ 오류: ' + error.message);
    Logger.log(error.stack);
    throw error;
  }
}

/**
 * 전체 테스트 실행
 */
function runAllTests() {
  Logger.log('🚀 전체 테스트 시작');
  Logger.log('='.repeat(60));
  
  try {
    // 1. 컨설턴트 가입
    Logger.log('\n1️⃣ 컨설턴트 회원가입');
    Logger.log('-'.repeat(60));
    testRegisterConsultant();
    
    Logger.log('\n⏳ 수동 작업 필요:');
    Logger.log('   사근복컨설턴트 시트를 열고');
    Logger.log('   홍길동의 승인여부를 "승인완료"로 변경하세요');
    Logger.log('   완료 후 testLoginConsultant() 실행');
    
    Logger.log('\n\n2️⃣ 기업회원 가입');
    Logger.log('-'.repeat(60));
    testRegisterCompany();
    
    Logger.log('\n⏳ 수동 작업 필요:');
    Logger.log('   기업회원 시트를 열고');
    Logger.log('   김철수의 승인여부를 "승인완료"로 변경하세요');
    Logger.log('   완료 후 testLoginCompany() 실행');
    
    Logger.log('\n\n='.repeat(60));
    Logger.log('✅ 회원가입 테스트 완료!');
    Logger.log('='.repeat(60));
    
  } catch (error) {
    Logger.log('❌ 테스트 중 오류 발생: ' + error.message);
    throw error;
  }
}
