# 🚀 EC2 서버 배포 완료

## ✅ 배포 정보

**배포 시간**: 2026-01-21 21:12 (KST)
**배포 대상**: http://3.34.186.174/
**배포 방법**: SSH + SCP

---

## 📦 배포된 파일

### 웹 루트: `/var/www/sagunbok`

```
✅ index.html (1013 bytes)
   - favicon.svg 링크 추가
   - 캐시 비활성화 헤더
   - 쿼리 파라미터: ?v=2026012111

✅ favicon.svg (252 bytes)
   - S 로고 아이콘
   - 파란색 배경 (#1a5f7a)

✅ assets/index-BlSWeQQK.js (1,031.52 kB)
   - React 앱
   - 최신 빌드
   - gzip: 287.66 kB

✅ assets/index-CFI8-ieB.css (12.92 kB)
   - Tailwind CSS
   - 프로덕션 빌드
   - gzip: 3.14 kB
```

---

## 🔧 배포 과정

### 1️⃣ 파일 압축
```bash
tar -czf dist-latest.tar.gz -C dist .
```

### 2️⃣ 서버 전송
```bash
scp -i lightsail-key.pem dist-latest.tar.gz ubuntu@3.34.186.174:/tmp/
```

### 3️⃣ 기존 파일 백업
```bash
sudo mkdir -p /var/www/sagunbok.backup.20260121_121136
sudo cp -r /var/www/sagunbok/* /var/www/sagunbok.backup.20260121_121136/
```

### 4️⃣ 새 파일 배포
```bash
sudo tar -xzf dist-latest.tar.gz -C /var/www/sagunbok/
sudo chown -R www-data:www-data /var/www/sagunbok
sudo chmod -R 755 /var/www/sagunbok
```

### 5️⃣ Nginx 재시작
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🌐 접속 URL

### 프로덕션 서버:
```
✅ http://3.34.186.174/
```

**특징:**
- ✅ 최신 UI 적용
- ✅ 캐시 비활성화
- ✅ favicon 추가
- ✅ 캐시 버스팅 쿼리 파라미터
- ✅ Nginx 서빙

### 개발 서버 (샌드박스):
```
✅ https://8000-ibupgf3p7cll7kpgwy3n6-0e616f0a.sandbox.novita.ai/index.html
```

---

## 🧪 테스트

### PC 브라우저:
1. **완전 새로고침**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. **URL 접속**: http://3.34.186.174/
3. **확인 사항**:
   - ✅ 파란색 버튼
   - ✅ 둥근 모서리 카드
   - ✅ 그림자 효과
   - ✅ S 로고 아이콘 (탭)

### F12 개발자 도구:
```
✅ Console: 에러 없음
✅ Network:
   - index.html - 200 OK
   - index-BlSWeQQK.js?v=2026012111 - 200 OK
   - index-CFI8-ieB.css?v=2026012111 - 200 OK
   - favicon.svg - 200 OK
```

### 모바일:
1. **브라우저 캐시 삭제** (또는 시크릿 모드)
2. **URL 접속**: http://3.34.186.174/
3. **확인**: 스타일 적용된 UI

---

## 📊 서버 정보

### EC2 인스턴스:
- **IP**: 3.34.186.174
- **OS**: Ubuntu 22.04.5 LTS
- **Kernel**: 6.8.0-1044-aws
- **Memory**: 20% 사용 중
- **Disk**: 4.6% 사용 중

### 웹 서버:
- **Software**: Nginx 1.18.0
- **Document Root**: /var/www/sagunbok
- **Owner**: www-data:www-data
- **Permissions**: 755

---

## 🔄 롤백 방법 (필요시)

기존 파일이 백업되어 있습니다:
```bash
# SSH 접속
ssh -i lightsail-key.pem ubuntu@3.34.186.174

# 백업 확인
ls -la /var/www/sagunbok.backup.*

# 롤백 (백업 날짜 확인 후)
sudo rm -rf /var/www/sagunbok/*
sudo cp -r /var/www/sagunbok.backup.YYYYMMDD_HHMMSS/* /var/www/sagunbok/
sudo systemctl reload nginx
```

---

## 📋 체크리스트

### 배포 전:
- [x] 로컬 빌드 완료
- [x] 파일 압축
- [x] SSH 키 확인

### 배포 중:
- [x] 기존 파일 백업
- [x] 새 파일 전송
- [x] 권한 설정
- [x] Nginx 재시작

### 배포 후:
- [x] curl 테스트
- [x] CSS 파일 확인
- [x] 브라우저 테스트
- [ ] 회원가입 기능 테스트
- [ ] 모바일 테스트

---

## 🎯 다음 단계

### 1️⃣ 브라우저 캐시 완전 삭제
**Chrome:**
- F12 → Application → Storage → Clear site data

**Edge:**
- F12 → Application → Storage → Clear site data

**Firefox:**
- Ctrl+Shift+Delete → 캐시 삭제

### 2️⃣ 하드 새로고침
- **Windows**: Ctrl+Shift+R
- **Mac**: Cmd+Shift+R

### 3️⃣ 시크릿 모드 테스트
- 캐시 없이 완전히 새로운 상태로 테스트

### 4️⃣ 회원가입 테스트
```
회사명: EC2배포테스트병원
기업유형: 병의원개인사업자
담당자: EC2테스터
휴대폰: 010-3333-4444
이메일: ec2@deployment.com
비밀번호: test1234
추천인: 김철수
```

### 5️⃣ Google Sheets 확인
- [기업회원] 시트
- I열(승인상태): 승인전표

---

## ✅ 배포 완료!

**프로덕션 URL:**
```
http://3.34.186.174/
```

**상태:**
- ✅ 최신 빌드 배포
- ✅ Nginx 정상 작동
- ✅ CSS 파일 제공
- ✅ favicon 추가

**지금 바로 브라우저에서 http://3.34.186.174/ 를 열고 Ctrl+Shift+R로 새로고침하세요!**

---

## 📁 관련 파일

- `/home/user/webapp/dist-latest.tar.gz` (압축 파일)
- `/var/www/sagunbok/` (서버 웹 루트)
- `/var/www/sagunbok.backup.*/` (백업)

---

**배포 성공! 🎉**
