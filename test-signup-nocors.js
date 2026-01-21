const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwB26bKC8LI0MVYdmGptMYEXeiD4XtbrI5jsbxWheQbpBstq4ECHGQ_YfrhvEoOFKIM4g/exec';

async function callAPI(action, data) {
    const payload = { action, ...data };
    console.log(`\n📡 요청: ${action}`);
    console.log(`📦 데이터:`, JSON.stringify(payload, null, 2));
    
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script CORS 문제 우회
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });
        
        // no-cors 모드에서는 응답을 읽을 수 없음
        console.log(`✅ 요청 전송 완료 (응답 상태: ${response.type})`);
        console.log(`⚠️  no-cors 모드로 인해 응답 내용을 확인할 수 없습니다`);
        console.log(`📝 Google Sheets를 직접 확인하세요`);
        
        return { status: 'sent', message: 'no-cors 모드로 요청 전송됨' };
    } catch (error) {
        console.error(`❌ 오류:`, error.message);
        throw error;
    }
}

async function runTests() {
    console.log('🚀 사근복 AI - 회원가입 시트 연동 테스트 시작\n');
    console.log('=' .repeat(60));
    
    // 1. 헬스체크
    console.log('\n\n1️⃣ 헬스체크 테스트');
    console.log('-'.repeat(60));
    try {
        const response = await fetch(BACKEND_URL);
        const health = await response.json();
        console.log('✅ 백엔드 상태:', JSON.stringify(health, null, 2));
    } catch (error) {
        console.error('❌ 헬스체크 실패:', error.message);
        return;
    }
    
    // 2. 컨설턴트 회원가입
    console.log('\n\n2️⃣ 컨설턴트 회원가입 테스트');
    console.log('-'.repeat(60));
    try {
        await callAPI('registerConsultant', {
            name: '홍길동',
            phone: '010-8765-4321',
            email: 'hong@sagunbok.com',
            position: '수석 컨설턴트',
            businessUnit: '서울사업단',
            branchOffice: '강남지사'
        });
        
        console.log('\n✅ 컨설턴트 가입 요청 전송 완료!');
        console.log('📝 Google Sheets 확인:');
        console.log('   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit');
        console.log('   → 사근복컨설턴트 시트에 홍길동 데이터가 추가되었는지 확인');
        console.log('   → 비밀번호: 12345 (자동 설정)');
        console.log('   → 승인여부: 대기중 → "승인완료"로 변경하세요');
    } catch (error) {
        console.error('❌ 컨설턴트 가입 오류:', error.message);
    }
    
    // 대기
    console.log('\n⏳ 5초 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. 기업회원 가입
    console.log('\n\n3️⃣ 기업회원 가입 테스트 (추천인: 홍길동)');
    console.log('-'.repeat(60));
    try {
        await callAPI('registerCompany', {
            companyName: '테스트주식회사',
            companyType: '법인',
            referrer: '홍길동',
            name: '김철수',
            phone: '010-1234-5678',
            email: 'test@company.com',
            password: 'test1234'
        });
        
        console.log('\n✅ 기업회원 가입 요청 전송 완료!');
        console.log('📝 Google Sheets 확인:');
        console.log('   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit');
        console.log('   → 기업회원 시트에 김철수 데이터가 추가되었는지 확인');
        console.log('   → 추천인 검증: 홍길동 (컨설턴트 시트 연동)');
        console.log('   → 승인여부: 대기중 → "승인완료"로 변경하세요');
    } catch (error) {
        console.error('❌ 기업회원 가입 오류:', error.message);
    }
    
    console.log('\n\n' + '='.repeat(60));
    console.log('🎉 회원가입 요청 전송 완료!');
    console.log('='.repeat(60));
    console.log('\n⚠️  중요: Google Apps Script의 CORS 제한으로 인해');
    console.log('   응답을 직접 확인할 수 없습니다.');
    console.log('   Google Sheets를 직접 열어서 데이터가');
    console.log('   제대로 추가되었는지 확인해주세요!\n');
    console.log('📊 Google Sheets 확인:');
    console.log('   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit');
    console.log('\n📝 확인할 사항:');
    console.log('   1. 사근복컨설턴트 시트:');
    console.log('      - 이름: 홍길동');
    console.log('      - 전화번호: 010-8765-4321');
    console.log('      - 비밀번호: 12345');
    console.log('      - 승인여부: 대기중 → "승인완료"로 변경');
    console.log('\n   2. 기업회원 시트:');
    console.log('      - 회사명: 테스트주식회사');
    console.log('      - 이름: 김철수');
    console.log('      - 전화번호: 010-1234-5678');
    console.log('      - 추천인: 홍길동');
    console.log('      - 승인여부: 대기중 → "승인완료"로 변경');
    console.log('\n🔄 다음 단계:');
    console.log('   1. Google Sheets에서 데이터 확인');
    console.log('   2. 승인여부를 "승인완료"로 변경');
    console.log('   3. 웹 브라우저에서 로그인 테스트');
    console.log('   4. 테스트 URL: https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai');
}

runTests().catch(console.error);
