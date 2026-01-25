# 🎉 v6.2.13 배포 성공!

## ✅ 배포 완료 시각
- **배포 일시**: 2026-01-24 18:46 KST
- **배포자**: AI Assistant (SSH 자동 배포)
- **배포 방식**: SCP를 통한 EC2 직접 배포

---

## 📊 배포 검증 결과

### ✅ 웹사이트 상태
- **접속 URL**: http://3.34.186.174/
- **HTTP 상태**: 200 OK
- **빌드 파일**: 
  - index.html ✅
  - logout.html ✅
  - favicon.svg ✅
  - assets/index-C3aa0pzc.js ✅ (655KB)
  - assets/index-D7f1ZBkG.css ✅ (18KB)

### ✅ API 검증
- **새 API URL**: `AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH`
- **API 엔드포인트**: https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec
- **응답 상태**: ✅ 정상 (HTTP 200)
- **필드 검증**:
  - ✅ `userType` (company/manager/consultant)
  - ✅ `approvalStatus` (승인)

### ✅ 회원 데이터 (8명)
```json
{
  "success": true,
  "members": [
    // 기업회원 2명
    {
      "userType": "company",
      "companyName": "페마연",
      "name": "이종근",
      "phone": "01063529091",
      "email": "tysagunbok@gmail.com",
      "approvalStatus": "승인"
    },
    {
      "userType": "company",
      "companyName": "태양라이프",
      "name": "김민수",
      "phone": "01063850700",
      "email": "37minsu@gmail.com",
      "approvalStatus": "승인"
    },
    
    // 매니저 3명
    {
      "userType": "manager",
      "name": "이종근",
      "phone": "01063529091",
      "approvalStatus": "승인"
    },
    {
      "userType": "manager",
      "name": "문지용",
      "phone": "01086199091",
      "approvalStatus": "승인"
    },
    {
      "userType": "manager",
      "name": "김민수",
      "phone": "01063850700",
      "approvalStatus": "승인"
    },
    
    // 컨설턴트 3명
    {
      "userType": "consultant",
      "name": "이종근",
      "phone": "01063529091",
      "approvalStatus": "승인"
    },
    {
      "userType": "consultant",
      "name": "문지용",
      "phone": "01086199091",
      "approvalStatus": "승인"
    },
    {
      "userType": "consultant",
      "name": "김민수",
      "phone": "01063850700",
      "approvalStatus": "승인"
    }
  ]
}
```

---

## 🚀 배포 과정

### 1. SSH 연결 확인
```bash
✅ SSH Key: /home/user/webapp/lightsail-key.pem
✅ EC2 Host: 3.34.186.174
✅ User: ubuntu
✅ Connection: 성공
```

### 2. 권한 설정
```bash
sudo chown -R ubuntu:ubuntu /var/www/sagunbok
sudo chmod -R 755 /var/www/sagunbok
```

### 3. 빌드 파일 업로드
```bash
scp -i lightsail-key.pem -r dist/* ubuntu@3.34.186.174:/var/www/sagunbok/
```

### 4. Nginx 재시작
```bash
sudo systemctl restart nginx
```

---

## 🎯 테스트 가이드

### 🌐 웹사이트 접속
```
http://3.34.186.174/
```

### 🔐 테스트 계정

#### 슈퍼 관리자 (이종근)
- **전화번호**: `01063529091`
- **비밀번호**: (기존 설정한 비밀번호)
- **기대 결과**: 
  - ✅ 로그인 루프 없이 바로 대시보드 접근
  - ✅ 전체 회원 목록 표시 (8명)
  - ✅ 승인/거부 기능 사용 가능
  - ✅ JSON 백업 다운로드 기능

#### 매니저 로그인
1. **이종근** - `01063529091` / `12345`
2. **문지용** - `01086199091` / `12345`
3. **김민수** - `01063850700` / `12345`

#### 컨설턴트 로그인
1. **이종근** - `01063529091` / `12345`
2. **문지용** - `01086199091` / `12345`
3. **김민수** - `01063850700` / `12345`

#### 기업회원 로그인
1. **페마연 (이종근)** - `01063529091` / (설정한 비밀번호)
2. **태양라이프 (김민수)** - `01063850700` / (설정한 비밀번호)

---

## ⚠️ 중요: 브라우저 캐시 삭제

### 데스크톱 (Chrome/Edge)
```
1. Ctrl + Shift + Delete
2. "전체 기간" 선택
3. "캐시된 이미지 및 파일" 체크
4. "데이터 삭제" 클릭
```

### 모바일 (Chrome/Safari)
```
1. 설정 → 개인정보 보호
2. 인터넷 사용 기록 삭제
3. "캐시된 이미지 및 파일" 선택
4. 삭제
```

### 또는 시크릿 모드 사용
```
- Chrome: Ctrl + Shift + N
- Safari: Command + Shift + N
```

---

## 🐛 디버깅 방법

### F12 개발자 도구 → Network 탭
로그인 시도 시 다음을 확인:

1. **API 호출 URL 확인**
   ```
   https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec?action=loginCompany...
   ```

2. **응답 상태 코드**
   - ✅ 정상: `200 OK`
   - ❌ 오류: `404 Not Found`, `500 Internal Server Error`

3. **응답 JSON**
   ```json
   {
     "success": true,
     "userType": "company",
     "approvalStatus": "승인",
     "userData": { ... }
   }
   ```

---

## 📋 테스트 체크리스트

### 기본 기능
- [ ] 웹사이트 정상 접속 (http://3.34.186.174/)
- [ ] 슈퍼관리자 로그인 (01063529091)
- [ ] 로그인 루프 없음 확인
- [ ] 대시보드 회원 목록 표시 (8명)
- [ ] 회원 필터링 (기업회원/매니저/컨설턴트)
- [ ] 회원 검색 (이름/전화번호)

### 매니저/컨설턴트 로그인
- [ ] 매니저 로그인 (비밀번호 12345)
- [ ] 컨설턴트 로그인 (비밀번호 12345)
- [ ] 정상 로그인 확인

### 기업회원 로그인
- [ ] 기업회원 로그인
- [ ] 커스텀 비밀번호 작동 확인

### 고급 기능
- [ ] 신규 기업회원 가입
  - [ ] 추천인 검증 (매니저/컨설턴트)
  - [ ] 이메일 발송 확인
- [ ] 신규 매니저/컨설턴트 등록
  - [ ] 이메일 발송 확인
- [ ] 회원 승인/거부
  - [ ] 상태 변경 확인
  - [ ] 이메일 발송 확인
- [ ] JSON 백업 다운로드

---

## 🔗 관련 링크

- **웹사이트**: http://3.34.186.174/
- **Apps Script**: https://script.google.com/u/0/home/projects/1FqLBX8t_0XG-wGzbc5bt9UCXYUn68iomWNceY3P5ICYArM6rPj97-HIw/edit
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
- **GitHub PR**: https://github.com/masolshop/sagunbok/pull/1

---

## 📝 v6.2.13 주요 변경사항

### 1. 필드명 통일
- `type` → `userType` (company/manager/consultant)
- `status` → `approvalStatus` (승인/승인 대기/거부)

### 2. 시트명 수정
- ✅ 올바른 시트명: `사근복매니저`, `사근복컨설턴트`
- ❌ 잘못된 시트명: `사근복컨설턴트(매니저)`

### 3. 슈퍼관리자 로그인 루프 해결
- 전화번호 `01063529091` (이종근)에 `isSuperAdmin` 플래그 자동 설정
- 로그인 루프 없이 바로 대시보드 접근

### 4. 이메일 발송 시스템
- **발신자**: TY사근복헬스케어사업단 (tysagunbok@gmail.com)
- **발송 시점**:
  - 기업회원 가입 시
  - 추천인에게 알림
  - 관리자에게 알림
  - 매니저/컨설턴트 등록 시
  - 승인/거부 시

### 5. 추천인 검증
- 기업회원 가입 시 추천인이 매니저/컨설턴트로 등록되어 있는지 확인

### 6. G열 문서화
- 기업회원: 커스텀 비밀번호 사용
- 매니저/컨설턴트: 고정 비밀번호 `12345` 사용
- G열 "?" 표시는 로그인에 영향 없음

---

## 🎊 배포 완료!

**모든 배포 작업이 성공적으로 완료되었습니다!**

이제 브라우저 캐시를 삭제한 후 http://3.34.186.174/ 에서 로그인을 테스트해주세요!

문제가 발생하면 F12 개발자 도구의 Network 탭을 확인하고 스크린샷을 공유해주세요.

---

**배포 일시**: 2026-01-24 18:46 KST  
**배포 버전**: v6.2.13 FINAL  
**배포 상태**: ✅ 성공
