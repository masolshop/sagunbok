
import React, { useState } from 'react';
import { ModuleType, CalculationResult, CompanyContext } from '../types';
import { INCOME_TAX_BRACKETS } from '../constants';
import { raiseToFundSimulation } from '../utils/calculations';

interface EmployeeCalculatorProps {
  companyContext: CompanyContext;
  setCompanyContext: (ctx: CompanyContext) => void;
  inputs: any;
  setInputs: (inputs: any) => void;
  calcResults: CalculationResult[];
  setCalcResults: React.Dispatch<React.SetStateAction<CalculationResult[]>>;
}

const EmployeeCalculator: React.FC<EmployeeCalculatorProps> = ({ 
  companyContext, setCompanyContext,
  inputs, setInputs,
  calcResults, setCalcResults 
}) => {
  const [tab, setTab] = useState<'raise' | 'welfare'>('raise');
  const [welfareResult, setWelfareResult] = useState<any>(null);
  
  const handleDeleteResult = (timestamp: string) => {
    setCalcResults(prev => prev.filter(r => r.timestamp !== timestamp));
  };
  
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
    if (num === 0) return '0원';
    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    let result = '';
    if (eok > 0) result += `${eok}억 `;
    if (man > 0) result += `${man.toLocaleString()}만`;
    return result.trim() + '원';
  };

  const calculate = () => {
    const result = raiseToFundSimulation({
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

    const newResult: CalculationResult = {
      module: ModuleType.RAISE_TO_FUND,
      inputs: { ...inputs },
      result,
      timestamp: new Date().toISOString()
    };

    setCalcResults(prev => [newResult, ...prev]);
  };

  const calculateWelfare = () => {
    const welfareMonthly = parseNumber(inputs.welfareMonthly || 0);
    const welfareAnnual = welfareMonthly * 12;
    const employeeCount = parseNumber(inputs.employeeCount || 1);
    const corporateTaxRate = Number(inputs.corporateTaxRate || 0.24); // 법인세율
    const employeeTaxRate = Number(inputs.bracketRate || 0.24); // 직원 소득세율
    
    // 기업 절세액 계산 (복리후생비는 손금 인정)
    const companySavingMonthly = welfareMonthly * corporateTaxRate;
    const companySavingAnnual = welfareAnnual * corporateTaxRate;
    
    // 직원 절세액 계산 (복리후생비는 비과세)
    const employeeSavingMonthly = welfareMonthly * (employeeTaxRate * 1.1); // 소득세 + 지방소득세
    const employeeSavingAnnual = welfareAnnual * (employeeTaxRate * 1.1);
    
    // 전체 직원 절세액
    const totalCompanySavingMonthly = companySavingMonthly * employeeCount;
    const totalCompanySavingAnnual = companySavingAnnual * employeeCount;
    const totalEmployeeSavingMonthly = employeeSavingMonthly * employeeCount;
    const totalEmployeeSavingAnnual = employeeSavingAnnual * employeeCount;
    
    // 기업 + 직원 합산 절세액
    const totalSavingMonthly = totalCompanySavingMonthly + totalEmployeeSavingMonthly;
    const totalSavingAnnual = totalCompanySavingAnnual + totalEmployeeSavingAnnual;
    
    setWelfareResult({
      welfareMonthly,
      welfareAnnual,
      employeeCount,
      // 1인당
      companySavingMonthly,
      companySavingAnnual,
      employeeSavingMonthly,
      employeeSavingAnnual,
      perPersonTotalMonthly: companySavingMonthly + employeeSavingMonthly,
      perPersonTotalAnnual: companySavingAnnual + employeeSavingAnnual,
      // 전체
      totalCompanySavingMonthly,
      totalCompanySavingAnnual,
      totalEmployeeSavingMonthly,
      totalEmployeeSavingAnnual,
      totalSavingMonthly,
      totalSavingAnnual
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="space-y-4">
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">직원절세계산기</h1>
        <p className="text-2xl lg:text-3xl text-slate-500 font-bold leading-relaxed">임금 인상분 기금 전환 및 복리후생비 절세액을 시뮬레이션합니다.</p>
      </header>

      {/* 탭 버튼 */}
      <div className="flex gap-4">
        <button
          onClick={() => setTab('raise')}
          className={`flex-1 px-8 py-8 rounded-3xl text-2xl lg:text-3xl font-black transition-all ${
            tab === 'raise'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-slate-400 hover:text-slate-600 border-4 border-slate-100'
          }`}
        >
          임금인상→기금전환
        </button>
        <button
          onClick={() => setTab('welfare')}
          className={`flex-1 px-8 py-8 rounded-3xl text-2xl lg:text-3xl font-black transition-all ${
            tab === 'welfare'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-slate-400 hover:text-slate-600 border-4 border-slate-100'
          }`}
        >
          복리후생비 절세액
        </button>
      </div>

      {/* 임금인상→기금전환 탭 */}
      {tab === 'raise' && (
      <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-12">
        <h3 className="flex items-center gap-4 text-blue-700 font-black text-3xl lg:text-4xl">
          <span>👤</span> 개인별 시뮬레이션 데이터 입력
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">현재 월 과세급여 (원)</label>
            <input 
              type="text" 
              value={inputs.currentMonthlyTaxable || ''} 
              onChange={(e) => setInputs({...inputs, currentMonthlyTaxable: formatNumber(e.target.value)})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[24px] p-7 text-2xl lg:text-4xl font-black outline-none transition-all shadow-inner tracking-tighter" 
              placeholder="0" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">전환할 인상분 (월, 원)</label>
            <input 
              type="text" 
              value={inputs.shiftMonthly || ''} 
              onChange={(e) => setInputs({...inputs, shiftMonthly: formatNumber(e.target.value)})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[24px] p-7 text-2xl lg:text-4xl font-black outline-none transition-all shadow-inner tracking-tighter" 
              placeholder="0" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">적용 소득세율 구간</label>
            <select 
              value={inputs.bracketRate || '0.24'} 
              onChange={(e) => setInputs({...inputs, bracketRate: e.target.value})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[24px] p-7 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1.5rem_center]"
            >
              {INCOME_TAX_BRACKETS.map(b => <option key={b.rate} value={b.rate}>{b.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-xl lg:text-2xl font-black text-slate-700 block">퇴직제도</label>
              <select 
                value={inputs.retirementType || 'DB'} 
                onChange={(e) => setInputs({...inputs, retirementType: e.target.value})} 
                className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[24px] p-7 text-lg lg:text-2xl font-black outline-none transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center]"
              >
                <option value="DB">DB(확정급여)</option>
                <option value="DC">DC(확정기여)</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-xl lg:text-2xl font-black text-slate-700 block">잔여 근속 (년)</label>
              <input 
                type="number" 
                value={inputs.yearsToRetire || ''} 
                onChange={(e) => setInputs({...inputs, yearsToRetire: e.target.value})} 
                className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-[24px] p-7 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner" 
                placeholder="10" 
              />
            </div>
          </div>
        </div>

        <button 
          onClick={calculate} 
          className="w-full bg-[#1a5f7a] text-white text-3xl lg:text-5xl font-black py-10 rounded-[48px] hover:bg-[#0f2e44] shadow-2xl transition-all transform active:scale-[0.98] group"
        >
          <span>분석 실행</span>
          <span className="ml-6 group-hover:animate-bounce inline-block">⚡</span>
        </button>
      </div>
      )}

      {/* 복리후생비 절세액 탭 */}
      {tab === 'welfare' && (
      <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-12">
        <h3 className="flex items-center gap-4 text-emerald-700 font-black text-3xl lg:text-4xl">
          <span>💰</span> 복리후생비 기금지급 절세액 계산
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">월 복리후생비 (원)</label>
            <input 
              type="text" 
              value={inputs.welfareMonthly || ''} 
              onChange={(e) => setInputs({...inputs, welfareMonthly: formatNumber(e.target.value)})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-emerald-500 rounded-[24px] p-7 text-2xl lg:text-4xl font-black outline-none transition-all shadow-inner tracking-tighter" 
              placeholder="500,000" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">전체 직원수 (명)</label>
            <input 
              type="text" 
              value={inputs.employeeCount || ''} 
              onChange={(e) => setInputs({...inputs, employeeCount: formatNumber(e.target.value)})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-emerald-500 rounded-[24px] p-7 text-2xl lg:text-4xl font-black outline-none transition-all shadow-inner tracking-tighter" 
              placeholder="10" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">법인세율</label>
            <select 
              value={inputs.corporateTaxRate || '0.24'} 
              onChange={(e) => setInputs({...inputs, corporateTaxRate: e.target.value})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-emerald-500 rounded-[24px] p-7 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1.5rem_center]"
            >
              <option value="0.10">10% (과세표준 2억 이하)</option>
              <option value="0.20">20% (2억~200억)</option>
              <option value="0.22">22% (200억~3000억)</option>
              <option value="0.24">24% (3000억 초과)</option>
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">직원 평균 소득세율</label>
            <select 
              value={inputs.bracketRate || '0.24'} 
              onChange={(e) => setInputs({...inputs, bracketRate: e.target.value})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-emerald-500 rounded-[24px] p-7 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1.5rem_center]"
            >
              {INCOME_TAX_BRACKETS.map(b => <option key={b.rate} value={b.rate}>{b.label}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={calculateWelfare} 
          className="w-full bg-emerald-600 text-white text-3xl lg:text-5xl font-black py-10 rounded-[48px] hover:bg-emerald-700 shadow-2xl transition-all transform active:scale-[0.98] group"
        >
          <span>절세액 계산</span>
          <span className="ml-6 group-hover:animate-bounce inline-block">💰</span>
        </button>

        {welfareResult && (
          <div className="space-y-10 pt-8">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-[60px] p-12 lg:p-16 shadow-2xl space-y-8">
              <div className="text-2xl lg:text-3xl font-black text-emerald-100">💼 복리후생비 절세 효과</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-3xl p-8 space-y-3">
                  <div className="text-xl lg:text-2xl font-bold text-emerald-100">월 복리후생비</div>
                  <div className="text-3xl lg:text-5xl font-black">₩{welfareResult.welfareMonthly.toLocaleString()}</div>
                  <div className="text-xl lg:text-2xl font-bold text-emerald-200">{convertToKoreanUnit(welfareResult.welfareMonthly)}</div>
                </div>
                <div className="bg-white/10 rounded-3xl p-8 space-y-3">
                  <div className="text-xl lg:text-2xl font-bold text-emerald-100">연 복리후생비</div>
                  <div className="text-3xl lg:text-5xl font-black">₩{welfareResult.welfareAnnual.toLocaleString()}</div>
                  <div className="text-xl lg:text-2xl font-bold text-emerald-200">{convertToKoreanUnit(welfareResult.welfareAnnual)}</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-4 border-blue-100 rounded-[60px] p-12 space-y-8">
              <div className="text-3xl lg:text-4xl font-black text-blue-900">👤 직원 1인당 절세액</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-8 space-y-3 shadow-sm">
                  <div className="text-lg font-black text-blue-600 uppercase">기업 절세 (월)</div>
                  <div className="text-2xl lg:text-3xl font-black text-blue-900">₩{welfareResult.companySavingMonthly.toLocaleString()}</div>
                  <div className="text-lg font-bold text-blue-500">{convertToKoreanUnit(welfareResult.companySavingMonthly)}</div>
                </div>
                <div className="bg-white rounded-3xl p-8 space-y-3 shadow-sm">
                  <div className="text-lg font-black text-emerald-600 uppercase">직원 절세 (월)</div>
                  <div className="text-2xl lg:text-3xl font-black text-emerald-900">₩{welfareResult.employeeSavingMonthly.toLocaleString()}</div>
                  <div className="text-lg font-bold text-emerald-500">{convertToKoreanUnit(welfareResult.employeeSavingMonthly)}</div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-8 space-y-3 shadow-lg">
                  <div className="text-lg font-black text-slate-400 uppercase">합계 (월)</div>
                  <div className="text-2xl lg:text-3xl font-black text-white">₩{welfareResult.perPersonTotalMonthly.toLocaleString()}</div>
                  <div className="text-lg font-bold text-slate-400">{convertToKoreanUnit(welfareResult.perPersonTotalMonthly)}</div>
                </div>
                <div className="bg-white rounded-3xl p-8 space-y-3 shadow-sm">
                  <div className="text-lg font-black text-blue-600 uppercase">기업 절세 (연)</div>
                  <div className="text-2xl lg:text-3xl font-black text-blue-900">₩{welfareResult.companySavingAnnual.toLocaleString()}</div>
                  <div className="text-lg font-bold text-blue-500">{convertToKoreanUnit(welfareResult.companySavingAnnual)}</div>
                </div>
                <div className="bg-white rounded-3xl p-8 space-y-3 shadow-sm">
                  <div className="text-lg font-black text-emerald-600 uppercase">직원 절세 (연)</div>
                  <div className="text-2xl lg:text-3xl font-black text-emerald-900">₩{welfareResult.employeeSavingAnnual.toLocaleString()}</div>
                  <div className="text-lg font-bold text-emerald-500">{convertToKoreanUnit(welfareResult.employeeSavingAnnual)}</div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-8 space-y-3 shadow-lg">
                  <div className="text-lg font-black text-slate-400 uppercase">합계 (연)</div>
                  <div className="text-2xl lg:text-3xl font-black text-white">₩{welfareResult.perPersonTotalAnnual.toLocaleString()}</div>
                  <div className="text-lg font-bold text-slate-400">{convertToKoreanUnit(welfareResult.perPersonTotalAnnual)}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-[60px] p-12 lg:p-16 shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <div className="text-3xl lg:text-4xl font-black">👥 전체 직원 ({welfareResult.employeeCount}명) 절세액</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/20 rounded-3xl p-8 space-y-3 backdrop-blur-sm">
                  <div className="text-lg font-black text-purple-100 uppercase">기업 절세 (월)</div>
                  <div className="text-2xl lg:text-4xl font-black">₩{welfareResult.totalCompanySavingMonthly.toLocaleString()}</div>
                  <div className="text-lg font-bold text-purple-200">{convertToKoreanUnit(welfareResult.totalCompanySavingMonthly)}</div>
                </div>
                <div className="bg-white/20 rounded-3xl p-8 space-y-3 backdrop-blur-sm">
                  <div className="text-lg font-black text-purple-100 uppercase">직원 절세 (월)</div>
                  <div className="text-2xl lg:text-4xl font-black">₩{welfareResult.totalEmployeeSavingMonthly.toLocaleString()}</div>
                  <div className="text-lg font-bold text-purple-200">{convertToKoreanUnit(welfareResult.totalEmployeeSavingMonthly)}</div>
                </div>
                <div className="bg-white rounded-3xl p-8 space-y-3 shadow-lg">
                  <div className="text-lg font-black text-purple-600 uppercase">총 절세 (월)</div>
                  <div className="text-2xl lg:text-4xl font-black text-purple-900">₩{welfareResult.totalSavingMonthly.toLocaleString()}</div>
                  <div className="text-lg font-bold text-purple-600">{convertToKoreanUnit(welfareResult.totalSavingMonthly)}</div>
                </div>
                <div className="bg-white/20 rounded-3xl p-8 space-y-3 backdrop-blur-sm">
                  <div className="text-lg font-black text-purple-100 uppercase">기업 절세 (연)</div>
                  <div className="text-2xl lg:text-4xl font-black">₩{welfareResult.totalCompanySavingAnnual.toLocaleString()}</div>
                  <div className="text-lg font-bold text-purple-200">{convertToKoreanUnit(welfareResult.totalCompanySavingAnnual)}</div>
                </div>
                <div className="bg-white/20 rounded-3xl p-8 space-y-3 backdrop-blur-sm">
                  <div className="text-lg font-black text-purple-100 uppercase">직원 절세 (연)</div>
                  <div className="text-2xl lg:text-4xl font-black">₩{welfareResult.totalEmployeeSavingAnnual.toLocaleString()}</div>
                  <div className="text-lg font-bold text-purple-200">{convertToKoreanUnit(welfareResult.totalEmployeeSavingAnnual)}</div>
                </div>
                <div className="bg-white rounded-3xl p-8 space-y-3 shadow-lg">
                  <div className="text-lg font-black text-purple-600 uppercase">총 절세 (연)</div>
                  <div className="text-2xl lg:text-4xl font-black text-purple-900">₩{welfareResult.totalSavingAnnual.toLocaleString()}</div>
                  <div className="text-lg font-bold text-purple-600">{convertToKoreanUnit(welfareResult.totalSavingAnnual)}</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border-4 border-amber-200 rounded-3xl p-8">
              <div className="text-xl lg:text-2xl font-bold text-amber-800 leading-relaxed">
                💡 <b>절세 원리:</b> 복리후생비는 기업의 <u>손금(비용)</u>으로 인정되어 법인세가 절감되고, 직원은 <u>비과세 소득</u>으로 소득세가 절감됩니다.
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {tab === 'raise' && (
      <div className="pt-16 space-y-12">
        <div className="flex justify-between items-end border-b-4 border-slate-100 pb-8">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">분석 결과 리포트</h2>
          <span className="text-lg font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-6 py-2 rounded-full">Personal Analytics</span>
        </div>

        {calcResults.filter(r => r.module === ModuleType.RAISE_TO_FUND).map((res) => (
          <div key={res.timestamp} className="bg-white p-10 lg:p-14 rounded-[60px] border border-slate-100 shadow-2xl space-y-12 relative overflow-hidden animate-in slide-in-from-bottom-8">
            <button 
              onClick={() => handleDeleteResult(res.timestamp)}
              className="absolute top-10 right-10 w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center text-3xl font-black hover:bg-red-500 hover:text-white transition-all z-20 shadow-sm"
            >
              ✕
            </button>
            <div className="absolute top-0 left-0 w-6 h-full bg-blue-500"></div>

            <div className="space-y-4 relative z-10 px-4">
              <div className="text-xl font-black text-blue-500 uppercase tracking-widest border-b-2 border-blue-100 inline-block pb-1">직원절세 시뮬레이션</div>
              <h3 className="text-3xl lg:text-4xl font-black text-slate-900 break-keep leading-tight">
                연간 {convertToKoreanUnit(parseNumber(res.inputs.shiftMonthly) * 12)} 적용소득세율 {res.inputs.bracketRate ? `${(Number(res.inputs.bracketRate) * 100).toFixed(0)}%` : ''} / {res.inputs.retirementType || 'DB'} / 근속{res.inputs.yearsServed || '0'}년 전환시
              </h3>
            </div>

            <div className="space-y-12 px-2">
              <div className="bg-[#0f2e44] text-white rounded-[60px] p-10 lg:p-14 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <span className="text-lg lg:text-xl font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-700 pb-1">Personal Financial Impact</span>
                  <span className="px-5 py-2 bg-blue-500 text-xs font-black rounded-2xl uppercase shadow-lg shadow-blue-500/30">Annual Estimate</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/10 pb-10 relative z-10">
                  <div className="space-y-3">
                    <div className="text-2xl lg:text-3xl font-black text-slate-400">연간 근로소득 실질 증가액</div>
                    <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-blue-400 break-words leading-none tracking-tighter">₩{res.result.empTotalSavingA.toLocaleString()}</div>
                    <div className="text-2xl lg:text-3xl font-bold text-slate-500 opacity-80">({convertToKoreanUnit(res.result.empTotalSavingA)})</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-2xl lg:text-3xl font-black text-slate-400">월평균 실수령액 증가</div>
                    <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-green-400 break-words leading-none tracking-tighter">₩{Math.round(res.result.empTotalSavingA / 12).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
                  <div className="text-2xl lg:text-3xl font-black text-slate-300">퇴직 시 실질 이익 (Net Benefit)</div>
                  <div className="text-left lg:text-right space-y-2 max-w-full overflow-hidden">
                    <div className="text-4xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-none text-white break-words">₩{res.result.netBenefit.toLocaleString()}</div>
                    <div className="text-2xl lg:text-3xl font-black text-slate-500 italic opacity-80">({convertToKoreanUnit(res.result.netBenefit)})</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                <div className="bg-slate-50 p-10 rounded-[48px] space-y-6 border-2 border-slate-100 flex flex-col justify-between shadow-sm">
                  <div className="text-lg lg:text-xl font-black text-slate-400 uppercase tracking-widest">누적 절세 혜택</div>
                  <div className="text-2xl lg:text-3xl font-black text-slate-900 leading-none break-words tracking-tight">₩{res.result.cumulativeSaving.toLocaleString()}</div>
                  <div className="text-2xl lg:text-3xl font-bold text-slate-400 mt-1">{convertToKoreanUnit(res.result.cumulativeSaving)}</div>
                </div>
                <div className="bg-red-50 p-10 rounded-[48px] space-y-6 border-2 border-red-100 flex flex-col justify-between shadow-sm">
                  <div className="text-lg lg:text-xl font-black text-red-400 uppercase tracking-widest">퇴직금 감소 추정액</div>
                  <div className="text-2xl lg:text-3xl font-black text-red-700 leading-none break-words tracking-tight">₩{res.result.severanceLoss.toLocaleString()}</div>
                  <div className="text-2xl lg:text-3xl font-bold text-red-400 mt-1">{convertToKoreanUnit(res.result.severanceLoss)}</div>
                </div>
                <div className="bg-blue-50 p-10 rounded-[48px] space-y-6 border-2 border-blue-100 flex flex-col justify-between shadow-sm">
                  <div className="text-lg lg:text-xl font-black text-blue-400 uppercase tracking-widest">손익분기 근속연수</div>
                  <div className="text-2xl lg:text-3xl font-black text-blue-700 leading-none break-words tracking-tight">{res.result.breakEvenYears.toFixed(1)}년</div>
                  <div className="text-2xl lg:text-3xl font-bold text-blue-400 mt-1">이후 이득 구간 진입</div>
                </div>
                <div className="bg-slate-900 p-10 rounded-[48px] space-y-6 text-white flex flex-col justify-between shadow-xl">
                  <div className="text-lg lg:text-xl font-black text-slate-400 uppercase tracking-widest">총 혜택 판단</div>
                  <div className="text-2xl lg:text-3xl font-black text-white leading-none break-words tracking-tight">
                    {res.result.netBenefit > 0 ? "도입 유리" : "장기 검토"}
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-slate-500 mt-1">Net Benefit 기준</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default EmployeeCalculator;
