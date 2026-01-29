#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec"

echo "========================================="
echo "🧪 기업회원 로그인 API 직접 테스트"
echo "========================================="
echo ""

# 테스트 1: GET 방식
echo "1️⃣ GET 방식 테스트"
echo "URL: ${API_URL}?action=loginCompany&phone=01063529091&password=12345"
echo ""

RESPONSE=$(curl -sL "${API_URL}?action=loginCompany&phone=01063529091&password=12345&_t=$(date +%s)")

echo "응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ GET 방식 성공"
    
    if echo "$RESPONSE" | grep -q '"isSuperAdmin":true'; then
        echo "✅ isSuperAdmin 플래그 있음"
    else
        echo "⚠️ isSuperAdmin 플래그 없음"
    fi
else
    echo "❌ GET 방식 실패"
fi

echo ""
echo "========================================="
echo ""

# 테스트 2: 다른 전화번호 형식
echo "2️⃣ 하이픈 포함 전화번호 테스트"
echo "URL: ${API_URL}?action=loginCompany&phone=010-6352-9091&password=12345"
echo ""

RESPONSE2=$(curl -sL "${API_URL}?action=loginCompany&phone=010-6352-9091&password=12345&_t=$(date +%s)")

echo "응답:"
echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
echo ""

if echo "$RESPONSE2" | grep -q '"success":true'; then
    echo "✅ 하이픈 포함 형식 성공"
else
    echo "❌ 하이픈 포함 형식 실패"
fi

echo ""
echo "========================================="
echo ""

# 프런트엔드에서 사용하는 방식 시뮬레이션
echo "3️⃣ 프런트엔드 방식 시뮬레이션"
echo "normalizePhoneNumber('010-6352-9091') -> '01063529091'"
echo "callAPI('loginCompany', {phone: '01063529091', password: '12345'})"
echo ""

# URLSearchParams 방식 (프런트엔드와 동일)
PARAMS="action=loginCompany&phone=01063529091&password=12345&_t=$(date +%s)"
echo "실제 요청: ${API_URL}?${PARAMS}"
echo ""

RESPONSE3=$(curl -sL "${API_URL}?${PARAMS}")

echo "응답:"
echo "$RESPONSE3" | jq '.' 2>/dev/null || echo "$RESPONSE3"
echo ""

if echo "$RESPONSE3" | grep -q '"success":true'; then
    echo "✅ 프런트엔드 방식 성공"
    
    # userData 추출
    echo ""
    echo "📋 사용자 정보:"
    echo "$RESPONSE3" | jq -r '.userData // .user' 2>/dev/null
else
    echo "❌ 프런트엔드 방식 실패"
    echo ""
    echo "에러 메시지:"
    echo "$RESPONSE3" | jq -r '.error // .message // "알 수 없는 오류"' 2>/dev/null
fi

echo ""
echo "========================================="
