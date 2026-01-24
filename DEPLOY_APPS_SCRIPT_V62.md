# 🚀 Google Apps Script v6.2 배포 가이드

## 문제 상황
- 프론트엔드(React)는 EC2에 배포되어 정상 작동 중
- 로그인 API는 Google Apps Script로 동작
- **현재 문제**: Apps Script v6.2 코드가 배포되지 않아 로그인 실패

---

## ✅ 해결 방법: Apps Script v6.2 코드 배포

### 1️⃣ Google Sheets 열기
```
https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

### 2️⃣ Apps Script 에디터 열기
1. 위 링크로 이동
2. 상단 메뉴: **확장 프로그램 > Apps Script**

### 3️⃣ 코드 전체 삭제
- Apps Script 에디터에서 기존 코드 **전체 선택** (Ctrl+A)
- **삭제** (Delete)

### 4️⃣ v6.2 코드 붙여넣기
1. 아래 파일 열기:
   ```
   /home/user/webapp/COMPLETE_V6.2_CODE.js
   ```
2. 전체 코드 **복사** (Ctrl+A → Ctrl+C)
3. Apps Script 에디터에 **붙여넣기** (Ctrl+V)

### 5️⃣ 저장
- 상단 **💾 저장** 버튼 클릭
- 또는 `Ctrl+S`

### 6️⃣ 배포
1. 우측 상단 **배포** 버튼 클릭
2. **새 배포** 선택
3. 설정:
   - **유형 선택**: 웹 앱
   - **실행 사용자**: 나
   - **액세스 권한**: **모든 사용자**
4. **배포** 클릭

### 7️⃣ 웹 앱 URL 확인
- 배포 완료 후 **웹 앱 URL** 복사
- URL 형식: `https://script.google.com/macros/s/...../exec`

### 8️⃣ 프론트엔드 URL 확인 (선택)
현재 프론트엔드는 다음 URL을 사용하고 있습니다:
```
https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec
```

만약 **새로운 URL**이 나온다면, 프론트엔드 코드(`components/Auth.tsx`)를 수정해야 합니다.

---

## 🧪 테스트

배포 완료 후 다음 URL로 테스트:

### 1. API 상태 확인
```
https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec?action=test
```

**기대 응답**:
```json
{
  "success": true,
  "version": "6.2",
  "timestamp": "2026-01-24 ...",
  "message": "사근복 AI Apps Script v6.2 - 이메일 알림 시스템"
}
```

### 2. 로그인 테스트
```
https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec?action=loginCompany&phone=01063529091&password=12345
```

**기대 응답**:
```json
{
  "success": true,
  "user": {
    "userType": "company",
    "name": "이종근",
    "phone": "010-6352-9091",
    ...
  }
}
```

---

## 📱 프론트엔드 로그인 테스트

1. http://3.34.186.174/ 접속
2. 로그인/회원가입 클릭
3. 로그인 정보 입력:
   - **전화번호**: `01063529091`
   - **비밀번호**: `12345`
   - **회원 구분**: 기업회원
4. **로그인** 클릭
5. ✅ **성공**: 메인 화면으로 이동, 이종근 님 표시

---

## ❗ 문제 해결

### CORS 에러가 계속 발생하는 경우
1. Apps Script 배포 시 **액세스 권한**을 **모든 사용자**로 설정했는지 확인
2. 브라우저 캐시 삭제 (Ctrl+Shift+Del)
3. 시크릿 모드에서 테스트 (Ctrl+Shift+N)

### 로그인 실패하는 경우
1. Google Sheets에서 **승인 상태** 확인:
   - I열(승인상태) = `승인완료`
2. **비밀번호** 확인:
   - G열(비밀번호) = `12345`
3. Apps Script **실행 로그** 확인:
   - Apps Script 에디터 > 좌측 **실행 기록** 클릭

---

## 📝 핵심 요약

- **문제**: Apps Script v6.2가 배포되지 않아 로그인 실패
- **해결**: Google Apps Script에 v6.2 코드 배포
- **코드 위치**: `/home/user/webapp/COMPLETE_V6.2_CODE.js`
- **배포 URL**: 기존과 동일하게 유지 (새 배포 시 URL 변경 가능)
- **테스트 계정**: 01063529091 / 12345 / 기업회원
- **프론트엔드**: http://3.34.186.174/

---

## 🎯 다음 단계

1. ✅ v6.2 코드 배포
2. ✅ 로그인 테스트
3. ✅ 회원가입 테스트
4. ✅ 관리자 대시보드 테스트

배포 완료 후 알려주세요! 🚀
