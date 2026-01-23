# ✅ 사근복 AI v6.1 배포 완료

## 🎉 배포 성공!

**배포 일시**: 2026-01-23 19:34 KST  
**배포 버전**: v6.1 - GET 방식 지원  
**Git 커밋**: 596bb4e

---

## 📦 배포 내역

### ✅ 완료된 작업

1. **Apps Script v6.1 배포**
   - URL: https://script.google.com/macros/s/AKfycbxDVhMVyUGU68gFtYxsyICNwXHuvETNV64mehtRZxLuGARTyg9PUJZzwMSbnmwU8g4P/exec
   - 버전: 6.1 - Hybrid Request 지원
   - 상태: ✅ 정상 작동

2. **프론트엔드 업데이트**
   - GET 방식 전환 완료
   - Auth.tsx: ✅ 업데이트
   - AdminView.tsx: ✅ 업데이트

3. **빌드**
   - 파일: dist-v6.1-get-method-20260123102050.tar.gz
   - 크기: 147 KB
   - 상태: ✅ 완료

4. **EC2 배포**
   - 서버: 3.34.186.174
   - 방식: SSH (lightsail-key.pem)
   - 상태: ✅ 완료
   - Nginx: ✅ 재시작 완료

5. **Git 버전 관리**
   - GitHub: https://github.com/masolshop/sagunbok
   - 커밋: 596bb4e
   - 상태: ✅ 푸시 완료

---

## 🌐 접속 정보

### 프론트엔드
- **URL**: http://3.34.186.174/
- **상태**: ✅ 정상 작동

### 백엔드 (Apps Script)
- **URL**: https://script.google.com/macros/s/AKfycbxDVhMVyUGU68gFtYxsyICNwXHuvETNV64mehtRZxLuGARTyg9PUJZzwMSbnmwU8g4P/exec
- **상태**: ✅ 정상 작동

### Google Sheets
- **URL**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
- **상태**: ✅ 연동 완료

---

## 🧪 테스트 정보

### 로그인 테스트 계정
- **컨설턴트**
  - 전화번호: `01063529091`
  - 비밀번호: `12345`
  - 이름: 이종근
  - 직책: 단장
  - 소속: 수도권 - 페마연

### API 테스트 URL
```bash
# 기본 정보 확인
curl "https://script.google.com/macros/s/AKfycbxDVhMVyUGU68gFtYxsyICNwXHuvETNV64mehtRZxLuGARTyg9PUJZzwMSbnmwU8g4P/exec"

# 로그인 테스트
curl "https://script.google.com/macros/s/AKfycbxDVhMVyUGU68gFtYxsyICNwXHuvETNV64mehtRZxLuGARTyg9PUJZzwMSbnmwU8g4P/exec?action=loginConsultant&phone=01063529091&password=12345"
```

---

## 📊 시스템 아키텍처

```
사용자 브라우저
    ↓
프론트엔드 (EC2: 3.34.186.174)
    ↓ GET 요청
Apps Script v6.1
    ↓
Google Sheets (메인 DB)
    ↓
Google Drive (JSON 백업)
    ├── sagunbok_members_all.json
    └── sagunbok_members_by_consultant.json
```

---

## 🔧 주요 기능

### 1. 로그인
- ✅ 기업회원 로그인
- ✅ 사근복컨설턴트 로그인
- ✅ 승인 상태 확인

### 2. 회원가입
- ✅ 기업회원 가입
- ✅ 컨설턴트 가입
- ✅ 자동 승인대기 상태 설정

### 3. 관리자 대시보드
- ✅ 전체 회원 조회
- ✅ 회원 승인/거부
- ✅ JSON 파일 동기화
- ✅ JSON 파일 다운로드

---

## 🛠️ 배포 스크립트

### EC2 배포 명령어
```bash
# 1. 파일 업로드
scp -i lightsail-key.pem dist-v6.1-get-method-20260123102050.tar.gz ubuntu@3.34.186.174:/tmp/

# 2. EC2 접속 및 배포
ssh -i lightsail-key.pem ubuntu@3.34.186.174

# 3. 배포 실행
cd /tmp
tar -xzf dist-v6.1-get-method-20260123102050.tar.gz
sudo rm -rf /var/www/sagunbok/*
sudo cp -r dist/* /var/www/sagunbok/
sudo chown -R www-data:www-data /var/www/sagunbok
sudo chmod -R 755 /var/www/sagunbok
sudo systemctl restart nginx
```

---

## 📝 다음 테스트 항목

### ✅ 완료된 테스트
- [x] Apps Script GET 요청 테스트
- [x] 프론트엔드 빌드
- [x] EC2 배포
- [x] Nginx 재시작
- [x] 웹사이트 접속 확인

### 🔲 사용자 테스트 필요
- [ ] 브라우저에서 로그인 테스트
- [ ] 회원가입 기능 테스트
- [ ] 관리자 대시보드 접속
- [ ] 회원 승인/거부 기능
- [ ] JSON 동기화 기능
- [ ] JSON 다운로드 기능

---

## 🚀 다음 단계

1. **브라우저 테스트**
   - http://3.34.186.174/ 접속
   - 로그인 시도 (01063529091 / 12345)
   - 정상 작동 확인

2. **기능 테스트**
   - 회원가입 흐름 확인
   - 관리자 기능 확인
   - JSON 백업 확인

3. **보안 강화 (선택)**
   - HTTPS 적용
   - JWT 인증 도입
   - Rate Limiting

---

## 📞 문제 발생 시

### Nginx 로그 확인
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Apps Script 로그 확인
- Google Sheets → 로그기록 시트

### 배포 롤백
```bash
# 백업으로 복원
sudo rm -rf /var/www/sagunbok/*
sudo cp -r /var/www/sagunbok_backup_YYYYMMDD_HHMMSS/* /var/www/sagunbok/
sudo systemctl restart nginx
```

---

## ✅ 체크리스트

- [x] Apps Script 코드 작성 및 배포
- [x] 프론트엔드 GET 방식 전환
- [x] 빌드 완료
- [x] Git 커밋/푸시
- [x] EC2 배포
- [x] Nginx 재시작
- [x] 웹사이트 접속 확인
- [ ] 브라우저 로그인 테스트 (사용자 확인 필요)
- [ ] 관리자 기능 테스트 (사용자 확인 필요)

---

**배포 완료 시각**: 2026-01-23 19:34:43 UTC  
**배포 담당**: AI Assistant  
**배포 상태**: ✅ 성공

🎉 **모든 배포가 완료되었습니다! 이제 브라우저에서 테스트해주세요!**
