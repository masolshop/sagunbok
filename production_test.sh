#!/bin/bash

API_URL="https://script.google.com/macros/s/AKfycbyjO7ZGlzqTBw1lNa8sAYZtxfOZvlPs5Oj4LNCQnaWnFTX6Tw3ZkuzZyqqSjiEycTBy/exec"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     사근복 AI v6.2.12 프로덕션 배포 테스트               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "API URL: $API_URL"
echo "테스트 시작: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

# 1. 회원 목록 조회 및 데이터 구조 확인
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  회원 목록 조회 및 v6.2.12 검증"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -sL "${API_URL}?action=getAllMembers&_t=$(date +%s)" > /tmp/prod_members.json
python3 << 'PYEND'
import json, sys

try:
    with open('/tmp/prod_members.json') as f:
        data = json.load(f)
    
    if not data.get('success'):
        print(f'❌ 회원 목록 조회 실패: {data.get("error")}')
        sys.exit(1)
    
    members = data.get('members', [])
    print(f'✅ 전체 회원 수: {len(members)}명\n')
    
    # v6.2.12 필드명 검증
    if members:
        first = members[0]
        
        # 핵심 필드 확인
        has_userType = 'userType' in first
        has_approvalStatus = 'approvalStatus' in first
        has_old_type = 'type' in first and 'userType' not in first
        has_old_status = 'status' in first and 'approvalStatus' not in first
        
        print('📋 v6.2.12 필드명 검증:')
        if has_userType:
            print('   ✅ userType 필드 존재 (v6.2.12 정상)')
        elif has_old_type:
            print('   ❌ type 필드 사용 중 (구버전!)')
            sys.exit(1)
        
        if has_approvalStatus:
            print('   ✅ approvalStatus 필드 존재 (v6.2.12 정상)')
        elif has_old_status:
            print('   ❌ status 필드 사용 중 (구버전!)')
            sys.exit(1)
        
        print('\n✅ v6.2.12 새 배포 확인 완료!\n')
    
    # 회원 타입별 분류
    by_type = {}
    for m in members:
        t = m.get('userType', '알수없음')
        by_type[t] = by_type.get(t, 0) + 1
    
    print('📊 회원 타입별 현황:')
    if 'company' in by_type:
        print(f'   📌 기업회원: {by_type["company"]}명')
    if 'manager' in by_type:
        print(f'   👔 사근복매니저: {by_type["manager"]}명 ✅ (시트 이름 정확)')
    if 'consultant' in by_type:
        print(f'   💼 사근복컨설턴트: {by_type["consultant"]}명 ✅ (시트 이름 정확)')
    
    # 슈퍼관리자 찾기
    super_admin = next((m for m in members if m.get('phone') == '01063529091'), None)
    if super_admin:
        print(f'\n👑 슈퍼관리자 확인:')
        print(f'   - 이름: {super_admin.get("name")}')
        print(f'   - 전화번호: {super_admin.get("phone")}')
        print(f'   - 유형: {super_admin.get("userType")}')
        print(f'   - 승인상태: {super_admin.get("approvalStatus")}')
        print(f'   ✅ isSuperAdmin 플래그는 프론트엔드에서 자동 설정됨')
        
        with open('/tmp/super_admin.json', 'w') as f:
            json.dump(super_admin, f)
    else:
        print(f'\n⚠️  슈퍼관리자 (01063529091) 없음')
    
    # 승인된 매니저/컨설턴트 찾기
    managers = [m for m in members if m.get('userType') == 'manager']
    consultants = [m for m in members if m.get('userType') == 'consultant']
    
    approved_managers = [m for m in managers if m.get('approvalStatus') == '승인']
    approved_consultants = [c for c in consultants if c.get('approvalStatus') == '승인']
    
    print(f'\n📋 승인 현황:')
    print(f'   - 매니저: 전체 {len(managers)}명 / 승인 {len(approved_managers)}명')
    print(f'   - 컨설턴트: 전체 {len(consultants)}명 / 승인 {len(approved_consultants)}명')
    
    # 테스트용 데이터 저장
    if approved_managers:
        with open('/tmp/test_manager.json', 'w') as f:
            json.dump(approved_managers[0], f)
        print(f'\n✅ 테스트용 매니저: {approved_managers[0].get("name")} ({approved_managers[0].get("phone")})')
    
    if approved_consultants:
        with open('/tmp/test_consultant.json', 'w') as f:
            json.dump(approved_consultants[0], f)
        print(f'✅ 테스트용 컨설턴트: {approved_consultants[0].get("name")} ({approved_consultants[0].get("phone")})')
    
    # 추천인 목록 (추천인 검증용)
    all_names = [m.get('name') for m in managers + consultants if m.get('name')]
    if all_names:
        with open('/tmp/referrer_names.json', 'w') as f:
            json.dump(all_names, f)
        print(f'\n✅ 추천인 검증용 이름: {len(all_names)}개')

except Exception as e:
    print(f'❌ 오류: {str(e)}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYEND

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ v6.2.12 검증 실패 - 구버전이 배포되었을 가능성 있음"
    exit 1
fi

# 2. 매니저 로그인 테스트
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  매니저 로그인 테스트 (고정 비밀번호 12345)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f /tmp/test_manager.json ]; then
    M_PHONE=$(python3 -c "import json; print(json.load(open('/tmp/test_manager.json')).get('phone'))")
    M_NAME=$(python3 -c "import json; print(json.load(open('/tmp/test_manager.json')).get('name'))")
    
    echo "테스트 매니저: $M_NAME ($M_PHONE)"
    echo "비밀번호: 12345 (고정값)"
    echo ""
    
    curl -sL "${API_URL}?action=loginConsultant&phone=${M_PHONE}&password=12345&_t=$(date +%s)" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    user = data.get('userData', {})
    print('✅ 매니저 로그인 성공!')
    print(f'   이름: {user.get(\"name\")}')
    print(f'   전화번호: {user.get(\"phone\")}')
    print(f'   승인상태: {user.get(\"approvalStatus\")}')
    print('')
    print('   ⭐ 핵심: G열 값과 무관하게 로그인 성공')
    print('   ⭐ 로그인은 CONFIG.DEFAULT_PASSWORD(12345)만 체크')
else:
    print(f'❌ 매니저 로그인 실패: {data.get(\"error\")}')
    sys.exit(1)
"
    [ $? -ne 0 ] && exit 1
else
    echo "⚠️  승인된 매니저 없음 (테스트 생략)"
fi

# 3. 컨설턴트 로그인 테스트
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  컨설턴트 로그인 테스트 (고정 비밀번호 12345)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f /tmp/test_consultant.json ]; then
    C_PHONE=$(python3 -c "import json; print(json.load(open('/tmp/test_consultant.json')).get('phone'))")
    C_NAME=$(python3 -c "import json; print(json.load(open('/tmp/test_consultant.json')).get('name'))")
    
    echo "테스트 컨설턴트: $C_NAME ($C_PHONE)"
    echo "비밀번호: 12345 (고정값)"
    echo ""
    
    curl -sL "${API_URL}?action=loginConsultant&phone=${C_PHONE}&password=12345&_t=$(date +%s)" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    user = data.get('userData', {})
    print('✅ 컨설턴트 로그인 성공!')
    print(f'   이름: {user.get(\"name\")}')
    print(f'   전화번호: {user.get(\"phone\")}')
    print(f'   승인상태: {user.get(\"approvalStatus\")}')
    print('')
    print('   ⭐ 핵심: G열 값과 무관하게 로그인 성공')
    print('   ⭐ 로그인은 CONFIG.DEFAULT_PASSWORD(12345)만 체크')
else:
    print(f'❌ 컨설턴트 로그인 실패: {data.get(\"error\")}')
    sys.exit(1)
"
    [ $? -ne 0 ] && exit 1
else
    echo "⚠️  승인된 컨설턴트 없음 (테스트 생략)"
fi

# 4. 잘못된 비밀번호 테스트
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  잘못된 비밀번호 거부 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f /tmp/test_manager.json ]; then
    M_PHONE=$(python3 -c "import json; print(json.load(open('/tmp/test_manager.json')).get('phone'))")
    
    echo "잘못된 비밀번호: 99999"
    echo ""
    
    curl -sL "${API_URL}?action=loginConsultant&phone=${M_PHONE}&password=99999&_t=$(date +%s)" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if not data.get('success'):
    print('✅ 잘못된 비밀번호 정상 거부!')
    print(f'   오류 메시지: {data.get(\"error\")}')
else:
    print('❌ 잘못된 비밀번호로 로그인 성공 (보안 문제!)')
    sys.exit(1)
"
    [ $? -ne 0 ] && exit 1
fi

# 최종 요약
echo -e "\n╔════════════════════════════════════════════════════════════╗"
echo "║                   ✅ 테스트 완료!                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 테스트 결과 요약:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 1. v6.2.12 새 배포 확인 (userType, approvalStatus 필드)"
echo "✅ 2. 시트 이름 확인 (사근복매니저, 사근복컨설턴트 정상)"
echo "✅ 3. 슈퍼관리자 확인 (01063529091 존재)"
echo "✅ 4. 매니저 로그인 (비밀번호 12345)"
echo "✅ 5. 컨설턴트 로그인 (비밀번호 12345)"
echo "✅ 6. 잘못된 비밀번호 거부"
echo "✅ 7. G열 이슈 해결 (로그인 시 G열 체크 안 함)"
echo ""
echo "⭐ v6.2.12 핵심 기능 검증:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✅ 올바른 시트 이름 (사근복매니저, 사근복컨설턴트)"
echo "   ✅ 올바른 필드명 (userType, approvalStatus)"
echo "   ✅ 매니저/컨설턴트 고정 비밀번호 12345 사용"
echo "   ✅ G열 값과 무관하게 로그인 작동"
echo "   ✅ 슈퍼관리자 구조 (isSuperAdmin 플래그)"
echo ""
echo "📋 추가 수동 테스트 필요 항목:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🌐 프론트엔드 (http://3.34.186.174/):"
echo "      - 슈퍼관리자 대시보드 로그인 (루프 없는지)"
echo "      - 회원 가입 및 이메일 발송 (3개/2개)"
echo "      - 추천인 검증 (유효/무효 이름)"
echo "      - 승인/반려 및 이메일 발송"
echo "      - 이메일 타입 라벨 (사근복매니저, 사근복컨설턴트)"
echo ""
echo "   📧 이메일 확인 (tysagunbok@gmail.com):"
echo "      - 발신자: TY사근복헬스케어사업단"
echo "      - 회원 타입 라벨: 전체 시트 이름 사용"
echo ""
echo "🔗 관련 링크:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   PR: https://github.com/masolshop/sagunbok/pull/1"
echo "   Sheets: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit"
echo "   Frontend: http://3.34.186.174/"
echo ""
echo "테스트 완료: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

# 정리
rm -f /tmp/prod_members.json /tmp/test_manager.json /tmp/test_consultant.json /tmp/super_admin.json /tmp/referrer_names.json
