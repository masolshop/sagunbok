#!/bin/bash

# EC2 배포 스크립트 v2 - SSH 키 없이 배포
# EC2에 직접 접속하여 wget으로 파일 다운로드

DIST_FILE=$(ls -t dist-v6-final-deployed-*.tar.gz 2>/dev/null | head -1)

if [ -z "$DIST_FILE" ]; then
    echo "❌ 배포 파일을 찾을 수 없습니다."
    exit 1
fi

echo "📦 배포 파일: $DIST_FILE"
echo ""
echo "⚠️  SSH 키가 없어 자동 배포가 불가능합니다."
echo ""
echo "📋 수동 배포 방법:"
echo ""
echo "1. 다음 파일을 EC2로 전송하세요:"
echo "   $DIST_FILE"
echo ""
echo "2. EC2에서 다음 명령어 실행:"
echo ""
echo "   # 백업 생성"
echo "   sudo cp -r /var/www/sagunbok /var/www/sagunbok.backup.\$(date +%Y%m%d%H%M%S)"
echo ""
echo "   # 압축 해제"
echo "   cd /tmp"
echo "   tar -xzf $DIST_FILE"
echo ""
echo "   # 기존 파일 삭제 및 새 파일 복사"
echo "   sudo rm -rf /var/www/sagunbok/*"
echo "   sudo mv dist/* /var/www/sagunbok/"
echo "   sudo chown -R www-data:www-data /var/www/sagunbok"
echo "   sudo chmod -R 755 /var/www/sagunbok"
echo ""
echo "   # Nginx 재시작"
echo "   sudo systemctl restart nginx"
echo ""
echo "3. 접속 확인:"
echo "   http://3.34.186.174/"
echo ""

