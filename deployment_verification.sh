#!/bin/bash

echo "=========================================="
echo "🎉 v6.2.13 배포 검증 시작"
echo "=========================================="
echo ""

# 1. 웹사이트 접속 확인
echo "1️⃣ 웹사이트 접속 확인..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://3.34.186.174/")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ 웹사이트 정상 접속 (HTTP $HTTP_CODE)"
else
    echo "   ❌ 웹사이트 접속 실패 (HTTP $HTTP_CODE)"
fi
echo ""

# 2. 새 API URL 확인
echo "2️⃣ 새 API URL 확인..."
NEW_API_URL=$(curl -s "http://3.34.186.174/assets/index-C3aa0pzc.js" | grep -o "AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH" | head -1)
if [ -n "$NEW_API_URL" ]; then
    echo "   ✅ 새 API URL 발견: $NEW_API_URL"
else
    echo "   ❌ 새 API URL 없음"
fi
echo ""

# 3. API 응답 테스트
echo "3️⃣ API 응답 테스트..."
API_RESPONSE=$(curl -s "https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec?action=getAllMembers&_t=$(date +%s)")

echo "$API_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('   ✅ API 응답 성공')
        members = data.get('members', [])
        print(f'   📊 전체 회원: {len(members)}명')
        
        if members:
            first = members[0]
            if 'userType' in first:
                print('   ✅ userType 필드 존재 (v6.2.13)')
            else:
                print('   ❌ userType 필드 없음 (구버전)')
            
            if 'approvalStatus' in first:
                print('   ✅ approvalStatus 필드 존재 (v6.2.13)')
            else:
                print('   ❌ approvalStatus 필드 없음 (구버전)')
            
            # 유형별 통계
            company = sum(1 for m in members if m.get('userType') == 'company')
            manager = sum(1 for m in members if m.get('userType') == 'manager')
            consultant = sum(1 for m in members if m.get('userType') == 'consultant')
            
            print(f'   📋 기업회원: {company}명 | 매니저: {manager}명 | 컨설턴트: {consultant}명')
    else:
        print('   ❌ API 응답 실패')
        print(f'   오류: {data}')
except Exception as e:
    print(f'   ❌ JSON 파싱 실패: {e}')
    sys.exit(1)
"

echo ""
echo "=========================================="
echo "✅ 배포 검증 완료!"
echo "=========================================="
echo ""
echo "🌐 테스트 URL: http://3.34.186.174/"
echo ""
echo "🔐 테스트 계정:"
echo "   슈퍼 관리자: 01063529091 / (기존 비밀번호)"
echo "   매니저: 01063529091 / 12345"
echo "   컨설턴트: 01063529091 / 12345"
echo ""
echo "⚠️  브라우저 캐시를 완전히 삭제한 후 테스트하세요!"
echo "   Chrome: Ctrl + Shift + Delete"
echo "   또는 시크릿 모드 사용"
echo ""
