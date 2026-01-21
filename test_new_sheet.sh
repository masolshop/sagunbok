#!/bin/bash

echo "🧪 신규 Google Sheets 연동 테스트"
echo "===================================="
echo ""

# 새 Apps Script URL
BACKEND_URL="https://script.google.com/macros/s/AKfycbwjtxzuEsmI_led6T_nFqyJuk0a91Qd7UvXp2DaIdJBEP3Dz8Gz6Qf57NgkWaZNovOwWg/exec"

# 신규 시트 URL
SHEET_URL="https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit"

echo "📊 신규 시트: $SHEET_URL"
echo "🔗 Apps Script URL: $BACKEND_URL"
echo ""

# 테스트 데이터
TEST_DATA='{
  "companyName": "신규시트테스트병원",
  "companyType": "병의원개인사업자",
  "name": "신규테스터",
  "phone": "01044445555",
  "email": "newsheet@test.com",
  "password": "test1234",
  "referrer": "김철수"
}'

echo "1️⃣  Apps Script 버전 확인"
curl -L -s "${BACKEND_URL}" | jq -r '.version, .message'
echo ""

echo "2️⃣  기업회원 가입 테스트"
echo "테스트 데이터:"
echo "$TEST_DATA" | jq '.'
echo ""

ENCODED_DATA=$(echo "$TEST_DATA" | jq -c '.' | jq -sRr @uri)
RESPONSE=$(curl -L -s "${BACKEND_URL}?action=registerCompany&data=${ENCODED_DATA}")

echo "📥 응답:"
echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  if [ "$SUCCESS" = "true" ]; then
    echo "✅ 회원가입 성공!"
    echo ""
    echo "🔍 신규 Google Sheets 확인:"
    echo "   $SHEET_URL"
    echo ""
    echo "✅ 확인 사항:"
    echo "   - [기업회원] 시트 열기"
    echo "   - 새 행 추가됨"
    echo "   - A열: 가입일시"
    echo "   - B열: 신규시트테스트병원"
    echo "   - C열: 병의원개인사업자"
    echo "   - D열: 신규테스터"
    echo "   - E열: 010-4444-5555"
    echo "   - F열: newsheet@test.com"
    echo "   - G열: (해시값)"
    echo "   - H열: 김철수"
    echo "   - I열: 승인전표 ⭐"
  else
    echo "⚠️  응답: $(echo "$RESPONSE" | jq -r '.error // .message')"
  fi
else
  echo "❌ 회원가입 실패"
  echo "$RESPONSE"
fi

echo ""
echo "===================================="
echo "✅ 테스트 완료!"
