# 🚨 긴급 배포 가이드 - v6.2.13

## ❌ 문제 상황
- **증상**: 폰, PC, 시크릿 모드 모두에서 로그인 오류 발생
- **원인**: EC2 서버에 v6.2.13 빌드가 배포되지 않음
- **상태**: Apps Script는 v6.2.13 배포 완료, 프론트엔드는 구버전 상태

## ✅ 현재 상태
- ✅ Apps Script v6.2.13 배포 완료
- ✅ 로컬 빌드 완료 (새 API URL 포함)
- ❌ EC2 서버 배포 미완료 ← **이것이 문제!**

---

## 🚀 즉시 배포 방법 (5분 소요)

### 필수 정보
```bash
EC2 IP: 3.34.186.174
사용자: ubuntu
경로: /var/www/sagunbok
```

### Step 1: EC2 백업 (선택사항, 30초)
```bash
ssh ubuntu@3.34.186.174 'cd /var/www/sagunbok && tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz *.html assets/ 2>/dev/null || true'
```

### Step 2: 빌드 파일 업로드 (2분) ⭐ 가장 중요
```bash
scp -r dist/* ubuntu@3.34.186.174:/var/www/sagunbok/
```

**이 명령어는 로컬 터미널에서 실행해야 합니다!**
- Windows: PowerShell 또는 Git Bash
- Mac/Linux: 터미널

### Step 3: Nginx 재시작 (선택사항, 10초)
```bash
ssh ubuntu@3.34.186.174 'sudo systemctl restart nginx'
```

### Step 4: 배포 확인 (10초)
```bash
curl http://3.34.186.174/ | grep AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH
```

**성공 시**: 새 API URL이 출력됨
```
AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH
```

---

## 🔧 대체 방법: FTP/FileZilla 사용

### 1. FileZilla 연결
```
호스트: sftp://3.34.186.174
사용자명: ubuntu
비밀번호: (EC2 키 파일 또는 비밀번호)
포트: 22
```

### 2. 파일 업로드
```
로컬: /home/user/webapp/dist/* (모든 파일)
원격: /var/www/sagunbok/
```

### 3. 업로드할 파일 목록
- ✅ index.html
- ✅ logout.html
- ✅ favicon.svg
- ✅ assets/ 폴더 전체
  - index-C3aa0pzc.js ← 새 API URL 포함
  - index-D7f1ZBkG.css

---

## 🎯 배포 후 테스트 체크리스트

### 1. 브라우저 캐시 완전 삭제
```
Chrome: Ctrl + Shift + Delete
- 전체 기간
- 캐시된 이미지 및 파일 체크
- 데이터 삭제
```

### 2. 시크릿 모드로 접속
```
http://3.34.186.174/
```

### 3. F12 개발자 도구 → Network 탭
로그인 시도 시 다음을 확인:
- ✅ API URL: `...AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH...`
- ✅ 응답 상태: `200 OK`
- ✅ 응답 JSON: `{"success": true, "userType": "...", "approvalStatus": "..."}`

### 4. 로그인 테스트
```
슈퍼 관리자:
- 전화번호: 01063529091
- 비밀번호: (기존 설정한 비밀번호)

매니저/컨설턴트:
- 전화번호: 01063529091 / 01086199091 / 01063850700
- 비밀번호: 12345
```

---

## 🐛 문제 해결

### Q: scp 명령어가 안 됨
**A**: SSH 키 파일을 사용하는 경우:
```bash
scp -i /path/to/key.pem -r dist/* ubuntu@3.34.186.174:/var/www/sagunbok/
```

### Q: Permission denied 오류
**A**: EC2에서 권한 설정:
```bash
ssh ubuntu@3.34.186.174 'sudo chown -R ubuntu:ubuntu /var/www/sagunbok'
```

### Q: 배포 후에도 구버전 API URL이 보임
**A**: 
1. 브라우저 캐시 완전 삭제
2. Nginx 재시작
3. 시크릿 모드로 재접속

### Q: EC2 접속 정보를 모름
**A**: 
- AWS EC2 콘솔에서 키 페어 다운로드
- 또는 비밀번호 재설정

---

## 📋 빠른 체크리스트

배포 전:
- [ ] 로컬 dist/ 폴더 확인
- [ ] 새 API URL이 빌드에 포함되었는지 확인

배포:
- [ ] Step 1: EC2 백업 (선택)
- [ ] Step 2: SCP로 파일 업로드 ⭐
- [ ] Step 3: Nginx 재시작 (선택)
- [ ] Step 4: curl로 배포 확인

테스트:
- [ ] 브라우저 캐시 삭제
- [ ] 시크릿 모드로 접속
- [ ] F12로 API URL 확인
- [ ] 로그인 테스트

---

## 🔗 관련 정보

- **Apps Script**: https://script.google.com/u/0/home/projects/1FqLBX8t_0XG-wGzbc5bt9UCXYUn68iomWNceY3P5ICYArM6rPj97-HIw/edit
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
- **API Endpoint**: https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec
- **PR**: https://github.com/masolshop/sagunbok/pull/1

---

## ⚡ 핵심 요약

1. **문제**: EC2에 새 빌드가 배포되지 않음
2. **해결**: `scp -r dist/* ubuntu@3.34.186.174:/var/www/sagunbok/`
3. **확인**: 시크릿 모드 + F12 Network 탭
4. **예상 시간**: 5분

**이 작업만 하면 모든 로그인 문제가 해결됩니다!** 🚀
