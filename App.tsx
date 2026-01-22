import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  // 로그인 성공 후 대시보드
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 border-4 border-blue-100">
        {/* 로고 */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center font-black text-3xl text-white shadow-lg transform rotate-3">
            S
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900">사근복 AI</h1>
            <p className="text-sm text-blue-600 font-bold uppercase tracking-widest">Studio v2.5</p>
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="mb-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600 font-bold uppercase tracking-widest">
              {currentUser?.userType === 'company' ? '🏢 기업회원' : '👔 Sagunbok 컨설턴트'}
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 mb-2">
            {currentUser?.name || '사용자'}
          </div>
          <div className="text-base text-gray-600">
            {currentUser?.userType === 'company' ? currentUser?.companyName : currentUser?.position}
          </div>
          {currentUser?.phone && (
            <div className="text-sm text-gray-500 mt-2">
              📱 {currentUser.phone}
            </div>
          )}
        </div>

        {/* 성공 메시지 */}
        <div className="mb-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">✅</span>
            <h2 className="text-xl font-bold text-green-800">로그인 성공!</h2>
          </div>
          <p className="text-green-700 leading-relaxed">
            Google Sheets와 연동된 로그인 시스템이 정상적으로 작동하고 있습니다.
          </p>
        </div>

        {/* 시스템 정보 */}
        <div className="mb-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3">🔧 활성화된 기능</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>로그인/회원가입 (추천인 + 기업유형)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Google Sheets 연동</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Google Apps Script 백엔드</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>CORS Proxy 서버</span>
            </li>
          </ul>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleLogout}
          className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          🚪 로그아웃
        </button>

        {/* 푸터 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-2">💾 로그인 데이터는 localStorage에 안전하게 저장됩니다</p>
          <p className="text-xs text-gray-400">🔗 Google Sheets: 승인된 사용자 관리</p>
        </div>
      </div>
    </div>
  );
};

export default App;
