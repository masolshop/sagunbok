const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwB26bKC8LI0MVYdmGptMYEXeiD4XtbrI5jsbxWheQbpBstq4ECHGQ_YfrhvEoOFKIM4g/exec';

async function callAPI(action, data) {
    const url = `${BACKEND_URL}?${new URLSearchParams({ action, ...data })}`;
    console.log(`\n📡 요청: ${action}`);
    console.log(`🔗 URL: ${url}`);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        const result = await response.json();
        console.log(`✅ 응답:`, JSON.stringify(result, null, 2));
        return result;
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
        const result = await callAPI('registerConsultant', {
            name: '홍길동',
            phone: '010-8765-4321',
            email: 'hong@sagunbok.com',
            position: '수석 컨설턴트',
            businessUnit: '서울사업단',
            branchOffice: '강남지사'
        });
        
        if (result.status === 'success') {
            console.log('✅ 컨설턴트 가입 성공!');
            console.log('📝 다음 단계: Google Sheets에서 승인여부를 "승인완료"로 변경하세요');
        } else if (result.message && result.message.includes('이미 등록된')) {
            console.log('⚠️  이미 등록된 컨설턴트입니다 (정상)');
        } else {
            console.log('❌ 컨설턴트 가입 실패:', result.message);
        }
    } catch (error) {
        console.error('❌ 컨설턴트 가입 오류:', error.message);
    }
    
    // 대기
    console.log('\n⏳ 3초 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. 기업회원 가입
    console.log('\n\n3️⃣ 기업회원 가입 테스트 (추천인: 홍길동)');
    console.log('-'.repeat(60));
    try {
        const result = await callAPI('registerCompany', {
            companyName: '테스트주식회사',
            companyType: '법인',
            referrer: '홍길동',
            name: '김철수',
            phone: '010-1234-5678',
            email: 'test@company.com',
            password: 'test1234'
        });
        
        if (result.status === 'success') {
            console.log('✅ 기업회원 가입 성공!');
            console.log('📝 다음 단계: Google Sheets에서 승인여부를 "승인완료"로 변경하세요');
        } else if (result.message && result.message.includes('이미 등록된')) {
            console.log('⚠️  이미 등록된 회원입니다 (정상)');
        } else {
            console.log('❌ 기업회원 가입 실패:', result.message);
        }
    } catch (error) {
        console.error('❌ 기업회원 가입 오류:', error.message);
    }
    
    // 대기
    console.log('\n⏳ 3초 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. 컨설턴트 로그인
    console.log('\n\n4️⃣ 컨설턴트 로그인 테스트');
    console.log('-'.repeat(60));
    console.log('⚠️  주의: 로그인 전에 Google Sheets에서 승인여부를 "승인완료"로 변경해야 합니다');
    try {
        const result = await callAPI('loginConsultant', {
            phone: '010-8765-4321',
            password: '12345'
        });
        
        if (result.status === 'success') {
            console.log('✅ 컨설턴트 로그인 성공!');
            console.log('👤 사용자 정보:', JSON.stringify(result.user, null, 2));
        } else {
            console.log('❌ 컨설턴트 로그인 실패:', result.message);
            if (result.message && result.message.includes('승인')) {
                console.log('📝 Google Sheets에서 승인여부를 "승인완료"로 변경하세요');
            }
        }
    } catch (error) {
        console.error('❌ 컨설턴트 로그인 오류:', error.message);
    }
    
    // 대기
    console.log('\n⏳ 3초 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. 기업회원 로그인
    console.log('\n\n5️⃣ 기업회원 로그인 테스트');
    console.log('-'.repeat(60));
    console.log('⚠️  주의: 로그인 전에 Google Sheets에서 승인여부를 "승인완료"로 변경해야 합니다');
    try {
        const result = await callAPI('loginCompany', {
            phone: '010-1234-5678',
            password: 'test1234'
        });
        
        if (result.status === 'success') {
            console.log('✅ 기업회원 로그인 성공!');
            console.log('👤 사용자 정보:', JSON.stringify(result.user, null, 2));
        } else {
            console.log('❌ 기업회원 로그인 실패:', result.message);
            if (result.message && result.message.includes('승인')) {
                console.log('📝 Google Sheets에서 승인여부를 "승인완료"로 변경하세요');
            }
        }
    } catch (error) {
        console.error('❌ 기업회원 로그인 오류:', error.message);
    }
    
    console.log('\n\n' + '='.repeat(60));
    console.log('🎉 테스트 완료!');
    console.log('='.repeat(60));
    console.log('\n📊 Google Sheets 확인:');
    console.log('https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit');
    console.log('\n📝 다음 단계:');
    console.log('1. Google Sheets 열기');
    console.log('2. 사근복컨설턴트 시트에서 홍길동 찾기');
    console.log('3. 승인여부를 "승인완료"로 변경');
    console.log('4. 기업회원 시트에서 김철수 찾기');
    console.log('5. 승인여부를 "승인완료"로 변경');
    console.log('6. 로그인 테스트 재실행');
}

runTests().catch(console.error);
