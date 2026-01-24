import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import { ModuleType, CompanyContext, DiagnosisResult, CalculationResult, ReportSubmission } from './types';
import CorporateCalculator from './components/CorporateCalculator';
import CEOCalculator from './components/CEOCalculator';
import EmployeeCalculator from './components/EmployeeCalculator';
import NetPayCalculator from './components/NetPayCalculator';
import Diagnosis from './components/Diagnosis';
import AdminView from './components/AdminView';
import AIChat from './components/AIChat';
import SagunbokInfo from './components/SagunbokInfo';
import SagunbokTaxSavings from './components/SagunbokTaxSavings';
import Sagunbok7Plans from './components/Sagunbok7Plans';

// 메뉴 접근 권한 정의
type MenuAccess = 'public' | 'company' | 'manager' | 'consultant' | 'admin';

interface MenuItem {
  id: 'sagunbok-info' | 'sagunbok-tax' | 'sagunbok-plans' | 'corp' | 'ceo' | 'emp' | 'net' | 'diag' | 'admin';
  label: string;
  icon: string;
  access: MenuAccess[];
  description?: string;
  isSubMenu?: boolean;
  parentId?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'sagunbok-info', label: '사근복이란?', icon: '📚', access: ['public'], description: '누구나 이용 가능', isSubMenu: true, parentId: 'sagunbok' },
  { id: 'sagunbok-tax', label: '사근복 절세', icon: '💰', access: ['public'], description: '누구나 이용 가능', isSubMenu: true, parentId: 'sagunbok' },
  { id: 'sagunbok-plans', label: '사근복 7대플랜', icon: '🎯', access: ['public'], description: '누구나 이용 가능', isSubMenu: true, parentId: 'sagunbok' },
  { id: 'diag', label: '기업리스크진단', icon: '🩺', access: ['public'], description: '누구나 이용 가능', isSubMenu: true, parentId: 'sagunbok' },
  { id: 'corp', label: '기업절세계산기', icon: '📊', access: ['company', 'manager', 'consultant'], description: '회원 전용' },
  { id: 'ceo', label: 'CEO절세계산기', icon: '👑', access: ['company', 'manager', 'consultant'], description: '회원 전용' },
  { id: 'emp', label: '직원절세계산기', icon: '👤', access: ['company', 'manager', 'consultant'], description: '회원 전용' },
  { id: 'net', label: '네트급여계산기', icon: '🧮', access: ['company', 'manager', 'consultant'], description: '회원 전용' },
  { id: 'admin', label: 'ADMIN DASHBOARD', icon: '⚙️', access: ['admin'], description: '관리자 전용' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'sagunbok-info' | 'sagunbok-tax' | 'sagunbok-plans' | 'corp' | 'ceo' | 'emp' | 'net' | 'diag' | 'admin'>('sagunbok-info');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<'sagunbok-info' | 'sagunbok-tax' | 'sagunbok-plans' | 'corp' | 'ceo' | 'emp' | 'net' | 'diag' | 'admin' | null>(null);
  const [showSagunbokSubmenu, setShowSagunbokSubmenu] = useState(true);

  
  const [companyContext, setCompanyContext] = useState<CompanyContext>({
    companyName: '',
    region: '서울',
    employeeCount: null,
    avgSalary: null,
    welfareTotal: null,
    dueFromCeo: null,
    retainedEarnings: null,
  });

  const [calculatorInputs, setCalculatorInputs] = useState<any>({
    prevTaxPaid: '',
    taxRate: '19',
    contribution: '',
    prevWelfareExp: '',
    convPercent: '30',
    currentMonthlyTaxable: '',
    shiftMonthly: '',
    taxMode: 'bracket',
    bracketRate: '0.24',
    retirementType: 'DB',
    yearsToRetire: '10',
    yearsServed: '0',
    // 네트급여 전용
    netTargetMonthly: '',
    ownerMarginalRate: '35',
    // CEO 전용
    ceo_epsMode: 'eps',
    ceo_sharesOutstanding: '',
    ceo_sharesToTransfer: '',
    ceo_assetsFair: '',
    ceo_liabilitiesFair: '0',
    ceo_eps1: '',
    ceo_eps2: '',
    ceo_eps3: '',
    ceo_profit1: '',
    ceo_profit2: '',
    ceo_profit3: '',
    ceo_isRealEstateHeavy: 'false',
    ceo_giftRelation: 'child',
    ceo_giftPrior10y: '',
    ceo_giftDeduction: '50000000',
    ceo_giftOtherAssets: '',
    ceo_inheritDeduction: '500000000',
    ceo_inheritOtherAssets: '',
    ceo_contributionAnnual: '',
    ceo_effectiveCorpTaxRate: '24.2',
    ceo_simulateImpact: 'true',
    ceo_useSpecial: 'false',
    ceo_specialDeduction: '1000000000',
    ceo_specialTier2Threshold: '12000000000',
    ceo_specialRate1: '10',
    ceo_specialRate2: '20'
  });
  
  const [calcResults, setCalcResults] = useState<CalculationResult[]>([]);
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<Record<string, number[]>>({});
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // 로그인 상태 확인 (컴포넌트 마운트 시)
  useEffect(() => {
    const savedUser = localStorage.getItem('sagunbok_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // 사용자 정보를 companyContext에 반영
        if (user.companyName) {
          setCompanyContext(prev => ({
            ...prev,
            companyName: user.companyName
          }));
        }
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('sagunbok_user');
      }
    }
  }, []);

  // 접근 권한 확인 함수
  const checkAccess = (menuItem: MenuItem): boolean => {
    // 공개 메뉴는 누구나 접근 가능
    if (menuItem.access.includes('public')) {
      return true;
    }
    
    // 로그인하지 않은 경우
    if (!isAuthenticated || !currentUser) {
      return false;
    }
    
    // 슈퍼관리자는 모든 메뉴 접근 가능
    if (currentUser.isSuperAdmin) {
      return true;
    }
    
    // 사용자 유형에 따른 접근 권한 확인
    const userType = currentUser.userType;
    
    if (menuItem.access.includes('admin')) {
      return currentUser.isSuperAdmin === true;
    }
    
    if (menuItem.access.includes(userType)) {
      return true;
    }
    
    return false;
  };
  
  // 메뉴 클릭 핸들러
  const handleMenuClick = (menuItem: MenuItem) => {
    if (checkAccess(menuItem)) {
      setActiveTab(menuItem.id);
    } else {
      // 접근 권한이 없으면 로그인 모달 표시
      setPendingTab(menuItem.id);
      setShowAuthModal(true);
    }
  };

  // 로그인 성공 핸들러
  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('sagunbok_user', JSON.stringify(user));
    setShowAuthModal(false);
    
    // 사용자 정보를 companyContext에 반영
    if (user.companyName) {
      setCompanyContext(prev => ({
        ...prev,
        companyName: user.companyName
      }));
    }
    
    // 대기 중인 탭이 있으면 해당 탭으로 이동
    if (pendingTab) {
      const menuItem = MENU_ITEMS.find(item => item.id === pendingTab);
      if (menuItem && checkAccess(menuItem)) {
        setActiveTab(pendingTab);
      }
      setPendingTab(null);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('sagunbok_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    // 계산기 데이터 초기화
    setCompanyContext({
      companyName: '',
      region: '서울',
      employeeCount: null,
      avgSalary: null,
      welfareTotal: null,
      dueFromCeo: null,
      retainedEarnings: null,
    });
    setCalcResults([]);
    setDiagnosisResult(null);
    setAiAnalysis(null);
  };

  const handleSaveReport = () => {
    if (!companyContext.companyName) {
      alert("회사명을 입력해주세요.");
      return;
    }
    const newSubmission: ReportSubmission = {
      id: crypto.randomUUID(),
      companyName: companyContext.companyName,
      companyContext,
      diagnosisResult,
      calcResults,
      aiAnalysis,
      submittedAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('sagunbok_submissions') || '[]');
    localStorage.setItem('sagunbok_submissions', JSON.stringify([...existing, newSubmission]));
    alert("상담 데이터가 성공적으로 저장되었습니다.");
  };

  // 현재 사용자 타입 표시 텍스트
  const getUserTypeLabel = () => {
    if (!currentUser) return '';
    if (currentUser.isSuperAdmin) return '👑 슈퍼관리자';
    switch (currentUser.userType) {
      case 'company': return '🏢 기업회원';
      case 'manager': return '👤 매니저';
      case 'consultant': return '👔 컨설턴트';
      default: return '사용자';
    }
  };

  // 메인 렌더링
  return (
    <>
      {/* 로그인 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setPendingTab(null);
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all z-10"
            >
              ✕
            </button>
            <Auth onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
      
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc]">
      {/* Sidebar Nav */}
      <nav className="w-full lg:w-96 bg-[#0f2e44] text-white flex flex-col p-8 space-y-6 sticky top-0 lg:h-screen z-20 shadow-2xl overflow-y-auto">
        <div className="flex items-center space-x-3 mb-4 flex-shrink-0">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg transform rotate-3">S</div>
          <div>
            <span className="text-2xl font-black tracking-tighter block leading-none">사근복 AI</span>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-widest">Studio v2.5</span>
          </div>
        </div>
        
        {/* 사용자 정보 표시 */}
        <div className="flex-shrink-0">
          {isAuthenticated ? (
            <div className="p-5 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="text-xs text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Logged In
              </div>
              <div className="text-base font-black truncate">{currentUser?.name || currentUser?.companyName || '사용자'}</div>
              <div className="text-sm text-slate-400 mt-1">
                {getUserTypeLabel()}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full p-5 bg-blue-500/10 hover:bg-blue-500/20 rounded-2xl border-2 border-blue-500/30 hover:border-blue-500/50 backdrop-blur-md transition-all group"
            >
              <div className="text-xs text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full group-hover:animate-pulse"></span>
                Guest Mode
              </div>
              <div className="text-base font-black text-blue-400">로그인 / 회원가입</div>
              <div className="text-sm text-slate-400 mt-1">클릭하여 로그인</div>
            </button>
          )}
        </div>
        
        <div className="flex flex-col space-y-3 flex-1 overflow-y-auto pb-4">
          {/* 사내근로복지기금 메뉴 그룹 */}
          <div className="space-y-2">
            <button
              onClick={() => setShowSagunbokSubmenu(!showSagunbokSubmenu)}
              className="w-full py-5 px-6 rounded-2xl text-xl font-bold transition-all border-2 border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏢</span>
                <span>사내근로복지기금</span>
              </div>
              <span className={`transition-transform text-slate-400 text-xl ${
                showSagunbokSubmenu ? 'rotate-180' : ''
              }`}>▼</span>
            </button>
            
            {showSagunbokSubmenu && (
              <div className="ml-4 space-y-2 border-l-2 border-slate-700 pl-4">
                {MENU_ITEMS.filter(item => item.isSubMenu).map(menuItem => {
                  const isActive = activeTab === menuItem.id;
                  return (
                    <button 
                      key={menuItem.id}
                      onClick={() => handleMenuClick(menuItem)}
                      className={`w-full py-4 px-5 rounded-xl text-base font-bold transition-all border text-left flex items-center gap-3 ${
                        isActive 
                          ? 'bg-[#1a5f7a] border-blue-400 shadow-lg text-white' 
                          : 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span className="text-2xl">{menuItem.icon}</span>
                      <span>{menuItem.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 기존 메뉴들 - 항상 표시 */}
          {MENU_ITEMS.filter(item => !item.isSubMenu && item.id !== 'admin').map(menuItem => {
            const hasAccess = checkAccess(menuItem);
            const isActive = activeTab === menuItem.id;
            const isPublic = menuItem.access.includes('public');
            
            return (
              <button 
                key={menuItem.id}
                onClick={() => handleMenuClick(menuItem)}
                className={`w-full py-5 px-6 rounded-2xl text-xl font-bold transition-all border-2 text-left flex flex-col gap-1 group relative ${
                  isActive 
                    ? 'bg-[#1a5f7a] border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.2)] text-white' 
                    : hasAccess
                      ? 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
                      : 'bg-transparent border-slate-800 text-slate-600 hover:border-blue-500/30 hover:text-slate-400'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{menuItem.label}</span>
                  <span className={`text-base transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>{menuItem.icon}</span>
                </div>
                {!hasAccess && (
                  <div className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                    <span className="text-sm">🔒</span>
                    <span>{isPublic ? '누구나' : '로그인 필요'}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-shrink-0 space-y-4 border-t border-slate-700 pt-4">
          {(() => {
            const adminMenuItem = MENU_ITEMS.find(item => item.id === 'admin');
            if (!adminMenuItem) return null;
            
            const hasAccess = checkAccess(adminMenuItem);
            if (!hasAccess) return null;
            
            return (
              <button 
                onClick={() => handleMenuClick(adminMenuItem)}
                className={`w-full py-4 px-5 rounded-xl text-sm font-black transition-all border border-dashed ${
                  activeTab === 'admin' 
                    ? 'bg-white/10 border-white text-white' 
                    : 'border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {adminMenuItem.label}
              </button>
            );
          })()}
          
          <div className="p-5 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="text-xs text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Active Context
            </div>
            <div className="text-base font-black truncate">{companyContext.companyName || '업체명 미입력'}</div>
            <div className="text-sm text-slate-400 mt-1">{companyContext.region} · {companyContext.employeeCount || 0}명</div>
          </div>

          {/* 로그아웃 버튼 */}
          {isAuthenticated && (
            <button 
              onClick={handleLogout}
              className="w-full py-4 px-5 rounded-xl text-sm font-black transition-all bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300"
            >
              🚪 로그아웃
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area - 확대된 레이아웃 */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto pb-24 lg:pb-0">
          {activeTab === 'sagunbok-info' && <SagunbokInfo />}
          {activeTab === 'sagunbok-tax' && <SagunbokTaxSavings />}
          {activeTab === 'sagunbok-plans' && <Sagunbok7Plans />}
          
          {activeTab === 'corp' && (
            <CorporateCalculator 
              companyContext={companyContext}
              setCompanyContext={setCompanyContext}
              inputs={calculatorInputs}
              setInputs={setCalculatorInputs}
              setCalcResults={setCalcResults}
              calcResults={calcResults}
            />
          )}

          {activeTab === 'ceo' && (
            <CEOCalculator 
              companyContext={companyContext}
              setCompanyContext={setCompanyContext}
              inputs={calculatorInputs}
              setInputs={setCalculatorInputs}
              setCalcResults={setCalcResults}
              calcResults={calcResults}
            />
          )}

          {activeTab === 'emp' && (
            <EmployeeCalculator 
              companyContext={companyContext}
              setCompanyContext={setCompanyContext}
              inputs={calculatorInputs}
              setInputs={setCalculatorInputs}
              setCalcResults={setCalcResults}
              calcResults={calcResults}
            />
          )}

          {activeTab === 'net' && (
            <NetPayCalculator 
              companyContext={companyContext}
              setCompanyContext={setCompanyContext}
              inputs={calculatorInputs}
              setInputs={setCalculatorInputs}
              setCalcResults={setCalcResults}
              calcResults={calcResults}
            />
          )}

          {activeTab === 'diag' && (
            <Diagnosis 
              companyContext={companyContext}
              setCompanyContext={setCompanyContext}
              answers={diagnosisAnswers}
              setAnswers={setDiagnosisAnswers}
              setDiagnosisResult={setDiagnosisResult}
              setAiAnalysis={setAiAnalysis}
              aiAnalysis={aiAnalysis}
              diagnosisResult={diagnosisResult}
              onSave={handleSaveReport}
            />
          )}



          {activeTab === 'admin' && (
            <AdminView currentUser={currentUser} />
          )}
        </div>
      </main>

      </div>
    </>
  );
};

export default App;
