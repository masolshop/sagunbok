
import React, { useState } from 'react';
import { ModuleType, CalculationResult, CompanyContext } from '../types';
import { KOREA_REGIONS } from '../constants';

interface CorporateCalculatorProps {
  companyContext: CompanyContext;
  setCompanyContext: (ctx: CompanyContext) => void;
  inputs: any;
  setInputs: (inputs: any) => void;
  calcResults: CalculationResult[];
  setCalcResults: React.Dispatch<React.SetStateAction<CalculationResult[]>>;
}

const CorporateCalculator: React.FC<CorporateCalculatorProps> = ({ 
  companyContext, setCompanyContext, 
  inputs, setInputs,
  calcResults, setCalcResults 
}) => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.WELFARE_CONVERSION);

  const parseNumber = (val: string | number) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(val.toString().replace(/[^0-9]/g, '')) || 0;
  };

  const formatNumber = (val: string) => {
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

  const convertToKoreanUnit = (value: number | string) => {
    const num = parseNumber(value);
    if (num === 0) return '0원';
    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    let result = '';
    if (eok > 0) result += `${eok}억 `;
    if (man > 0) result += `${man.toLocaleString()}만`;
    return result.trim() + '원';
  };

  const calculate = () => {
    if (!companyContext.companyName) {
      alert("회사명을 입력해주세요.");
      return;
    }

    let result = null;
    const empCount = companyContext.employeeCount || 1;

    if (currentModule === ModuleType.WELFARE_CONVERSION) {
      const prevWelfareExp = parseNumber(inputs.prevWelfareExp);
      const convPercent = Number(inputs.convPercent || 0) / 100;
      const totalConvertedAmount = Math.round(prevWelfareExp * convPercent);
      
      const employerSaving = Math.round(totalConvertedAmount * 0.11);
      const employeeSaving = Math.round(totalConvertedAmount * 0.25);
      const totalSaving = employerSaving + employeeSaving;
      
      result = {
        prevWelfareExp,
        totalConvertedAmount,
        employerSaving,
        employeeSaving,
        totalSaving,
        perEmpEmployerSaving: Math.round(employerSaving / empCount),
        perEmpEmployeeSaving: Math.round(employeeSaving / empCount),
        perEmpTotalSaving: Math.round(totalSaving / empCount),
        perEmpPrevWelfareExp: Math.round(prevWelfareExp / empCount),
      };
    } else {
      const contribution = parseNumber(inputs.contribution);
      const taxRate = Number(inputs.taxRate || (currentModule === ModuleType.CORP_TAX ? 19 : 24)) / 100;
      const mainTaxSaving = Math.round(contribution * taxRate);
      const localTaxSaving = Math.round(mainTaxSaving * 0.1);
      result = {
        contribution,
        taxSaving: mainTaxSaving + localTaxSaving,
        mainTaxSaving,
        localTaxSaving,
        netTaxAfterContribution: Math.max(0, parseNumber(inputs.prevTaxPaid) - (mainTaxSaving + localTaxSaving)),
        appliedRate: inputs.taxRate,
        prevTaxPaid: parseNumber(inputs.prevTaxPaid)
      };
    }

    const newResult: CalculationResult = {
      module: currentModule,
      inputs: { ...inputs },
      result,
      timestamp: new Date().toISOString()
    };

    setCalcResults(prev => [newResult, ...prev]);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">기업절세계산기</h1>
        <p className="text-2xl lg:text-3xl text-slate-500 mt-6 font-bold leading-relaxed">사내근로복지기금 출연 시 발생하는 실질적인 세무 이익을 산출합니다.</p>
      </header>

      {/* 1. 필수 정보 입력 섹션 */}
      <div className="bg-[#f1f7ff] rounded-[48px] border-4 border-blue-100 p-10 lg:p-14 space-y-10 shadow-xl">
        <h3 className="flex items-center gap-4 text-blue-700 font-black text-3xl lg:text-4xl">
          <span>🏢</span> 계산 전 필수 정보 입력
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-blue-600 block">회사명</label>
            <input 
              type="text" 
              value={companyContext.companyName} 
              onChange={(e) => setCompanyContext({...companyContext, companyName: e.target.value})} 
              className="w-full bg-white border-4 border-transparent focus:border-blue-400 rounded-2xl p-7 text-2xl lg:text-3xl font-bold outline-none shadow-sm transition-all" 
              placeholder="페마연" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-blue-600 block">지역 (시/도)</label>
            <select 
              value={companyContext.region} 
              onChange={(e) => setCompanyContext({...companyContext, region: e.target.value})} 
              className="w-full bg-white border-4 border-transparent focus:border-blue-400 rounded-2xl p-7 text-2xl lg:text-3xl font-bold outline-none shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1.5rem_center]"
            >
              {KOREA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xl lg:text-2xl font-black text-blue-600 block">전체 직원 수 (명)</label>
              <a href="/api/bulk/template" className="text-xs font-black text-blue-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                <span>📥 템플릿 다운로드</span>
              </a>
            </div>
            <input 
              type="number" 
              value={companyContext.employeeCount || ''} 
              onChange={(e) => setCompanyContext({...companyContext, employeeCount: Number(e.target.value)})} 
              className="w-full bg-white border-4 border-transparent focus:border-blue-400 rounded-2xl p-7 text-2xl lg:text-3xl font-bold outline-none shadow-sm transition-all" 
              placeholder="500" 
            />
          </div>
        </div>
      </div>

      {/* 2. 탭 메뉴 */}
      <div className="flex bg-slate-100 p-4 rounded-[40px] gap-4 shadow-inner">
        {[ModuleType.WELFARE_CONVERSION, ModuleType.CORP_TAX, ModuleType.PERSONAL_TAX].map((m) => (
          <button
            key={m}
            onClick={() => setCurrentModule(m)}
            className={`flex-1 py-7 text-xl lg:text-3xl font-black rounded-[32px] transition-all duration-300 ${currentModule === m ? 'bg-white shadow-2xl text-blue-600 ring-1 ring-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
          >
            {m === ModuleType.WELFARE_CONVERSION ? '복리후생비절세' : m === ModuleType.CORP_TAX ? '법인세절세' : '종합소득세절세'}
          </button>
        ))}
      </div>

      {/* 3. 상세 입력 필드 */}
      <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {currentModule === ModuleType.WELFARE_CONVERSION ? (
            <>
              <div className="space-y-6">
                <label className="text-2xl lg:text-4xl font-black text-slate-700 block tracking-tight">전년도 복리후생비 집행 총액 (원)</label>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={inputs.prevWelfareExp || ''} 
                    onChange={(e) => setInputs({...inputs, prevWelfareExp: formatNumber(e.target.value)})} 
                    className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 lg:p-10 text-2xl lg:text-4xl font-black outline-none shadow-inner tracking-tighter" 
                    placeholder="0" 
                  />
                  <div className="bg-blue-50/50 border-2 border-blue-100 rounded-2xl p-4 flex justify-end items-center gap-3">
                    <span className="text-blue-600 font-black text-2xl lg:text-4xl">{convertToKoreanUnitParts(inputs.prevWelfareExp).eok}</span>
                    <span className="text-blue-400 font-black text-2xl lg:text-4xl">{convertToKoreanUnitParts(inputs.prevWelfareExp).man}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <label className="text-2xl lg:text-4xl font-black text-slate-700 block tracking-tight">기금 전환 비율 (%)</label>
                <div className="relative">
                  <select 
                    value={inputs.convPercent || '30'} 
                    onChange={(e) => setInputs({...inputs, convPercent: e.target.value})} 
                    className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 lg:p-10 text-2xl lg:text-4xl font-black outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_2.5rem_center]"
                  >
                    {[10, 20, 30, 40, 50, 70, 100].map(p => <option key={p} value={p}>{p}%</option>)}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-6">
                <label className="text-2xl lg:text-4xl font-black text-slate-700 block tracking-tight">
                  {currentModule === ModuleType.CORP_TAX ? '전년도 법인세 납부액 (원)' : '전년도 종합소득세 납부액 (원)'}
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={inputs.prevTaxPaid || ''} 
                    onChange={(e) => setInputs({...inputs, prevTaxPaid: formatNumber(e.target.value)})} 
                    className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 lg:p-10 text-2xl lg:text-4xl font-black outline-none shadow-inner tracking-tighter" 
                    placeholder="300,000,000" 
                  />
                  {inputs.prevTaxPaid && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <span className="text-blue-600 font-black text-xl lg:text-3xl">{convertToKoreanUnitParts(inputs.prevTaxPaid).eok}</span>
                      <span className="text-blue-400 font-black text-xl lg:text-3xl">{convertToKoreanUnitParts(inputs.prevTaxPaid).man}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <label className="text-2xl lg:text-4xl font-black text-slate-700 block tracking-tight">적용 세율 (%)</label>
                <select 
                  value={inputs.taxRate || '19'} 
                  onChange={(e) => setInputs({...inputs, taxRate: e.target.value})} 
                  className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 lg:p-10 text-2xl lg:text-4xl font-black outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_2.5rem_center]"
                >
                  {currentModule === ModuleType.CORP_TAX 
                    ? [9, 19, 21, 24].map(v => <option key={v} value={v}>{v}%</option>)
                    : [6, 15, 24, 35, 38, 40, 42, 45].map(v => <option key={v} value={v}>{v}%</option>)}
                </select>
              </div>
              <div className="space-y-6 md:col-span-2">
                <label className="text-2xl lg:text-4xl font-black text-slate-700 block tracking-tight">기금 출연 예정액 (원)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={inputs.contribution || ''} 
                    onChange={(e) => setInputs({...inputs, contribution: formatNumber(e.target.value)})} 
                    className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[32px] p-8 lg:p-10 text-2xl lg:text-4xl font-black outline-none shadow-inner tracking-tighter" 
                    placeholder="50,000,000" 
                  />
                  {inputs.contribution && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <span className="text-blue-600 font-black text-xl lg:text-3xl">{convertToKoreanUnitParts(inputs.contribution).eok}</span>
                      <span className="text-blue-400 font-black text-xl lg:text-3xl">{convertToKoreanUnitParts(inputs.contribution).man}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={calculate} 
          className="w-full bg-[#1a5f7a] text-white text-3xl lg:text-5xl font-black py-12 rounded-[48px] hover:bg-[#0f2e44] shadow-2xl transition-all transform active:scale-[0.98] group"
        >
          <span>시뮬레이션 실행</span>
          <span className="ml-6 group-hover:animate-bounce inline-block">🚀</span>
        </button>
      </div>

      {/* 5. 시뮬레이션 히스토리 */}
      <div className="pt-16 space-y-12">
        <div className="flex justify-between items-end border-b-4 border-slate-100 pb-8">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">시뮬레이션 히스토리</h2>
          <span className="text-lg font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-6 py-2 rounded-full">Recent Analytics</span>
        </div>

        {calcResults.filter(r => r.module === currentModule).map((res) => (
          <div key={res.timestamp} className="bg-white p-10 lg:p-14 rounded-[60px] border border-slate-100 shadow-2xl space-y-12 relative overflow-hidden animate-in slide-in-from-bottom-8">
            <button className="absolute top-10 right-10 w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center text-3xl font-black hover:bg-red-500 hover:text-white transition-all z-20 shadow-sm">✕</button>
            <div className="absolute top-0 left-0 w-6 h-full bg-blue-500"></div>

            {res.module === ModuleType.WELFARE_CONVERSION && (
              <div className="space-y-4 relative z-10 px-4">
                <div className="text-xl font-black text-blue-500 uppercase tracking-widest border-b-2 border-blue-100 inline-block pb-1">
                  복리후생비절세 시뮬레이션
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-slate-900 break-keep leading-tight">
                  연간 ₩{parseNumber(res.inputs.prevWelfareExp).toLocaleString()} 중
                </h3>
                <p className="text-slate-400 font-bold text-xl lg:text-2xl mt-1">({convertToKoreanUnit(res.inputs.prevWelfareExp)} / 1인당 연평균 ₩{Math.round(parseNumber(res.inputs.prevWelfareExp) / (companyContext.employeeCount || 1)).toLocaleString()})</p>
              </div>
            )}

            {res.module === ModuleType.WELFARE_CONVERSION ? (
              <div className="space-y-12 px-2">
                <div className="bg-[#0f2e44] text-white rounded-[60px] p-10 lg:p-14 shadow-2xl space-y-12 relative overflow-hidden">
                  <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-lg lg:text-xl font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-700 pb-1">Total Company Impact ({companyContext.employeeCount || 0}명 규모)</span>
                      <span className="px-5 py-2 bg-blue-500 text-xs font-black rounded-2xl uppercase shadow-lg shadow-blue-500/30">Annual Estimate</span>
                    </div>
                    <div className="text-center">
                      <div className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl shadow-lg">
                        <span className="text-2xl lg:text-3xl font-black text-white">
                          복리후생비 {res.inputs.convPercent}% 기금 전환시 절세 효과
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-white/10 pb-14 relative z-10">
                    <div className="space-y-6">
                      <div className="text-2xl lg:text-3xl font-black text-slate-400">기업 4대보험 총 절감액 (약 11%)</div>
                      <div className="text-3xl lg:text-4xl font-black text-blue-400 break-all leading-tight tracking-tighter">₩{res.result.employerSaving.toLocaleString()}</div>
                      <div className="text-3xl lg:text-4xl font-bold text-slate-500">({convertToKoreanUnit(res.result.employerSaving)})</div>
                    </div>
                    <div className="space-y-6">
                      <div className="text-2xl lg:text-3xl font-black text-slate-400">근로자 전체 실질소득 증가</div>
                      <div className="text-3xl lg:text-4xl font-black text-green-400 break-all leading-tight tracking-tighter">₩{res.result.employeeSaving.toLocaleString()}</div>
                      <div className="text-3xl lg:text-4xl font-bold text-slate-500">({convertToKoreanUnit(res.result.employeeSaving)})</div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative z-10">
                    <div className="text-2xl lg:text-3xl font-black text-slate-300">합계 총 절감액 (Company + Employee)</div>
                    <div className="text-left lg:text-right space-y-4 max-w-full overflow-hidden">
                      <div className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter leading-tight text-white break-all">₩{res.result.totalSaving.toLocaleString()}</div>
                      <div className="text-3xl lg:text-4xl font-black text-slate-500 italic">({convertToKoreanUnit(res.result.totalSaving)})</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                  <div className="bg-slate-50 p-10 rounded-[48px] space-y-6 border-2 border-slate-100 flex flex-col justify-between shadow-sm">
                    <div className="text-lg lg:text-xl font-black text-slate-400 uppercase tracking-widest">기존 1인당 복후비</div>
                    <div className="text-xl lg:text-2xl xl:text-3xl font-black text-slate-900 leading-tight break-all">₩{res.result.perEmpPrevWelfareExp.toLocaleString()}</div>
                    <div className="text-2xl lg:text-3xl font-bold text-slate-400 mt-1">약 {Math.round(res.result.perEmpPrevWelfareExp/10000)}만원</div>
                  </div>
                  <div className="bg-blue-50 p-10 rounded-[48px] space-y-6 border-2 border-blue-100 flex flex-col justify-between shadow-sm">
                    <div className="text-lg lg:text-xl font-black text-blue-400 uppercase tracking-widest">1인 기업보험 절감</div>
                    <div className="text-xl lg:text-2xl xl:text-3xl font-black text-blue-700 leading-tight break-all">₩{res.result.perEmpEmployerSaving.toLocaleString()}</div>
                    <div className="text-2xl lg:text-3xl font-bold text-blue-400 mt-1">약 {Math.round(res.result.perEmpEmployerSaving/10000)}만원</div>
                  </div>
                  <div className="bg-green-50 p-10 rounded-[48px] space-y-6 border-2 border-green-100 flex flex-col justify-between shadow-sm">
                    <div className="text-lg lg:text-xl font-black text-green-400 uppercase tracking-widest">1인 실질소득 증가</div>
                    <div className="text-xl lg:text-2xl xl:text-3xl font-black text-green-700 leading-tight break-all">₩{res.result.perEmpEmployeeSaving.toLocaleString()}</div>
                    <div className="text-2xl lg:text-3xl font-bold text-green-400 mt-1">약 {Math.round(res.result.perEmpEmployeeSaving/10000)}만원</div>
                  </div>
                  <div className="bg-slate-900 p-10 rounded-[48px] space-y-6 text-white flex flex-col justify-between shadow-xl">
                    <div className="text-lg lg:text-xl font-black text-slate-400 uppercase tracking-widest">1인 평균 총 혜택</div>
                    <div className="text-xl lg:text-2xl xl:text-3xl font-black text-white leading-tight break-all">₩{res.result.perEmpTotalSaving.toLocaleString()}</div>
                    <div className="text-2xl lg:text-3xl font-bold text-slate-500 mt-1">약 {Math.round(res.result.perEmpTotalSaving/10000)}만원</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-10 px-2">
                {/* 기금출연시 절세효과 제목 */}
                <div className="text-center">
                  <div className="inline-block px-12 py-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-[40px] shadow-2xl">
                    <span className="text-3xl lg:text-5xl font-black text-white">
                      {parseNumber(res.inputs.contribution).toLocaleString()}원 기금출연시 절세효과
                    </span>
                  </div>
                </div>

                <div className="space-y-10">
                  {/* 상단 박스: 최종 절세 예상액 */}
                  <div className="p-12 lg:p-16 bg-blue-50 rounded-[60px] border-4 border-blue-100 space-y-10 shadow-xl">
                    <div className="space-y-8">
                      <div className="text-2xl lg:text-3xl font-black text-blue-400 uppercase tracking-widest">최종 절세 예상액 (국세+지방세)</div>
                      <div className="text-4xl lg:text-6xl xl:text-7xl font-black text-blue-700 leading-tight tracking-tighter">₩{res.result.taxSaving.toLocaleString()}</div>
                      <div className="text-3xl lg:text-4xl text-blue-400 font-black">({convertToKoreanUnit(res.result.taxSaving)})</div>
                    </div>
                    <div className="grid grid-cols-2 gap-10 pt-10 border-t-4 border-blue-200 mt-10">
                      <div className="space-y-4">
                        <div className="text-xl lg:text-2xl text-blue-300 font-black uppercase">국세 절감액</div>
                        <div className="font-black text-blue-700 text-2xl lg:text-4xl tracking-tight">₩{res.result.mainTaxSaving.toLocaleString()}</div>
                      </div>
                      <div className="space-y-4">
                        <div className="text-xl lg:text-2xl text-blue-300 font-black uppercase">지방세 (10%)</div>
                        <div className="font-black text-blue-700 text-2xl lg:text-4xl tracking-tight">₩{res.result.localTaxSaving.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* 하단 박스: 출연 전후 비교 */}
                  <div className="p-12 lg:p-16 bg-[#0f2e44] rounded-[60px] space-y-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/5 rounded-full blur-3xl"></div>
                    <div className="space-y-8 relative z-10">
                      <div className="flex justify-between items-center pb-8 border-b-2 border-white/10">
                        <span className="text-2xl lg:text-3xl font-black uppercase tracking-widest text-slate-400">출연 전 납부세액</span>
                        <span className="line-through font-bold text-3xl lg:text-5xl tracking-tighter italic text-slate-500">₩{res.result.prevTaxPaid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl lg:text-3xl font-black uppercase tracking-widest text-slate-300">출연 후 예상 세액</span>
                        <div className="text-right space-y-4">
                          <div className="text-4xl lg:text-6xl xl:text-7xl font-black text-green-400 leading-tight tracking-tighter">₩{res.result.netTaxAfterContribution.toLocaleString()}</div>
                          <div className="text-xl lg:text-2xl text-slate-400 font-bold bg-white/5 px-6 py-3 rounded-full inline-block">약 {Math.round((res.result.taxSaving / res.result.prevTaxPaid) * 100 || 0)}% 감소 효과</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 6. 노란색 안내 박스 */}
      <div className="bg-[#fffdf0] rounded-[60px] border-[6px] border-[#ffeaa7] p-12 lg:p-20 space-y-12 shadow-inner mt-20">
        <div className="flex items-center gap-6 text-4xl lg:text-5xl font-black text-[#d4a017]">
          <span>💡</span> 기금 도입 및 절세 원리 안내
        </div>
        <div className="space-y-10">
          <p className="text-2xl lg:text-3xl text-[#7f6311] leading-relaxed font-bold">
            통상임금(급여·상여 등 임금성 보수)과 복리후생(복지 목적사업)은 법적 성격이 다릅니다. 사내근로복지기금은 「근로복지기본법」에 근거한 제도로, 임금과 구분되는 복지 목적사업으로 설계·운영할 수 있으며, 관련 규정·의사결정 절차·지급기준·증빙을 적정하게 갖춘 경우 「법인세법」상 손금산입 범위 및 「소득세법」상 과세 범위(또는 보험료 부과 구조)가 달라질 수 있어 기업과 근로자 모두 절세 효과가 발생할 수 있습니다.
          </p>
          <div className="p-10 lg:p-14 bg-white/60 rounded-[48px] border-4 border-[#ffeaa7]/50 shadow-sm">
            <p className="text-xl lg:text-2xl text-[#b59210] font-bold leading-relaxed italic">
              다만 실제 절세 가능 여부 및 금액은 임금대체 여부, 지급의 정기성·고정성, 대상자 선정 및 지급기준의 구체성, 사규/규정의 정비 및 증빙 관리 등 개별 사정에 따라 달라질 수 있으므로, 본 계산기는 이해를 돕기 위한 추정 시뮬레이션으로 활용해 주세요.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CorporateCalculator;
