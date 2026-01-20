
import React from 'react';
import { ModuleType, CalculationResult, CompanyContext } from '../types';
import { ceoTaxSimulation } from '../utils/calculations';

interface CEOCalculatorProps {
  companyContext: CompanyContext;
  setCompanyContext: (ctx: CompanyContext) => void;
  inputs: any;
  setInputs: (inputs: any) => void;
  calcResults: CalculationResult[];
  setCalcResults: React.Dispatch<React.SetStateAction<CalculationResult[]>>;
}

const CEOCalculator: React.FC<CEOCalculatorProps> = ({ 
  companyContext, setCompanyContext,
  inputs, setInputs,
  calcResults, setCalcResults 
}) => {
  
  const parseNumber = (val: string | number) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(val.toString().replace(/[^0-9]/g, '')) || 0;
  };

  const formatNumber = (val: string | number) => {
    const num = val.toString().replace(/[^0-9]/g, '');
    return num ? parseInt(num, 10).toLocaleString() : '';
  };

  const convertToKoreanUnitParts = (value: number | string) => {
    const num = parseNumber(value);
    if (num === 0) return { eok: '', man: '' };
    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    
    return {
      eok: eok > 0 ? `${eok}억 ` : '',
      man: man > 0 ? `${man.toLocaleString()}만원` : (eok > 0 ? '' : '0원')
    };
  };

  const handleRelationChange = (val: string) => {
    const defaults: Record<string, string> = {
      spouse: '600000000',
      child: '50000000',
      parent: '50000000',
      other: '10000000'
    };
    if (val !== 'custom') {
      setInputs({...inputs, ceo_giftRelation: val, ceo_giftDeduction: formatNumber(defaults[val])});
    } else {
      setInputs({...inputs, ceo_giftRelation: val});
    }
  };

  const calculate = () => {
    const sh = parseNumber(inputs.ceo_sharesOutstanding);
    const e1 = parseNumber(inputs.ceo_eps1);
    const e2 = parseNumber(inputs.ceo_eps2);
    const e3 = parseNumber(inputs.ceo_eps3);

    const result = ceoTaxSimulation({
      sharesOutstanding: sh,
      sharesToTransfer: parseNumber(inputs.ceo_sharesToTransfer),
      assetsFair: parseNumber(inputs.ceo_assetsFair),
      liabilitiesFair: parseNumber(inputs.ceo_liabilitiesFair || 0),
      eps1: e1, eps2: e2, eps3: e3,
      capitalizationRate: 0.1,
      isRealEstateHeavy: inputs.ceo_isRealEstateHeavy === 'true',
      giftPrior10y: parseNumber(inputs.ceo_giftPrior10y),
      giftDeduction: parseNumber(inputs.ceo_giftDeduction),
      giftOtherAssets: parseNumber(inputs.ceo_giftOtherAssets),
      inheritDeduction: parseNumber(inputs.ceo_inheritDeduction),
      inheritOtherAssets: parseNumber(inputs.ceo_inheritOtherAssets),
      contributionAnnual: parseNumber(inputs.ceo_contributionAnnual),
      effectiveCorpTaxRate: Number(inputs.ceo_effectiveCorpTaxRate || 24.2) / 100,
      simulateContributionImpact: inputs.ceo_simulateImpact === 'true',
      useBusinessSuccessionSpecial: inputs.ceo_useSpecial === 'true',
      specialDeduction: parseNumber(inputs.ceo_specialDeduction || 1000000000),
      specialTier2Threshold: parseNumber(inputs.ceo_specialTier2Threshold || 12000000000),
      specialRate1: Number(inputs.ceo_specialRate1 || 10) / 100,
      specialRate2: Number(inputs.ceo_specialRate2 || 20) / 100
    });

    const newResult: CalculationResult = {
      module: ModuleType.CEO_TAX,
      inputs: { ...inputs },
      result,
      timestamp: new Date().toISOString()
    };

    setCalcResults(prev => [newResult, ...prev]);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="space-y-4">
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">CEO 절세계산기</h1>
        <p className="text-2xl lg:text-3xl text-slate-500 font-bold leading-relaxed italic">
          비상장주식 가치평가 + 상속·증여·승계 시나리오 + 사근복 출연 연계 통합 분석
        </p>
      </header>

      {/* 1. 비상장주식 평가 데이터 입력 */}
      <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-12">
        <h3 className="flex items-center gap-4 text-[#1a5f7a] font-black text-3xl lg:text-4xl">
          <span>👑</span> 자산 및 주식 평가 데이터
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">발행주식수 (주)</label>
            <input 
              type="text" 
              value={inputs.ceo_sharesOutstanding || ''} 
              onChange={(e) => setInputs({...inputs, ceo_sharesOutstanding: formatNumber(e.target.value)})} 
              className="w-full h-[84px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-6 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner tracking-tighter" 
              placeholder="100,000" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">평가(증여) 주식수 (주)</label>
            <input 
              type="text" 
              value={inputs.ceo_sharesToTransfer || ''} 
              onChange={(e) => setInputs({...inputs, ceo_sharesToTransfer: formatNumber(e.target.value)})} 
              className="w-full h-[84px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-6 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner tracking-tighter" 
              placeholder="30,000" 
            />
          </div>

          {/* 부동산과다보유 (선택 문구 복원 및 Select로 변경) */}
          <div className="space-y-4 lg:col-span-2">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">부동산과다보유 여부</label>
            <select 
              value={inputs.ceo_isRealEstateHeavy || 'false'} 
              onChange={(e) => setInputs({...inputs, ceo_isRealEstateHeavy: e.target.value})} 
              className="w-full h-[84px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl px-6 text-xl lg:text-2xl font-black outline-none transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1.5rem_center] tracking-tight"
            >
              <option value="false">아니오 (3:2 가중)</option>
              <option value="true">예 (2:3 가중)</option>
            </select>
          </div>

          {/* 순자산 */}
          <div className="space-y-4 lg:col-span-2">
            <label className="text-xl font-bold text-slate-700 block">순자산 (자산-부채, 원)</label>
            <div className="space-y-2">
              <input 
                type="text" 
                value={inputs.ceo_assetsFair || ''} 
                onChange={(e) => setInputs({...inputs, ceo_assetsFair: formatNumber(e.target.value)})} 
                className="w-full bg-slate-50 border-4 border-transparent focus:border-[#1a5f7a] rounded-3xl p-6 text-2xl lg:text-5xl font-black outline-none transition-all shadow-inner text-slate-900 tracking-tighter" 
                placeholder="5,000,000,000" 
              />
              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 flex justify-end items-center gap-3">
                <span className="text-blue-700 font-black text-xl lg:text-3xl tracking-tight">{convertToKoreanUnitParts(inputs.ceo_assetsFair).eok}</span>
                <span className="text-blue-400 font-black text-xl lg:text-3xl tracking-tight">{convertToKoreanUnitParts(inputs.ceo_assetsFair).man}</span>
              </div>
            </div>
          </div>

          {/* 연 사근복 출연 예정액 */}
          <div className="space-y-4 lg:col-span-2">
            <label className="text-xl font-bold text-slate-700 block leading-tight">연 사근복 출연 예정액 (원)</label>
            <div className="space-y-2">
              <input 
                type="text" 
                value={inputs.ceo_contributionAnnual || ''} 
                onChange={(e) => setInputs({...inputs, ceo_contributionAnnual: formatNumber(e.target.value)})} 
                className="w-full bg-slate-50 border-4 border-transparent focus:border-green-600 rounded-3xl p-6 text-2xl lg:text-5xl font-black outline-none transition-all shadow-inner text-slate-900 tracking-tighter" 
                placeholder="500,000,000" 
              />
              <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-4 flex justify-end items-center gap-3">
                <span className="text-green-700 font-black text-xl lg:text-3xl tracking-tight">{convertToKoreanUnitParts(inputs.ceo_contributionAnnual).eok}</span>
                <span className="text-green-400 font-black text-xl lg:text-3xl tracking-tight">{convertToKoreanUnitParts(inputs.ceo_contributionAnnual).man}</span>
              </div>
            </div>
          </div>

          {/* EPS 데이터 */}
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">EPS1 (최근 1년)</label>
            <input type="text" value={inputs.ceo_eps1 || ''} onChange={(e) => setInputs({...inputs, ceo_eps1: formatNumber(e.target.value)})} className="w-full h-[84px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-6 text-xl lg:text-2xl font-black outline-none shadow-inner tracking-tighter" />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">EPS2 (최근 2년)</label>
            <input type="text" value={inputs.ceo_eps2 || ''} onChange={(e) => setInputs({...inputs, ceo_eps2: formatNumber(e.target.value)})} className="w-full h-[84px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-6 text-xl lg:text-2xl font-black outline-none shadow-inner tracking-tighter" />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">EPS3 (최근 3년)</label>
            <input type="text" value={inputs.ceo_eps3 || ''} onChange={(e) => setInputs({...inputs, ceo_eps3: formatNumber(e.target.value)})} className="w-full h-[84px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-6 text-xl lg:text-2xl font-black outline-none shadow-inner tracking-tighter" />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">법인 실효세율 (%)</label>
            <input 
              type="text" 
              value={inputs.ceo_effectiveCorpTaxRate || '24.2'} 
              onChange={(e) => setInputs({...inputs, ceo_effectiveCorpTaxRate: e.target.value})} 
              className="w-full h-[84px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-6 text-xl lg:text-2xl font-black outline-none shadow-inner tracking-tight" 
            />
          </div>
        </div>
      </div>

      {/* 2. 세금 입력 섹션 */}
      <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-12">
        <h3 className="flex items-center gap-4 text-[#1a5f7a] font-black text-3xl lg:text-4xl">
          <span>📊</span> 세금 설정 (증여·상속)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">증여 관계</label>
            <select 
              value={inputs.ceo_giftRelation || 'child'} 
              onChange={(e) => handleRelationChange(e.target.value)} 
              className="w-full h-[76px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl pl-5 pr-12 py-2 text-lg lg:text-xl font-black outline-none transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] tracking-tighter"
            >
              <option value="custom">직접 입력</option>
              <option value="spouse">배우자 (6억)</option>
              <option value="child">자녀/직계비속 (5천만)</option>
              <option value="parent">부모/직계존속 (5천만)</option>
              <option value="other">기타 (1천만)</option>
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">증여공제 (원)</label>
            <input type="text" value={inputs.ceo_giftDeduction || ''} onChange={(e) => setInputs({...inputs, ceo_giftDeduction: formatNumber(e.target.value)})} className="w-full h-[76px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-5 text-xl lg:text-2xl font-black outline-none shadow-inner tracking-tighter" />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">최근 10년 합산증여액</label>
            <input type="text" value={inputs.ceo_giftPrior10y || ''} onChange={(e) => setInputs({...inputs, ceo_giftPrior10y: formatNumber(e.target.value)})} className="w-full h-[76px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-5 text-xl lg:text-2xl font-black outline-none shadow-inner tracking-tighter" />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">증여: 기타 합산자산</label>
            <input type="text" value={inputs.ceo_giftOtherAssets || ''} onChange={(e) => setInputs({...inputs, ceo_giftOtherAssets: formatNumber(e.target.value)})} className="w-full h-[76px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-5 text-xl lg:text-2xl font-black outline-none shadow-inner tracking-tighter" />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">상속: 공제 합계</label>
            <input type="text" value={inputs.ceo_inheritDeduction || '500,000,000'} onChange={(e) => setInputs({...inputs, ceo_inheritDeduction: formatNumber(e.target.value)})} className="w-full h-[76px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-5 text-xl lg:text-2xl font-black outline-none shadow-inner tracking-tighter" />
          </div>
          <div className="space-y-4">
            <label className="text-xl font-bold text-slate-700 block tracking-tight">상속: 기타 상속재산</label>
            <input type="text" value={inputs.ceo_inheritOtherAssets || ''} onChange={(e) => setInputs({...inputs, ceo_inheritOtherAssets: formatNumber(e.target.value)})} className="w-full h-[76px] bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-5 text-xl lg:text-2xl font-black outline-none shadow-inner tracking-tighter" />
          </div>
        </div>

        {/* 가업승계 특례 (토글) */}
        <div className="pt-8 border-t-2 border-slate-50 space-y-8">
           <div className="flex flex-col sm:flex-row sm:items-center gap-6">
             <label className="text-xl font-black text-slate-700 tracking-tight">가업승계 과세특례 적용</label>
             <div className="flex bg-slate-100 p-1.5 rounded-2xl h-[64px] w-full sm:w-[320px] gap-1 shadow-inner">
               <button 
                 onClick={() => setInputs({...inputs, ceo_useSpecial: 'false'})}
                 className={`flex-1 rounded-xl text-lg font-black transition-all ${inputs.ceo_useSpecial === 'false' || !inputs.ceo_useSpecial ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 미사용
               </button>
               <button 
                 onClick={() => setInputs({...inputs, ceo_useSpecial: 'true'})}
                 className={`flex-1 rounded-xl text-lg font-black transition-all ${inputs.ceo_useSpecial === 'true' ? 'bg-[#7f1d1d] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 사용함
               </button>
             </div>
           </div>
           
           {inputs.ceo_useSpecial === 'true' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">특례 공제액 (원)</label>
                  <input type="text" value={inputs.ceo_specialDeduction || '1,000,000,000'} onChange={(e) => setInputs({...inputs, ceo_specialDeduction: formatNumber(e.target.value)})} className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl p-4 font-black outline-none text-xl tracking-tighter" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">2구간 기준액 (원)</label>
                  <input type="text" value={inputs.ceo_specialTier2Threshold || '12,000,000,000'} onChange={(e) => setInputs({...inputs, ceo_specialTier2Threshold: formatNumber(e.target.value)})} className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl p-4 font-black outline-none text-xl tracking-tighter" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">1구간 세율 (%)</label>
                  <input type="number" value={inputs.ceo_specialRate1 || '10'} onChange={(e) => setInputs({...inputs, ceo_specialRate1: e.target.value})} className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl p-4 font-black outline-none text-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">2구간 세율 (%)</label>
                  <input type="number" value={inputs.ceo_specialRate2 || '20'} onChange={(e) => setInputs({...inputs, ceo_specialRate2: e.target.value})} className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl p-4 font-black outline-none text-xl" />
                </div>
             </div>
           )}
        </div>

        {/* 시뮬레이션 모드 (토글) */}
        <div className="pt-8 border-t-2 border-slate-50 space-y-4">
          <label className="text-xl font-black text-slate-700 block tracking-tight">사근복 출연 시뮬레이션 모드</label>
          <div className="flex bg-slate-100 p-2 rounded-[32px] h-[96px] gap-2 shadow-inner">
            <button 
              onClick={() => setInputs({...inputs, ceo_simulateImpact: 'false'})}
              className={`flex-1 rounded-[24px] text-xl font-black transition-all flex flex-col items-center justify-center ${inputs.ceo_simulateImpact === 'false' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="text-sm opacity-60">기초 평가 모드</span>
              <span>독립 평가만 실행</span>
            </button>
            <button 
              onClick={() => setInputs({...inputs, ceo_simulateImpact: 'true'})}
              className={`flex-1 rounded-[24px] text-xl font-black transition-all flex flex-col items-center justify-center ${inputs.ceo_simulateImpact === 'true' || !inputs.ceo_simulateImpact ? 'bg-[#1a5f7a] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="text-sm opacity-60">통합 분석 모드</span>
              <span>사근복 출연 전/후 비교</span>
            </button>
          </div>
        </div>

        <button 
          onClick={calculate} 
          className="w-full bg-slate-900 text-white text-3xl lg:text-5xl font-black py-10 rounded-[48px] hover:bg-black shadow-2xl transition-all transform active:scale-[0.98] group"
        >
          <span>통합 절세 리포트 생성</span>
          <span className="ml-6 group-hover:animate-bounce inline-block">🚀</span>
        </button>
      </div>

      {/* 결과 리포트 리스트 */}
      <div className="pt-16 space-y-12">
        <div className="flex justify-between items-end border-b-4 border-slate-100 pb-8">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">분석 결과 리포트</h2>
          <span className="text-lg font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-6 py-2 rounded-full">CEO Wealth Strategy</span>
        </div>

        {calcResults.filter(r => r.module === ModuleType.CEO_TAX).map((res) => (
          <div key={res.timestamp} className="bg-white p-10 lg:p-14 rounded-[60px] border border-slate-100 shadow-2xl space-y-12 relative overflow-hidden animate-in slide-in-from-bottom-8">
            <button className="absolute top-10 right-10 w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center text-3xl font-black hover:bg-red-500 hover:text-white transition-all z-20 shadow-sm">✕</button>
            <div className="absolute top-0 left-0 w-6 h-full bg-[#1a5f7a]"></div>

            <div className="space-y-4 relative z-10 px-4">
              <div className="text-xl font-black text-[#1a5f7a] uppercase tracking-widest border-b-2 border-blue-100 inline-block pb-1">종합 승계 절세 시나리오 요약</div>
              <h3 className="text-3xl lg:text-4xl font-black text-slate-900 break-keep leading-tight">
                {parseNumber(res.inputs.ceo_sharesToTransfer).toLocaleString()}주 {res.inputs.ceo_simulateImpact === 'true' ? '사근복 연계' : ''} 증여 시나리오
              </h3>
            </div>

            <div className="space-y-12 px-2">
              {/* 사근복 연계 총절세 (CEO 한장 요약) */}
              {res.result.linkedScenario && (
                <div className="bg-[#0f2e44] text-white rounded-[60px] p-10 lg:p-14 shadow-2xl space-y-8 relative overflow-hidden border-4 border-blue-400/30">
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-xl lg:text-2xl font-black text-blue-300 uppercase tracking-widest border-b-2 border-blue-900 pb-1">CEO One-Page Summary (Total Savings)</span>
                    <span className="px-6 py-3 bg-green-500 text-sm font-black rounded-2xl uppercase animate-pulse">Maximum Benefit Route</span>
                  </div>

                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="py-4 text-slate-400 font-bold text-lg">항목</th>
                          <th className="py-4 text-slate-400 font-bold text-lg text-right">금액 / 절감액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="py-5 text-xl font-bold">법인세 절감 (연간 출연금 기준)</td>
                          <td className="py-5 text-xl font-black text-blue-400 text-right">₩{res.result.sagunbokSaving.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="py-5 text-xl font-bold">증여세 감소분 (주식가치 하락 반영)</td>
                          <td className="py-5 text-xl font-black text-green-400 text-right">₩{res.result.linkedScenario.taxReductions.gift.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="py-5 text-xl font-bold">상속세 감소분 (주식가치 하락 반영)</td>
                          <td className="py-5 text-xl font-black text-slate-300 text-right">₩{res.result.linkedScenario.taxReductions.inheritance.toLocaleString()}</td>
                        </tr>
                        {res.result.linkedScenario.totals.totalSavingSpecialRoute != null && (
                          <tr>
                            <td className="py-5 text-xl font-bold">가업승계 특례세 감소분</td>
                            <td className="py-5 text-xl font-black text-red-400 text-right">₩{res.result.linkedScenario.taxReductions.special.toLocaleString()}</td>
                          </tr>
                        )}
                        <tr className="bg-white/5">
                          <td className="py-6 text-2xl font-black text-white">총 절세 효과 (증여 중심 Route)</td>
                          <td className="py-6 text-4xl lg:text-6xl font-black text-white text-right tracking-tighter italic">
                            ₩{res.result.linkedScenario.totals.totalSavingGiftRoute.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="text-slate-500 font-bold text-sm italic relative z-10">※ 주식가치 영향: 출연금 만큼의 순자산(NAV) 감소 및 순이익(EPS) 감소를 보수적으로 가정한 시뮬레이션입니다.</p>
                </div>
              )}

              {/* 기본 평가 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                <div className="bg-[#f8fafc] p-8 rounded-[48px] space-y-4 border-2 border-slate-100 shadow-sm">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">1주당 평가액</div>
                  <div className="text-2xl lg:text-3xl font-black text-slate-900 leading-none break-all tracking-tighter">₩{res.result.valuation.finalPerShare.toLocaleString()}</div>
                  <div className="text-sm font-bold text-slate-400">보충적 평가 가액</div>
                </div>

                <div className="bg-[#f0f7ff] p-8 rounded-[48px] space-y-4 border-2 border-blue-100 shadow-sm">
                  <div className="text-xs font-black text-blue-400 uppercase tracking-widest">평가 지분 총액</div>
                  <div className="text-2xl lg:text-3xl font-black text-blue-700 leading-none break-all tracking-tighter">₩{res.result.totalTransferValue.toLocaleString()}</div>
                  <div className="text-sm font-bold text-blue-500">증여 대상 가액</div>
                </div>

                <div className="bg-[#0f172a] p-8 rounded-[48px] space-y-4 text-white shadow-xl">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">일반 증여세</div>
                  <div className="text-2xl lg:text-3xl font-black text-white leading-none break-all tracking-tighter">₩{res.result.gift.tax.toLocaleString()}</div>
                  <div className="text-sm font-bold text-slate-400">최고 {res.result.gift.rate * 100}% 구간</div>
                </div>

                <div className="bg-[#7f1d1d] p-8 rounded-[48px] space-y-4 text-white shadow-xl">
                  <div className="text-xs font-black text-red-300 uppercase tracking-widest">특례 적용 시</div>
                  <div className="text-2xl lg:text-3xl font-black text-white leading-none break-all tracking-tighter">
                    {res.result.specialSuccession ? `₩${res.result.specialSuccession.tax.toLocaleString()}` : '미적용'}
                  </div>
                  <div className="text-sm font-bold text-red-300">10억 공제 + 저율과세</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 사용 가이드 */}
      <div className="bg-[#f8fafc] rounded-[60px] border-4 border-slate-100 p-12 lg:p-20 space-y-12">
        <h3 className="text-3xl lg:text-5xl font-black text-slate-800 tracking-tight flex items-center gap-4">
          <span>📖</span> 사용 가이드 및 유의사항
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-slate-600">
           <div className="space-y-6">
             <h4 className="text-xl font-black text-slate-900 border-l-8 border-[#1a5f7a] pl-4 tracking-tight">이 계산기의 목적</h4>
             <ul className="list-disc pl-6 space-y-3 font-bold text-lg leading-relaxed">
               <li>상증세법 보충적 평가(순자산+순손익) 공식을 기반으로 주식 가치를 정밀 추정합니다.</li>
               <li>증여·상속·가업승계 시나리오를 한눈에 비교하여 최적의 승계 전략을 도출합니다.</li>
               <li>사근복 출연 시 법인세 절감과 주식가치 하락으로 인한 2차 절세 효과를 합산합니다.</li>
             </ul>
           </div>
           <div className="space-y-6">
             <h4 className="text-xl font-black text-slate-900 border-l-8 border-[#1a5f7a] pl-4 tracking-tight">결과 해석 유의사항</h4>
             <ul className="list-disc pl-6 space-y-3 font-bold text-lg leading-relaxed">
               <li>본 결과는 입력된 데이터를 기반으로 한 <b>시뮬레이션</b>이며 법적 효력은 없습니다.</li>
               <li>부동산 시가조정, 비경상 손익 조정 등은 전문 상담을 통해 정밀화해야 합니다.</li>
               <li>사근복 출연의 가치 하락 효과는 타이밍 및 사업 목적에 따라 변동될 수 있습니다.</li>
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CEOCalculator;
