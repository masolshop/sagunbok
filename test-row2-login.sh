#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec"

echo "========================================="
echo "🧪 Row 2 계정 로그인 테스트"
echo "========================================="
echo ""
echo "계정 정보:"
echo "  전화번호: 01063529091"
echo "  비밀번호: 12345"
echo "  승인여부: 승인"
echo ""
echo "로그인 시도 중..."
echo ""

RESPONSE=$(curl -sL "${API_URL}?action=loginCompany&phone=01063529091&password=12345&_t=$(date +%s)")

echo "응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅✅✅ 로그인 성공!"
    echo ""
    
    if echo "$RESPONSE" | grep -q '"isSuperAdmin":true'; then
        echo "🎉 슈퍼어드민 플래그 확인됨!"
        echo ""
        echo "📋 사용자 정보:"
        echo "$RESPONSE" | jq -r '.user // .userData' 2>/dev/null
    else
        echo "⚠️  슈퍼어드민 플래그가 없습니다"
        echo ""
        echo "전체 응답:"
        echo "$RESPONSE" | jq '.'
    fi
else
    echo "❌ 로그인 실패"
    echo ""
    echo "에러:"
    echo "$RESPONSE" | jq -r '.error // .message // "알 수 없는 오류"' 2>/dev/null
fi

echo ""
echo "========================================="
echo ""
echo "💡 다음 단계:"
echo ""
echo "1. 로그인 성공 시:"
echo "   → https://sagunbok.com에서 동일한 계정으로 로그인"
echo "   → 브라우저 F12 → Console에서 isSuperAdmin 확인"
echo ""
echo "2. 슈퍼어드민 확인:"
echo "   → 좌측 메뉴 모든 항목 활성화 여부"
echo "   → 기업절세계산기 접근 가능 여부"
echo ""
echo "========================================="
