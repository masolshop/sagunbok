import React from 'react';

const SagunbokTaxSavings: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="mb-12">
        <div className="inline-block px-4 py-2 bg-green-500/10 rounded-full border border-green-500/30 mb-4">
          <span className="text-green-600 font-bold text-sm">💰 세금 절감 효과</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">
          사근복 절세 가이드
        </h1>
        <p className="text-lg text-gray-600">
          기업과 근로자 모두에게 제공되는 세제 혜택을 확인해보세요
        </p>
      </div>

      {/* 주요 내용 */}
      <div className="space-y-8">
        {/* 섹션 1: 기업 세제 혜택 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-2xl">🏢</span>
            <h2 className="text-2xl font-black text-gray-900">기업 세제 혜택</h2>
          </div>
          
          <div className="space-y-6">
            {/* 법인세 절감 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-600">①</span> 법인세 절감
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">기금 출연금 손비 인정</p>
                    <p className="text-sm text-gray-600 mt-1">
                      사내근로복지기금 출연금은 <strong>100% 손금 인정</strong>되어 법인세 과세표준 감소
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">출연 한도</p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>전년도 법인세의 50% 한도</strong>로 출연 가능 (복리후생비로 손금 처리)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 계산 예시 */}
              <div className="mt-6 bg-white rounded-xl p-5 border border-blue-300">
                <p className="text-sm font-bold text-blue-900 mb-3">💡 절세 효과 예시</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">전년도 법인세 납부액:</span>
                    <span className="font-bold">100,000,000원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">기금 출연액 (50% 한도):</span>
                    <span className="font-bold text-blue-600">50,000,000원</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">법인세 절감액 (세율 19%):</span>
                    <span className="font-bold text-green-600 text-lg">약 9,500,000원 ↓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">지방소득세 절감액:</span>
                    <span className="font-bold text-green-600">약 950,000원 ↓</span>
                  </div>
                  <div className="flex justify-between border-t-2 pt-2 border-green-300 bg-green-50 -mx-5 px-5 py-2 rounded-b-lg">
                    <span className="font-bold text-gray-900">총 절세액:</span>
                    <span className="font-black text-green-600 text-xl">약 10,450,000원 ↓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 추가 절세 효과 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border-2 border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-purple-600">②</span> 추가 절세 효과
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="font-semibold text-gray-900 mb-2">💰 복리후생비 증가</p>
                  <p className="text-sm text-gray-600">
                    직접 복리후생비 지출 대신 기금 출연으로 세제 혜택 극대화
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="font-semibold text-gray-900 mb-2">📊 과세 이연 효과</p>
                  <p className="text-sm text-gray-600">
                    출연 시점에 손금 인정, 실제 복지 지출은 시간 분산
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 섹션 2: 근로자 세제 혜택 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl">👥</span>
            <h2 className="text-2xl font-black text-gray-900">근로자 세제 혜택</h2>
          </div>
          
          <div className="space-y-6">
            {/* 비과세 혜택 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-green-600">①</span> 비과세 혜택
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">소득세 비과세</p>
                    <p className="text-sm text-gray-600 mt-1">
                      기금으로부터 받는 <strong>복지 혜택은 근로소득세 과세 대상 제외</strong>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">4대보험 제외</p>
                    <p className="text-sm text-gray-600 mt-1">
                      복지 수혜액은 4대보험료 산정 기준에서 제외
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 실질 소득 증대 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 border-2 border-orange-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-orange-600">②</span> 실질 소득 증대 효과
              </h3>
              
              {/* 비교 표 */}
              <div className="bg-white rounded-xl overflow-hidden border border-orange-300">
                <div className="grid grid-cols-3 bg-orange-100 text-sm font-bold text-gray-900">
                  <div className="p-3 border-r border-orange-300">구분</div>
                  <div className="p-3 border-r border-orange-300">급여 인상</div>
                  <div className="p-3">기금 복지</div>
                </div>
                <div className="grid grid-cols-3 text-sm">
                  <div className="p-3 border-r border-gray-200 bg-gray-50 font-semibold">명목 금액</div>
                  <div className="p-3 border-r border-gray-200">100만원</div>
                  <div className="p-3">100만원</div>
                </div>
                <div className="grid grid-cols-3 text-sm">
                  <div className="p-3 border-r border-gray-200 bg-gray-50 font-semibold">소득세 (15%)</div>
                  <div className="p-3 border-r border-gray-200 text-red-600">▼ 150,000원</div>
                  <div className="p-3 text-green-600">면제</div>
                </div>
                <div className="grid grid-cols-3 text-sm">
                  <div className="p-3 border-r border-gray-200 bg-gray-50 font-semibold">4대보험 (약 9%)</div>
                  <div className="p-3 border-r border-gray-200 text-red-600">▼ 90,000원</div>
                  <div className="p-3 text-green-600">면제</div>
                </div>
                <div className="grid grid-cols-3 text-sm bg-orange-50 font-bold border-t-2 border-orange-300">
                  <div className="p-3 border-r border-orange-300">실수령액</div>
                  <div className="p-3 border-r border-orange-300">760,000원</div>
                  <div className="p-3 text-green-600">1,000,000원 ✨</div>
                </div>
              </div>
              
              <p className="text-sm text-orange-900 mt-4 font-semibold text-center">
                💡 동일 금액 대비 <strong className="text-orange-600">약 24만원(31%) 더 많은</strong> 실수령액!
              </p>
            </div>
          </div>
        </div>

        {/* 섹션 3: 절세 시뮬레이션 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white">
          <h2 className="text-2xl font-black mb-6 text-center">🧮 우리 회사 절세액은?</h2>
          <p className="text-blue-100 text-center mb-6">
            사근복 절세 시뮬레이터로 예상 절감액을 바로 확인하세요
          </p>
          <div className="flex justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
              절세 시뮬레이션 시작하기 →
            </button>
          </div>
        </div>

        {/* 추가 혜택 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">기타 부가 혜택</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-gray-900 mb-2">기업 이미지 제고</h3>
              <p className="text-sm text-gray-600">복지 중심 기업으로 인식, 인재 유치 유리</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
              <div className="text-4xl mb-3">💪</div>
              <h3 className="font-bold text-gray-900 mb-2">직원 충성도 향상</h3>
              <p className="text-sm text-gray-600">실질적 복지 제공으로 직원 만족도 상승</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-bold text-gray-900 mb-2">노사 관계 개선</h3>
              <p className="text-sm text-gray-600">투명한 복지 운영으로 신뢰 구축</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SagunbokTaxSavings;
