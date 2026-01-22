
import React, { useState } from 'react';
import { ModuleType, CalculationResult, CompanyContext } from '../types';
import { payDoctorNetSimulation, payDoctorRiskSimulation } from '../utils/calculations';
import { TAX_PRESETS, INCOME_TAX_BRACKETS } from '../constants';

interface NetPayCalculatorProps {
  companyContext: CompanyContext;
  setCompanyContext: (ctx: CompanyContext) => void;
  inputs: any;
  setInputs: (inputs: any) => void;
  calcResults: CalculationResult[];
  setCalcResults: React.Dispatch<React.SetStateAction<CalculationResult[]>>;
}

const NetPayCalculator: React.FC<NetPayCalculatorProps> = ({ 
  companyContext, setCompanyContext,
  inputs, setInputs,
  calcResults, setCalcResults 
}) => {
  const [riskResult, setRiskResult] = useState<any>(null);
  
  const parseNumber = (val: string | number) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(val.toString().replace(/[^0-9]/g, '')) || 0;
  };

  const formatNumber = (val: string) => {
    const num = val.toString().replace(/[^0-9]/g, '');
    return num ? parseInt(num, 10).toLocaleString() : '';
  };

  const calculate = () => {
    const preset = (TAX_PRESETS as any)[2025];
    const result = payDoctorNetSimulation({
      yearPreset: preset,
      netMonthly: parseNumber(inputs.netTargetMonthly),
      taxMode: inputs.net_taxMode || 'advanced',
      bracketRate: Number(inputs.bracketRate || 0.35),
      ownerTaxBaseAnnual: parseNumber(inputs.ownerTaxBaseAnnual),
      addedExpenseAnnualOverride: inputs.addedExpenseAnnualOverride ? parseNumber(inputs.addedExpenseAnnualOverride) : null
    });

    const newResult: CalculationResult = {
      module: ModuleType.PAYDOCTOR_NET,
      inputs: { ...inputs },
      result,
      timestamp: new Date().toISOString()
    };

    setCalcResults(prev => [newResult, ...prev]);
    setRiskResult(null); 
  };

  const runRiskSimulation = () => {
    if (calcResults.length === 0 || calcResults[0].module !== ModuleType.PAYDOCTOR_NET) {
      alert("먼저 역산 시뮬레이션을 실행해주세요.");
      return;
    }
    
    const preset = (TAX_PRESETS as any)[2025];
    const payload = {
      netMonthly: parseNumber(inputs.netTargetMonthly),
      taxMode: inputs.net_taxMode || 'advanced',
      bracketRate: Number(inputs.bracketRate || 0.35),
      ownerTaxBaseAnnual: parseNumber(inputs.ownerTaxBaseAnnual),
      addedExpenseAnnualOverride: inputs.addedExpenseAnnualOverride ? parseNumber(inputs.addedExpenseAnnualOverride) : null
    };

    const shock = {
      healthRateDeltaPp: 0.1, 
      bracketUp: true 
    };

    const result = payDoctorRiskSimulation({
      basePreset: preset,
      basePayload: payload,
      shock
    });

    setRiskResult(result);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="space-y-4">
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">네트급여계산기</h1>
        <p className="text-2xl lg:text-3xl text-slate-500 font-bold leading-relaxed">페이닥터 네트 계약을 위한 실수령액 기반 총급여(Gross-up) 역계산 시스템입니다.</p>
      </header>

      <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-12">
        <h3 className="flex items-center gap-4 text-blue-700 font-black text-3xl lg:text-4xl">
          <span>🩺</span> 네트 계약 데이터 입력
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">목표 실수령액 (NET, 월, 원)</label>
            <input 
              type="text" 
              value={inputs.netTargetMonthly || ''} 
              onChange={(e) => setInputs({...inputs, netTargetMonthly: formatNumber(e.target.value)})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-2xl lg:text-4xl font-black outline-none transition-all shadow-inner tracking-tighter" 
              placeholder="10,000,000" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">세금 계산 모드</label>
            <select 
              value={inputs.net_taxMode || 'advanced'} 
              onChange={(e) => setInputs({...inputs, net_taxMode: e.target.value})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1.5rem_center]"
            >
              <option value="advanced">고급(근로소득공제 반영)</option>
              <option value="bracket">구간선택(한계세율 근사)</option>
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">원장 종합소득 과세표준 (연, 원)</label>
            <input 
              type="text" 
              value={inputs.ownerTaxBaseAnnual || ''} 
              onChange={(e) => setInputs({...inputs, ownerTaxBaseAnnual: formatNumber(e.target.value)})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-xl lg:text-3xl font-black outline-none shadow-sm transition-all shadow-inner" 
              placeholder="300,000,000" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-xl lg:text-2xl font-black text-slate-700 block">적용 소득세율 구간 (근사용)</label>
            <select 
              disabled={inputs.net_taxMode !== 'bracket'}
              value={inputs.bracketRate || '0.35'} 
              onChange={(e) => setInputs({...inputs, bracketRate: e.target.value})} 
              className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner appearance-none disabled:opacity-30 disabled:cursor-not-allowed bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1.5rem_center]"
            >
              {INCOME_TAX_BRACKETS.map(b => <option key={b.rate} value={b.rate}>{b.label}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={calculate} 
          className="w-full bg-[#1a5f7a] text-white text-3xl lg:text-5xl font-black py-10 rounded-[48px] hover:bg-[#0f2e44] shadow-2xl transition-all transform active:scale-[0.98] group"
        >
          <span>역산 시뮬레이션 실행</span>
          <span className="ml-6 group-hover:animate-bounce inline-block">🧮</span>
        </button>
      </div>

      <div className="pt-16 space-y-12">
        <div className="flex justify-between items-end border-b-4 border-slate-100 pb-8">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">역산 결과 리포트</h2>
          <span className="text-lg font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-6 py-2 rounded-full">Medical Net Analytics</span>
        </div>

        {calcResults.filter(r => r.module === ModuleType.PAYDOCTOR_NET).map((res) => (
          <div key={res.timestamp} className="bg-white p-10 lg:p-14 rounded-[60px] border border-slate-100 shadow-2xl space-y-12 relative overflow-hidden animate-in slide-in-from-bottom-8">
            <button className="absolute top-10 right-10 w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center text-3xl font-black hover:bg-red-500 hover:text-white transition-all z-20 shadow-sm">✕</button>
            <div className="absolute top-0 left-0 w-6 h-full bg-blue-500"></div>

            <div className="space-y-4 relative z-10 px-4">
              <div className="text-xl font-black text-blue-500 uppercase tracking-widest border-b-2 border-blue-100 inline-block pb-1">페이닥터 네트 계약 분석</div>
              <h3 className="text-3xl lg:text-4xl font-black text-slate-900 break-keep leading-tight">
                월 실수령액 ₩{res.result.payroll.netMonthly.toLocaleString()} 보장 시
              </h3>
            </div>

            <div className="space-y-12 px-2">
              <div className="bg-[#0f2e44] text-white rounded-[60px] p-10 lg:p-14 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <span className="text-lg lg:text-xl font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-700 pb-1">Gross-up Analysis</span>
                  <span className="px-5 py-2 bg-blue-500 text-xs font-black rounded-2xl uppercase shadow-lg shadow-blue-500/30">Reverse Calculation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/10 pb-10 relative z-10">
                  <div className="space-y-3">
                    <div className="text-lg lg:text-xl font-black text-slate-400">필요 총급여액 (Gross Monthly)</div>
                    <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-blue-400 break-words leading-none tracking-tighter">₩{res.result.payroll.grossMonthly.toLocaleString()}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-lg lg:text-xl font-black text-slate-400">원장 보전 금액 (대납 합계)</div>
                    <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-red-400 break-words leading-none tracking-tighter">₩{res.result.payroll.ownerCoverMonthly.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
                  <div className="text-2xl lg:text-3xl font-black text-slate-300">원장 총 현금 유출액</div>
                  <div className="text-left lg:text-right space-y-2 max-w-full overflow-hidden">
                    <div className="text-4xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-none text-white break-words">₩{res.result.payroll.employer.ownerCashOutMonthly.toLocaleString()}</div>
                    <div className="text-lg font-bold text-slate-500 opacity-60">Gross + 사업주 4대보험 포함</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                {/* 1. 원장 세금 절감 카드 (Grey) */}
                <div className="bg-[#f8fafc] p-10 lg:p-12 rounded-[48px] space-y-5 border-2 border-slate-100 flex flex-col items-start justify-center shadow-sm">
                  <div className="text-sm lg:text-base font-black text-slate-400 uppercase tracking-widest">원장 세금 절감 (누진 연환산)</div>
                  <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-slate-900 leading-none break-all tracking-tighter">
                    ₩{Math.round(res.result.ownerTaxEffect.ownerTotalTaxSavingAnnual / 12).toLocaleString()}
                  </div>
                  <div className="text-lg lg:text-xl font-bold text-slate-400">월 평균 세금 절감액</div>
                </div>

                {/* 2. 원장 실질 세후 부담 카드 (Blue) */}
                <div className="bg-[#f0f7ff] p-10 lg:p-12 rounded-[48px] space-y-5 border-2 border-blue-100 flex flex-col items-start justify-center shadow-sm">
                  <div className="text-sm lg:text-base font-black text-blue-400 uppercase tracking-widest">원장 실질 세후 부담 (월)</div>
                  <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-blue-700 leading-none break-all tracking-tighter">
                    ₩{res.result.ownerTaxEffect.ownerAfterTaxCostMonthly_est.toLocaleString()}
                  </div>
                  <div className="text-lg lg:text-xl font-bold text-blue-500">현금유출 - 세금절감</div>
                </div>

                {/* 3. 직원 4대보험 부담분 카드 (Dark) */}
                <div className="bg-[#0f172a] p-10 lg:p-12 rounded-[48px] space-y-5 text-white flex flex-col items-start justify-center shadow-xl">
                  <div className="text-sm lg:text-base font-black text-slate-400 uppercase tracking-widest">직원 4대보험 부담분</div>
                  <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-none break-all tracking-tighter">
                    ₩{res.result.payroll.employee.insuranceMonthly.toLocaleString()}
                  </div>
                  <div className="text-lg lg:text-xl font-bold text-slate-400">원장 대납 항목</div>
                </div>

                {/* 4. 직원 소득세 부담분 카드 (Red) */}
                <div className="bg-[#7f1d1d] p-10 lg:p-12 rounded-[48px] space-y-5 text-white flex flex-col items-start justify-center shadow-xl">
                  <div className="text-sm lg:text-base font-black text-red-300 uppercase tracking-widest">직원 소득세 부담분</div>
                  <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-none break-all tracking-tighter">
                    ₩{res.result.payroll.employee.incomeTaxMonthly.toLocaleString()}
                  </div>
                  <div className="text-lg lg:text-xl font-bold text-red-300">원장 대납 항목</div>
                </div>
              </div>

              <div className="mt-16 bg-red-50 rounded-[48px] p-10 lg:p-14 border-4 border-red-100 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <h4 className="text-3xl font-black text-red-700 tracking-tight">네트 계약 리스크 시뮬레이션</h4>
                    <p className="text-lg text-red-400 font-bold">건보료 인상 및 세율 구간 변동 시 원장님의 추가 부담액을 예측합니다.</p>
                  </div>
                  <button 
                    onClick={runRiskSimulation}
                    className="px-10 py-5 bg-red-600 text-white font-black text-xl rounded-2xl hover:bg-red-700 shadow-xl transition-all active:scale-95 shrink-0"
                  >
                    리스크 분석 ⚡
                  </button>
                </div>

                {riskResult && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
                    <div className="bg-white p-8 rounded-3xl border-2 border-red-200 space-y-6 shadow-sm">
                      <div className="text-sm font-black text-red-400 uppercase tracking-widest border-b border-red-50 pb-2">리스크 조건: 건보료 0.1%p ↑ + 세율상향</div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-slate-600">월 총유출 증가액</span>
                          <span className="text-2xl font-black text-red-600">+ ₩{riskResult.delta.ownerCashOutMonthly.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-slate-600">연간 총유출 증가액</span>
                          <span className="text-3xl font-black text-red-700">+ ₩{riskResult.delta.ownerCashOutAnnual.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-3xl space-y-6 shadow-xl">
                      <div className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">대응 전략 가이드</div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-slate-300">필요 GROSS 상향분</span>
                          <span className="text-2xl font-black text-white">₩{riskResult.delta.grossMonthly.toLocaleString()} / 월</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          네트 계약 시 위와 같은 고정비 인상 리스크는 전액 원장이 부담하게 됩니다. 사근복 기금 도입을 통한 비과세 전환이 가장 확실한 방어 기제가 될 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetPayCalculator;
