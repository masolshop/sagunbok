import React, { useState, useEffect } from 'react';
import AdminView from './components/AdminView';
import AIChat from './components/AIChat';
import APIKeySettings from './components/APIKeySettings';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAPISettings, setShowAPISettings] = useState(false);

  // 로그인 상태 확인 (컴포넌트 마운트 시)
  useEffect(() => {
    const savedUser = localStorage.getItem('sagunbok_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('sagunbok_user');
      }
    }
  }, []);

  // 로그인 성공 핸들러
  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('sagunbok_user', JSON.stringify(user));
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('sagunbok_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* 헤더 */}
      <header className="bg-[#0f2e44] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg transform rotate-3">S</div>
            <div>
              <span className="text-xl font-black tracking-tighter block leading-none">사근복 AI</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Studio v2.5</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 사용자 정보 */}
            <div className="p-3 bg-black/30 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                {currentUser?.userType === 'company' ? '기업회원' : 'Sagunbok 컨설턴트'}
              </div>
              <div className="text-sm font-black text-white">
                {currentUser?.name || '사용자'}
              </div>
              <div className="text-[11px] text-slate-300">
                {currentUser?.userType === 'company' ? currentUser?.companyName : currentUser?.position}
              </div>
            </div>

            <button 
              onClick={() => setShowAPISettings(true)}
              className="py-2 px-4 rounded-xl text-xs font-black transition-all border border-dashed border-slate-700 text-slate-300 hover:border-blue-400 hover:text-blue-400 hover:bg-white/5"
            >
              🔑 API 키 설정
            </button>

            {/* 로그아웃 버튼 */}
            <button 
              onClick={handleLogout}
              className="py-2 px-4 rounded-xl text-xs font-black transition-all bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:border-red-400"
            >
              🚪 로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 p-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl border-4 border-slate-50 p-16 shadow-2xl text-center">
            <h1 className="text-4xl font-black mb-6 text-gray-800">
              🎉 사근복 AI 스튜디오에 오신 것을 환영합니다!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              새로운 계산기 모듈을 업로드해주세요.
            </p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg font-bold text-blue-800">
                계산기 모듈이 삭제되었습니다.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                압축 파일을 업로드하여 새로운 계산기를 추가하세요.
              </p>
            </div>
          </div>

          {/* 관리자 뷰 */}
          <div className="mt-8">
            <AdminView />
          </div>
        </div>
      </main>

      {/* API Key Settings Modal */}
      {showAPISettings && <APIKeySettings onClose={() => setShowAPISettings(false)} />}
    </div>
  );
};

export default App;
