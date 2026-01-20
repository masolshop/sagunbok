
import React, { useState } from 'react';
import { ModuleType, CompanyContext, DiagnosisResult, CalculationResult, ReportSubmission } from './types';
import CorporateCalculator from './components/CorporateCalculator';
import CEOCalculator from './components/CEOCalculator';
import EmployeeCalculator from './components/EmployeeCalculator';
import NetPayCalculator from './components/NetPayCalculator';
import Diagnosis from './components/Diagnosis';
import AdminView from './components/AdminView';
import AIChat from './components/AIChat';
import APIKeySettings from './components/APIKeySettings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'corp' | 'ceo' | 'emp' | 'net' | 'diag' | 'admin'>('corp');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [showAPISettings, setShowAPISettings] = useState(false);
  
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc]">
      {/* Sidebar Nav */}
      <nav className="w-full lg:w-72 bg-[#0f2e44] text-white flex flex-col p-8 space-y-10 sticky top-0 lg:h-screen z-20 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg transform rotate-3">S</div>
          <div>
            <span className="text-xl font-black tracking-tighter block leading-none">사근복 AI</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Studio v2.5</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => setActiveTab('corp')}
            className={`w-full py-5 px-6 rounded-2xl text-lg font-bold transition-all border-2 text-left flex justify-between items-center group ${activeTab === 'corp' ? 'bg-[#1a5f7a] border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.2)]' : 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300'}`}
          >
            <span>기업절세계산기</span>
            <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === 'corp' ? 'opacity-100' : ''}`}>📊</span>
          </button>
          <button 
            onClick={() => setActiveTab('ceo')}
            className={`w-full py-5 px-6 rounded-2xl text-lg font-bold transition-all border-2 text-left flex justify-between items-center group ${activeTab === 'ceo' ? 'bg-[#1a5f7a] border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.2)]' : 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300'}`}
          >
            <span>CEO절세계산기</span>
            <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === 'ceo' ? 'opacity-100' : ''}`}>👑</span>
          </button>
          <button 
            onClick={() => setActiveTab('emp')}
            className={`w-full py-5 px-6 rounded-2xl text-lg font-bold transition-all border-2 text-left flex justify-between items-center group ${activeTab === 'emp' ? 'bg-[#1a5f7a] border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.2)]' : 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300'}`}
          >
            <span>직원절세계산기</span>
            <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === 'emp' ? 'opacity-100' : ''}`}>👤</span>
          </button>
          <button 
            onClick={() => setActiveTab('net')}
            className={`w-full py-5 px-6 rounded-2xl text-lg font-bold transition-all border-2 text-left flex justify-between items-center group ${activeTab === 'net' ? 'bg-[#1a5f7a] border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.2)]' : 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300'}`}
          >
            <span>네트급여계산기</span>
            <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === 'net' ? 'opacity-100' : ''}`}>🧮</span>
          </button>
          <button 
            onClick={() => setActiveTab('diag')}
            className={`w-full py-5 px-6 rounded-2xl text-lg font-bold transition-all border-2 text-left flex justify-between items-center group ${activeTab === 'diag' ? 'bg-[#1a5f7a] border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.2)]' : 'bg-transparent border-slate-700 hover:border-slate-500 text-slate-300'}`}
          >
            <span>기업리스크진단</span>
            <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === 'diag' ? 'opacity-100' : ''}`}>🩺</span>
          </button>
        </div>

        <div className="mt-auto space-y-6">
          <button 
            onClick={() => setShowAPISettings(true)}
            className="w-full py-3 px-4 rounded-xl text-xs font-black transition-all border border-dashed border-slate-700 text-slate-300 hover:border-blue-400 hover:text-blue-400 hover:bg-white/5"
          >
            🔑 API 키 설정
          </button>
          
          <button 
            onClick={() => setActiveTab('admin')}
            className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all border border-dashed ${activeTab === 'admin' ? 'bg-white/10 border-white text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
          >
            ADMIN DASHBOARD
          </button>
          
          <div className="p-5 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
              Active Context
            </div>
            <div className="text-sm font-black truncate">{companyContext.companyName || '업체명 미입력'}</div>
            <div className="text-[11px] text-slate-400 mt-1">{companyContext.region} · {companyContext.employeeCount || 0}명</div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-24 lg:pb-0">
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
            <AdminView />
          )}
        </div>
      </main>

      {/* Desktop AI Assistant Sidebar */}
      <aside className="w-full lg:w-[400px] bg-white border-l border-slate-200 hidden xl:block p-8">
        <AIChat 
          companyContext={companyContext}
          calcResults={calcResults}
          diagnosisResult={diagnosisResult}
        />
      </aside>

      {/* Mobile AI Chat Toggle & Overlay */}
      <div className="xl:hidden">
        <button 
          onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-[#1a5f7a] text-white rounded-full shadow-2xl z-50 flex items-center justify-center text-2xl animate-bounce hover:animate-none"
        >
          {isMobileChatOpen ? '✕' : '🤖'}
        </button>
        {isMobileChatOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsMobileChatOpen(false)}>
            <div className="absolute bottom-24 right-6 left-6 top-20 bg-white rounded-[32px] shadow-2xl overflow-hidden p-6" onClick={e => e.stopPropagation()}>
              <AIChat 
                companyContext={companyContext}
                calcResults={calcResults}
                diagnosisResult={diagnosisResult}
              />
            </div>
          </div>
        )}
      </div>

      {/* API Key Settings Modal */}
      {showAPISettings && <APIKeySettings onClose={() => setShowAPISettings(false)} />}
    </div>
  );
};

export default App;
