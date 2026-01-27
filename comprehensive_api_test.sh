#!/bin/bash

# v6.2.12 최종 배포 검증 스크립트
API_URL="https://script.google.com/macros/s/AKfycbzeunTWd_3je-kVRzz9ZgDe4NLkz1WSG2oeut8h8b4ZUiKrCiCx-cYmPCi5ioOBZmmH/exec"

echo "============================================"
echo "🚀 v6.2.12 배포 검증 시작"
echo "============================================"
echo ""

# 1. 전체 회원 조회 및 데이터 구조 검증
echo "📋 테스트 1: 전체 회원 조회 및 v6.2.12 구조 검증"
echo "----------------------------------------"
response=$(curl -s "${API_URL}?action=getAllMembers&_t=$(date +%s)")
echo "$response" > /tmp/test_members_v6212.json

echo "응답 저장: /tmp/test_members_v6212.json"
echo ""

# 데이터 구조 검증
echo "🔍 데이터 구조 검증 중..."
python3 << 'PYCODE'
import json

with open('/tmp/test_members_v6212.json', 'r') as f:
    data = json.load(f)

if not data.get('success'):
    print("❌ API 호출 실패:", data.get('error'))
    exit(1)

members = data.get('members', [])
print(f"✅ 전체 회원 수: {len(members)}")

if len(members) > 0:
    first_member = members[0]
    print("\n첫 번째 회원 데이터 구조:")
    for key in sorted(first_member.keys()):
        print(f"  - {key}: {first_member[key]}")
    
    # v6.2.12 필드 검증
    print("\n📊 v6.2.12 필드 검증:")
    has_userType = 'userType' in first_member
    has_approvalStatus = 'approvalStatus' in first_member
    has_old_type = 'type' in first_member
    has_old_status = 'status' in first_member
    
    if has_userType:
        print("✅ userType 필드 존재 (v6.2.12)")
    elif has_old_type:
        print("❌ type 필드 존재 (구버전) - 재배포 필요!")
    
    if has_approvalStatus:
        print("✅ approvalStatus 필드 존재 (v6.2.12)")
    elif has_old_status:
        print("❌ status 필드 존재 (구버전) - 재배포 필요!")
    
    if has_userType and has_approvalStatus:
        print("\n🎉 v6.2.12 배포 성공!")
    else:
        print("\n❌ 구버전이 배포되어 있습니다. 재배포가 필요합니다.")
        exit(1)
    
    # 매니저와 컨설턴트 추출
    managers = [m for m in members if m.get('userType') == 'manager' and m.get('approvalStatus') == '승인']
    consultants = [m for m in members if m.get('userType') == 'consultant' and m.get('approvalStatus') == '승인']
    
    print(f"\n📊 회원 통계:")
    print(f"  - 승인된 매니저: {len(managers)}")
    print(f"  - 승인된 컨설턴트: {len(consultants)}")
    
    # 테스트용 매니저/컨설턴트 저장
    if managers:
        with open('/tmp/test_manager_v6212.json', 'w') as f:
            json.dump(managers[0], f, ensure_ascii=False, indent=2)
        print(f"✅ 테스트용 매니저 저장: {managers[0]['name']}")
    
    if consultants:
        with open('/tmp/test_consultant_v6212.json', 'w') as f:
            json.dump(consultants[0], f, ensure_ascii=False, indent=2)
        print(f"✅ 테스트용 컨설턴트 저장: {consultants[0]['name']}")

PYCODE

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ v6.2.12 배포 검증 실패!"
    exit 1
fi

echo ""
echo "============================================"
echo "✅ v6.2.12 배포 검증 완료!"
echo "============================================"
