#!/bin/bash
echo "========================================
🔍 EC2 서버 상세 정보
========================================

📍 기본 정보:
  EC2 IP: 3.34.186.174
  도메인: sagunbok.com
  리전: ap-northeast-2 (Seoul)

🌐 DNS 확인:"
nslookup sagunbok.com 2>/dev/null | grep -A1 "Name:" || echo "  DNS 조회 필요"

echo "
🔌 포트 접근 테스트:"
echo -n "  HTTP (80): "
timeout 2 bash -c "echo >/dev/tcp/3.34.186.174/80" 2>/dev/null && echo "✓ 열림" || echo "✗ 닫힘"

echo -n "  HTTPS (443): "
timeout 2 bash -c "echo >/dev/tcp/3.34.186.174/443" 2>/dev/null && echo "✓ 열림" || echo "✗ 닫힘"

echo -n "  API (3002): "
timeout 2 bash -c "echo >/dev/tcp/3.34.186.174/3002" 2>/dev/null && echo "✓ 열림" || echo "✗ 닫힘 (로컬 전용)"

echo "
🌐 웹사이트 접근 테스트:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://sagunbok.com 2>/dev/null)
echo "  https://sagunbok.com: $HTTP_CODE"

echo "
📂 로컬 서버 상태:"
echo "  Express API: http://localhost:3002"
curl -s http://localhost:3002/health 2>/dev/null | jq -r '  "    Status: " + .status + "\n    Uptime: " + (.uptime|tostring) + "s"' || echo "    ✗ 응답 없음"

echo "
🔑 SSH 접근:"
echo "  Key: lightsail-key.pem"
ls -lh lightsail-key.pem 2>/dev/null | awk '{print "  Size: " $5}'
echo "  테스트: ssh -i lightsail-key.pem ubuntu@3.34.186.174 'echo 연결성공'"

echo "
📦 배포 준비 상태:"
[ -d "server" ] && echo "  ✓ server/ 디렉토리 존재" || echo "  ✗ server/ 디렉토리 없음"
[ -d "dist" ] && echo "  ✓ dist/ 디렉토리 존재" || echo "  ✗ dist/ 디렉토리 없음"
[ -f "server/index.js" ] && echo "  ✓ server/index.js 존재" || echo "  ✗ server/index.js 없음"
[ -f "server/package.json" ] && echo "  ✓ server/package.json 존재" || echo "  ✗ server/package.json 없음"

echo "
🎯 다음 단계:"
echo "  1. API 서버를 EC2에 배포"
echo "  2. Nginx 리버스 프록시 설정"
echo "  3. 프론트엔드 API_BASE_URL 수정"
echo "  4. 재배포 및 테스트"

echo "
========================================"
