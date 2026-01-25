/**
 * Apps Script API 테스트 스크립트
 * 배포된 v6.2.12 API 엔드포인트를 테스트합니다
 */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx2A1eC-1S5bKrpzuN6CFQlSn5OMxsU6Xv_3zzqLXPpf9C2CxP-kvKY3n5r/exec';

// 테스트 함수들
const tests = {
  // 1. 버전 확인
  async checkVersion() {
    console.log('\n=== 1. 버전 확인 테스트 ===');
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getVersion&_t=${Date.now()}`);
      const data = await response.json();
      console.log('✅ 버전:', data);
      return data;
    } catch (error) {
      console.error('❌ 버전 확인 실패:', error.message);
      return null;
    }
  },

  // 2. 매니저 목록 조회 (시트 이름 확인)
  async getManagers() {
    console.log('\n=== 2. 매니저 목록 조회 (시트 이름 확인) ===');
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getAllMembers&_t=${Date.now()}`);
      const data = await response.json();
      
      if (data.success) {
        const managers = data.members.filter(m => m.userType === 'manager');
        console.log(`✅ 매니저 수: ${managers.length}명`);
        if (managers.length > 0) {
          console.log('첫 번째 매니저:', {
            name: managers[0].name,
            phone: managers[0].phone,
            approvalStatus: managers[0].approvalStatus
          });
        }
        return managers;
      } else {
        console.error('❌ 매니저 목록 조회 실패:', data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ 매니저 목록 조회 에러:', error.message);
      return null;
    }
  },

  // 3. 컨설턴트 목록 조회
  async getConsultants() {
    console.log('\n=== 3. 컨설턴트 목록 조회 ===');
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getAllMembers&_t=${Date.now()}`);
      const data = await response.json();
      
      if (data.success) {
        const consultants = data.members.filter(m => m.userType === 'consultant');
        console.log(`✅ 컨설턴트 수: ${consultants.length}명`);
        if (consultants.length > 0) {
          console.log('첫 번째 컨설턴트:', {
            name: consultants[0].name,
            phone: consultants[0].phone,
            approvalStatus: consultants[0].approvalStatus
          });
        }
        return consultants;
      } else {
        console.error('❌ 컨설턴트 목록 조회 실패:', data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ 컨설턴트 목록 조회 에러:', error.message);
      return null;
    }
  },

  // 4. 매니저 로그인 테스트 (비밀번호 12345)
  async testManagerLogin(phone) {
    console.log('\n=== 4. 매니저 로그인 테스트 ===');
    try {
      const response = await fetch(`${SCRIPT_URL}?action=loginConsultant&phone=${encodeURIComponent(phone)}&password=12345&_t=${Date.now()}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 매니저 로그인 성공:', {
          name: data.userData.name,
          phone: data.userData.phone,
          approvalStatus: data.userData.approvalStatus
        });
        return true;
      } else {
        console.error('❌ 매니저 로그인 실패:', data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ 매니저 로그인 에러:', error.message);
      return false;
    }
  },

  // 5. 슈퍼관리자 확인
  async checkSuperAdmin() {
    console.log('\n=== 5. 슈퍼관리자 확인 (01063529091) ===');
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getAllMembers&_t=${Date.now()}`);
      const data = await response.json();
      
      if (data.success) {
        const superAdmin = data.members.find(m => m.phone === '01063529091');
        if (superAdmin) {
          console.log('✅ 슈퍼관리자 찾음:', {
            name: superAdmin.name,
            phone: superAdmin.phone,
            userType: superAdmin.userType,
            approvalStatus: superAdmin.approvalStatus
          });
          return superAdmin;
        } else {
          console.log('⚠️ 슈퍼관리자 (01063529091) 찾을 수 없음');
          return null;
        }
      }
    } catch (error) {
      console.error('❌ 슈퍼관리자 확인 에러:', error.message);
      return null;
    }
  }
};

// 메인 테스트 실행
async function runTests() {
  console.log('🚀 Apps Script v6.2.12 테스트 시작');
  console.log('API URL:', SCRIPT_URL);
  
  // 1. 버전 확인
  const version = await tests.checkVersion();
  
  // 2. 매니저 목록 조회
  const managers = await tests.getManagers();
  
  // 3. 컨설턴트 목록 조회
  const consultants = await tests.getConsultants();
  
  // 4. 매니저 로그인 테스트 (첫 번째 매니저로 테스트)
  if (managers && managers.length > 0) {
    const firstManager = managers[0];
    await tests.testManagerLogin(firstManager.phone);
  } else {
    console.log('⚠️ 테스트할 매니저가 없습니다');
  }
  
  // 5. 슈퍼관리자 확인
  await tests.checkSuperAdmin();
  
  console.log('\n✅ 모든 테스트 완료!');
}

// Node.js 환경 체크 및 실행
if (typeof fetch === 'undefined') {
  console.log('Node.js 환경에서 실행 중... node-fetch 필요');
  console.log('브라우저 콘솔에서 실행하세요.');
} else {
  runTests();
}

// 브라우저 콘솔용 export
if (typeof window !== 'undefined') {
  window.runSaggunbokTests = runTests;
}
