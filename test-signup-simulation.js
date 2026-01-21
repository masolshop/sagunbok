/**
 * 사근복 AI 회원가입 시뮬레이션 테스트
 */

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbyZW1cSH2GtUvfwfk3nGHWvNMV9PCwlMrrIuc-09Ar7SHi4hpt-5cB08bqJDvWKGMWnhQ/exec';

console.log('='.repeat(80));
console.log('🧪 사근복 AI 회원가입 시뮬레이션 테스트 시작');
console.log('='.repeat(80));
console.log('');

async function testAPI(testName, action, data) {
  console.log(`\n📋 테스트: ${testName}`);
  console.log('─'.repeat(80));
  console.log('📤 요청 데이터:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 성공:', result.message || '성공');
      if (result.user) {
        console.log('👤 사용자 정보:', JSON.stringify(result.user, null, 2));
      }
    } else {
      console.log('❌ 실패:', result.error || '알 수 없는 오류');
    }
    
    console.log('📥 전체 응답:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.log('🚨 오류 발생:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  // 1. 헬스체크
  console.log('\n' + '='.repeat(80));
  console.log('1️⃣  헬스체크');
  console.log('='.repeat(80));
  
  try {
    const healthResponse = await fetch(BACKEND_URL);
    const health = await healthResponse.json();
    console.log('✅ 백엔드 상태:', health.status);
    console.log('📌 버전:', health.version);
    console.log('🎯 기능:', health.features.join(', '));
    console.log('⏰ 타임스탬프:', health.timestamp);
  } catch (error) {
    console.log('❌ 헬스체크 실패:', error.message);
    return;
  }
  
  // 2. 컨설턴트 회원가입 테스트
  console.log('\n' + '='.repeat(80));
  console.log('2️⃣  컨설턴트 회원가입 테스트');
  console.log('='.repeat(80));
  
  const consultantData = {
    name: '테스트컨설턴트',
    phone: '010-9999-0001',
    email: 'test.consultant@sagunbok.com',
    position: '주임 컨설턴트',
    businessUnit: '서울사업단',
    branchOffice: '테스트지사'
  };
  
  const consultantResult = await testAPI(
    '컨설턴트 회원가입',
    'registerConsultant',
    consultantData
  );
  
  // 3. 기업회원 가입 테스트 (올바른 추천인)
  console.log('\n' + '='.repeat(80));
  console.log('3️⃣  기업회원 회원가입 테스트 (올바른 추천인: 이종근)');
  console.log('='.repeat(80));
  
  const companyData = {
    companyName: '페마연컴퍼니',
    companyType: '법인',
    referrer: '이종근',
    name: '김대표',
    phone: '010-1234-5678',
    email: 'ceo@femayeon.com',
    password: 'test1234'
  };
  
  const companyResult = await testAPI(
    '기업회원 가입 (올바른 추천인)',
    'registerCompany',
    companyData
  );
  
  // 4. 기업회원 가입 테스트 (잘못된 추천인)
  console.log('\n' + '='.repeat(80));
  console.log('4️⃣  기업회원 회원가입 테스트 (잘못된 추천인)');
  console.log('='.repeat(80));
  
  const companyDataWrongReferrer = {
    companyName: '테스트회사2',
    companyType: '개인사업자',
    referrer: '존재하지않는사람',
    name: '홍길동',
    phone: '010-8888-9999',
    email: 'hong@test.com',
    password: 'test5678'
  };
  
  const wrongReferrerResult = await testAPI(
    '기업회원 가입 (잘못된 추천인)',
    'registerCompany',
    companyDataWrongReferrer
  );
  
  // 5. 중복 전화번호 테스트
  console.log('\n' + '='.repeat(80));
  console.log('5️⃣  중복 전화번호 테스트');
  console.log('='.repeat(80));
  
  const duplicatePhoneData = {
    companyName: '중복테스트회사',
    companyType: '법인',
    referrer: '이종근',
    name: '이중복',
    phone: '010-1234-5678', // 이미 사용된 번호
    email: 'duplicate@test.com',
    password: 'test9999'
  };
  
  const duplicateResult = await testAPI(
    '중복 전화번호',
    'registerCompany',
    duplicatePhoneData
  );
  
  // 최종 요약
  console.log('\n' + '='.repeat(80));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(80));
  console.log('');
  
  const results = [
    { name: '헬스체크', status: '✅ 성공' },
    { name: '컨설턴트 가입', status: consultantResult.success ? '✅ 성공' : '❌ 실패' },
    { name: '기업회원 가입 (올바른 추천인)', status: companyResult.success ? '✅ 성공' : '❌ 실패' },
    { name: '잘못된 추천인 검증', status: !wrongReferrerResult.success ? '✅ 성공 (오류 예상됨)' : '❌ 실패' },
    { name: '중복 전화번호 검증', status: !duplicateResult.success ? '✅ 성공 (오류 예상됨)' : '❌ 실패' }
  ];
  
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}: ${r.status}`);
  });
  
  console.log('');
  console.log('='.repeat(80));
  console.log('📋 다음 단계');
  console.log('='.repeat(80));
  console.log('');
  console.log('1. Google Sheets 확인:');
  console.log('   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit');
  console.log('');
  console.log('2. 확인 사항:');
  console.log('   - 사근복컨설턴트 시트: 테스트컨설턴트 데이터 추가됨');
  console.log('   - 기업회원 시트: 페마연컴퍼니 데이터 추가됨');
  console.log('   - 승인여부: 모두 "대기중"');
  console.log('');
  console.log('3. 승인 처리:');
  console.log('   - 각 시트의 I열(승인여부)를 "승인완료"로 변경');
  console.log('');
  console.log('4. 로그인 테스트:');
  console.log('   - 컨설턴트: 010-9999-0001 / 12345');
  console.log('   - 기업회원: 010-1234-5678 / test1234');
  console.log('');
  console.log('='.repeat(80));
  console.log('✅ 테스트 완료!');
  console.log('='.repeat(80));
}

runTests().catch(error => {
  console.error('테스트 실행 중 오류:', error);
});
