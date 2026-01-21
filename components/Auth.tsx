import React, { useState } from 'react';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register' | 'findId' | 'findPassword';
type UserType = 'company' | 'consultant';

// Apps Script URL - 신규 시트 (V5.4.2 FINAL)
// 신규 시트: https://docs.google.com/spreadsheets/d/1NzBVwAjDTSQWznBapoD1fGspUvXpvQsozdJVSEF5Atc/edit
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwjtxzuEsmI_led6T_nFqyJuk0a91Qd7UvXp2DaIdJBEP3Dz8Gz6Qf57NgkWaZNovOwWg/exec';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>('company');
  const [loading, setLoading] = useState(false);
  
  // 로그인 폼
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // 기업회원 가입 폼
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('개인사업자'); // 기업 유형
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [referrer, setReferrer] = useState(''); // 추천인
  
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
    // Apps Script는 GET 요청의 쿼리 파라미터로 받음
    const params = new URLSearchParams({
      action,
      data: JSON.stringify(data)
    });
    
    const response = await fetch(`${BACKEND_URL}?${params.toString()}`, {
      method: 'GET',
      redirect: 'follow', // 명시적으로 리다이렉트 따라가기
      mode: 'cors', // CORS 모드 명시
      credentials: 'omit', // 쿠키/인증 정보 제외
      cache: 'no-cache', // 캐시 사용 안 함 (304 에러 방지)
    });
    
    const text = await response.text();
    
    // Apps Script는 때때로 HTML을 반환할 수 있으므로 JSON 파싱 시도
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON 파싱 실패:', text);
      throw new Error('서버 응답 형식이 올바르지 않습니다.');
    }
  };
  
  // 전화번호 정규화 함수 (하이픈 제거)
  const normalizePhone = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  // 전화번호 포맷팅 함수 (010-1234-5678 형식)
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
    return cleaned;
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
        phone: normalizePhone(loginPhone), // 하이픈 제거하여 전송
        password: loginPassword,
      });
      
      if (result.success) {
        localStorage.setItem('sagunbok_user', JSON.stringify(result.user));
        // 로그인 성공 - alert 제거하고 바로 메인으로 이동
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
    if (!companyName || !companyType || !name || !phone || !email || !password || !referrer) {
      alert('모든 필드를 입력해주세요. (추천인은 필수입니다)');
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
        name,
        phone: formatPhone(phone), // 010-1234-5678 형식으로 저장
        email,
        password,
        referrer, // 추천인
      });
      
      if (result.success) {
        alert(result.message);
        setMode('login');
        setUserType('company');
        // 폼 초기화
        setCompanyName('');
        setCompanyType('개인사업자');
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
    if (!consultantName || !consultantPhone || !consultantEmail || !position) {
      alert('필수 필드를 모두 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await callAPI('registerConsultant', {
        name: consultantName,
        phone: formatPhone(consultantPhone), // 010-1234-5678 형식으로 저장
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
        phone: normalizePhone(findPhone), // 하이픈 제거하여 전송
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-2xl text-blue-600 shadow-lg transform rotate-3">
              S
            </div>
            <div>
              <h1 className="text-2xl font-black">사근복 AI</h1>
              <p className="text-xs text-blue-200">Studio v2.5</p>
            </div>
          </div>
          <p className="text-sm text-blue-100 mt-4">
            {mode === 'login' && '로그인하여 시작하세요'}
            {mode === 'register' && '회원가입'}
            {mode === 'findId' && 'ID 찾기'}
            {mode === 'findPassword' && '비밀번호 찾기'}
          </p>
        </div>

        <div className="p-8">
          {/* 로그인 모드 */}
          {mode === 'login' && (
            <div className="space-y-6">
              {/* 회원 구분 탭 */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setUserType('company')}
                  className={`flex-1 py-3 rounded-xl font-bold transition ${
                    userType === 'company'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  기업회원
                </button>
                <button
                  onClick={() => setUserType('consultant')}
                  className={`flex-1 py-3 rounded-xl font-bold transition ${
                    userType === 'consultant'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  사근복 컨설턴트
                </button>
              </div>

              {/* 로그인 폼 */}
              <div className="space-y-4">
                <input
                  type="tel"
                  placeholder="ID (전화번호: 010-1234-5678)"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <input
                  type="password"
                  placeholder={userType === 'consultant' ? '비밀번호 (12345)' : '비밀번호'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                
                {userType === 'consultant' && (
                  <p className="text-xs text-gray-500 text-center">
                    💡 컨설턴트 비밀번호는 <strong>12345</strong> 입니다.
                  </p>
                )}
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>

              {/* 하단 링크 */}
              <div className="flex justify-between text-sm">
                <button
                  onClick={() => setMode('register')}
                  className="text-blue-600 hover:underline"
                >
                  회원가입
                </button>
                {userType === 'company' && (
                  <div className="space-x-3">
                    <button
                      onClick={() => setMode('findId')}
                      className="text-gray-600 hover:underline"
                    >
                      ID 찾기
                    </button>
                    <button
                      onClick={() => setMode('findPassword')}
                      className="text-gray-600 hover:underline"
                    >
                      비밀번호 찾기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 회원가입 모드 */}
          {mode === 'register' && (
            <div className="space-y-6">
              {/* 회원 구분 탭 */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setUserType('company')}
                  className={`flex-1 py-3 rounded-xl font-bold transition ${
                    userType === 'company'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  기업회원
                </button>
                <button
                  onClick={() => setUserType('consultant')}
                  className={`flex-1 py-3 rounded-xl font-bold transition ${
                    userType === 'consultant'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  사근복 컨설턴트
                </button>
              </div>

              {/* 기업회원 가입 폼 */}
              {userType === 'company' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="회사명 *"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="개인사업자">개인사업자</option>
                    <option value="법인">법인</option>
                    <option value="병의원개인사업자">병의원개인사업자</option>
                    <option value="의료재단">의료재단</option>
                  </select>
                  <input
                    type="text"
                    placeholder="이름 *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="전화번호 (ID로 사용됩니다) *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="email"
                    placeholder="이메일 *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="password"
                    placeholder="비밀번호 (최소 4자리) *"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="password"
                    placeholder="비밀번호 확인 *"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="추천인 (사근복 컨설턴트 이름) *"
                    value={referrer}
                    onChange={(e) => setReferrer(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500">
                    💡 추천인은 사근복 컨설턴트 시트에 등록된 이름과 정확히 일치해야 합니다.
                  </p>
                  <button
                    onClick={handleRegisterCompany}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? '가입 중...' : '회원가입'}
                  </button>
                </div>
              )}

              {/* 컨설턴트 가입 폼 */}
              {userType === 'consultant' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="이름 *"
                    value={consultantName}
                    onChange={(e) => setConsultantName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="전화번호 (ID로 사용됩니다) *"
                    value={consultantPhone}
                    onChange={(e) => setConsultantPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="email"
                    placeholder="이메일 *"
                    value={consultantEmail}
                    onChange={(e) => setConsultantEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="직함 *"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="소속 사업단 (선택)"
                    value={businessUnit}
                    onChange={(e) => setBusinessUnit(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="소속 지사 (선택)"
                    value={branchOffice}
                    onChange={(e) => setBranchOffice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700">
                    <p className="font-bold text-yellow-800 mb-1">💡 안내</p>
                    <p>컨설턴트 비밀번호는 <strong>12345</strong>로 고정됩니다.</p>
                    <p>가입 승인 후 로그인 시 사용하세요.</p>
                  </div>
                  
                  <button
                    onClick={handleRegisterConsultant}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? '가입 중...' : '회원가입'}
                  </button>
                </div>
              )}

              <button
                onClick={() => setMode('login')}
                className="w-full text-gray-600 text-sm hover:underline"
              >
                ← 로그인으로 돌아가기
              </button>
            </div>
          )}

          {/* ID 찾기 모드 */}
          {mode === 'findId' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                가입 시 입력한 이름과 이메일을 입력해주세요.
              </p>
              <input
                type="text"
                placeholder="이름"
                value={findName}
                onChange={(e) => setFindName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="email"
                placeholder="이메일"
                value={findEmail}
                onChange={(e) => setFindEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleFindId}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? '찾는 중...' : 'ID 찾기'}
              </button>
              <button
                onClick={() => setMode('login')}
                className="w-full text-gray-600 text-sm hover:underline"
              >
                ← 로그인으로 돌아가기
              </button>
            </div>
          )}

          {/* 비밀번호 찾기 모드 */}
          {mode === 'findPassword' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                가입 시 입력한 전화번호와 이메일을 입력해주세요.
              </p>
              <input
                type="tel"
                placeholder="전화번호 (ID)"
                value={findPhone}
                onChange={(e) => setFindPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="email"
                placeholder="이메일"
                value={findEmail}
                onChange={(e) => setFindEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleFindPassword}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? '찾는 중...' : '비밀번호 찾기'}
              </button>
              <button
                onClick={() => setMode('login')}
                className="w-full text-gray-600 text-sm hover:underline"
              >
                ← 로그인으로 돌아가기
              </button>
            </div>
          )}

          {/* 승인 안내 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-gray-700">
            <p className="font-bold text-blue-800 mb-1">🔒 승인 안내</p>
            <p>회원가입 후 관리자 승인이 필요합니다.</p>
            <p>승인 완료 시 로그인이 가능합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
