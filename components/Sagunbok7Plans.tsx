import React from 'react';

const Sagunbok7Plans: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="mb-12">
        <div className="inline-block px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/30 mb-4">
          <span className="text-purple-600 font-bold text-sm">🎯 사근복 활용 전략</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">
          사근복 7대 플랜
        </h1>
        <p className="text-lg text-gray-600">
          기업과 근로자를 위한 7가지 핵심 복지 프로그램
        </p>
      </div>

      {/* 주요 플랜 */}
      <div className="space-y-6">
        {/* 플랜 1: 생활안정자금 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center gap-4">
              <span className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">💰</span>
              <div className="text-white">
                <h2 className="text-2xl font-black mb-1">플랜 1. 생활안정자금 지원</h2>
                <p className="text-blue-100 text-sm">긴급한 생활자금이 필요할 때</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">📋</span> 지원 내용
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>생활비, 의료비, 경조사비 등 긴급 자금 지원</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>저금리 또는 무이자 대여</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>최대 2,000만원까지 지원 (기금 정관에 따라 차등)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">🎯</span> 활용 효과
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900">근로자: 저금리 자금 확보</p>
                    <p className="text-gray-600 text-xs mt-1">시중 대출보다 낮은 금리로 부담 완화</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-gray-900">기업: 직원 생활 안정</p>
                    <p className="text-gray-600 text-xs mt-1">업무 집중도 향상 및 이직률 감소</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 플랜 2: 주택자금 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <div className="flex items-center gap-4">
              <span className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">🏠</span>
              <div className="text-white">
                <h2 className="text-2xl font-black mb-1">플랜 2. 주택자금 지원</h2>
                <p className="text-green-100 text-sm">내 집 마련과 주거 안정을 위한 지원</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-green-600">📋</span> 지원 내용
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>전세자금, 주택구입자금 대여</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>장기 저금리 대출 (연 2~4%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>최대 1억원까지 지원 가능</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-green-600">💡</span> 예시
                </h3>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>전세자금 5,000만원 대여</strong>
                  </p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>기금 금리 (연 3%):</span>
                      <span className="font-semibold">150만원/년</span>
                    </div>
                    <div className="flex justify-between">
                      <span>시중 금리 (연 6%):</span>
                      <span className="text-red-600">300만원/년</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-green-300 font-bold text-green-700">
                      <span>절감 효과:</span>
                      <span>150만원/년 ↓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 플랜 3: 학자금 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
            <div className="flex items-center gap-4">
              <span className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">📚</span>
              <div className="text-white">
                <h2 className="text-2xl font-black mb-1">플랜 3. 학자금 지원</h2>
                <p className="text-purple-100 text-sm">자녀 교육비 부담 경감</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-2">🎓 학자금 대여</h4>
                <p className="text-sm text-gray-700">자녀 대학 등록금, 입학금 무이자 또는 저금리 대여</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-2">🏆 장학금 지급</h4>
                <p className="text-sm text-gray-700">우수 성적 자녀에게 장학금 지급 (비과세)</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-2">📖 교육비 보조</h4>
                <p className="text-sm text-gray-700">학원비, 교재비 등 교육 관련 비용 지원</p>
              </div>
            </div>
          </div>
        </div>

        {/* 플랜 4: 의료비 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
            <div className="flex items-center gap-4">
              <span className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">💊</span>
              <div className="text-white">
                <h2 className="text-2xl font-black mb-1">플랜 4. 의료비 지원</h2>
                <p className="text-red-100 text-sm">건강관리 및 의료비 부담 완화</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <h4 className="font-bold text-gray-900 mb-2">🏥 진료비 지원</h4>
                  <p className="text-sm text-gray-700">본인 및 가족 질병 치료비, 입원비 지원</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <h4 className="font-bold text-gray-900 mb-2">🔬 건강검진</h4>
                  <p className="text-sm text-gray-700">종합건강검진 비용 전액 또는 일부 지원</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <h4 className="font-bold text-gray-900 mb-2">👶 출산지원금</h4>
                  <p className="text-sm text-gray-700">출산 축하금 및 산후조리 비용 지원</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <h4 className="font-bold text-gray-900 mb-2">🦷 치과/안과</h4>
                  <p className="text-sm text-gray-700">치과 치료비, 안경/렌즈 구입비 지원</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 플랜 5: 경조사비 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
            <div className="flex items-center gap-4">
              <span className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">🎉</span>
              <div className="text-white">
                <h2 className="text-2xl font-black mb-1">플랜 5. 경조사비 지원</h2>
                <p className="text-orange-100 text-sm">경조사 시 실질적 도움</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: '💒', title: '결혼', desc: '본인/자녀 결혼 축하금' },
                { icon: '⚰️', title: '상조', desc: '본인/가족 조의금 지원' },
                { icon: '🎂', title: '회갑', desc: '장수 축하금' },
                { icon: '🏆', title: '수상', desc: '각종 수상 격려금' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-orange-50 rounded-xl border border-orange-200 text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 플랜 6: 자산형성 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6">
            <div className="flex items-center gap-4">
              <span className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">💎</span>
              <div className="text-white">
                <h2 className="text-2xl font-black mb-1">플랜 6. 자산형성 지원</h2>
                <p className="text-teal-100 text-sm">장기 재산 형성 지원</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <h4 className="font-bold text-gray-900 mb-2">📈 재형저축</h4>
                <p className="text-sm text-gray-700 mb-2">근로자 재산형성 저축 지원금 지급</p>
                <p className="text-xs text-teal-700 font-semibold">이자소득 비과세 혜택</p>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <h4 className="font-bold text-gray-900 mb-2">🎯 우리사주</h4>
                <p className="text-sm text-gray-700 mb-2">우리사주조합 출연 및 인수 지원</p>
                <p className="text-xs text-teal-700 font-semibold">자사주 취득 기회 제공</p>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <h4 className="font-bold text-gray-900 mb-2">💰 퇴직연금</h4>
                <p className="text-sm text-gray-700 mb-2">퇴직연금 추가 적립 지원</p>
                <p className="text-xs text-teal-700 font-semibold">노후 준비 강화</p>
              </div>
            </div>
          </div>
        </div>

        {/* 플랜 7: 여가문화 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6">
            <div className="flex items-center gap-4">
              <span className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">🎭</span>
              <div className="text-white">
                <h2 className="text-2xl font-black mb-1">플랜 7. 여가·문화 지원</h2>
                <p className="text-pink-100 text-sm">일과 삶의 균형 실현</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>🏖️</span> 휴가비 지원
                  </h4>
                  <p className="text-sm text-gray-700">가족 여행비, 휴양시설 이용료 지원</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>🎬</span> 문화생활
                  </h4>
                  <p className="text-sm text-gray-700">영화, 공연, 전시회 관람권 지원</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>🏃</span> 체육활동
                  </h4>
                  <p className="text-sm text-gray-700">체육시설 이용료, 동호회 활동비 지원</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>📚</span> 자기계발
                  </h4>
                  <p className="text-sm text-gray-700">직무 교육, 자격증 취득 비용 지원</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-3xl p-10 text-white text-center">
          <h2 className="text-3xl font-black mb-4">맞춤형 사근복 7대 플랜 설계</h2>
          <p className="text-indigo-100 mb-6 text-lg">
            귀사의 상황과 근로자 니즈에 맞는 최적의 복지 프로그램을 제안합니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg">
              무료 컨설팅 신청
            </button>
            <button className="px-8 py-4 bg-indigo-400 text-white rounded-xl font-bold hover:bg-indigo-300 transition-colors">
              플랜별 상세 자료 다운로드
            </button>
          </div>
        </div>

        {/* 도입 효과 요약 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">7대 플랜 도입 시 기대효과</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: '📊', title: '법인세 절감', desc: '출연금 손금 인정' },
              { icon: '😊', title: '직원 만족도', desc: '실질 복지 체감' },
              { icon: '🤝', title: '노사 신뢰', desc: '투명한 복지 운영' },
              { icon: '🚀', title: '기업 성장', desc: '우수 인재 유치' }
            ].map((item, idx) => (
              <div key={idx} className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sagunbok7Plans;
