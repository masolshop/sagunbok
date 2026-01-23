# 🗑️ Apps Script 배포 삭제 가이드

## 📍 배포 관리 화면 접근 방법

### 방법 1: 스프레드시트에서 직접 접근 (권장)

1. **스프레드시트 열기**
   ```
   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
   ```

2. **Apps Script 열기**
   ```
   확장 프로그램 → Apps Script
   ```

3. **배포 관리 화면**
   - 왼쪽 사이드바: 🚀 배포 아이콘 클릭
   - 또는 상단 메뉴: 배포 → 배포 관리

### 방법 2: Apps Script 홈에서 접근

1. **Apps Script 홈**
   ```
   https://script.google.com/home
   ```

2. **프로젝트 선택**
   - "사근복 회원관리 v2" 또는 유사 이름 찾기
   - 프로젝트 클릭

3. **배포 탭**
   - 왼쪽 사이드바에서 "배포" 클릭

### 방법 3: 프로젝트 ID로 직접 접근

현재 배포 URL에서 프로젝트 ID 추출 후:
```
https://script.google.com/home/projects/[PROJECT_ID]/deployments
```

---

## 🗑️ 배포 삭제 단계

### 배포 관리 화면에서:

```
┌────────────────────────────────────────┐
│ 배포                                   │
├────────────────────────────────────────┤
│ 🔵 버전 6.0 - JSON DB...               │
│    웹 앱 • 활성                    ⋮   │ ← 클릭
│    AKfycbxl_ia0gCJSikCD...            │
│                                        │
│ 🔵 v4                                  │
│    웹 앱 • 활성                    ⋮   │ ← 클릭
│                                        │
│ 🔵 2.7v                                │
│    웹 앱 • 활성                    ⋮   │ ← 클릭
└────────────────────────────────────────┘
```

각 배포의 **⋮ (점 3개)** 클릭 → **"보관처리"** 선택

---

## ✅ 모든 배포 삭제 후

### 새 배포 만들기

1. **새 배포 버튼** 클릭

2. **설정 확인** (매우 중요!)
   ```
   설명: v6.0 JSON DB POST 지원
   유형: 웹 앱 ⚠️
   실행 계정: 나 ⚠️
   액세스 권한: 누구나 ⚠️
   ```

3. **배포** 클릭

4. **권한 승인**
   - "권한 검토" 클릭
   - 계정 선택
   - "고급" 클릭
   - "프로젝트명(안전하지 않음)으로 이동" 클릭
   - "허용" 클릭

5. **새 웹 앱 URL 복사**
   ```
   https://script.google.com/macros/s/[NEW_DEPLOYMENT_ID]/exec
   ```

---

## 🎯 핵심 체크리스트

배포 전 반드시 확인:

- [ ] 모든 기존 배포 보관처리/삭제 완료
- [ ] 유형: "웹 앱" 선택
- [ ] 실행 계정: "나" 선택
- [ ] 액세스 권한: "누구나" 선택
- [ ] 권한 승인 완료
- [ ] 새 웹 앱 URL 복사

---

## 📝 현재 상태

### 기존 배포 URL (삭제 대상)
```
https://script.google.com/macros/s/AKfycbxl_ia0gCJSikCD-wVy1uzuRiHmrQS1HgcVvVobVr6zyZZ2OWPPmBhNbDDV8tStqTYn/exec
https://script.google.com/macros/s/AKfycbzHvtZ9i6wfsdIwENGrjKVSwbExmxN_MCvQ8Mm_8416FwOz-3okPt-KC-Ri35dJLkl6/exec
```

### 스프레드시트 정보
```
ID: 1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc
URL: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
```

---

## 🚨 문제 해결

### "배포 관리" 메뉴가 안 보이는 경우

1. Apps Script 에디터 새로고침
2. 브라우저 캐시 삭제
3. 시크릿 모드로 재접속

### 권한 오류가 발생하는 경우

1. Google 계정 재로그인
2. Apps Script 권한 재확인
3. 스프레드시트 소유자 확인

---

## 📞 다음 단계

새 배포 URL을 알려주시면:

1. 프론트엔드 코드 업데이트 (AdminView.tsx, Auth.tsx)
2. 빌드 및 EC2 재배포
3. POST 요청 테스트
4. 로그인 기능 검증

자동으로 진행하겠습니다! 🚀
