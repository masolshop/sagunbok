import React, { useState } from 'react';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register' | 'findId' | 'findPassword';
type UserType = 'company' | 'consultant';

// 🔥 CORS 우회: Vite의 프록시 설정을 통해 localhost:3001로 전달
const PROXY_URL = '/api';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>('company');
  const [loading, setLoading] = useState(false);
  
  // 로그인 폼
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // 기업회원 가입 폼
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('개인사업자'); // 추가: 기업회원분류
  const [referrer, setReferrer] = useState(''); // 추가: 추천인
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState(''); // 복구
  
  // 컨설턴트 가입 폼
  const [consultantName, setConsultantName] = useState('');
  const [consultantPhone, setConsultantPhone] = useState('');
  const [consultantEmail, setConsultantEmail] = useState('');
  const [position, setPosition] = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  const [branchOffice, setBranchOffice] = useState('');
  
  // ID/비밀번호 찾기 폼
  const [findName, setFindName] = useState('');
  const [findEmail, setFindEmail] = useState('');
  const [findPhone, setFindPhone] = useState('');
  
  const callAPI = async (action: string, data: any) => {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
    });
    return response.json();
  };
  
  const handleLogin = async () => {
    if (!loginPhone || !loginPassword) {
      alert('ID(전화번호)와 비밀번호를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      const action = userType === 'company' ? 'loginCompany' : 'loginConsultant';
      const result = await callAPI(action, {
        phone: loginPhone,
        password: loginPassword,
      });
      
      if (result.success) {
        localStorage.setItem('sagunbok_user', JSON.stringify(result.user));
        alert('로그인 성공!');
        onLoginSuccess(result.user);
      } else {
        alert(result.error || '로그인 실패');
      }
    } catch (error) {
      alert('로그인 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegisterCompany = async () => {
    if (!companyName || !companyType || !referrer || !name || !phone || !email || !password || !passwordConfirm) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }
    
    if (password.length < 4) {
      alert('비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }
    
    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await callAPI('registerCompany', {
        companyName,
        companyType,
        referrer,
        name,
        phone,
        email,
        password,
      });
      
      if (result.success) {
        alert(result.message);
        setMode('login');
        setUserType('company');
        // 폼 초기화
        setCompanyName('');
        setCompanyType('개인사업자');
        setReferrer('');
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setPasswordConfirm('');
      } else {
        alert(result.error || '회원가입 실패');
      }
    } catch (error) {
      alert('회원가입 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegisterConsultant = async () => {
    if (!consultantName || !consultantPhone || !consultantEmail || !position) {
      alert('필수 필드를 모두 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await callAPI('registerConsultant', {
        name: consultantName,
        phone: consultantPhone,
        email: consultantEmail,
        position,
        businessUnit,
        branchOffice,
      });
      
      if (result.success) {
        alert(result.message);
        setMode('login');
        setUserType('consultant');
        // 폼 초기화
        setConsultantName('');
        setConsultantPhone('');
        setConsultantEmail('');
        setPosition('');
        setBusinessUnit('');
        setBranchOffice('');
      } else {
        alert(result.error || '회원가입 실패');
      }
    } catch (error) {
      alert('회원가입 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFindId = async () => {
    if (!findName || !findEmail) {
      alert('이름과 이메일을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await callAPI('findUserId', {
        name: findName,
        email: findEmail,
      });
      
      if (result.success) {
        alert(result.message);
        setMode('login');
      } else {
        alert(result.error || 'ID 찾기 실패');
      }
    } catch (error) {
      alert('ID 찾기 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFindPassword = async () => {
    if (!findPhone || !findEmail) {
      alert('전화번호와 이메일을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await callAPI('findPassword', {
        phone: findPhone,
        email: findEmail,
      });
      
      if (result.success) {
        alert(result.message);
        setMode('login');
      } else {
        alert(result.error || '비밀번호 찾기 실패');
      }
    } catch (error) {
      alert('비밀번호 찾기 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 배경 애니메이션 원들 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 relative z-10">
        {/* 헤더 */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white relative overflow-hidden">
          {/* 헤더 배경 패턴 */}
          <div className="absolute inset-0 bg-grid-white/10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-14 h-14 bg-white/95 rounded-2xl flex items-center justify-center font-black text-3xl text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl backdrop-blur-sm">
                S
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">사근복 AI</h1>
                <p className="text-xs text-white/80 font-semibold">Studio v2.5 • Pro Edition</p>
              </div>
            </div>
            <p className="text-sm text-white/90 mt-4 font-medium">
              {mode === 'login' && '💼 로그인하여 시작하세요'}
              {mode === 'register' && '✨ 회원가입'}
              {mode === 'findId' && '🔍 ID 찾기'}
              {mode === 'findPassword' && '🔑 비밀번호 찾기'}
            </p>
          </div>
        </div>

        <div className="p-8 relative">
          {/* 로그인 모드 */}
          {mode === 'login' && (
            <div className="space-y-6">
              {/* 회원 구분 탭 - 모던 디자인 */}
              <div className="flex space-x-3 p-1.5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-inner">
                <button
                  onClick={() => setUserType('company')}
                  className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'company'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`${
                    userType === 'company'
                      ? 'text-blue-600 font-extrabold text-lg'
                      : 'text-gray-500'
                  }`}>
                    🏢 기업회원
                  </span>
                </button>
                <button
                  onClick={() => setUserType('consultant')}
                  className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'consultant'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`${
                    userType === 'consultant'
                      ? 'text-blue-600 font-extrabold text-lg'
                      : 'text-gray-500'
                  }`}>
                    👔 사근복 컨설턴트
                  </span>
                </button>
              </div>

              {/* 로그인 폼 - 모던 디자인 */}
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xl">📱</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="ID (전화번호: 010-1234-5678)"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 group-hover:border-gray-300 font-medium"
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xl">🔒</span>
                  </div>
                  <input
                    type="password"
                    placeholder={userType === 'consultant' ? '비밀번호 (12345)' : '비밀번호'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-12 pr-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 group-hover:border-gray-300 font-medium"
                  />
                </div>
                
                {userType === 'consultant' && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-sm text-amber-900 font-semibold">
                      💡 컨설턴트 비밀번호는 <span className="text-lg font-black text-amber-700">12345</span> 입니다.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>로그인 중...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>로그인</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>

              {/* 하단 링크 - 모던 디자인 */}
              <div className="flex justify-between items-center text-sm pt-2">
                <button
                  onClick={() => setMode('register')}
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center space-x-1 transition-all"
                >
                  <span>✨</span>
                  <span>회원가입</span>
                </button>
                {userType === 'company' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setMode('findId')}
                      className="text-gray-600 hover:text-gray-800 font-medium hover:underline transition-all"
                    >
                      🔍 ID 찾기
                    </button>
                    <button
                      onClick={() => setMode('findPassword')}
                      className="text-gray-600 hover:text-gray-800 font-medium hover:underline transition-all"
                    >
                      🔑 비밀번호 찾기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 회원가입 모드 */}
          {mode === 'register' && (
            <div className="space-y-6">
              {/* 회원 구분 탭 - 모던 디자인 */}
              <div className="flex space-x-3 p-1.5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-inner">
                <button
                  onClick={() => setUserType('company')}
                  className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'company'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`${
                    userType === 'company'
                      ? 'text-blue-600 font-extrabold text-lg'
                      : 'text-gray-500'
                  }`}>
                    🏢 기업회원
                  </span>
                </button>
                <button
                  onClick={() => setUserType('consultant')}
                  className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'consultant'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`${
                    userType === 'consultant'
                      ? 'text-blue-600 font-extrabold text-lg'
                      : 'text-gray-500'
                  }`}>
                    👔 사근복 컨설턴트
                  </span>
                </button>
              </div>

              {/* 기업회원 가입 폼 - 모던 디자인 */}
              {userType === 'company' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="🏢 회사명 *"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  
                  {/* 기업회원분류 선택 */}
                  <div className="relative">
                    <select
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value)}
                      className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium appearance-none cursor-pointer"
                    >
                      <option value="개인사업자">🏪 개인사업자</option>
                      <option value="법인">🏢 법인</option>
                      <option value="병원">🏥 병원</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* 추천인 입력 */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="👔 추천인 (사근복 컨설턴트 이름) *"
                      value={referrer}
                      onChange={(e) => setReferrer(e.target.value)}
                      className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                    />
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
                    <p className="text-xs text-blue-900 font-semibold flex items-center space-x-2">
                      <span>ℹ️</span>
                      <span>추천인은 등록된 사근복 컨설턴트 이름이어야 합니다.</span>
                    </p>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="👤 이름 *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="tel"
                    placeholder="📱 전화번호 (ID로 사용됩니다) *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="email"
                    placeholder="📧 이메일 *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="password"
                    placeholder="🔒 비밀번호 (최소 4자리) *"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="password"
                    placeholder="✅ 비밀번호 확인 *"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <button
                    onClick={handleRegisterCompany}
                    disabled={loading}
                    className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>가입 중...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>회원가입</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                </div>
              )}

              {/* 컨설턴트 가입 폼 - 모던 디자인 */}
              {userType === 'consultant' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="👤 이름 *"
                    value={consultantName}
                    onChange={(e) => setConsultantName(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="tel"
                    placeholder="📱 전화번호 (ID로 사용됩니다) *"
                    value={consultantPhone}
                    onChange={(e) => setConsultantPhone(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="email"
                    placeholder="📧 이메일 *"
                    value={consultantEmail}
                    onChange={(e) => setConsultantEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="text"
                    placeholder="👔 직함 *"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="text"
                    placeholder="🏢 소속 사업단 (선택)"
                    value={businessUnit}
                    onChange={(e) => setBusinessUnit(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="text"
                    placeholder="🏛️ 소속 지사 (선택)"
                    value={branchOffice}
                    onChange={(e) => setBranchOffice(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
                    <p className="font-bold text-amber-900 mb-2 flex items-center space-x-2">
                      <span className="text-2xl">💡</span>
                      <span className="text-lg">안내사항</span>
                    </p>
                    <div className="space-y-1 text-sm text-amber-900">
                      <p>• 컨설턴트 비밀번호는 <span className="font-black text-lg text-amber-700">12345</span>로 고정됩니다.</p>
                      <p>• 가입 승인 후 로그인 시 사용하세요.</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRegisterConsultant}
                    disabled={loading}
                    className="w-full bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>가입 중...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>회원가입</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                </div>
              )}

              <button
                onClick={() => setMode('login')}
                className="w-full text-gray-600 hover:text-gray-800 text-sm font-semibold hover:underline py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
              >
                <span>←</span>
                <span>로그인으로 돌아가기</span>
              </button>
            </div>
          )}

          {/* ID 찾기 모드 - 모던 디자인 */}
          {mode === 'findId' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-blue-900 font-semibold flex items-center space-x-2">
                  <span className="text-xl">🔍</span>
                  <span>가입 시 입력한 이름과 이메일을 입력해주세요.</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xl">👤</span>
                  </div>
                  <input
                    type="text"
                    placeholder="이름"
                    value={findName}
                    onChange={(e) => setFindName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 group-hover:border-gray-300 font-medium"
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xl">📧</span>
                  </div>
                  <input
                    type="email"
                    placeholder="이메일"
                    value={findEmail}
                    onChange={(e) => setFindEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 group-hover:border-gray-300 font-medium"
                  />
                </div>
              </div>
              
              <button
                onClick={handleFindId}
                disabled={loading}
                className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>찾는 중...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>ID 찾기</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              
              <button
                onClick={() => setMode('login')}
                className="w-full text-gray-600 hover:text-gray-800 text-sm font-semibold hover:underline py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
              >
                <span>←</span>
                <span>로그인으로 돌아가기</span>
              </button>
            </div>
          )}

          {/* 비밀번호 찾기 모드 - 모던 디자인 */}
          {mode === 'findPassword' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-amber-900 font-semibold flex items-center space-x-2">
                  <span className="text-xl">🔑</span>
                  <span>가입 시 입력한 전화번호와 이메일을 입력해주세요.</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xl">📱</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="전화번호 (ID)"
                    value={findPhone}
                    onChange={(e) => setFindPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 group-hover:border-gray-300 font-medium"
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xl">📧</span>
                  </div>
                  <input
                    type="email"
                    placeholder="이메일"
                    value={findEmail}
                    onChange={(e) => setFindEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 group-hover:border-gray-300 font-medium"
                  />
                </div>
              </div>
              
              <button
                onClick={handleFindPassword}
                disabled={loading}
                className="w-full bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>찾는 중...</span>
                    </>
                  ) : (
                    <>
                      <span>🔑</span>
                      <span>비밀번호 찾기</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              
              <button
                onClick={() => setMode('login')}
                className="w-full text-gray-600 hover:text-gray-800 text-sm font-semibold hover:underline py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
              >
                <span>←</span>
                <span>로그인으로 돌아가기</span>
              </button>
            </div>
          )}

          {/* 승인 안내 - 모던 디자인 */}
          <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-sm">
            <p className="font-bold text-blue-900 mb-3 flex items-center space-x-2 text-lg">
              <span className="text-2xl">🔒</span>
              <span>승인 안내</span>
            </p>
            <div className="space-y-2 text-sm text-blue-900">
              <p className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>회원가입 후 <span className="font-bold text-blue-700">관리자 승인</span>이 필요합니다.</span>
              </p>
              <p className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>승인 완료 시 <span className="font-bold text-blue-700">로그인</span>이 가능합니다.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
