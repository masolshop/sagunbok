# 🧪 브라우저 테스트 가이드

## 현재 상황 분석

### Network 탭에서 확인된 사항:
- ✅ `index-BByIZ93f.js` (1.3 MB) - 정상 로드
- ✅ `index-DB6axhxu.css` (20.8 kB) - 정상 로드
- ⚠️ Google Fonts CSS - 302 리다이렉트 (정상, 폰트 로드 중)
- ❌ Tailwind CSS 프로덕션 경고 (무시 가능)
- ❌ Runtime errors (Chrome 확장 프로그램 관련)

---

## 🎯 Step 1: localStorage 확인

**Console 탭에서 실행:**

```javascript
// 현재 저장된 사용자 확인
const currentUser = localStorage.getItem('sagunbok_user');
if (currentUser) {
  console.log('현재 로그인 상태:', JSON.parse(currentUser));
} else {
  console.log('로그인되지 않음');
}
```

**결과:**
- 로그인되어 있다면 → **Step 4**로 이동
- 로그인되지 않았다면 → **Step 2**로 진행

---

## 🎯 Step 2: 로그인 폼 테스트

### A. UI에서 로그인 시도

```
1. 로그인 버튼 클릭
2. 기업 탭 선택
3. 전화번호: 01063529091
4. 비밀번호: 12345
5. 로그인 버튼 클릭
```

**Network 탭 확인:**
- `exec?action=loginCompany` 요청 찾기
- 응답 확인 (success: true 여부)

### B. Console에서 직접 로그인

UI 로그인이 실패하면 Console에서 다음 실행:

```javascript
// 직접 API 호출
fetch('https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec?action=loginCompany&phone=01063529091&password=12345&_t=' + Date.now())
  .then(r => r.json())
  .then(data => {
    console.log('📋 로그인 API 응답:', data);
    
    if (data.success) {
      console.log('✅ API 로그인 성공!');
      
      // 사용자 정보 localStorage에 저장
      const user = data.userData;
      user.userType = 'company';
      
      console.log('📋 사용자 정보:', user);
      console.log('🔑 슈퍼어드민:', user.isSuperAdmin);
      
      localStorage.setItem('sagunbok_user', JSON.stringify(user));
      
      console.log('✅ localStorage 저장 완료');
      console.log('🔄 페이지를 새로고침합니다...');
      
      // 3초 후 새로고침
      setTimeout(() => location.reload(), 3000);
    } else {
      console.error('❌ 로그인 실패:', data.error);
    }
  })
  .catch(err => {
    console.error('❌ API 호출 오류:', err);
  });
```

---

## 🎯 Step 3: 새로고침 후 확인

페이지 새로고침 후:

```javascript
// 로그인 상태 재확인
const user = JSON.parse(localStorage.getItem('sagunbok_user'));
console.log('📋 현재 사용자:', user);
console.log('🔑 슈퍼어드민:', user?.isSuperAdmin);
console.log('📱 전화번호:', user?.phone);
console.log('👤 이름:', user?.name);
console.log('🏢 회사:', user?.companyName);
```

---

## 🎯 Step 4: 메뉴 접근 확인

로그인 후:

1. **좌측 메뉴 확인**
   - 모든 메뉴가 활성화되어 있는지 확인
   - "기업절세계산기" 클릭 가능한지 확인

2. **기업절세계산기 접근**
   - 좌측 메뉴 → "기업절세계산기" 클릭
   - 페이지가 로드되는지 확인

3. **복리후생비절세 탭**
   - 탭이 보이는지 확인
   - 시뮬레이션 폼이 표시되는지 확인

---

## 🎯 Step 5: 복리후생비 시뮬레이션 테스트

1. **데이터 입력:**
   ```
   전년도 복리후생비: 10,000,000
   올해 예상 복리후생비: 12,000,000
   직원 수: 10
   평균 급여: 3,500,000
   ```

2. **시뮬레이션 실행** 버튼 클릭

3. **결과 확인**

---

## 🐛 트러블슈팅

### 문제 1: "전화번호 또는 비밀번호 불일치"

**해결:**
1. Console에서 직접 API 테스트:
   ```javascript
   fetch('https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec?action=loginCompany&phone=01063529091&password=12345&_t=' + Date.now())
     .then(r => r.json())
     .then(data => console.log(data));
   ```

2. Google Sheets 확인:
   - Row 2의 G열(전화번호): 01063529091
   - Row 2의 I열(비밀번호): 12345
   - Row 2의 K열(승인여부): 승인

### 문제 2: 로그인 후 메뉴가 비활성화

**해결:**
1. Console에서 isSuperAdmin 확인:
   ```javascript
   const user = JSON.parse(localStorage.getItem('sagunbok_user'));
   console.log('isSuperAdmin:', user.isSuperAdmin);
   ```

2. isSuperAdmin이 false라면:
   ```javascript
   const user = JSON.parse(localStorage.getItem('sagunbok_user'));
   user.isSuperAdmin = true;
   localStorage.setItem('sagunbok_user', JSON.stringify(user));
   location.reload();
   ```

### 문제 3: Tailwind CSS 경고

**무시 가능:** 이 경고는 개발 모드에서만 표시되며 실제 기능에 영향을 주지 않습니다.

**해결 (선택사항):**
- `vite.config.ts`에서 production 빌드 최적화
- 또는 경고 무시

### 문제 4: Runtime lastError

**원인:** Chrome 확장 프로그램 충돌

**해결:**
1. 시크릿 모드에서 테스트
2. 또는 확장 프로그램 비활성화

---

## 📋 체크리스트

### 배포 완료 항목:
- [x] Apps Script v7.2.2 배포
- [x] 슈퍼어드민 로직 추가
- [x] API 로그인 테스트 성공
- [x] 프런트엔드 재빌드
- [x] EC2 배포
- [x] Nginx 재시작

### 브라우저 테스트 항목:
- [ ] localStorage 확인 (Step 1)
- [ ] 로그인 시도 (Step 2)
- [ ] 새로고침 후 확인 (Step 3)
- [ ] 메뉴 접근 확인 (Step 4)
- [ ] 복리후생비 시뮬레이션 (Step 5)

---

## 🔗 관련 링크

- **사근복 사이트**: https://sagunbok.com
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc
- **GitHub PR**: https://github.com/masolshop/sagunbok/pull/1

---

## 💡 다음 단계

1. ✅ Step 1~5 순서대로 진행
2. ✅ 각 단계의 결과를 스크린샷으로 기록
3. ✅ 문제 발생 시 Console 로그 확인
4. ✅ 성공 시 복리후생비 시뮬레이션 실행

**현재 진행 단계를 알려주시면 다음 조치를 안내드리겠습니다!** 🚀
