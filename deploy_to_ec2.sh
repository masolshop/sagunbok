#!/bin/bash

# v6.2.12 EC2 배포 스크립트
# 사용 방법: ./deploy_to_ec2.sh

set -e  # 오류 발생 시 중단

echo "============================================"
echo "🚀 v6.2.12 EC2 배포 시작"
echo "============================================"
echo ""

# 환경 변수
EC2_HOST="3.34.186.174"
EC2_USER="ubuntu"  # 또는 실제 사용자명
EC2_PATH="/var/www/sagunbok"
BUILD_DIR="./dist"

# 1. 빌드 디렉토리 확인
echo "📦 Step 1: 빌드 디렉토리 확인..."
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ dist/ 디렉토리가 없습니다. npm run build를 먼저 실행하세요."
    exit 1
fi

echo "✅ 빌드 디렉토리 확인 완료"
echo ""

# 2. 빌드 파일 목록 출력
echo "📋 Step 2: 빌드 파일 목록"
echo "----------------------------------------"
ls -lh "$BUILD_DIR"
ls -lh "$BUILD_DIR/assets"
echo ""

# 3. 새 API URL 확인
echo "🔍 Step 3: 새 API URL 포함 여부 확인..."
if grep -q "AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH" "$BUILD_DIR/assets/"*.js; then
    echo "✅ 새 v6.2.12 API URL 포함 확인"
else
    echo "❌ 새 API URL이 빌드 파일에 없습니다!"
    exit 1
fi
echo ""

# 4. 백업 생성 (선택 사항 - SSH 접근 필요)
echo "💾 Step 4: EC2 서버 백업 (SSH 필요)..."
echo "수동으로 백업을 진행하세요:"
echo "  ssh $EC2_USER@$EC2_HOST"
echo "  cd $EC2_PATH"
echo "  tar -czf backup_\$(date +%Y%m%d_%H%M%S).tar.gz *.html assets/"
echo ""

# 5. 배포 방법 안내
echo "============================================"
echo "📤 Step 5: EC2 배포 방법"
echo "============================================"
echo ""

echo "방법 1: SCP를 사용한 배포 (권장)"
echo "----------------------------------------"
echo "ssh $EC2_USER@$EC2_HOST \"mkdir -p $EC2_PATH\""
echo "scp -r $BUILD_DIR/* $EC2_USER@$EC2_HOST:$EC2_PATH/"
echo ""

echo "방법 2: rsync를 사용한 배포"
echo "----------------------------------------"
echo "rsync -avz --delete $BUILD_DIR/ $EC2_USER@$EC2_HOST:$EC2_PATH/"
echo ""

echo "방법 3: Git을 통한 배포"
echo "----------------------------------------"
echo "1. EC2 서버에 SSH 접속:"
echo "   ssh $EC2_USER@$EC2_HOST"
echo ""
echo "2. 저장소로 이동:"
echo "   cd $EC2_PATH"
echo ""
echo "3. 최신 코드 Pull:"
echo "   git pull origin genspark_ai_developer"
echo ""
echo "4. 의존성 설치 및 빌드:"
echo "   npm install"
echo "   npm run build"
echo ""

# 6. 배포 후 확인 사항
echo "============================================"
echo "✅ 배포 후 확인 사항"
echo "============================================"
echo ""

echo "1. EC2 서버 파일 확인:"
echo "   ssh $EC2_USER@$EC2_HOST \"ls -lh $EC2_PATH\""
echo ""

echo "2. 웹 서버 재시작 (필요 시):"
echo "   ssh $EC2_USER@$EC2_HOST \"sudo systemctl restart nginx\""
echo "   # 또는"
echo "   ssh $EC2_USER@$EC2_HOST \"sudo service nginx restart\""
echo ""

echo "3. 브라우저에서 확인:"
echo "   http://$EC2_HOST/"
echo ""

echo "4. API 호출 테스트:"
echo "   개발자 도구(F12) → Network 탭에서 API 요청 확인"
echo "   새 URL 사용 여부: AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH"
echo ""

# 7. 배포 정보 파일 생성
echo "============================================"
echo "📝 배포 정보 저장"
echo "============================================"
echo ""

DEPLOY_INFO_FILE="DEPLOY_INFO_v6.2.12.txt"
cat > "$DEPLOY_INFO_FILE" << EOF
===========================================
v6.2.12 배포 정보
===========================================

배포 일시: $(date '+%Y-%m-%d %H:%M:%S')
배포 버전: v6.2.12
API URL: https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec

빌드 파일:
$(ls -lh "$BUILD_DIR")

빌드 에셋:
$(ls -lh "$BUILD_DIR/assets")

배포 대상:
- EC2 Host: $EC2_HOST
- EC2 User: $EC2_USER
- EC2 Path: $EC2_PATH

배포 후 확인:
- 프론트엔드: http://$EC2_HOST/
- API 테스트: http://$EC2_HOST/ (F12 → Network 탭)

주요 변경사항:
- Auth.tsx: 새 API URL 적용
- AdminView.tsx: 새 API URL 적용
- v6.2.12 기능: 시트 이름 수정, 이메일 시스템, 추천인 검증

===========================================
EOF

echo "✅ 배포 정보 저장: $DEPLOY_INFO_FILE"
cat "$DEPLOY_INFO_FILE"
echo ""

echo "============================================"
echo "🎯 다음 단계"
echo "============================================"
echo ""
echo "1. 위의 방법 중 하나를 선택하여 EC2에 배포"
echo "2. 브라우저에서 http://$EC2_HOST/ 접속"
echo "3. 로그인/회원가입 테스트"
echo "4. 개발자 도구로 새 API URL 사용 확인"
echo "5. 전체 기능 테스트 수행"
echo ""
echo "============================================"
echo "✅ 배포 스크립트 실행 완료"
echo "============================================"
