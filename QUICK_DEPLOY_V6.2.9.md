# ✅ Apps Script v6.2.9 배포 완료 체크리스트

## 📦 준비 완료
- ✅ `APPS_SCRIPT_V6.2.9_ADMIN_FUNCTIONS.js` 생성 (1,017줄)
- ✅ `DEPLOY_V6.2.9_GUIDE.md` 작성
- ✅ Git 커밋 완료 (2b0426e)

## 🎯 새로 추가된 API

### getAllMembers
```bash
curl -L 'https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec?action=getAllMembers'
```

### updateMemberStatus
```bash
curl -L 'https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec?action=updateMemberStatus&phone=01012345678&type=company&status=승인'
```

### syncJson
```bash
curl -L 'https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec?action=syncJson'
```

### getJsonUrls
```bash
curl -L 'https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec?action=getJsonUrls'
```

## 🚀 즉시 배포 방법

### 1️⃣ 코드 복사
```bash
cat /home/user/webapp/APPS_SCRIPT_V6.2.9_ADMIN_FUNCTIONS.js
```
전체 코드를 복사하세요.

### 2️⃣ Apps Script 에디터
1. 접속: https://script.google.com/home
2. 사근복 프로젝트 열기
3. 전체 선택 (Ctrl+A)
4. 붙여넣기 (Ctrl+V)
5. 저장 (Ctrl+S)

### 3️⃣ 배포
1. 우측 상단 **"배포"** → **"배포 관리"**
2. 현재 배포 **"수정"** (연필 아이콘)
3. 버전: **"새 버전"**
4. 설명: `v6.2.9 - 관리자 대시보드 API 추가`
5. **"배포"** 클릭

### 4️⃣ 확인
```bash
curl -L 'https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec'
```

**예상 응답**:
```json
{
  "success": true,
  "version": "6.2.9",
  "message": "사근복 AI Apps Script v6.2.9 - 관리자 기능 추가 (getAllMembers, updateMemberStatus, syncJson, getJsonUrls)"
}
```

## 🎉 배포 완료 후
1. ✅ 브라우저에서 관리자 대시보드 접속
2. ✅ "💾 수동 동기화" 버튼 클릭 → 성공 메시지 확인
3. ✅ "📥 다운로드 링크 보기" 버튼 클릭 → URL 확인
4. ✅ 회원 목록 조회 → 모든 회원 표시 확인
5. ✅ 회원 상태 변경 → 승인/대기 변경 확인

## 📝 중요 사항
- ✅ 프론트엔드는 **재배포 불필요**
- ✅ 기존 URL **변경 없음**
- ✅ 로그인 기능 **영향 없음**
- ✅ 기존 기능 **모두 유지**

## 🔗 참고 문서
- 상세 가이드: `/home/user/webapp/DEPLOY_V6.2.9_GUIDE.md`
- Apps Script 파일: `/home/user/webapp/APPS_SCRIPT_V6.2.9_ADMIN_FUNCTIONS.js`
- Git 커밋: `2b0426e`

---

**Apps Script만 재배포하면 즉시 사용 가능합니다!** 🚀
