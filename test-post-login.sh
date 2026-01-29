#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec"

echo "========================================="
echo "🧪 POST 방식 로그인 테스트 (v7.2.2)"
echo "========================================="
echo ""

# POST로 로그인 시도
echo "📱 테스트: POST 방식 슈퍼어드민 로그인"
echo "전화번호: 01063529091"
echo "비밀번호: test1234"
echo ""

LOGIN_DATA='{
  "action": "loginCompany",
  "phone": "01063529091",
  "password": "test1234"
}'

RESPONSE=$(curl -sL -X POST \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA" \
  "$API_URL")

echo "응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ 로그인 성공!"
    
    if echo "$RESPONSE" | grep -q '"isSuperAdmin":true'; then
        echo "✅ 슈퍼어드민 플래그 확인됨!"
        echo ""
        echo "📋 사용자 정보:"
        echo "$RESPONSE" | jq -r '.user' 2>/dev/null
    else
        echo "⚠️  슈퍼어드민 플래그가 없습니다"
    fi
else
    echo "❌ 로그인 실패"
    echo ""
    echo "에러 메시지:"
    echo "$RESPONSE" | jq -r '.error // .message // "알 수 없는 오류"' 2>/dev/null
fi

echo ""
echo "========================================="
echo ""

# 다른 비밀번호로도 시도 (빈 비밀번호 또는 다른 일반 비밀번호)
echo "📱 추가 테스트: 다양한 비밀번호"
echo ""

for pwd in "" "1234" "password" "admin"; do
    echo "비밀번호: '$pwd'"
    
    TEST_DATA="{\"action\": \"loginCompany\", \"phone\": \"01063529091\", \"password\": \"$pwd\"}"
    
    TEST_RESPONSE=$(curl -sL -X POST \
      -H "Content-Type: application/json" \
      -d "$TEST_DATA" \
      "$API_URL")
    
    if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
        echo "  ✅ 성공!"
        if echo "$TEST_RESPONSE" | grep -q '"isSuperAdmin":true'; then
            echo "  ✅✅ 슈퍼어드민!"
        fi
        break
    else
        echo "  ❌ 실패"
    fi
done

echo ""
echo "========================================="
echo ""
echo "💡 다음 단계:"
echo ""
echo "1. Google Sheets에서 직접 확인:"
echo "   https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc"
echo ""
echo "2. '기업회원' 시트에서 찾기:"
echo "   - G열(전화번호): 01063529091 검색"
echo "   - 해당 행의 I열(비밀번호) 확인"
echo ""
echo "3. '로그' 시트 확인:"
echo "   - 최근 loginCompany 액션"
echo "   - 디버그 정보 확인"
echo ""
echo "4. 계정이 없다면:"
echo "   - https://sagunbok.com에서 기업회원 가입"
echo "   - 전화번호: 010-6352-9091"
echo "   - 가입 후 관리자가 승인 필요"
echo ""
echo "========================================="
