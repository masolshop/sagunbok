import React, { useState } from 'react';
import { normalizePhoneNumber, formatPhoneForDisplay, isValidPhoneNumber } from '../utils';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register' | 'findId' | 'findPassword';
type UserType = 'company' | 'manager' | 'consultant';

// Apps Script Web App URL (v7.2.1 - doPost 함수 추가, POST 요청 지원)
// 새 배포: 2026-01-29 (v7.2.1 WITH doPost SUPPORT)
const API_URL = 'https://script.google.com/macros/s/AKfycbxreP-TEskpL8DnRUrAYi6YJ9nFWhDHrwwQcAer2UBEZp2zrmQlOtp4OOBqeyHcBdYrXA/exec';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>('company');
  const [loading, setLoading] = useState(false);
  
  // 로그인 폼
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // 기업회원 가입 폼
  const [businessNumber, setBusinessNumber] = useState(''); // 사업자번호
  const [companyName, setCompanyName] = useState('');
  const [ceoName, setCeoName] = useState(''); // 대표자명
  const [companyType, setCompanyType] = useState('개인사업자'); // 추가: 기업회원분류
  const [position, setPosition] = useState(''); // 직함 (대표/재무담당자/기타)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState(''); // 복구
  const [referrer, setReferrer] = useState(''); // 추가: 추천인
  const [lookupLoading, setLookupLoading] = useState(false); // 조회 로딩
  
  // 컨설턴트 가입 폼
  const [consultantName, setConsultantName] = useState('');
  const [consultantPhone, setConsultantPhone] = useState('');
  const [consultantEmail, setConsultantEmail] = useState('');
  const [consultantPassword, setConsultantPassword] = useState('');
  const [consultantPasswordConfirm, setConsultantPasswordConfirm] = useState('');
  const [position, setPosition] = useState('');
  const [region, setRegion] = useState('수도권사업단');
  const [consultantReferrer, setConsultantReferrer] = useState('');
  
  // ID/비밀번호 찾기 폼
  const [findName, setFindName] = useState('');
  const [findEmail, setFindEmail] = useState('');
  const [findPhone, setFindPhone] = useState('');
  
  const callAPI = async (action: string, data: any) => {
    // GET 방식으로 변경 (CORS 우회)
    // 헤더 없이 요청 (preflight 방지)
    const params = new URLSearchParams({
      action,
      ...data,
      _t: Date.now() // 캐시 방지 타임스탬프
    });
    
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: 'GET',
      cache: 'no-cache' // 캐시 사용 안 함
    });
    return response.json();
  };
  
  const handleLogin = async () => {
    if (!loginPhone || !loginPassword) {
      alert('ID(전화번호)와 비밀번호를 입력해주세요.');
      return;
    }
    
    // 전화번호 정규화
    const normalizedPhone = normalizePhoneNumber(loginPhone);
    if (!normalizedPhone) {
      alert('올바른 전화번호 형식이 아닙니다.');
      return;
    }
    
    setLoading(true);
    try {
      const action = userType === 'company' ? 'loginCompany' : 'loginConsultant';
      const result = await callAPI(action, {
        phone: normalizedPhone,
        password: loginPassword,
      });
      
      if (result.success) {
        // Apps Script는 userData 필드로 반환
        const user = result.userData || result.user;
        
        // userType 추가 (프론트엔드에서 사용)
        user.userType = userType;
        
        // 슈퍼관리자 여부 추가 (전화번호 체크)
        // 정규화된 전화번호로 비교 (하이픈 제거)
        const adminPhones = ['01063529091', '010-6352-9091'];
        const normalizedUserPhone = user.phone?.replace(/[^0-9]/g, '');
        user.isSuperAdmin = adminPhones.some(p => p.replace(/[^0-9]/g, '') === normalizedUserPhone);
        
        localStorage.setItem('sagunbok_user', JSON.stringify(user));
        onLoginSuccess(user);
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
  
  // 사업자번호 조회
  const handleLookupBusinessNumber = async () => {
    if (!businessNumber) {
      alert('사업자번호를 입력해주세요.');
      return;
    }
    
    setLookupLoading(true);
    try {
      const response = await fetch('/api/external-data/lookup-business-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessNumber }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCompanyName(result.companyName || '');
        setCeoName(result.ceoName || ''); // 대표자명 설정
        alert(`✅ 조회 성공!\n\n회사명: ${result.companyName || '알 수 없음'}\n대표자명: ${result.ceoName || '알 수 없음'}`);
      } else {
        alert(result.message || '사업자번호 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('사업자번호 조회 오류:', error);
      alert('사업자번호 조회 중 오류가 발생했습니다.');
    } finally {
      setLookupLoading(false);
    }
  };
  
  const handleRegisterCompany = async () => {
    if (!companyName || !companyType || !position || !name || !phone || !email || !password || !passwordConfirm || !referrer) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }
    
    // 전화번호 정규화
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      alert('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
      return;
    }
    
    // 추천인 전화번호 정규화
    const normalizedReferrer = normalizePhoneNumber(referrer);
    if (!normalizedReferrer) {
      alert('올바른 추천인 전화번호 형식이 아닙니다.');
      return;
    }
    
    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('올바른 이메일 형식이 아닙니다.');
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
        businessNumber, // 사업자번호 추가
        companyName,
        ceoName, // 대표자명 추가
        companyType,
        position, // 직함 추가
        referrer: normalizedReferrer,
        name,
        phone: normalizedPhone,
        email,
        password,
      });
      
      if (result.success) {
        alert(result.message);
        setMode('login');
        setUserType('company');
        // 폼 초기화
        setBusinessNumber('');
        setCompanyName('');
        setCeoName('');
        setCompanyType('개인사업자');
        setPosition('');
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setPasswordConfirm('');
        setReferrer('');
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
    if (!consultantName || !consultantPhone || !consultantEmail || !consultantPassword || !consultantPasswordConfirm || !position || !region || !consultantReferrer) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }
    
    // 전화번호 정규화
    const normalizedPhone = normalizePhoneNumber(consultantPhone);
    if (!normalizedPhone) {
      alert('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
      return;
    }
    
    // 추천인 전화번호 정규화
    const normalizedReferrer = normalizePhoneNumber(consultantReferrer);
    if (!normalizedReferrer) {
      alert('올바른 추천인 전화번호 형식이 아닙니다.');
      return;
    }
    
    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(consultantEmail)) {
      alert('올바른 이메일 형식이 아닙니다.');
      return;
    }
    
    // 비밀번호 검증
    if (consultantPassword.length < 4) {
      alert('비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }
    
    if (consultantPassword !== consultantPasswordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setLoading(true);
    try {
      const action = userType === 'manager' ? 'registerManager' : 'registerConsultant';
      const result = await callAPI(action, {
        name: consultantName,
        phone: normalizedPhone,
        email: consultantEmail,
        password: consultantPassword,
        position,
        region,
        referrer: normalizedReferrer,
      });
      
      if (result.success) {
        alert(result.message);
        setMode('login');
        setUserType(userType); // 매니저 또는 컨설턴트 유지
        // 폼 초기화
        setConsultantName('');
        setConsultantPhone('');
        setConsultantEmail('');
        setConsultantPassword('');
        setConsultantPasswordConfirm('');
        setPosition('');
        setRegion('수도권사업단');
        setConsultantReferrer('');
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
              {/* 회원 구분 탭 - 3개 (기업회원 / 매니저 / 컨설턴트) */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-inner">
                <button
                  onClick={() => setUserType('company')}
                  className={`py-3.5 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'company'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`text-sm ${
                    userType === 'company'
                      ? 'text-blue-600 font-extrabold'
                      : 'text-gray-500'
                  }`}>
                    🏢 기업회원
                  </span>
                </button>
                <button
                  onClick={() => setUserType('manager')}
                  className={`py-3.5 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'manager'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`text-sm ${
                    userType === 'manager'
                      ? 'text-blue-600 font-extrabold'
                      : 'text-gray-500'
                  }`}>
                    👤 매니저
                  </span>
                </button>
                <button
                  onClick={() => setUserType('consultant')}
                  className={`py-3.5 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'consultant'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`text-sm ${
                    userType === 'consultant'
                      ? 'text-blue-600 font-extrabold'
                      : 'text-gray-500'
                  }`}>
                    👔 컨설턴트
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
                    placeholder="비밀번호"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-12 pr-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 group-hover:border-gray-300 font-medium"
                  />
                </div>
                

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
              {/* 회원 구분 탭 - 3개 (기업회원 / 매니저 / 컨설턴트) */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-inner">
                <button
                  onClick={() => setUserType('company')}
                  className={`py-3 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'company'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`text-sm ${
                    userType === 'company'
                      ? 'text-blue-600 font-extrabold'
                      : 'text-gray-500'
                  }`}>
                    🏢 기업
                  </span>
                </button>
                <button
                  onClick={() => setUserType('manager')}
                  className={`py-3 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'manager'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`text-sm ${
                    userType === 'manager'
                      ? 'text-blue-600 font-extrabold'
                      : 'text-gray-500'
                  }`}>
                    👨‍💼 매니저
                  </span>
                </button>
                <button
                  onClick={() => setUserType('consultant')}
                  className={`py-3 rounded-xl font-bold transition-all duration-300 transform ${
                    userType === 'consultant'
                      ? 'bg-white shadow-xl scale-105 border-2 border-blue-400'
                      : 'bg-white/50 hover:bg-white/70 shadow-sm border-2 border-gray-200'
                  }`}
                >
                  <span className={`text-sm ${
                    userType === 'consultant'
                      ? 'text-blue-600 font-extrabold'
                      : 'text-gray-500'
                  }`}>
                    👔 컨설턴트
                  </span>
                </button>
              </div>

              {/* 기업회원 가입 폼 - 모던 디자인 */}
              {userType === 'company' && (
                <div className="space-y-4">
                  {/* 사업자번호 조회 */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="🔍 사업자번호 (예: 123-45-67890)"
                        value={businessNumber}
                        onChange={(e) => setBusinessNumber(e.target.value)}
                        maxLength={12}
                        className="flex-1 px-4 py-4 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-blue-400 font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleLookupBusinessNumber}
                        disabled={lookupLoading}
                        className="px-6 py-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {lookupLoading ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          '조회'
                        )}
                      </button>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-3">
                      <p className="text-xs text-blue-900 font-semibold flex items-center space-x-2">
                        <span>💡</span>
                        <span>사업자번호를 입력하고 조회 버튼을 누르면 회사명과 대표자명이 자동으로 입력됩니다.</span>
                      </p>
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="🏢 회사명 *"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  
                  <input
                    type="text"
                    placeholder="👤 대표자명 *"
                    value={ceoName}
                    onChange={(e) => setCeoName(e.target.value)}
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
                  
                  {/* 직함 입력 */}
                  <input
                    type="text"
                    placeholder="👔 직함 (예: 대표이사, 재무담당자) *"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  
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
                  
                  {/* 추천인 전화번호 입력 */}
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="📞 추천인 전화번호 (필수) *"
                      value={referrer}
                      onChange={(e) => setReferrer(e.target.value)}
                      className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 font-medium"
                    />
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
                    <p className="text-xs text-blue-900 font-semibold flex items-center space-x-2">
                      <span>ℹ️</span>
                      <span>사근복매니저/사근복컨설턴트의 전화번호를 입력하세요</span>
                    </p>
                  </div>
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

              {/* 매니저 / 컨설턴트 가입 폼 - 모던 디자인 */}
              {(userType === 'manager' || userType === 'consultant') && (
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
                    type="password"
                    placeholder="🔒 비밀번호 (최소 4자리) *"
                    value={consultantPassword}
                    onChange={(e) => setConsultantPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="password"
                    placeholder="✅ 비밀번호 확인 *"
                    value={consultantPasswordConfirm}
                    onChange={(e) => setConsultantPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  <input
                    type="text"
                    placeholder="👔 직함 *"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                  />
                  
                  {/* 소속 사업단 선택 */}
                  <div className="relative">
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium appearance-none cursor-pointer"
                    >
                      <option value="수도권사업단">🏢 수도권사업단</option>
                      <option value="대구사업단">🏢 대구사업단</option>
                      <option value="부산사업단">🏢 부산사업단</option>
                      <option value="페마연사업단">🏢 페마연사업단</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* 추천인 전화번호 입력 */}
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="📞 추천인 전화번호 (필수) *"
                      value={consultantReferrer}
                      onChange={(e) => setConsultantReferrer(e.target.value)}
                      className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 font-medium"
                    />
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4">
                    <p className="text-xs text-purple-900 font-semibold flex items-center space-x-2">
                      <span>ℹ️</span>
                      <span>사근복매니저/사근복컨설턴트의 전화번호를 입력하세요</span>
                    </p>
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
