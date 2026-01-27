import React from 'react';

interface ConsultantZoneProps {
  currentUser?: any;
}

const ConsultantZone: React.FC<ConsultantZoneProps> = ({ currentUser }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🔐 CONSULTANT ZONE Hero Section */}
      <div className="relative overflow-hidden rounded-[56px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 lg:p-11 shadow-2xl border-4 border-slate-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-40"></div>
        <div className="absolute inset-0 bg-grid-white/5"></div>

        {/* Consultant Badge */}
        <div className="relative mb-8 flex justify-center">
          <div className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-lg">
            <span className="text-3xl">👔</span>
            <span className="text-xl font-black text-white uppercase tracking-widest">CONSULTANT ZONE</span>
          </div>
        </div>

        {/* Main Title */}
        <div className="relative text-center space-y-6">
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            사근복 컨설턴트 전용 페이지
          </h1>
          <h2 className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-400 bg-clip-text text-transparent tracking-tight" style={{textShadow: '0 0 40px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)'}}>
            컨설턴트를 위한 전문 도구
          </h2>

          {/* Welcome Message */}
          <div className="mt-6 p-6 bg-black/30 backdrop-blur-md rounded-3xl border-2 border-white/10">
            <p className="text-2xl lg:text-3xl font-black text-purple-300 mb-4">
              환영합니다, <span className="text-white">{currentUser?.name || '컨설턴트'}</span>님! 👋
            </p>
            <p className="text-xl lg:text-2xl font-bold text-slate-300">
              이곳은 사근복 컨설턴트 전용 공간입니다.<br />
              고객 관리, 영업 도구, 컨설팅 자료 등을 이용하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 📊 Tools Section */}
      <div className="relative overflow-hidden rounded-[56px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border-4 border-slate-600 p-10 lg:p-14 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-600/20 via-transparent to-transparent opacity-40"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-4">
            <h3 className="text-5xl lg:text-6xl font-black text-white">컨설턴트 도구</h3>
            <p className="text-3xl lg:text-4xl font-bold text-purple-400">
              고객 관리 및 영업 지원 도구
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Tool 1 */}
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-purple-600 to-purple-800 p-12 shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white/10">
              <div className="relative z-10 space-y-6">
                <div className="text-7xl mb-6">📋</div>
                <h4 className="text-3xl lg:text-4xl font-black text-white">고객 관리</h4>
                <p className="text-2xl font-bold text-white/95 leading-relaxed">
                  • 고객 정보 관리<br />
                  • 상담 기록 저장<br />
                  • 진행 상황 추적
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
            </div>

            {/* Tool 2 */}
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white/10">
              <div className="relative z-10 space-y-6">
                <div className="text-7xl mb-6">📈</div>
                <h4 className="text-3xl lg:text-4xl font-black text-white">영업 대시보드</h4>
                <p className="text-2xl font-bold text-white/95 leading-relaxed">
                  • 실적 현황<br />
                  • 목표 달성률<br />
                  • 월간/연간 통계
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
            </div>

            {/* Tool 3 */}
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-blue-600 to-blue-800 p-12 shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white/10">
              <div className="relative z-10 space-y-6">
                <div className="text-7xl mb-6">📚</div>
                <h4 className="text-3xl lg:text-4xl font-black text-white">컨설팅 자료</h4>
                <p className="text-2xl font-bold text-white/95 leading-relaxed">
                  • 제안서 템플릿<br />
                  • 사례 연구<br />
                  • 교육 자료
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 Quick Links Section */}
      <div className="relative overflow-hidden rounded-[56px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-4 border-slate-700 p-10 lg:p-14 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-40"></div>
        
        <div className="relative z-10 space-y-10">
          <div className="text-center space-y-4">
            <h3 className="text-5xl lg:text-6xl font-black text-white mb-4">빠른 링크</h3>
            <p className="text-3xl lg:text-4xl font-bold text-purple-400">
              자주 사용하는 기능
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button className="p-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl border-4 border-purple-400 hover:scale-105 transition-all shadow-2xl">
              <div className="flex items-center gap-6">
                <span className="text-6xl">📊</span>
                <div className="text-left">
                  <div className="text-3xl font-black text-white">계산기 열기</div>
                  <div className="text-xl font-bold text-purple-200">고객 시뮬레이션</div>
                </div>
              </div>
            </button>

            <button className="p-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl border-4 border-indigo-400 hover:scale-105 transition-all shadow-2xl">
              <div className="flex items-center gap-6">
                <span className="text-6xl">📞</span>
                <div className="text-left">
                  <div className="text-3xl font-black text-white">고객 연락</div>
                  <div className="text-xl font-bold text-indigo-200">상담 예약 관리</div>
                </div>
              </div>
            </button>

            <button className="p-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl border-4 border-blue-400 hover:scale-105 transition-all shadow-2xl">
              <div className="flex items-center gap-6">
                <span className="text-6xl">📄</span>
                <div className="text-left">
                  <div className="text-3xl font-black text-white">제안서 작성</div>
                  <div className="text-xl font-bold text-blue-200">템플릿 활용</div>
                </div>
              </div>
            </button>

            <button className="p-8 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-3xl border-4 border-cyan-400 hover:scale-105 transition-all shadow-2xl">
              <div className="flex items-center gap-6">
                <span className="text-6xl">📚</span>
                <div className="text-left">
                  <div className="text-3xl font-black text-white">학습 센터</div>
                  <div className="text-xl font-bold text-cyan-200">교육 자료</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 📌 Coming Soon */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 rounded-3xl border-4 border-purple-400 p-10 text-center shadow-2xl">
        <p className="text-3xl font-bold text-white leading-relaxed">
          💡 <span className="font-black">더 많은 기능이 준비 중입니다!</span><br />
          컨설턴트님의 성공적인 영업을 위해 계속 업데이트하겠습니다.
        </p>
      </div>
    </div>
  );
};

export default ConsultantZone;
