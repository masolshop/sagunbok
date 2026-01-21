# 🚨 긴급 수정: SyntaxError 해결

**수정일**: 2026-01-21  
**커밋**: ec0bf25  
**이슈**: `SyntaxError: Illegal return statement` at line 676

---

## ❌ 문제

Apps Script 배포 시 **라인 676에서 SyntaxError** 발생:

```
구문 오류: SyntaxError: Illegal return statement 라인: 676 파일: Code.gs
```

**원인**: doPost 함수 종료 후 **중복된 코드 블록**(673-691번 라인)이 있어서 문법 오류 발생

---

## ✅ 해결

**수정 내용**:
- 673-691번 라인의 중복 코드 제거
- doPost 함수가 정상적으로 종료되도록 수정

**변경사항**:
```javascript
// BEFORE (오류)
function doPost(e) {
  try {
    // ...
    return handleRequest(action, params);
  } catch (error) {
    // ...
  }
}
        result = { success: false, error: '알 수 없는 action입니다: ' + action };  // ❌ 중복 코드
    }
    
    Logger.log('응답: ' + JSON.stringify(result));
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doPost 오류: ' + error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: '요청 처리 중 오류가 발생했습니다: ' + error
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// AFTER (정상)
function doPost(e) {
  try {
    // ...
    return handleRequest(action, params);
  } catch (error) {
    // ...
  }
}  // ✅ 정상 종료

function doGet(e) {
  // ...
}
```

---

## 🚀 배포 절차

### 1. Apps Script 코드 업데이트 (필수)

1. **Google Sheets 열기**
   - 사근복회원관리 스프레드시트

2. **Apps Script 편집기 열기**
   ```
   확장 프로그램 > Apps Script
   ```

3. **기존 코드 전체 삭제**
   - Ctrl/Cmd + A > Delete

4. **새 코드 복사**
   - 파일: `/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js`
   - 전체 복사 (Ctrl/Cmd + A, Ctrl/Cmd + C)

5. **붙여넣기 및 저장**
   - Apps Script 편집기에 붙여넣기 (Ctrl/Cmd + V)
   - 저장 (Ctrl/Cmd + S)

6. **문법 체크**
   - 왼쪽 하단에 **빨간 오류 메시지가 없는지** 확인
   - ✅ "실행 준비됨" 메시지가 표시되어야 함

7. **배포 업데이트**
   ```
   배포 관리 > 배포 수정
   버전: V5.4.3 - SyntaxError 수정
   배포
   ```

---

## 🧪 테스트

### 1. Apps Script 테스트 (배포 전)

**방법 1: 테스트 함수 실행**
```javascript
// Apps Script 편집기에서 실행
function testRegister() {
  const result = registerCompany({
    companyName: '테스트병원',
    companyType: '병의원개인사업자',
    name: '테스터',
    phone: '01012345678',
    email: 'test@test.com',
    password: 'test1234',
    referrer: '김철수'
  });
  Logger.log(result);
}
```

**실행**:
1. 함수 선택: `testRegister`
2. 실행 버튼 클릭
3. 실행 로그 확인 (Ctrl/Cmd + Enter)

**예상 결과**:
```json
{
  "success": true,
  "message": "회원가입 신청이 완료되었습니다..."
}
```

---

### 2. 브라우저 테스트 (배포 후)

1. **브라우저 접속**
   ```
   http://3.34.186.174
   ```

2. **캐시 완전 삭제** (중요!)
   ```
   F12 > 애플리케이션/저장소 탭
   "캐시 저장소" 모두 삭제
   "로컬 저장소" 모두 삭제
   
   또는
   
   Ctrl/Cmd + Shift + Delete
   전체 삭제
   ```

3. **페이지 하드 새로고침**
   ```
   Ctrl/Cmd + Shift + R
   ```

4. **기업회원 가입 테스트**
   - 회사명: 최종테스트병원
   - 기업유형: 병의원개인사업자
   - 담당자: 최종테스터
   - 휴대폰: 01099998888
   - 이메일: final@test.com
   - 비밀번호: test1234
   - 추천인: 김철수

5. **Network 탭 확인** (F12)
   ```
   요청: GET https://script.google.com/.../exec?action=registerCompany&...
   상태: 200 OK
   응답: { success: true, message: "회원가입 신청이 완료되었습니다..." }
   ```

6. **Google Sheets 확인**
   - [기업회원] 시트에 새 행 추가됨
   - C열: 병의원개인사업자 ✅
   - E열: 010-9999-8888 ✅
   - H열: 김철수 ✅
   - I열: 승인전표 ✅

---

## 📊 체크리스트

### Apps Script
- [ ] 코드 전체 교체 완료
- [ ] 저장 완료 (Ctrl/Cmd + S)
- [ ] **빨간 오류 메시지 없음** ✅
- [ ] "실행 준비됨" 표시 확인
- [ ] 배포 업데이트 완료

### 브라우저
- [ ] 캐시 완전 삭제
- [ ] 하드 새로고침
- [ ] 기업회원 가입 테스트 성공
- [ ] Network 200 OK 응답
- [ ] Google Sheets 데이터 저장 확인

---

## 🐛 트러블슈팅

### Q1: 여전히 SyntaxError 발생
**해결**:
1. Apps Script 편집기에서 **모든 코드 삭제**
2. 새 코드를 **전체 복사** 후 붙여넣기
3. 저장 후 **왼쪽 하단 확인**
4. 빨간 오류가 있다면 → 복사가 잘못됨, 다시 복사

### Q2: "알 수 없는 action" 에러
**원인**: 배포가 아직 안 됨  
**해결**: 
```
배포 관리 > 배포 수정
버전 입력 > 배포
```

### Q3: 304/302 에러 (네트워크)
**원인**: 브라우저 캐시  
**해결**:
1. F12 > 네트워크 탭
2. "캐시 비활성화" 체크
3. Ctrl/Cmd + Shift + R

### Q4: Google Sheets에 저장 안 됨
**원인**: Apps Script 배포 URL이 다름  
**해결**:
1. Apps Script 배포 URL 확인
2. `components/Auth.tsx`의 `BACKEND_URL` 업데이트 필요
   - 현재: `https://script.google.com/macros/s/AKfycbw5c6wArjU15_l6bXfMNe2oMpQXMQtwqvO4eyNQ1BcP1LtSXmYECNj2EatGWP09pDnYQw/exec`

---

## 📁 파일 위치

**Apps Script 코드**:
```
/home/user/webapp/docs/apps-script-v5/APPS_SCRIPT_V5.4_FINAL.js
```

**프런트엔드 (배포 URL 확인 필요 시)**:
```
/home/user/webapp/components/Auth.tsx
```

**문서**:
```
/home/user/webapp/V5.4.3_COMPLETE_DEPLOYMENT.md
/home/user/webapp/FINAL_FIXES_SUMMARY.md
/home/user/webapp/FIX_NETWORK_ERROR.md
```

---

## ✅ 완료 상태

- [x] SyntaxError 수정 완료
- [x] GitHub 커밋 & 푸시 완료 (ec0bf25)
- [ ] Apps Script 재배포 (사용자 수행)
- [ ] 브라우저 테스트 (사용자 수행)

---

## 🎯 핵심 요약

### 문제
- **라인 676 SyntaxError**: doPost 함수 종료 후 중복 코드

### 해결
- 673-691번 라인 중복 코드 제거

### 다음
1. Apps Script 코드 전체 교체
2. 저장 후 **빨간 오류 없는지 확인** ✅
3. 배포 업데이트
4. 브라우저 테스트

---

**중요**: Apps Script 편집기에서 **빨간 오류 메시지**가 사라져야 배포 가능합니다!

배포 후 바로 테스트하세요! 🚀
