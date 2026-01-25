#!/bin/bash

echo "======================================"
echo "🚀 사근복 v6.2.13 긴급 배포"
echo "======================================"
echo ""

# EC2 정보
EC2_HOST="3.34.186.174"
EC2_USER="ubuntu"
EC2_PATH="/var/www/sagunbok"

echo "📋 배포 정보:"
echo "- 대상: $EC2_HOST"
echo "- 경로: $EC2_PATH"
echo "- 버전: v6.2.13"
echo ""

# 빌드 확인
if [ ! -d "dist" ]; then
    echo "❌ dist 폴더가 없습니다!"
    exit 1
fi

echo "✅ 빌드 폴더 확인 완료"
echo ""

echo "📦 배포 명령어:"
echo ""
echo "1. EC2 기존 파일 백업:"
echo "   ssh $EC2_USER@$EC2_HOST 'cd $EC2_PATH && tar -czf backup_\$(date +%Y%m%d_%H%M%S).tar.gz *.html assets/ 2>/dev/null || true'"
echo ""
echo "2. 새 빌드 파일 업로드:"
echo "   scp -r dist/* $EC2_USER@$EC2_HOST:$EC2_PATH/"
echo ""
echo "3. Nginx 재시작 (필요시):"
echo "   ssh $EC2_USER@$EC2_HOST 'sudo systemctl restart nginx'"
echo ""
echo "4. 배포 확인:"
echo "   curl http://$EC2_HOST/ | grep AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH"
echo ""

echo "======================================"
echo "⚠️  위 명령어를 순서대로 실행하세요!"
echo "======================================"
