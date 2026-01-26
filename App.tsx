import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import { ModuleType, CompanyContext, DiagnosisResult, CalculationResult, ReportSubmission } from './types';
import CorporateCalculator from './components/CorporateCalculator';
import CEOCalculatorV2 from './src/components/CEOCalculatorV2';
import EmployeeCalculator from './components/EmployeeCalculator';
import NetPayCalculator from './components/NetPayCalculator';
import SecretPlan from './src/components/SecretPlan';
import Diagnosis from './components/Diagnosis';
import AdminView from './components/AdminView';
import ConsultantZonePage from './src/pages/ConsultantZonePage';
import CretopReportPage from './src/pages/CretopReportPage';
import AIConsultantZonePage from './src/pages/AIConsultantZonePage';
import ConsultantInsightsPage from './src/pages/ConsultantInsightsPage';
import FinalIntegratedReportPage from './src/pages/FinalIntegratedReportPage';
import ConsultantAIPanel from './src/components/ConsultantAIPanel';
import AIChat from './components/AIChat';
import SagunbokInfo from './components/SagunbokInfo';
import SagunbokTaxSavings from './components/SagunbokTaxSavings';
import Sagunbok7Plans from './components/Sagunbok7Plans';

// 메뉴 접근 권한 정의
type MenuAccess = 'public' | 'company' | 'manager' | 'consultant' | 'admin';

interface MenuItem {
  id: 'sagunbok-info' | 'sagunbok-tax' | 'corp' | 'ceo' | 'emp' | 'net' | 'secret' | 'diag' | 'consultant-zone' | 'ai-consultant-zone' | 'consultant-insights' | 'final-integrated' | 'cretop-report' | 'admin';
  label: string;
  icon: string;
  access: MenuAccess[];
  description?: string;
  isSubMenu?: boolean;
  parentId?: string;
  isSpecial?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'sagunbok-info', label: '사근복이란?', icon: '📚', access: ['public'], description: '누구나 이용 가능', isSubMenu: true, parentId: 'sagunbok' },
  { id: 'sagunbok-tax', label: '사근복 절세', icon: '💰', access: ['public'], description: '누구나 이용 가능', isSubMenu: true, parentId: 'sagunbok' },
  { id: 'corp', label: '기업절세계산기', icon: '📊', access: ['company', 'manager', 'consultant'], description: '회원 전용' },
  { id: 'emp', label: '직원절세계산기', icon: '👤', access: ['company', 'manager', 'consultant'], description: '회원 전용' },
  { id: 'ceo', label: 'CEO절세계산기', icon: '👑', access: ['company', 'manager', 'consultant'], description: '회원 전용' },
  { id: 'net', label: '네트급여계산기', icon: '🧮', access: ['company', 'manager', 'consultant'], description: '회원 전용' },
  { id: 'diag', label: '기업리스크진단', icon: '🩺', access: ['company', 'manager', 'consultant'], description: '회원 전용' },
  { id: 'secret', label: 'SECRET PLAN', icon: '🔐', access: ['company', 'manager', 'consultant'], description: 'VIP 컨설팅', isSpecial: true },
  { id: 'consultant-zone', label: '컨설턴트 전용', icon: '👔', access: ['consultant', 'admin'], description: '컨설턴트 전용', isSpecial: true },
  { id: 'cretop-report', label: '1단계: 재무제표 분석', icon: '📊', access: ['consultant', 'admin'], description: 'CRETOP 기업분석', isSubMenu: true, parentId: 'consultant-zone' },
  { id: 'consultant-insights', label: '2-3단계: 외부데이터 인사이트', icon: '🔍', access: ['consultant', 'admin'], description: '복지/리뷰 분석', isSubMenu: true, parentId: 'consultant-zone' },
  { id: 'ai-consultant-zone', label: '7단계: AI 컨설팅 존', icon: '🎯', access: ['consultant', 'admin'], description: '전체 자동화', isSubMenu: true, parentId: 'consultant-zone' },
  { id: 'final-integrated', label: '최종 통합 리포트', icon: '🎬', access: ['consultant', 'admin'], description: '클라이맥스', isSubMenu: true, parentId: 'consultant-zone' },
  { id: 'admin', label: 'ADMIN DASHBOARD', icon: '⚙️', access: ['admin'], description: '관리자 전용' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'sagunbok-info' | 'sagunbok-tax' | 'corp' | 'ceo' | 'emp' | 'net' | 'secret' | 'diag' | 'consultant-zone' | 'ai-consultant-zone' | 'consultant-insights' | 'final-integrated' | 'cretop-report' | 'admin'>('sagunbok-info');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<'sagunbok-info' | 'sagunbok-tax' | 'corp' | 'ceo' | 'emp' | 'net' | 'secret' | 'diag' | 'consultant-zone' | 'ai-consultant-zone' | 'consultant-insights' | 'final-integrated' | 'cretop-report' | 'admin' | null>(null);
  const [showSagunbokSubmenu, setShowSagunbokSubmenu] = useState(true);
  const [showConsultantSubmenu, setShowConsultantSubmenu] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  
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
    // 법인세 전용
    corp_prevTaxPaid: '',
    corp_contribution: '',
    corp_taxRate: '19',
    // 종합소득세 전용
    personal_prevTaxPaid: '',
    personal_contribution: '',
    personal_taxRate: '24',
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
      setIsMobileMenuOpen(false); // 모바일에서 메뉴 선택 시 자동으로 닫기
    } else {
      // 접근 권한이 없으면 로그인 모달 표시
      setPendingTab(menuItem.id);
      setShowAuthModal(true);
      setIsMobileMenuOpen(false);
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
      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 로그인 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* 닫기 버튼 - 모달 우상단 안쪽 */}
            <button
              onClick={() => {
                setShowAuthModal(false);
                setPendingTab(null);
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all shadow-md text-xl font-bold z-10"
            >
              ✕
            </button>
            <Auth onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
      
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 right-4 z-50 lg:hidden w-14 h-14 bg-[#0f2e44] rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-[#1a5f7a] transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] gap-6">
      {/* Sidebar Nav */}
      <nav className={`fixed lg:static w-full lg:w-[420px] bg-[#0f2e44] text-white flex flex-col p-6 lg:p-8 space-y-4 lg:space-y-6 top-0 left-0 h-screen z-40 shadow-2xl overflow-y-hidden transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center space-x-2 lg:space-x-3 mb-3 lg:mb-4 flex-shrink-0">
          <div className="w-11 h-11 lg:w-12 lg:h-12 bg-blue-500 rounded-xl flex items-center justify-center font-black text-xl lg:text-2xl shadow-lg transform rotate-3">S</div>
          <div>
            <span className="text-xl lg:text-2xl font-black tracking-tighter block leading-none">AI사근복닷컴</span>
          </div>
        </div>
        
        {/* 사용자 정보 표시 */}
        <div className="flex-shrink-0">
          {isAuthenticated ? (
            <div className="p-3 lg:p-4 bg-black/20 rounded-lg lg:rounded-xl border border-white/5 backdrop-blur-md">
              <div className="text-[10px] lg:text-xs text-blue-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-pulse"></span>
                Logged In
              </div>
              <div className="text-sm lg:text-base font-bold truncate">{currentUser?.name || currentUser?.companyName || '사용자'}</div>
              <div className="text-xs lg:text-sm text-slate-400 mt-0.5">
                {getUserTypeLabel()}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 hover:border-blue-500/50 backdrop-blur-md transition-all text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              🔑 로그인
            </button>
          )}
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="flex flex-col space-y-3 flex-1 overflow-y-auto pb-4 cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={(e) => {
            setIsDragging(true);
            setStartY(e.pageY - (scrollContainerRef.current?.offsetTop || 0));
            setScrollTop(scrollContainerRef.current?.scrollTop || 0);
          }}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (!isDragging) return;
            e.preventDefault();
            const y = e.pageY - (scrollContainerRef.current?.offsetTop || 0);
            const walk = (y - startY) * 2;
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollTop - walk;
            }
          }}
        >
          {/* 사내근로복지기금 메뉴 그룹 */}
          <div className="space-y-3 lg:space-y-3">
            <button
              onClick={() => setShowSagunbokSubmenu(!showSagunbokSubmenu)}
              className="w-full py-5 lg:py-5 px-5 lg:px-6 rounded-xl lg:rounded-2xl text-lg lg:text-xl font-bold transition-all border-2 border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <span className="text-2xl lg:text-3xl">🏢</span>
                <span className="text-base lg:text-base">사내근로복지기금</span>
              </div>
              <span className={`transition-transform text-slate-400 text-lg lg:text-xl ${
                showSagunbokSubmenu ? 'rotate-180' : ''
              }`}>▼</span>
            </button>
            
            {showSagunbokSubmenu && (
              <div className="ml-3 lg:ml-4 space-y-3 lg:space-y-3 border-l-2 border-slate-700 pl-3 lg:pl-4">
                {MENU_ITEMS.filter(item => item.isSubMenu && item.parentId === 'sagunbok').map(menuItem => {
                  const isActive = activeTab === menuItem.id;
                  return (
                    <button 
                      key={menuItem.id}
                      onClick={() => handleMenuClick(menuItem)}
                      className={`w-full py-4 lg:py-4 px-4 lg:px-5 rounded-lg lg:rounded-xl text-base lg:text-lg font-bold transition-all border text-left flex items-center gap-2 lg:gap-3 ${
                        isActive 
                          ? 'bg-[#1a5f7a] border-blue-400 shadow-lg text-white' 
                          : 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span className="text-xl lg:text-2xl">{menuItem.icon}</span>
                      <span>{menuItem.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 기존 메뉴들 - 항상 표시 (admin 포함) */}
          {MENU_ITEMS.filter(item => !item.isSubMenu).map(menuItem => {
            const hasAccess = checkAccess(menuItem);
            const isActive = activeTab === menuItem.id;
            const isPublic = menuItem.access.includes('public');
            const isSpecial = menuItem.isSpecial;
            const hasSubmenu = menuItem.id === 'consultant-zone';
            
            return (
              <div key={menuItem.id}>
                <button 
                  onClick={() => {
                    if (hasSubmenu) {
                      setShowConsultantSubmenu(!showConsultantSubmenu);
                    } else {
                      handleMenuClick(menuItem);
                    }
                  }}
                  className={`w-full py-5 lg:py-5 px-5 lg:px-6 rounded-xl lg:rounded-2xl text-lg lg:text-xl font-bold transition-all border-2 text-left flex flex-col gap-1 group relative select-none ${
                    isSpecial
                      ? isActive
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] text-white'
                        : 'bg-gradient-to-r from-slate-800 to-slate-700 border-amber-500/50 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] text-amber-300 hover:text-amber-200'
                      : isActive 
                        ? 'bg-[#1a5f7a] border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.2)] text-white' 
                        : hasAccess
                          ? 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
                          : 'bg-transparent border-slate-700 text-slate-300 hover:border-blue-500/30 hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {isSpecial && <span className="text-xl lg:text-2xl">✨</span>}
                      <span className="text-xl lg:text-2xl">{menuItem.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl lg:text-3xl transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>{menuItem.icon}</span>
                      {hasSubmenu && (
                        <span className={`transition-transform text-slate-400 text-lg lg:text-xl ${
                          showConsultantSubmenu ? 'rotate-180' : ''
                        }`}>▼</span>
                      )}
                    </div>
                  </div>
                  {!hasAccess && (
                    <div className="text-sm lg:text-base text-blue-400 font-semibold flex items-center gap-1">
                      <span className="text-base lg:text-lg">🔒</span>
                      <span>{isPublic ? '누구나' : '로그인 필요'}</span>
                    </div>
                  )}
                  {isSpecial && hasAccess && !isActive && (
                    <div className="text-xs lg:text-xs text-amber-400 font-semibold flex items-center gap-1">
                      <span className="text-sm lg:text-sm">🔐</span>
                      <span>{menuItem.description}</span>
                    </div>
                  )}
                </button>
                
                {/* 컨설턴트존 서브메뉴 */}
                {hasSubmenu && showConsultantSubmenu && hasAccess && (
                  <div className="ml-3 lg:ml-4 mt-3 space-y-3 lg:space-y-3 border-l-2 border-amber-500/30 pl-3 lg:pl-4">
                    {MENU_ITEMS.filter(item => item.parentId === 'consultant-zone').map(subItem => {
                      const isSubActive = activeTab === subItem.id;
                      return (
                        <button 
                          key={subItem.id}
                          onClick={() => handleMenuClick(subItem)}
                          className={`w-full py-4 lg:py-4 px-4 lg:px-5 rounded-lg lg:rounded-xl text-base lg:text-lg font-bold transition-all border text-left flex items-center gap-2 lg:gap-3 ${
                            isSubActive 
                              ? 'bg-[#1a5f7a] border-blue-400 shadow-lg text-white' 
                              : 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="text-xl lg:text-2xl">{subItem.icon}</span>
                          <span>{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-shrink-0 space-y-2 lg:space-y-3 border-t border-slate-700 pt-2 lg:pt-3">
          <div className="p-3 lg:p-4 bg-black/20 rounded-lg lg:rounded-xl border border-white/5 backdrop-blur-md">
            <div className="text-[10px] lg:text-xs text-blue-400 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Context
            </div>
            <div className="text-sm lg:text-base font-bold truncate">{companyContext.companyName || '업체명 미입력'}</div>
            <div className="text-xs lg:text-sm text-slate-400 mt-0.5">{companyContext.region} · {companyContext.employeeCount || 0}명</div>
          </div>

          {/* 로그아웃 버튼 */}
          {isAuthenticated && (
            <button 
              onClick={handleLogout}
              className="w-full py-2 lg:py-3 px-3 lg:px-4 rounded-lg lg:rounded-xl text-sm lg:text-base font-bold transition-all bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300"
            >
              🚪 로그아웃
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area - 확대된 레이아웃 */}
      <main className="flex-1 p-6 pt-20 lg:pt-12 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto pb-24 lg:pb-0">
          {activeTab === 'sagunbok-info' && <SagunbokInfo />}
          {activeTab === 'sagunbok-tax' && <SagunbokTaxSavings />}
          
          {activeTab === 'corp' && (
            <>
              <CorporateCalculator 
                companyContext={companyContext}
                setCompanyContext={setCompanyContext}
                inputs={calculatorInputs}
                setInputs={setCalculatorInputs}
                setCalcResults={setCalcResults}
                calcResults={calcResults}
              />
              <ConsultantAIPanel
                currentUser={currentUser}
                module="CORP_TAX"
                calcResult={calcResults.find(r => r.module === 'CORP_TAX')}
                caseMeta={{
                  companyName: companyContext.companyName,
                  region: companyContext.region,
                  employeeCount: companyContext.employeeCount
                }}
              />
            </>
          )}

          {activeTab === 'ceo' && (
            <>
              <CEOCalculatorV2 />
              <ConsultantAIPanel
                currentUser={currentUser}
                module="CEO_TAX"
                calcResult={calcResults.find(r => r.module === 'CEO_TAX')}
                caseMeta={{
                  companyName: companyContext.companyName,
                  region: companyContext.region,
                  employeeCount: companyContext.employeeCount
                }}
              />
            </>
          )}

          {activeTab === 'emp' && (
            <>
              <EmployeeCalculator 
                companyContext={companyContext}
                setCompanyContext={setCompanyContext}
                inputs={calculatorInputs}
                setInputs={setCalculatorInputs}
                setCalcResults={setCalcResults}
                calcResults={calcResults}
              />
              <ConsultantAIPanel
                currentUser={currentUser}
                module="STAFF_TAX"
                calcResult={calcResults.find(r => r.module === 'STAFF_TAX')}
                caseMeta={{
                  companyName: companyContext.companyName,
                  region: companyContext.region,
                  employeeCount: companyContext.employeeCount
                }}
              />
            </>
          )}

          {activeTab === 'net' && (
            <>
              <NetPayCalculator 
                companyContext={companyContext}
                setCompanyContext={setCompanyContext}
                inputs={calculatorInputs}
                setInputs={setCalculatorInputs}
                setCalcResults={setCalcResults}
                calcResults={calcResults}
              />
              <ConsultantAIPanel
                currentUser={currentUser}
                module="NETPAY"
                calcResult={calcResults.find(r => r.module === 'NETPAY')}
                caseMeta={{
                  companyName: companyContext.companyName,
                  region: companyContext.region,
                  employeeCount: companyContext.employeeCount
                }}
              />
            </>
          )}

          {activeTab === 'secret' && (
            <SecretPlan currentUser={currentUser} />
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



          {activeTab === 'consultant-zone' && (
            <ConsultantZonePage />
          )}

          {activeTab === 'ai-consultant-zone' && (
            <AIConsultantZonePage />
          )}

          {activeTab === 'consultant-insights' && (
            <ConsultantInsightsPage />
          )}

          {activeTab === 'final-integrated' && (
            <FinalIntegratedReportPage />
          )}

          {activeTab === 'cretop-report' && (
            <CretopReportPage />
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
