# 🚀 Apps Script v6.2.1 배포 가이드

## 📋 변경 사항

### 1. 전화번호 정규화 개선
- **저장 형식**: `010-XXXX-XXXX` (하이픈 포함)
- **입력 지원**: `1012345678`, `01012345678`, `010-1234-5678` 등

### 2. comparePhoneNumbers() 함수 추가
- 저장된 번호와 입력된 번호를 유연하게 비교
- 숫자만 추출하여 비교 (하이픈 유무 무관)

### 3. 로그인 함수 개선
- `loginCompany()`: comparePhoneNumbers 사용
- `loginConsultant()`: comparePhoneNumbers 사용
- 모든 전화번호 형식으로 로그인 가능

---

## 🔧 배포 방법

### 1. 전체 코드 복사
```bash
cat /home/user/webapp/COMPLETE_V6.2_CODE.js
```

### 2. Google Apps Script 배포
1. https://script.google.com 접속
2. "사근복 회원관리 v2" 프로젝트 선택
3. Code.gs 전체 삭제 (Ctrl+A → Delete)
4. 새 코드 붙여넣기 (Ctrl+V)
5. 저장 (Ctrl+S)
6. **배포 → 배포 관리 → 새 버전 배포**

---

## 🧪 테스트 방법

### 테스트 1: 매니저 회원가입 (전화번호 형식 확인)
```
https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec?action=registerManager&name=테스트&phone=1099999999&email=test@test.com&position=팀장&division=사업부&branch=본사
```

**기대 결과**: 
- Google Sheets에 `010-9999-9999` 형식으로 저장
- 성공 메시지 반환

### 테스트 2: 로그인 (다양한 형식)
```
# 형식 1: 01012345678
action=loginConsultant&phone=01012345678&password=12345

# 형식 2: 1012345678
action=loginConsultant&phone=1012345678&password=12345

# 형식 3: 010-1234-5678
action=loginConsultant&phone=010-1234-5678&password=12345
```

**기대 결과**: 모든 형식으로 로그인 성공

---

## 📝 주요 개선점

1. ✅ **전화번호 저장**: `010-XXXX-XXXX` 형식으로 통일
2. ✅ **로그인 유연성**: 모든 형식 허용
3. ✅ **코드 가독성**: comparePhoneNumbers() 함수로 명확한 비교
4. ✅ **유지보수성**: 전화번호 처리 로직 중앙화

---

**배포 버전**: v6.2.1
**배포 일시**: 2026-01-24
**커밋**: 1407d31

