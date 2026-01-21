#!/bin/bash

# 사근복 AI - 로그인 페이지 포함 최종 배포 스크립트
# 배포 날짜: 2026-01-21
# 배포 파일: dist-with-login-20260121155055.tar.gz
# 대상 서버: http://3.34.186.174/

# 컬러 출력 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 배포 정보
DEPLOY_FILE="dist-with-login-20260121155055.tar.gz"
EC2_HOST="3.34.186.174"
EC2_USER="ubuntu"
DEPLOY_PATH="/var/www/html"
SSH_KEY="${1:-}"

# 헤더 출력
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}  ${BOLD}🚀 사근복 AI - 로그인 페이지 포함 최종 배포${NC}      ${PURPLE}║${NC}"
echo -e "${PURPLE}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${PURPLE}║${NC}  배포 파일: ${GREEN}${DEPLOY_FILE}${NC}"
echo -e "${PURPLE}║${NC}  대상 서버: ${CYAN}http://${EC2_HOST}/${NC}"
echo -e "${PURPLE}║${NC}  배포 시각: ${YELLOW}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# [1/7] 배포 파일 확인
echo -e "${CYAN}[1/7]${NC} ${BOLD}배포 파일 확인 중...${NC}"
if [ ! -f "$DEPLOY_FILE" ]; then
    echo -e "${RED}❌ 오류: $DEPLOY_FILE 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi
DEPLOY_SIZE=$(ls -lah "$DEPLOY_FILE" | awk '{print $5}')
echo -e "${GREEN}✓${NC} 배포 파일 확인 완료 (${DEPLOY_SIZE})"
echo ""

# [2/7] EC2 연결 테스트
echo -e "${CYAN}[2/7]${NC} ${BOLD}EC2 연결 테스트 중...${NC}"
SSH_CMD="ssh"
if [ -n "$SSH_KEY" ]; then
    SSH_CMD="ssh -i $SSH_KEY"
    echo -e "${YELLOW}ℹ${NC}  SSH 키: $SSH_KEY"
fi

if $SSH_CMD -o ConnectTimeout=10 -o BatchMode=yes ${EC2_USER}@${EC2_HOST} exit 2>/dev/null; then
    echo -e "${GREEN}✓${NC} EC2 연결 성공"
else
    echo -e "${YELLOW}⚠${NC}  SSH 키 인증이 필요합니다."
    if [ -z "$SSH_KEY" ]; then
        echo -e "${YELLOW}ℹ${NC}  사용법: $0 /path/to/your-key.pem"
    fi
fi
echo ""

# [3/7] 파일 업로드
echo -e "${CYAN}[3/7]${NC} ${BOLD}배포 파일 업로드 중...${NC}"
SCP_CMD="scp"
if [ -n "$SSH_KEY" ]; then
    SCP_CMD="scp -i $SSH_KEY"
fi

$SCP_CMD "$DEPLOY_FILE" ${EC2_USER}@${EC2_HOST}:/tmp/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 파일 업로드 완료"
else
    echo -e "${RED}❌파일 업로드 실패${NC}"
    exit 1
fi
echo ""

# [4/7] 기존 파일 백업
echo -e "${CYAN}[4/7]${NC} ${BOLD}기존 파일 백업 중...${NC}"
BACKUP_NAME="html.backup.with-login.$(date +%Y%m%d%H%M%S)"
$SSH_CMD ${EC2_USER}@${EC2_HOST} "
    if [ -d ${DEPLOY_PATH} ]; then
        sudo cp -r ${DEPLOY_PATH} /var/www/${BACKUP_NAME}
        echo '✓ 백업 완료: /var/www/${BACKUP_NAME}'
    else
        echo '⚠ 기존 배포 없음'
    fi
"
echo ""

# [5/7] 로그인 페이지 포함 배포
echo -e "${CYAN}[5/7]${NC} ${BOLD}로그인 페이지 포함 배포 중...${NC}"
$SSH_CMD ${EC2_USER}@${EC2_HOST} "
    cd /tmp
    tar -xzf ${DEPLOY_FILE}
    sudo rm -rf ${DEPLOY_PATH}/*
    sudo cp -r dist/* ${DEPLOY_PATH}/
    sudo chown -R www-data:www-data ${DEPLOY_PATH}
    sudo chmod -R 755 ${DEPLOY_PATH}
    echo '✓ 배포 완료'
"
echo ""

# [6/7] nginx 재시작
echo -e "${CYAN}[6/7]${NC} ${BOLD}nginx 재시작 중...${NC}"
$SSH_CMD ${EC2_USER}@${EC2_HOST} "
    sudo nginx -t && sudo systemctl reload nginx
    echo '✓ nginx 재시작 완료'
"
echo ""

# [7/7] 배포 확인
echo -e "${CYAN}[7/7]${NC} ${BOLD}배포 확인 중...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST}/)
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} HTTP 상태 코드: ${HTTP_STATUS} OK"
else
    echo -e "${YELLOW}⚠${NC}  HTTP 상태 코드: ${HTTP_STATUS}"
fi
echo ""

# 완료 메시지
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}  ${BOLD}${GREEN}🎉 로그인 페이지 포함 최종 배포 완료!${NC}            ${PURPLE}║${NC}"
echo -e "${PURPLE}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${PURPLE}║${NC}  ${BOLD}배포 URL:${NC} ${CYAN}http://${EC2_HOST}/${NC}"
echo -e "${PURPLE}║${NC}  ${BOLD}백업 위치:${NC} ${YELLOW}/var/www/${BACKUP_NAME}${NC}"
echo -e "${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}  ${BOLD}🔐 로그인 페이지 기능:${NC}"
echo -e "${PURPLE}║${NC}  ${GREEN}✓${NC} 모던 React 디자인 적용"
echo -e "${PURPLE}║${NC}  ${GREEN}✓${NC} 배경 애니메이션 (3색 블롭)"
echo -e "${PURPLE}║${NC}  ${GREEN}✓${NC} 글래스모피즘 효과"
echo -e "${PURPLE}║${NC}  ${GREEN}✓${NC} 로그인/회원가입 페이지"
echo -e "${PURPLE}║${NC}  ${GREEN}✓${NC} ID/비밀번호 찾기"
echo -e "${PURPLE}║${NC}  ${GREEN}✓${NC} Google Sheets 연동"
echo -e "${PURPLE}║${NC}  ${GREEN}✓${NC} 로그아웃 기능"
echo -e "${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}  ${BOLD}📱 테스트 계정:${NC}"
echo -e "${PURPLE}║${NC}  ${CYAN}기업회원:${NC}"
echo -e "${PURPLE}║${NC}    ID: 010-1234-5678 (가입된 전화번호)"
echo -e "${PURPLE}║${NC}    PW: (회원가입 시 설정한 비밀번호)"
echo -e "${PURPLE}║${NC}  ${CYAN}컨설턴트:${NC}"
echo -e "${PURPLE}║${NC}    ID: 010-8765-4321 (가입된 전화번호)"
echo -e "${PURPLE}║${NC}    PW: 12345"
echo -e "${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}  ${BOLD}⚠️  중요:${NC}"
echo -e "${PURPLE}║${NC}  로그인하지 않으면 메인 앱에 접근할 수 없습니다."
echo -e "${PURPLE}║${NC}  Google Sheets에서 승인상태가 '승인완료'여야 합니다."
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}지금 바로 테스트하세요: ${CYAN}http://${EC2_HOST}/${NC}"
echo -e "${BOLD}로그인 페이지가 먼저 표시됩니다! 🔐${NC}"
echo ""
