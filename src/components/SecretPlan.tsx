import React, { useState, useMemo } from 'react';

interface SecretPlanProps {
  currentUser?: any;
}

const SecretPlan: React.FC<SecretPlanProps> = ({ currentUser }) => {
  const [checkedItems, setCheckedItems] = useState<boolean[]>([false, false, false, false, false]);

  // 체크박스 토글
  const toggleCheck = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  // 체크된 개수
  const checkedCount = checkedItems.filter(x => x).length;
  const isHighRisk = checkedCount >= 2;

  // 담당자 정보 결정 로직
  const consultantInfo = useMemo(() => {
    // 1. 현재 로그인한 사용자가 매니저/컨설턴트인 경우 → 본인 정보
    if (currentUser?.userType === 'manager' || currentUser?.userType === 'consultant') {
      return {
        name: currentUser.name || '담당자',
        position: currentUser.position || '담당자',
        phone: currentUser.phone || '010-0000-0000',
        type: currentUser.userType === 'manager' ? '사근복매니저' : '사근복컨설턴트'
      };
    }

    // 2. 기업회원인 경우 → 추천인 정보 (임시: 로컬스토리지에서 조회 시뮬레이션)
    if (currentUser?.userType === 'company' && currentUser?.referrer) {
      // 실제로는 API 호출로 추천인 정보를 가져와야 함
      // 여기서는 기본값 반환
      return {
        name: currentUser.referrer || '이종근',
        position: '단장',
        phone: '010-6352-9091',
        type: '사근복컨설턴트'
      };
    }

    // 3. 기본 담당자 (슈퍼관리자)
    return {
      name: '이종근',
      position: '단장',
      phone: '010-6352-9091',
      type: '사근복컨설턴트'
    };
  }, [currentUser]);

  const checklistItems = [
    { id: 1, text: '유보금(잉여금)이 계속 쌓인다', icon: '💰' },
    { id: 2, text: '가지급금이 정리되지 않는다', icon: '📊' },
    { id: 3, text: '자사주/차명주식 이슈가 있다', icon: '📈' },
    { id: 4, text: '가업승계를 \'언젠가\' 해야 한다', icon: '👨‍👩‍👧‍👦' },
    { id: 5, text: '통상임금/노무 리스크가 불안하다', icon: '⚠️' }
  ];

  const plans = [
    {
      title: '미처분이익잉여금 SECRET PLAN',
      desc: '• 법인 잉여금 합법적 현금화 플랜\n• 쌓일수록 주식가치↑ → 증여·상속세 폭증',
      icon: '📈',
      color: 'from-purple-600 to-purple-800'
    },
    {
      title: '가지급금 SECRET PLAN',
      desc: '• 가지급금 합법적 해결 플랜\n• 인정이자·상여처분 → 세무조사 트리거',
      icon: '💳',
      color: 'from-red-600 to-red-800'
    },
    {
      title: '가업승계 SECRET PLAN',
      desc: '• 합법적 가업승계 플랜\n• 평가방식/타이밍/구조에 따라 세금이 갈림',
      icon: '👑',
      color: 'from-blue-600 to-blue-800'
    },
    {
      title: '절세 SECRET PLAN',
      desc: '• 법인세 대표종소세 절감 + 복지적금 설계로 리스크를 \'비용\'으로 전환',
      icon: '🎯',
      color: 'from-green-600 to-green-800'
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🔐 SECRET PLAN Hero Section */}
      <div className="relative overflow-hidden rounded-[56px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 lg:p-11 shadow-2xl border-4 border-slate-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-40"></div>
        <div className="absolute inset-0 bg-grid-white/5"></div>

        {/* Secret Badge */}
        <div className="relative mb-8 flex justify-center">
          <div className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg">
            <span className="text-3xl">🔐</span>
            <span className="text-xl font-black text-white uppercase tracking-widest">SECRET PLAN</span>
          </div>
        </div>

        {/* Main Title */}
        <div className="relative text-center space-y-6">
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            사내근로복지기금과 수익형 직원 복지를 활용한
          </h1>
          <h2 className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent tracking-tight" style={{textShadow: '0 0 40px rgba(251, 191, 36, 0.5), 0 0 20px rgba(251, 191, 36, 0.3)'}}>
            기업과 CEO를 위한 SECRET PLAN
          </h2>

          {/* Key Message */}
          <div className="mt-6 p-6 bg-black/30 backdrop-blur-md rounded-3xl border-2 border-white/10">
            <p className="text-2xl lg:text-3xl font-black text-amber-300 mb-4">
              대표님, <span className="text-white">"절세"</span>는 계산이 아니라 <span className="text-white">"구조"</span>입니다.
            </p>
            <p className="text-xl lg:text-2xl font-bold text-slate-300 mb-3">
              사내근로복지기금은 기업과 대표님 <span className="text-amber-400 font-black">'절세'</span>의 필수 <span className="text-amber-400 font-black">'구조'</span>입니다.
            </p>
            <p className="text-xl lg:text-2xl font-bold text-slate-300">
              잉여금·가지급금·증여세 등…<br />
              합법적으로 절세하고, 개인화하는 설계, <span className="text-amber-400 font-black">SECRET PLAN</span>
            </p>
          </div>
        </div>
      </div>

      {/* 📋 Checklist Section */}
      <div className="relative overflow-hidden rounded-[56px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border-4 border-slate-600 p-10 lg:p-14 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-600/20 via-transparent to-transparent opacity-40"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-4">
            <h3 className="text-5xl lg:text-6xl font-black text-white">SECRET PLAN 체크리스트</h3>
            <p className="text-3xl lg:text-4xl font-bold text-amber-400">
              2개 이상이면 '<span className="text-red-400">돈이 새고 있을 확률</span>'이 <span className="text-red-400 text-5xl">큽니다.</span>
            </p>
          </div>

          {/* Interactive Checklist */}
          <div className="space-y-6">
            {checklistItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => toggleCheck(idx)}
                className={`w-full p-8 rounded-3xl border-4 transition-all duration-300 text-left ${
                  checkedItems[idx]
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 border-red-400 shadow-2xl scale-[1.02]'
                    : 'bg-slate-900/50 border-slate-500 hover:border-amber-500 hover:shadow-xl hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg border-3 flex items-center justify-center transition-all ${
                    checkedItems[idx]
                      ? 'bg-white border-white'
                      : 'bg-slate-700 border-slate-500'
                  }`}>
                    {checkedItems[idx] && <span className="text-red-600 text-4xl font-black">✓</span>}
                  </div>
                  <span className="text-5xl">{item.icon}</span>
                  <span className={`text-3xl font-black flex-1 ${
                    checkedItems[idx] ? 'text-white' : 'text-slate-200'
                  }`}>
                    {item.text}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Risk Alert */}
          {checkedCount > 0 && (
            <div className={`p-10 rounded-3xl border-4 animate-in slide-in-from-bottom-4 ${
              isHighRisk
                ? 'bg-gradient-to-r from-red-600 to-orange-600 border-red-400'
                : 'bg-gradient-to-r from-yellow-600 to-amber-600 border-yellow-400'
            }`}>
              <div className="flex items-center gap-6">
                <span className="text-7xl">{isHighRisk ? '🚨' : '⚠️'}</span>
                <div>
                  <div className="text-4xl font-black text-white mb-3">
                    체크 항목: <span className="text-amber-300">{checkedCount}개</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {isHighRisk
                      ? '→ 즉시 SECRET PLAN 컨설팅이 필요합니다!'
                      : '→ SECRET PLAN으로 사전 점검을 권장합니다.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🎯 4-PLAN Section */}
      <div className="relative overflow-hidden rounded-[56px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-4 border-slate-700 p-10 lg:p-14 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent opacity-40"></div>
        
        <div className="relative z-10 space-y-10">
          <div className="text-center space-y-4">
            <h3 className="text-5xl lg:text-6xl font-black text-white mb-4">SECRET PLAN 무료 컨설팅</h3>
            <p className="text-3xl lg:text-4xl font-bold text-amber-400">
              4가지 핵심 플랜으로 세금 리스크를 비용으로 전환
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden rounded-[40px] bg-gradient-to-br ${plan.color} p-12 shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white/10`}
              >
                <div className="relative z-10 space-y-6">
                  <div className="text-7xl mb-6">{plan.icon}</div>
                  <h4 className="text-3xl lg:text-4xl font-black text-white">{plan.title}</h4>
                  <p className="text-2xl font-bold text-white/95 leading-relaxed text-left whitespace-pre-line">{plan.desc}</p>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🎯 CTA Section - 담당자 정보 */}
      <div className="relative overflow-hidden rounded-[56px] bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 p-10 lg:p-14 shadow-2xl border-4 border-green-400">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/30 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-grid-white/10"></div>

        <div className="relative z-10 space-y-10">
          {/* Checkmark Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-4 px-10 py-5 bg-white rounded-full shadow-2xl border-4 border-green-300">
              <span className="text-5xl">✅</span>
              <span className="text-3xl font-black text-slate-900">무료·비공개 · 대표 단독 컨설팅 신청하기</span>
            </div>
          </div>

          {/* Consultant Info Card */}
          <div className="bg-slate-900/95 backdrop-blur-md rounded-[40px] border-4 border-green-400 p-12 lg:p-16 shadow-2xl">
            <div className="text-center space-y-10">
              <div className="space-y-6">
                
                {/* Type Badge */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full border-2 border-blue-400">
                    <span className="text-3xl">👔</span>
                    <span className="text-2xl font-black text-white">{consultantInfo.type}</span>
                  </div>
                </div>

                {/* Name & Position */}
                <div className="space-y-3">
                  <div className="text-6xl lg:text-7xl font-black text-white">
                    {consultantInfo.name} {consultantInfo.position}
                  </div>
                </div>

                {/* Phone Number - BIG */}
                <div className="mt-10 p-10 bg-gradient-to-r from-slate-800 to-slate-700 rounded-3xl border-4 border-green-400">
                  <a
                    href={`tel:${consultantInfo.phone.replace(/-/g, '')}`}
                    className="text-6xl lg:text-7xl font-black text-white hover:text-green-300 transition-colors block"
                  >
                    {consultantInfo.phone}
                  </a>
                </div>

                {/* Call to Action */}
                <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center">
                  <a
                    href={`tel:${consultantInfo.phone.replace(/-/g, '')}`}
                    className="px-12 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-2xl font-black rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-2xl border-2 border-blue-400"
                  >
                    📞 전화 상담 신청
                  </a>
                  <a
                    href={`sms:${consultantInfo.phone.replace(/-/g, '')}?body=안녕하세요. SECRET PLAN 무료 컨설팅을 신청합니다.`}
                    className="px-12 py-6 bg-gradient-to-r from-green-600 to-green-700 text-white text-2xl font-black rounded-2xl hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-2xl border-2 border-green-400"
                  >
                    💬 문자 상담 신청
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="text-center">
            <p className="text-4xl font-bold text-white">
              ※ 비공개 1:1 컨설팅으로 진행됩니다. 모든 정보는 비밀 보장됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 📌 Bottom Disclaimer */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl border-4 border-green-400 p-10 text-center shadow-2xl">
        <p className="text-3xl font-bold text-white leading-relaxed">
          ※ SECRET PLAN은 세무·법무·노무 전문가 협업 구조로 설계됩니다.<br />
          실제 실행 전에는 반드시 전문가 검토를 거칩니다.
        </p>
      </div>
    </div>
  );
};

export default SecretPlan;
