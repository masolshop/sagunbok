# 🚨 배포 확인 필요

**문제**: Apps Script가 여전히 V5.4.1로 표시됨  
**예상**: V5.4.2 또는 V5.4.3으로 표시되어야 함

---

## 배포 상태 확인 방법

### 1. Apps Script 편집기에서 확인

1. **Apps Script 편집기 열기**
   - Google Sheets > 확장 프로그램 > Apps Script

2. **코드 첫 줄 확인**
   ```javascript
   /**
    * Sagunbok Apps Script - VERSION 5.4.2 (FINAL)
    * 작성일: 2026-01-21
    * 수정일: 2026-01-21 19:00 (컨설턴트 승인상태 추가)
    */
   ```
   - ✅ VERSION 5.4.2가 표시되어야 함
   - ❌ VERSION 5.4.1이면 코드가 교체되지 않은 것

3. **배포 관리 확인**
   ```
   배포 > 배포 관리
   ```
   - 최신 배포가 "V5.4.3" 또는 "V5.4.2"인지 확인
   - "활성" 상태인지 확인

---

## 해결 방법

### 방법 1: 배포 업데이트 (권장)

1. **배포 관리** 열기
   ```
   배포 > 배포 관리
   ```

2. **기존 배포 수정**
   - 연필 아이콘 (✏️) 클릭
   - 새 설명: "V5.4.3 - GET 요청 지원, 승인상태 추가"
   - **배포** 버튼 클릭

3. **배포 URL 확인**
   - URL이 변경되지 않았는지 확인
   - 변경되었다면 프런트엔드 `BACKEND_URL` 업데이트 필요

---

### 방법 2: 새 배포 생성

1. **새 배포** 클릭
   ```
   배포 > 새 배포
   ```

2. **설정**
   - 유형: 웹 앱
   - 실행 계정: 나 (본인)
   - 액세스 권한: 누구나
   - 설명: "V5.4.3 - GET 요청 지원"

3. **배포** 클릭

4. **새 URL 확인**
   - 웹 앱 URL 복사
   - 프런트엔드 `components/Auth.tsx`의 `BACKEND_URL` 업데이트

---

### 방법 3: 코드 재확인

**코드가 정말 교체되었는지 확인**:

1. Apps Script 편집기에서 **라인 3-5** 확인:
   ```javascript
   /**
    * Sagunbok Apps Script - VERSION 5.4.2 (FINAL)
    * 작성일: 2026-01-21
    * 수정일: 2026-01-21 19:00 (컨설턴트 승인상태 추가)
    */
   ```

2. **라인 673-680** 확인 (doGet 함수):
   ```javascript
   function doGet(e) {
     // GET 요청으로 action과 data를 받아서 처리
     if (e && e.parameter && e.parameter.action && e.parameter.data) {
       try {
         const action = e.parameter.action;
         const data = JSON.parse(e.parameter.data);
         
         // doPost와 동일한 처리
         return handleRequest(action, data);
   ```

3. **라인 580-620** 확인 (handleRequest 함수 존재 여부):
   ```javascript
   function handleRequest(action, data) {
     let result;
     
     switch (action) {
       case 'loginCompany':
         result = loginCompany(data);
         break;
       case 'loginConsultant':
         result = loginConsultant(data);
         break;
       // ...
     }
   ```

**만약 위 코드가 없다면**:
- 코드가 제대로 교체되지 않은 것
- `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js` 파일을 **전체 복사** 후 다시 붙여넣기

---

## 테스트 명령어

**현재 배포된 버전 확인**:
```bash
curl -L -s 'https://script.google.com/macros/s/AKfycbw5c6wArjU15_l6bXfMNe2oMpQXMQtwqvO4eyNQ1BcP1LtSXmYECNj2EatGWP09pDnYQw/exec' | jq '.version'
```

**예상 결과**:
```json
"5.4.2"
```

**현재 결과**:
```json
"5.4.1"  ← 문제!
```

---

## 체크리스트

### Apps Script 편집기
- [ ] 코드 첫 줄: VERSION 5.4.2 확인
- [ ] doGet 함수: handleRequest() 호출 확인
- [ ] handleRequest 함수 존재 확인
- [ ] 저장 (Ctrl/Cmd + S)
- [ ] 왼쪽 하단: 빨간 오류 없음

### 배포
- [ ] 배포 관리 > 배포 수정
- [ ] 새 설명 입력
- [ ] 배포 버튼 클릭
- [ ] 배포 완료 메시지 확인

### 테스트
- [ ] curl 명령어로 버전 확인
- [ ] version: "5.4.2" 또는 "5.4.3" 표시
- [ ] 브라우저 테스트

---

## 다음 단계

1. **Apps Script 편집기에서 코드 확인**
   - VERSION 5.4.2인지 확인

2. **코드가 V5.4.1이면**
   - 코드 전체 삭제
   - `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js` 전체 복사
   - 붙여넣기 및 저장

3. **코드가 V5.4.2이면**
   - 배포 관리 > 배포 수정
   - 배포 업데이트

4. **배포 후**
   - 위의 curl 명령어로 버전 확인
   - version: "5.4.2" 표시 확인

---

**중요**: 배포를 **수정**해야 URL이 변경되지 않습니다!  
새 배포를 만들면 URL이 바뀌어서 프런트엔드 코드도 수정해야 합니다.

배포 수정 → 버전 확인 → 브라우저 테스트 순서로 진행하세요! 🚀
