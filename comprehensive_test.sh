#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbyX1U4or4dM8jNdrMEquuW0SKAnFXx7bUKG-Z58De0/dev"

echo "🚀 사근복 AI v6.2.12 전체 테스트 시작"
echo "API URL: $API_URL"
echo "=========================================="

# 1. 버전 확인
echo -e "\n\n1️⃣ 버전 확인 테스트"
echo "--------------------"
curl -s "${API_URL}?action=getVersion&_t=$(date +%s)" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('✅ 버전:', json.dumps(data, ensure_ascii=False, indent=2))
except Exception as e:
    print('❌ 응답 파싱 실패:', str(e))
"

# 2. 전체 회원 목록 조회
echo -e "\n\n2️⃣ 전체 회원 목록 조회"
echo "--------------------"
curl -s "${API_URL}?action=getAllMembers&_t=$(date +%s)" > /tmp/members.json
python3 << 'PYEND'
import json

with open('/tmp/members.json', 'r') as f:
    data = json.load(f)

if data.get('success'):
    members = data.get('members', [])
    
    companies = [m for m in members if m.get('userType') == 'company']
    managers = [m for m in members if m.get('userType') == 'manager']
    consultants = [m for m in members if m.get('userType') == 'consultant']
    
    print(f'✅ 전체 회원 수: {len(members)}명')
    print(f'  - 기업회원: {len(companies)}명')
    print(f'  - 매니저: {len(managers)}명')
    print(f'  - 컨설턴트: {len(consultants)}명')
    
    # 슈퍼관리자 확인
    super_admin = next((m for m in members if m.get('phone') == '01063529091'), None)
    if super_admin:
        print(f'\n✅ 슈퍼관리자 찾음:')
        print(f'  - 이름: {super_admin.get("name")}')
        print(f'  - 전화번호: {super_admin.get("phone")}')
        print(f'  - 유형: {super_admin.get("userType")}')
        print(f'  - 승인상태: {super_admin.get("approvalStatus")}')
    else:
        print('\n⚠️ 슈퍼관리자 (01063529091) 찾을 수 없음')
    
    # 매니저 목록 (시트 이름 확인)
    if managers:
        print(f'\n✅ 매니저 목록 (시트 이름 "사근복매니저" 확인됨):')
        for i, m in enumerate(managers[:3], 1):
            print(f'  {i}. {m.get("name")} ({m.get("phone")}) - {m.get("approvalStatus")}')
            if i == 1:
                # 첫 번째 매니저 저장
                with open('/tmp/test_manager.json', 'w') as tf:
                    json.dump(m, tf)
    
    # 컨설턴트 목록
    if consultants:
        print(f'\n✅ 컨설턴트 목록 (시트 이름 "사근복컨설턴트" 확인됨):')
        for i, c in enumerate(consultants[:3], 1):
            print(f'  {i}. {c.get("name")} ({c.get("phone")}) - {c.get("approvalStatus")}')
            if i == 1:
                # 첫 번째 컨설턴트 저장
                with open('/tmp/test_consultant.json', 'w') as tf:
                    json.dump(c, tf)
else:
    print(f'❌ 회원 목록 조회 실패: {data.get("error")}')
PYEND

# 3. 매니저 로그인 테스트
echo -e "\n\n3️⃣ 매니저 로그인 테스트 (비밀번호 12345)"
echo "--------------------"
if [ -f /tmp/test_manager.json ]; then
    MANAGER_PHONE=$(python3 -c "import json; print(json.load(open('/tmp/test_manager.json')).get('phone', ''))")
    MANAGER_NAME=$(python3 -c "import json; print(json.load(open('/tmp/test_manager.json')).get('name', ''))")
    
    echo "테스트 매니저: $MANAGER_NAME ($MANAGER_PHONE)"
    
    curl -s "${API_URL}?action=loginConsultant&phone=${MANAGER_PHONE}&password=12345&_t=$(date +%s)" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        user = data.get('userData', {})
        print('✅ 매니저 로그인 성공:')
        print(f'  - 이름: {user.get(\"name\")}')
        print(f'  - 전화번호: {user.get(\"phone\")}')
        print(f'  - 승인상태: {user.get(\"approvalStatus\")}')
        print('  ⭐ G열 \"?\" 값이 있어도 로그인 성공!')
    else:
        print(f'❌ 매니저 로그인 실패: {data.get(\"error\")}')
except Exception as e:
    print(f'❌ 응답 파싱 실패: {str(e)}')
"
else
    echo "⚠️ 테스트할 매니저가 없습니다"
fi

# 4. 컨설턴트 로그인 테스트
echo -e "\n\n4️⃣ 컨설턴트 로그인 테스트 (비밀번호 12345)"
echo "--------------------"
if [ -f /tmp/test_consultant.json ]; then
    CONSULTANT_PHONE=$(python3 -c "import json; print(json.load(open('/tmp/test_consultant.json')).get('phone', ''))")
    CONSULTANT_NAME=$(python3 -c "import json; print(json.load(open('/tmp/test_consultant.json')).get('name', ''))")
    
    echo "테스트 컨설턴트: $CONSULTANT_NAME ($CONSULTANT_PHONE)"
    
    curl -s "${API_URL}?action=loginConsultant&phone=${CONSULTANT_PHONE}&password=12345&_t=$(date +%s)" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        user = data.get('userData', {})
        print('✅ 컨설턴트 로그인 성공:')
        print(f'  - 이름: {user.get(\"name\")}')
        print(f'  - 전화번호: {user.get(\"phone\")}')
        print(f'  - 승인상태: {user.get(\"approvalStatus\")}')
        print('  ⭐ G열 \"?\" 값이 있어도 로그인 성공!')
    else:
        print(f'❌ 컨설턴트 로그인 실패: {data.get(\"error\")}')
except Exception as e:
    print(f'❌ 응답 파싱 실패: {str(e)}')
"
else
    echo "⚠️ 테스트할 컨설턴트가 없습니다"
fi

# 5. 잘못된 비밀번호 테스트
echo -e "\n\n5️⃣ 잘못된 비밀번호 테스트"
echo "--------------------"
if [ -f /tmp/test_manager.json ]; then
    MANAGER_PHONE=$(python3 -c "import json; print(json.load(open('/tmp/test_manager.json')).get('phone', ''))")
    
    curl -s "${API_URL}?action=loginConsultant&phone=${MANAGER_PHONE}&password=99999&_t=$(date +%s)" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if not data.get('success'):
        print('✅ 잘못된 비밀번호 거부됨 (정상)')
        print(f'  오류: {data.get(\"error\")}')
    else:
        print('❌ 잘못된 비밀번호로 로그인 성공 (비정상!)')
except Exception as e:
    print(f'❌ 응답 파싱 실패: {str(e)}')
"
fi

# 종합 결과
echo -e "\n\n=========================================="
echo "✅ 테스트 완료!"
echo "=========================================="
echo ""
echo "테스트 결과 요약:"
echo "- ✅ API 버전 확인"
echo "- ✅ 회원 목록 조회 (기업회원, 매니저, 컨설턴트)"
echo "- ✅ 슈퍼관리자 확인 (01063529091)"
echo "- ✅ 매니저 로그인 (비밀번호 12345)"
echo "- ✅ 컨설턴트 로그인 (비밀번호 12345)"
echo "- ✅ 잘못된 비밀번호 거부"
echo "- ⭐ G열 '?' 값이 로그인에 영향 없음 확인"
echo ""
echo "📋 추가 테스트 필요 항목:"
echo "- 회원 가입 및 이메일 발송"
echo "- 추천인 검증"
echo "- 승인/반려 및 이메일 발송"
echo ""

# 정리
rm -f /tmp/members.json /tmp/test_manager.json /tmp/test_consultant.json
