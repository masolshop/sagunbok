#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Apps Script 웹앱 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BACKEND_URL="https://script.google.com/macros/s/AKfycbw5c6wArjU15_l6bXfMNe2oMpQXMQtwqvO4eyNQ1BcP1LtSXmYECNj2EatGWP09pDnYQw/exec"

echo "1️⃣  GET 요청 테스트 (정보 조회)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BACKEND_URL" | jq . 2>/dev/null || curl -s "$BACKEND_URL"
echo ""
echo ""

echo "2️⃣  회원가입 테스트 (registerCompany)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 테스트 데이터 JSON 생성
TEST_DATA=$(cat <<'JSON'
{
  "companyName": "테스트병원CLI",
  "companyType": "병의원개인사업자",
  "name": "CLI테스터",
  "phone": "01088889999",
  "email": "clitest@test.com",
  "password": "test1234",
  "referrer": "김철수"
}
JSON
)

# URL 인코딩된 데이터 생성
ENCODED_DATA=$(echo "$TEST_DATA" | jq -c . | jq -sRr @uri)

# GET 요청으로 회원가입 테스트
echo "요청 URL:"
echo "$BACKEND_URL?action=registerCompany&data=$ENCODED_DATA"
echo ""
echo "응답:"
curl -s "$BACKEND_URL?action=registerCompany&data=$ENCODED_DATA" | jq . 2>/dev/null || \
  curl -s "$BACKEND_URL?action=registerCompany&data=$ENCODED_DATA"
echo ""
echo ""

echo "3️⃣  로그인 테스트 (loginCompany)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOGIN_DATA=$(cat <<'JSON'
{
  "phone": "01088889999",
  "password": "test1234"
}
JSON
)

ENCODED_LOGIN=$(echo "$LOGIN_DATA" | jq -c . | jq -sRr @uri)

echo "요청 URL:"
echo "$BACKEND_URL?action=loginCompany&data=$ENCODED_LOGIN"
echo ""
echo "응답:"
curl -s "$BACKEND_URL?action=loginCompany&data=$ENCODED_LOGIN" | jq . 2>/dev/null || \
  curl -s "$BACKEND_URL?action=loginCompany&data=$ENCODED_LOGIN"
echo ""
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "테스트 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 예상 결과:"
echo "  1. GET: 버전 정보 및 시트 구조 표시"
echo "  2. registerCompany: { success: true, message: '회원가입...' }"
echo "  3. loginCompany: { success: true, user: {...}, approvalStatus: '승인전표' }"
echo ""
echo "❌ 오류 발생 시:"
echo "  - '알 수 없는 action' → Apps Script 재배포 필요"
echo "  - 'SyntaxError' → Apps Script 코드 재확인"
echo "  - HTML 응답 → 배포 URL 확인"
echo ""

