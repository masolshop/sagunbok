#!/bin/bash

# 🚀 EC2 자동 배포 스크립트
# 사용법: ./deploy-to-ec2.sh [SSH_KEY_PATH]

set -e  # 오류 발생 시 중단

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# EC2 정보
EC2_HOST="3.34.186.174"
EC2_USER="ubuntu"
DEPLOY_PATH="/var/www/html"
ARCHIVE_NAME="dist-login-20260121152348.tar.gz"

# SSH 키 경로
SSH_KEY="${1:-}"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   사근복 AI - EC2 자동 배포 스크립트   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 1. 배포 파일 존재 확인
echo -e "${YELLOW}[1/6]${NC} 배포 파일 확인..."
if [ ! -f "$ARCHIVE_NAME" ]; then
    echo -e "${RED}❌ 오류: $ARCHIVE_NAME 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 배포 파일 확인 완료${NC}"
echo ""

# 2. EC2 서버 연결 테스트
echo -e "${YELLOW}[2/6]${NC} EC2 서버 연결 테스트..."
SSH_CMD="ssh"
if [ -n "$SSH_KEY" ]; then
    SSH_CMD="ssh -i $SSH_KEY"
    SCP_CMD="scp -i $SSH_KEY"
else
    SCP_CMD="scp"
fi

if $SSH_CMD ${EC2_USER}@${EC2_HOST} "echo 'Connection OK'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ EC2 서버 연결 성공${NC}"
else
    echo -e "${RED}❌ 오류: EC2 서버에 연결할 수 없습니다.${NC}"
    echo -e "${YELLOW}💡 힌트: SSH 키를 사용하려면 다음과 같이 실행하세요:${NC}"
    echo -e "   ./deploy-to-ec2.sh /path/to/your-key.pem"
    exit 1
fi
echo ""

# 3. 파일 업로드
echo -e "${YELLOW}[3/6]${NC} 배포 파일 업로드..."
$SCP_CMD $ARCHIVE_NAME ${EC2_USER}@${EC2_HOST}:/tmp/
echo -e "${GREEN}✅ 파일 업로드 완료${NC}"
echo ""

# 4. 기존 파일 백업
echo -e "${YELLOW}[4/6]${NC} 기존 파일 백업..."
BACKUP_NAME="html.backup.$(date +%Y%m%d%H%M%S)"
$SSH_CMD ${EC2_USER}@${EC2_HOST} "sudo cp -r ${DEPLOY_PATH} /var/www/${BACKUP_NAME}"
echo -e "${GREEN}✅ 백업 완료: /var/www/${BACKUP_NAME}${NC}"
echo ""

# 5. 새 버전 배포
echo -e "${YELLOW}[5/6]${NC} 새 버전 배포..."
$SSH_CMD ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
cd /tmp
tar -xzf dist-login-20260121152348.tar.gz
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
rm -rf dist
ENDSSH
echo -e "${GREEN}✅ 배포 완료${NC}"
echo ""

# 6. nginx 재시작
echo -e "${YELLOW}[6/6]${NC} nginx 재시작..."
$SSH_CMD ${EC2_USER}@${EC2_HOST} "sudo systemctl reload nginx"
echo -e "${GREEN}✅ nginx 재시작 완료${NC}"
echo ""

# 완료 메시지
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🎉 배포 성공! 🎉                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 배포된 URL:${NC} http://${EC2_HOST}/"
echo -e "${BLUE}📦 백업 위치:${NC} /var/www/${BACKUP_NAME}"
echo ""
echo -e "${YELLOW}💡 확인 방법:${NC}"
echo -e "   1. 브라우저에서 http://${EC2_HOST}/ 접속"
echo -e "   2. 로그인 페이지 확인"
echo -e "   3. 로그인 테스트"
echo ""
echo -e "${GREEN}✨ 완료되었습니다!${NC}"
