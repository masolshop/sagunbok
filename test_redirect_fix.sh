#!/bin/bash

echo "🔍 304/302 리다이렉트 수정 테스트"
echo "======================================"
echo ""

# Apps Script URL
BACKEND_URL="https://script.google.com/macros/s/AKfycbw5c6wArjU15_l6bXfMNe2oMpQXMQtwqvO4eyNQ1BcP1LtSXmYECNj2EatGWP09pDnYQw/exec"

# 테스트 데이터
TEST_DATA='{
  "companyName": "리다이렉트테스트병원",
  "companyType": "병의원개인사업자",
  "name": "테스터",
  "phone": "01099998888",
  "email": "redirect@test.com",
  "password": "test1234",
  "referrer": "김철수"
}'

echo "1️⃣  Apps Script 버전 확인 (리다이렉트 자동 따라가기)"
curl -L -s "${BACKEND_URL}" | jq -r '.version, .message'
echo ""

echo "2️⃣  회원가입 테스트 (리다이렉트 + 캐시 무효화)"
ENCODED_DATA=$(echo "$TEST_DATA" | jq -c '.' | jq -sRr @uri)
RESPONSE=$(curl -L -s "${BACKEND_URL}?action=registerCompany&data=${ENCODED_DATA}")

echo "📤 요청 URL:"
echo "${BACKEND_URL}?action=registerCompany&data=..."
echo ""

echo "📥 응답:"
echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ 회원가입 요청 성공!"
  echo "✅ Google Sheets 확인 필요:"
  echo "   - C열(기업유형): 병의원개인사업자"
  echo "   - E열(핸드폰): 010-9999-8888"
  echo "   - H열(추천인): 김철수"
  echo "   - I열(승인상태): 승인전표"
else
  echo "❌ 회원가입 실패"
  echo "$RESPONSE"
fi

echo ""
echo "======================================"
echo "✅ 테스트 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 브라우저 캐시 완전 삭제 (Ctrl+Shift+Delete)"
echo "2. http://3.34.186.174 접속"
echo "3. 하드 새로고침 (Ctrl+Shift+R)"
echo "4. 기업회원 가입 테스트"
echo "5. Network 탭: 200 OK 확인"
echo "6. Google Sheets: I열 승인상태 확인"
