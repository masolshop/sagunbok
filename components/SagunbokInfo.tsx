import React from 'react';

const SagunbokInfo: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="mb-12">
        <div className="inline-block px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/30 mb-4">
          <span className="text-blue-600 font-bold text-sm">📚 사내근로복지기금이란?</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">
          사내근로복지기금 완벽 가이드
        </h1>
        <p className="text-lg text-gray-600">
          기업과 근로자 모두에게 이익이 되는 복지제도에 대해 알아보세요
        </p>
      </div>

      {/* 주요 내용 */}
      <div className="space-y-8">
        {/* 섹션 1: 개요 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">1</span>
            사내근로복지기금이란?
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
            <p>
              <strong className="text-blue-600">사내근로복지기금</strong>은 기업이 근로자의 복지 증진을 위해 
              설립·운영하는 법정 복지제도입니다.
            </p>
            <p>
              「근로복지기본법」에 근거하여 운영되며, 기업의 자발적 출연금으로 조성된 기금을 
              근로자의 생활 안정, 주거 지원, 의료비 지원, 학자금 지원 등 다양한 복지 사업에 활용합니다.
            </p>
          </div>
        </div>

        {/* 섹션 2: 주요 특징 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">2</span>
            주요 특징
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border-2 border-blue-200">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">세제 혜택</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                기업 출연금은 손비 인정(법인세 절감), 근로자 수령액은 비과세 혜택 적용
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border-2 border-green-200">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">독립 법인</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                회사와 별도의 독립된 법인으로 운영, 전문적이고 투명한 복지 사업 수행
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">근로자 참여</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                이사회 구성 시 근로자 대표 참여, 민주적이고 투명한 기금 운영
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 border-2 border-orange-200">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">다양한 복지</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                생활안정자금, 주택자금, 의료비, 학자금, 경조사비 등 맞춤형 복지 제공
              </p>
            </div>
          </div>
        </div>

        {/* 섹션 3: 설립 요건 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">3</span>
            설립 요건
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">근로자 수</h4>
                <p className="text-gray-700 text-sm">상시 근로자 10인 이상 기업 (권장사항)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">출연금</h4>
                <p className="text-gray-700 text-sm">기업의 자발적 출연금으로 기금 조성 (법정 최소 금액 없음)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">법인 설립</h4>
                <p className="text-gray-700 text-sm">고용노동부 인가를 받아 독립 법인으로 설립</p>
              </div>
            </div>
          </div>
        </div>

        {/* 섹션 4: 운영 사업 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white">4</span>
            주요 복지 사업
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '🏠', title: '주거 지원', desc: '주택자금 대여, 전월세 지원' },
              { icon: '💊', title: '의료 지원', desc: '의료비 보조, 건강검진 지원' },
              { icon: '📚', title: '교육 지원', desc: '학자금 대여, 자녀 장학금' },
              { icon: '💰', title: '생활 안정', desc: '긴급생활자금, 경조사비' },
              { icon: '🎯', title: '자산 형성', desc: '재형저축, 우리사주 지원' },
              { icon: '🎉', title: '여가 문화', desc: '문화생활 지원, 체육활동' }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-gray-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-8 text-white text-center">
          <h3 className="text-2xl font-black mb-3">사내근로복지기금 설립을 고민 중이신가요?</h3>
          <p className="text-blue-100 mb-6">
            전문 컨설턴트가 귀사의 상황에 맞는 최적의 복지제도 설계를 도와드립니다
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
            무료 상담 신청하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SagunbokInfo;
