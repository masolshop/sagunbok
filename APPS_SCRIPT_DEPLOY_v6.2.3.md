# Apps Script 배포 가이드 v6.2.3

## 🐛 수정 내용

### 문제
- **ReferenceError**: `normalizedPhone is not defined`
- **위치**: `loginConsultant` 함수 (라인 878)
- **원인**: 정의되지 않은 변수 `normalizedPhone`을 로그 함수에서 사용

### 수정 사항
```javascript
// 이전 (오류)
writeLog('로그인', '사근복매니저/컨설턴트', normalizedPhone, '등록되지 않은 전화번호', '실패');

// 수정 (정상)
writeLog('로그인', '사근복매니저/컨설턴트', phone, '등록되지 않은 전화번호', '실패');
```

---

## 📋 배포 절차

### 1. 전체 코드 복사
```bash
# 터미널에서 실행
cat /home/user/webapp/COMPLETE_V6.2_CODE.js
```

### 2. Apps Script 에디터 열기
1. https://script.google.com 접속
2. 프로젝트: **"사근복 회원관리 v2"** 선택
3. 파일: **Code.gs** 열기

### 3. 코드 교체
1. Code.gs의 **전체 내용 삭제** (Ctrl+A → Delete)
2. 복사한 코드 **전체 붙여넣기** (Ctrl+V)
3. **저장** (Ctrl+S 또는 💾 아이콘)

### 4. 새 버전 배포
1. 상단 메뉴: **배포 → 배포 관리**
2. 우측 상단: **새 버전** 버튼 클릭
3. 버전 설명: `v6.2.3 - loginConsultant normalizedPhone 오류 수정`
4. **배포** 버튼 클릭
5. 배포 완료 확인 ✅

---

## 🧪 테스트

### 매니저 로그인 테스트
```
URL: http://3.34.186.174/
1. 로그인 팝업 열기
2. "매니저" 탭 선택
3. 전화번호: 010-1111-9999
4. 비밀번호: 12345
5. 로그인 버튼 클릭
6. 성공 확인 ✅
```

### 컨설턴트 로그인 테스트
```
URL: http://3.34.186.174/
1. 로그인 팝업 열기
2. "컨설턴트" 탭 선택
3. 전화번호: 010-2222-9999
4. 비밀번호: 12345
5. 로그인 버튼 클릭
6. 성공 확인 ✅
```

---

## 📊 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v6.2.3 | 2026-01-24 | loginConsultant normalizedPhone 오류 수정 |
| v6.2.2 | 2026-01-24 | sendConsultantApprovedEmail 주석 해제 |
| v6.2.1 | 2026-01-24 | 이메일 알림 시스템 추가 |
| v6.2 | 2026-01-23 | 매니저 시스템 추가 |

---

## 🔗 참고 링크

- **Apps Script 프로젝트**: https://script.google.com
- **프로젝트명**: 사근복 회원관리 v2
- **배포 URL**: https://script.google.com/macros/s/AKfycbzdJOCX6FS3YwK89v7klpUbjGHOHugfXodmES3Np6lVpF_bnCrRRPJkANdFTmL4ff9D/exec
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
- **GitHub**: https://github.com/masolshop/sagunbok
- **커밋**: 590765e

---

## ⚠️ 주의사항

1. **전체 코드 교체**: 일부만 수정하면 오류 발생 가능
2. **반드시 저장**: Ctrl+S로 저장 후 배포
3. **새 버전 배포**: 기존 버전 수정이 아닌 새 버전으로 배포
4. **배포 완료 확인**: "배포됨" 상태 확인 후 테스트

---

**작성일**: 2026-01-24 10:30 KST  
**작성자**: AI 자동화 시스템  
**버전**: v6.2.3  
**상태**: 코드 수정 완료, Apps Script 배포 대기 중
