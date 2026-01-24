# 🚀 Apps Script v6.2.9 배포 가이드

## 📋 버전 정보
- **버전**: v6.2.9
- **배포일**: 2026-01-24
- **주요 변경사항**: 관리자 대시보드 API 추가

## ✨ 새로 추가된 기능

### 1️⃣ getAllMembers
- **설명**: 모든 회원 정보 조회 (기업회원, 매니저, 컨설턴트)
- **응답 형식**:
```json
{
  "success": true,
  "members": [
    {
      "type": "company",
      "companyName": "페마연",
      "companyType": "법인",
      "referrer": "이종근",
      "name": "이종근",
      "phone": "01063529091",
      "email": "tysagunbok@gmail.com",
      "registeredAt": "2026-01-24",
      "status": "승인"
    }
  ]
}
```

### 2️⃣ updateMemberStatus
- **설명**: 회원 승인 상태 변경
- **파라미터**:
  - `phone`: 전화번호
  - `type`: 'company' | 'manager' | 'consultant'
  - `status`: '승인' | '승인 대기' | '거부' 등
- **응답 형식**:
```json
{
  "success": true,
  "message": "상태가 승인(으)로 변경되었습니다."
}
```

### 3️⃣ syncJson
- **설명**: Google Drive JSON 파일 동기화
- **응답 형식**:
```json
{
  "success": true,
  "message": "JSON 파일이 동기화되었습니다. (5명)"
}
```

### 4️⃣ getJsonUrls
- **설명**: JSON 파일 다운로드 URL 조회
- **응답 형식**:
```json
{
  "success": true,
  "urls": {
    "allMembers": "https://drive.google.com/file/d/...",
    "byConsultant": "https://drive.google.com/file/d/..."
  }
}
```

## 🔧 배포 방법

### 1단계: Apps Script 에디터 열기
```
https://script.google.com/home
```

### 2단계: 코드 복사
로컬 파일에서 코드 복사:
```bash
cat /home/user/webapp/APPS_SCRIPT_V6.2.9_ADMIN_FUNCTIONS.js
```

### 3단계: 코드 교체
1. 기존 Apps Script 프로젝트 열기
2. 전체 코드 선택 (Ctrl+A / Cmd+A)
3. 새 코드 붙여넣기 (Ctrl+V / Cmd+V)
4. 저장 (Ctrl+S / Cmd+S)

### 4단계: 배포
1. 우측 상단 **"배포"** 클릭
2. **"배포 관리"** 선택
3. 현재 배포 옆 **"연필 아이콘 (수정)"** 클릭
4. **"버전"** 드롭다운에서 **"새 버전"** 선택
5. **설명**: `v6.2.9 - 관리자 대시보드 API 추가 (getAllMembers, updateMemberStatus, syncJson, getJsonUrls)`
6. **"배포"** 클릭

### 5단계: URL 확인
기존 URL 유지:
```
https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec
```

## ✅ 배포 확인

### 버전 확인
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

### getAllMembers 테스트
```bash
curl -L 'https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec?action=getAllMembers'
```

### updateMemberStatus 테스트
```bash
curl -L 'https://script.google.com/macros/s/AKfycbyULZORS2SzTBYYTK_r_5Kd5Q-I3nELI4RbDim1THqGIX8IT0PiAL-BL2oqomf16ate/exec?action=updateMemberStatus&phone=01012345678&type=company&status=승인'
```

## 🌐 프론트엔드 업데이트

프론트엔드는 이미 v6.2.8 URL을 사용하고 있으므로 **별도 업데이트 불필요**합니다.

Apps Script만 재배포하면 됩니다!

## 📝 변경 파일 목록
- ✅ `APPS_SCRIPT_V6.2.9_ADMIN_FUNCTIONS.js` - 새 버전
- ✅ `components/Auth.tsx` - isSuperAdmin 필드 추가 (이미 배포됨)
- ✅ `components/AdminView.tsx` - v6.2.8 URL 사용 (이미 배포됨)

## 🎯 주요 개선사항
1. **관리자 대시보드 완전 지원**
   - 전체 회원 조회
   - 회원 상태 변경
   - JSON 파일 동기화
   - JSON URL 조회

2. **로그 기록 강화**
   - 모든 관리자 액션 로그 기록
   - 성공/실패 상태 추적

3. **날짜 포맷 통일**
   - formatDate 유틸리티 함수 추가
   - YYYY-MM-DD 형식으로 통일

## 🚨 주의사항
1. Apps Script 배포 시 **기존 URL을 유지**해야 합니다
2. 새 버전 선택 시 **"새 버전"**을 선택하세요
3. 배포 후 **버전 확인**을 반드시 수행하세요
4. 프론트엔드는 **재배포 불필요**합니다

## 📞 문제 발생 시
1. Apps Script 로그 확인: 실행 로그 탭
2. Google Sheets 로그 확인: '로그' 시트
3. 프론트엔드 Network 탭 확인
4. 이전 버전으로 롤백 가능

---

배포 완료 후 **관리자 대시보드**에서 모든 기능이 정상 작동하는지 확인하세요! 🎉
