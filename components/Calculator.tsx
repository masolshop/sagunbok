
import React, { useState } from 'react';
import { ModuleType, CalculationResult, CompanyContext } from '../types';
import { KOREA_REGIONS, INCOME_TAX_BRACKETS } from '../constants';
import { raiseToFundSimulation } from '../utils/calculations';

interface CalculatorProps {
  companyContext: CompanyContext;
  setCompanyContext: (ctx: CompanyContext) => void;
  currentModule: ModuleType;
  setCurrentModule: (m: ModuleType) => void;
  inputs: any;
  setInputs: (inputs: any) => void;
  calcResults: CalculationResult[];
  setCalcResults: React.Dispatch<React.SetStateAction<CalculationResult[]>>;
}

const Calculator: React.FC<CalculatorProps> = ({ 
  companyContext, setCompanyContext, 
  currentModule, setCurrentModule,
  inputs, setInputs,
  calcResults, setCalcResults 
}) => {
  
  const parseNumber = (val: string | number) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(val.toString().replace(/[^0-9]/g, '')) || 0;
  };

  const formatNumber = (val: string) => {
    const num = val.toString().replace(/[^0-9]/g, '');
    return num ? parseInt(num, 10).toLocaleString() : '';
  };

  const convertToKoreanUnit = (value: number | string) => {
    const num = parseNumber(value);
    if (num === 0) return '';
    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    let result = '';
    if (eok > 0) result += `${eok}억 `;
    if (man > 0) result += `${man.toLocaleString()}만`;
    return result.trim() ? `(${result.trim()}원)` : '';
  };

  const calculate = (moduleOverride?: ModuleType) => {
    if (!companyContext.companyName) {
      alert("회사명을 입력해주세요.");
      return;
    }

    const targetModule = moduleOverride || currentModule;
    let result = null;

    if (targetModule === ModuleType.RAISE_TO_FUND) {
      result = raiseToFundSimulation({
        currentMonthlyTaxable: parseNumber(inputs.currentMonthlyTaxable),
        shiftMonthly: parseNumber(inputs.shiftMonthly),
        taxMode: inputs.taxMode,
        bracketRate: Number(inputs.bracketRate || 0.24),
        currentTaxBaseAnnual: parseNumber(inputs.currentTaxBaseAnnual),
        retirementType: inputs.retirementType,
        affectsAvgWage: inputs.affectsAvgWage === 'true',
        expectedReturn: Number(inputs.expectedReturnPct || 3) / 100,
        yearsToRetire: Number(inputs.yearsToRetire || 10),
        yearsServed: Number(inputs.yearsServed || 0)
      });
    } else if (targetModule === ModuleType.WELFARE_CONVERSION) {
      const prevWelfareExp = parseNumber(inputs.prevWelfareExp);
      const convPercent = Number(inputs.convPercent || 0) / 100;
      const totalConvertedAmount = Math.round(prevWelfareExp * convPercent);
      const empCount = companyContext.employeeCount || 1;
      
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
      const taxRate = Number(inputs.taxRate || 0) / 100;
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
      module: targetModule,
      inputs: { ...inputs },
      result,
      timestamp: new Date().toISOString()
    };

    setCalcResults(prev => [newResult, ...prev]);
  };

  const formatCurrency = (val: any) => parseNumber(val).toLocaleString();

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">기업절세계산기</h1>
          <p className="text-lg text-slate-500 mt-2 font-bold italic">기금 출연 및 복리후생비 전환을 통한 법인 세제 혜택 시뮬레이션</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Corporate Calc Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* 기초 정보 입력 */}
          <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">회사명</label>
                <input type="text" value={companyContext.companyName} onChange={(e) => setCompanyContext({...companyContext, companyName: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="회사명 입력" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">전체 직원 수</label>
                <input type="number" value={companyContext.employeeCount || ''} onChange={(e) => setCompanyContext({...companyContext, employeeCount: Number(e.target.value)})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex bg-gray-200/50 p-1.5 rounded-2xl gap-1">
            {[ModuleType.CORP_TAX, ModuleType.PERSONAL_TAX, ModuleType.WELFARE_CONVERSION].map((m) => (
              <button
                key={m}
                onClick={() => setCurrentModule(m)}
                className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${currentModule === m ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-slate-700'}`}
              >
                {m === ModuleType.CORP_TAX ? '법인세 절세' : m === ModuleType.PERSONAL_TAX ? '종합소득세' : '복후비 전환'}
              </button>
            ))}
          </div>

          {/* 입력 섹션 */}
          <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentModule === ModuleType.WELFARE_CONVERSION ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">연간 복리후생비 총액 (원)</label>
                    <input type="text" value={inputs.prevWelfareExp || ''} onChange={(e) => setInputs({...inputs, prevWelfareExp: formatNumber(e.target.value)})} className="w-full border-2 border-gray-100 rounded-2xl p-4 text-xl font-black focus:border-blue-500 outline-none" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">기금 전환 비율</label>
                    <select value={inputs.convPercent || '30'} onChange={(e) => setInputs({...inputs, convPercent: e.target.value})} className="w-full border-2 border-gray-100 rounded-2xl p-4 text-xl font-black outline-none focus:border-blue-500 appearance-none bg-no-repeat bg-[right_1rem_center]">
                      {[10, 20, 30, 40, 50, 70, 100].map(p => <option key={p} value={p}>{p}%</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">전년도 납부 세액 (원)</label>
                    <input type="text" value={inputs.prevTaxPaid || ''} onChange={(e) => setInputs({...inputs, prevTaxPaid: formatNumber(e.target.value)})} className="w-full border-2 border-gray-100 rounded-2xl p-4 text-xl font-black focus:border-blue-500 outline-none" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">기금 출연 예정액 (원)</label>
                    <input type="text" value={inputs.contribution || ''} onChange={(e) => setInputs({...inputs, contribution: formatNumber(e.target.value)})} className="w-full border-2 border-gray-100 rounded-2xl p-4 text-xl font-black focus:border-blue-500 outline-none" placeholder="0" />
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => calculate()} 
              className="w-full mt-8 bg-slate-900 text-xl font-black text-white py-5 rounded-2xl hover:bg-black shadow-lg transition transform active:scale-[0.98]"
            >
              기업 절세 리포트 생성
            </button>
          </div>

          {/* 기업용 결과 섹션 */}
          <div className="space-y-6">
            {calcResults.filter(r => r.module !== ModuleType.RAISE_TO_FUND).slice(0, 1).map((res) => (
              <div key={res.timestamp} className="bg-white p-8 rounded-[32px] border-t-8 border-t-blue-600 shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-800">
                    {res.module === ModuleType.WELFARE_CONVERSION ? '복리후생비 전환 절세 효과' : '기금 출연 절세 결과'}
                   </h3>
                   <span className="text-[10px] text-slate-400 font-bold">{new Date(res.timestamp).toLocaleTimeString()}</span>
                </div>

                {res.module === ModuleType.WELFARE_CONVERSION ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 bg-blue-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-wider">기업 보험료 절감</div>
                      <div className="text-xl font-black text-blue-600">₩{formatCurrency(res.result.employerSaving)}</div>
                    </div>
                    <div className="p-5 bg-green-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-green-400 mb-1 uppercase tracking-wider">근로자 실질소득 증가</div>
                      <div className="text-xl font-black text-green-600">₩{formatCurrency(res.result.employeeSaving)}</div>
                    </div>
                    <div className="p-5 bg-slate-900 text-white rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">총 경제적 효과</div>
                      <div className="text-xl font-black">₩{formatCurrency(res.result.totalSaving)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-blue-50 rounded-[24px]">
                      <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-wider">총 절세 예상액</div>
                      <div className="text-3xl font-black text-blue-600">₩{formatCurrency(res.result.taxSaving)}</div>
                      <p className="text-[10px] text-blue-300 font-bold mt-1">출연액 전액 비용 인정 기준</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[24px] flex flex-col justify-center">
                       <div className="flex justify-between items-center opacity-40 mb-1">
                         <span className="text-[10px] font-black uppercase">기존 세액</span>
                         <span className="line-through font-bold text-sm">₩{formatCurrency(res.result.prevTaxPaid)}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-500">예상 납부액</span>
                         <span className="text-xl font-black text-slate-900">→ ₩{formatCurrency(res.result.netTaxAfterContribution)}</span>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Individual Calc Area */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-blue-600 rounded-[32px] p-1 shadow-xl overflow-hidden">
            <div className="bg-blue-600 px-6 py-5 flex items-center space-x-3 text-white">
              <span className="text-2xl">📊</span>
              <h2 className="text-lg font-black tracking-tight">개인별절세계산기</h2>
            </div>
            
            <div className="bg-white p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">현재 월 과세급여</label>
                  <input type="text" value={inputs.currentMonthlyTaxable || ''} onChange={(e) => setInputs({...inputs, currentMonthlyTaxable: formatNumber(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-base font-black focus:ring-2 focus:ring-blue-500 outline-none" placeholder="예: 4,000,000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">전환할 인상분(월)</label>
                  <input type="text" value={inputs.shiftMonthly || ''} onChange={(e) => setInputs({...inputs, shiftMonthly: formatNumber(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-base font-black focus:ring-2 focus:ring-blue-500 outline-none" placeholder="예: 300,000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">적용 소득세율 구간</label>
                  <select value={inputs.bracketRate || '0.24'} onChange={(e) => setInputs({...inputs, bracketRate: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none">
                    {INCOME_TAX_BRACKETS.map(b => <option key={b.rate} value={b.rate}>{b.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">퇴직제도</label>
                    <select value={inputs.retirementType || 'DB'} onChange={(e) => setInputs({...inputs, retirementType: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="DB">DB</option>
                      <option value="DC">DC</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">잔여 근속(년)</label>
                    <input type="number" value={inputs.yearsToRetire || ''} onChange={(e) => setInputs({...inputs, yearsToRetire: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-base font-black outline-none focus:ring-2 focus:ring-blue-500" placeholder="10" />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => calculate(ModuleType.RAISE_TO_FUND)}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 shadow-lg transition transform active:scale-[0.98]"
              >
                개인별 혜택 분석
              </button>

              {/* 개인별 결과 (미니 뷰) */}
              {calcResults.filter(r => r.module === ModuleType.RAISE_TO_FUND).slice(0, 1).map((res) => (
                <div key={res.timestamp} className="bg-slate-50 p-5 rounded-2xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                    <span className="text-[10px] font-black text-blue-500 uppercase">분석 결과</span>
                    <span className="text-[10px] text-slate-300 font-bold">{new Date(res.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">연간 절세 혜택</span>
                      <span className="text-base font-black text-blue-600">₩{formatCurrency(res.result.empTotalSavingA)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">퇴직 시 실질이익</span>
                      <span className="text-base font-black text-green-600">₩{formatCurrency(res.result.netBenefit)}</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-100 text-center">
                      <div className="text-[9px] font-bold text-slate-300 mb-1 uppercase tracking-widest">손익분기점</div>
                      <div className="text-sm font-black text-slate-700">{res.result.breakEvenYears.toFixed(1)}년 이상 근속 시 이득</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <h4 className="text-xs font-black text-slate-900 mb-3 uppercase tracking-widest">💡 전문가 팁</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              임금 인상분의 일부를 기금으로 전환하여 지급하면, 직원 입장에서는 4대보험료와 소득세가 비과세되어 실수령액이 높아지는 효과가 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
