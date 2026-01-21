#!/bin/bash

echo "=== 1. 프록시 서버 헬스 체크 ==="
curl -s http://localhost:3001/api/health | jq . || echo "❌ 프록시 서버 응답 없음"

echo ""
echo "=== 2. 외부에서 Nginx 헬스 체크 (실패 예상) ==="
timeout 5 curl -s http://3.34.186.174/api/health | jq . || echo "❌ Nginx 프록시 설정 안됨"

echo ""
echo "=== 3. 회원가입 API 테스트 (localhost) ==="
curl -s -X POST http://localhost:3001/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerCompany",
    "data": {
      "companyName": "콘솔테스트",
      "companyType": "병의원개인사업자",
      "name": "테스터",
      "phone": "01011112222",
      "email": "console@test.com",
      "password": "test1234",
      "referrer": "김철수"
    }
  }' | jq . || echo "❌ API 호출 실패"

echo ""
echo "=== 4. Nginx 프록시 테스트 (외부 - 실패 예상) ==="
timeout 10 curl -s -X POST http://3.34.186.174/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerCompany",
    "data": {
      "companyName": "Nginx테스트",
      "companyType": "법인",
      "name": "Nginx",
      "phone": "01022223333",
      "email": "nginx@test.com",
      "password": "test1234",
      "referrer": "김철수"
    }
  }' | jq . || echo "❌ Nginx 프록시 실패"

