# 🔧 Apps Script v6.0 재배포 가이드

## 문제 상황
- GET 요청: ✅ 정상 작동 (v6.0 버전 확인)
- POST 요청: ❌ "Page Not Found" 오류

## 원인
Apps Script 배포 설정이 POST 요청을 처리하지 못하고 있음

## 해결 방법

### 방법 1: 기존 배포 관리 (권장)

1. **Apps Script 에디터** 열기
   - https://script.google.com
   - "사근복 회원관리 v2" 프로젝트 선택

2. **배포 → 배포 관리** 클릭

3. **활성 배포** 확인
   - 현재 배포 ID: AKfycbxl_ia0gCJSikCD-wVy1uzuRiHmrQS1HgcVvVobVr6zyZZ2OWPPmBhNbDDV8tStqTYn

4. **연필 아이콘(수정)** 클릭

5. **설정 확인 및 수정**:
   ```
   새 설명: v6.0 - JSON DB 이중 백업 시스템 (POST 지원)
   다음 계정으로 실행: 나
   액세스 권한: 누구나
   ```

6. **버전 배포** 클릭
   - "새 버전" 선택
   - 설명: "v6.0 POST 지원 활성화"

7. **배포** 클릭

### 방법 2: 완전 새 배포

1. **Apps Script 에디터**에서 **배포 → 새 배포** 클릭

2. **유형 선택**: ⚙️ 아이콘 → **웹 앱** 선택

3. **설정**:
   ```
   설명: v6.0 - JSON DB 이중 백업 (완전 새 배포)
   다음 계정으로 실행: 나
   액세스 권한: 누구나
   ```

4. **배포** 클릭

5. **새 URL 복사**

6. **프론트엔드 업데이트**:
   - AdminView.tsx: API_URL 업데이트
   - Auth.tsx: API_URL 업데이트
   - 빌드 및 배포

## 배포 후 테스트

### 1. GET 요청 테스트
```bash
curl "https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec"
```

**예상 응답**:
```json
{
  "success": true,
  "version": "6.0",
  "timestamp": "2026-01-23 ...",
  "message": "사근복 AI Apps Script v6.0 - JSON DB 이중 백업 시스템"
}
```

### 2. POST 요청 테스트 (로그인)
```bash
curl -X POST "https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"loginConsultant","phone":"01063529091","password":"12345"}'
```

**예상 응답**:
```json
{
  "success": true,
  "user": {
    "userType": "consultant",
    "name": "...",
    "phone": "01063529091",
    ...
  }
}
```

또는 실패 시:
```json
{
  "success": false,
  "error": "비밀번호가 일치하지 않습니다."
}
```

## 트러블슈팅

### Q: POST 요청이 여전히 실패해요
**A**: 
1. Apps Script 에디터에서 **doPost** 함수가 있는지 확인
2. 배포 설정에서 **"나"**로 실행 설정 확인
3. 권한 승인 재확인 (syncAllJsonFiles 실행)

### Q: 권한 오류가 발생해요
**A**:
1. Apps Script 에디터에서 함수 실행
2. 권한 요청 팝업에서 허용
3. "고급" → "안전하지 않음으로 이동" → "허용"

### Q: 배포 ID가 변경되면 어떻게 하나요?
**A**:
1. 새 배포 ID 복사
2. 프론트엔드 코드 업데이트:
   - components/AdminView.tsx
   - components/Auth.tsx
3. npm run build
4. EC2 재배포

## 참고: Apps Script 배포 유형

| 유형 | GET | POST | 권장 |
|------|-----|------|------|
| API 실행 파일 | ✅ | ❌ | ❌ |
| 웹 앱 | ✅ | ✅ | ✅ |
| 라이브러리 | ❌ | ❌ | ❌ |

**중요**: 반드시 **웹 앱**으로 배포해야 POST 요청 처리 가능!

---

**작성일**: 2026-01-23  
**문서**: Apps Script v6.0 재배포 가이드
