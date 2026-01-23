# 📦 EC2 수동 배포 가이드

## 🎯 배포할 파일
\`dist-v6.1-get-method-20260123102050.tar.gz\` (147 KB)

---

## 📋 배포 단계

### 1️⃣ **배포 파일 다운로드**

GitHub에서 다운로드:
\`\`\`bash
# GitHub 최신 커밋에서 다운로드
git clone https://github.com/masolshop/sagunbok.git
cd sagunbok
\`\`\`

또는 직접 전송:
\`\`\`bash
# 로컬 → EC2 전송 (SSH 키 필요)
scp dist-v6.1-get-method-20260123102050.tar.gz ubuntu@3.34.186.174:/tmp/
\`\`\`

---

### 2️⃣ **EC2 접속**

\`\`\`bash
ssh ubuntu@3.34.186.174
\`\`\`

---

### 3️⃣ **기존 백업**

\`\`\`bash
cd /var/www
sudo cp -r sagunbok sagunbok_backup_$(date +%Y%m%d_%H%M%S)
\`\`\`

---

### 4️⃣ **새 파일 압축 해제**

\`\`\`bash
cd /tmp
tar -xzf dist-v6.1-get-method-20260123102050.tar.gz
\`\`\`

---

### 5️⃣ **파일 교체**

\`\`\`bash
sudo rm -rf /var/www/sagunbok/*
sudo cp -r dist/* /var/www/sagunbok/
\`\`\`

---

### 6️⃣ **권한 설정**

\`\`\`bash
sudo chown -R www-data:www-data /var/www/sagunbok
sudo chmod -R 755 /var/www/sagunbok
\`\`\`

---

### 7️⃣ **Nginx 재시작**

\`\`\`bash
sudo systemctl restart nginx
sudo systemctl status nginx
\`\`\`

---

### 8️⃣ **확인**

브라우저에서 접속:
\`\`\`
http://3.34.186.174/
\`\`\`

로그인 테스트:
- 전화번호: \`01063529091\`
- 비밀번호: \`12345\`

---

## ✅ 배포 완료 체크리스트

- [ ] GitHub에서 최신 코드 확인 (커밋: 596bb4e)
- [ ] EC2 접속
- [ ] 기존 파일 백업
- [ ] 새 파일 압축 해제 및 교체
- [ ] 권한 설정
- [ ] Nginx 재시작
- [ ] 브라우저 테스트
- [ ] 로그인 기능 확인

---

**작성일**: 2026-01-23 19:35 KST
