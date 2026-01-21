#!/bin/bash

BACKEND_URL="https://script.google.com/macros/s/AKfycbw5c6wArjU15_l6bXfMNe2oMpQXMQtwqvO4eyNQ1BcP1LtSXmYECNj2EatGWP09pDnYQw/exec"

echo "🧪 회원가입 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TEST_DATA='{"companyName":"CLI테스트병원","companyType":"병의원개인사업자","name":"CLI테스터","phone":"01077778888","email":"clitest2@test.com","password":"test1234","referrer":"김철수"}'
ENCODED=$(echo "$TEST_DATA" | jq -sRr @uri)

echo "요청 데이터:"
echo "$TEST_DATA" | jq .
echo ""

echo "응답:"
curl -L -s "$BACKEND_URL?action=registerCompany&data=$ENCODED" | jq . || \
  curl -L -s "$BACKEND_URL?action=registerCompany&data=$ENCODED"
echo ""

