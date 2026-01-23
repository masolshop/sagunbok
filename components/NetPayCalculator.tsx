import React, { useMemo, useState } from 'react';
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

type TabKey = 'single' | 'compare' | 'bulk';

type BulkRow = {
  role: 'DOCTOR' | 'STAFF';
  name: string;
  netMonthly: number;
  bracketRate: number;
  welfarePointMonthly: number;
};

const NetPayCalculator: React.FC<NetPayCalculatorProps> = ({
  companyContext, setCompanyContext,
  inputs, setInputs,
  calcResults, setCalcResults
}) => {
  const [tab, setTab] = useState<TabKey>('single');
  const [riskResult, setRiskResult] = useState<any>(null);

  // compare tab result
  const [compareResult, setCompareResult] = useState<any>(null);

  // bulk tab result
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkSummary, setBulkSummary] = useState<any>(null);
  const [bulkRowOutputs, setBulkRowOutputs] = useState<any[]>([]);

  const presetYear = 2026;
  const preset = (TAX_PRESETS as any)[presetYear] || (TAX_PRESETS as any)[2025];

  const parseNumber = (val: string | number) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(val.toString().replace(/[^0-9.-]/g, '')) || 0;
  };

  const formatNumber = (val: string) => {
    const num = val.toString().replace(/[^0-9]/g, '');
    return num ? parseInt(num, 10).toLocaleString() : '';
  };

  const fmt = (n: number) => (Number.isFinite(n) ? Math.round(n).toLocaleString() : '0');

  /** ---------------------------
   *  단일 역산 실행(기존 유지)
   *  --------------------------- */
  const calculateSingle = () => {
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

    setCalcResults((prev) => [newResult, ...prev]);
    setRiskResult(null);
  };

  /** ---------------------------
   *  리스크 시뮬(기존 유지)
   *  --------------------------- */
  const runRiskSimulation = () => {
    if (calcResults.length === 0 || calcResults[0].module !== ModuleType.PAYDOCTOR_NET) {
      alert("먼저 역산 시뮬레이션을 실행해주세요.");
      return;
    }

    const payload = {
      netMonthly: parseNumber(inputs.netTargetMonthly),
      taxMode: inputs.net_taxMode || 'advanced',
      bracketRate: Number(inputs.bracketRate || 0.35),
      ownerTaxBaseAnnual: parseNumber(inputs.ownerTaxBaseAnnual),
      addedExpenseAnnualOverride: inputs.addedExpenseAnnualOverride ? parseNumber(inputs.addedExpenseAnnualOverride) : null
    };

    const shock = {
      healthRateDeltaPp: 0.1, // +0.1%p
      bracketUp: true
    };

    const result = payDoctorRiskSimulation({
      basePreset: preset,
      basePayload: payload,
      shock
    });

    setRiskResult(result);
  };

  /** ---------------------------
   *  사근복 전/후 비교(근사)
   *  - 복지포인트만큼 과세급여를 줄여도 NET 체감은 유지된다고 보는 근사
   *  - 즉, after는 netMonthly = max(net - point, 0)로 역산
   *  --------------------------- */
  const runCompare = () => {
    const net = parseNumber(inputs.netTargetMonthly);
    const point = parseNumber(inputs.welfarePointMonthly || 0);

    if (!net) {
      alert('목표 실수령액(NET)을 입력하세요.');
      return;
    }

    const base = payDoctorNetSimulation({
      yearPreset: preset,
      netMonthly: net,
      taxMode: inputs.net_taxMode || 'advanced',
      bracketRate: Number(inputs.bracketRate || 0.35),
      ownerTaxBaseAnnual: parseNumber(inputs.ownerTaxBaseAnnual),
      addedExpenseAnnualOverride: inputs.addedExpenseAnnualOverride ? parseNumber(inputs.addedExpenseAnnualOverride) : null
    });

    const after = payDoctorNetSimulation({
      yearPreset: preset,
      netMonthly: Math.max(net - point, 0),
      taxMode: inputs.net_taxMode || 'advanced',
      bracketRate: Number(inputs.bracketRate || 0.35),
      ownerTaxBaseAnnual: parseNumber(inputs.ownerTaxBaseAnnual),
      addedExpenseAnnualOverride: inputs.addedExpenseAnnualOverride ? parseNumber(inputs.addedExpenseAnnualOverride) : null
    });

    const baseOut = base.payroll?.employer?.ownerCashOutMonthly ?? base.payroll?.employer?.ownerCashOutMonthly ?? 0;
    const afterOut = after.payroll?.employer?.ownerCashOutMonthly ?? after.payroll?.employer?.ownerCashOutMonthly ?? 0;

    const savingOutflow = (base.payroll.employer.ownerCashOutMonthly || 0) - (after.payroll.employer.ownerCashOutMonthly || 0);

    setCompareResult({
      netMonthly: net,
      welfarePointMonthly: point,
      base,
      after,
      savingOutflow
    });
  };

  /** ---------------------------
   *  추천 복지포인트 자동 산정(근사)
   *  - savingOutflow 최대가 되는 포인트(0~2,000,000 / step 50,000)
   *  --------------------------- */
  const autoRecommendPoint = () => {
    const net = parseNumber(inputs.netTargetMonthly);
    if (!net) return alert('목표 실수령액(NET)을 먼저 입력하세요.');

    const maxPoint = Math.min(net, 2_000_000);
    const step = 50_000;

    const base = payDoctorNetSimulation({
      yearPreset: preset,
      netMonthly: net,
      taxMode: inputs.net_taxMode || 'advanced',
      bracketRate: Number(inputs.bracketRate || 0.35),
      ownerTaxBaseAnnual: parseNumber(inputs.ownerTaxBaseAnnual),
      addedExpenseAnnualOverride: inputs.addedExpenseAnnualOverride ? parseNumber(inputs.addedExpenseAnnualOverride) : null
    });

    let bestPoint = 0;
    let bestSaving = -Infinity;

    for (let p = 0; p <= maxPoint; p += step) {
      const after = payDoctorNetSimulation({
        yearPreset: preset,
        netMonthly: Math.max(net - p, 0),
        taxMode: inputs.net_taxMode || 'advanced',
        bracketRate: Number(inputs.bracketRate || 0.35),
        ownerTaxBaseAnnual: parseNumber(inputs.ownerTaxBaseAnnual),
        addedExpenseAnnualOverride: inputs.addedExpenseAnnualOverride ? parseNumber(inputs.addedExpenseAnnualOverride) : null
      });

      const saving = (base.payroll.employer.ownerCashOutMonthly || 0) - (after.payroll.employer.ownerCashOutMonthly || 0);
      if (saving > bestSaving) {
        bestSaving = saving;
        bestPoint = p;
      }
    }

    setInputs({ ...inputs, welfarePointMonthly: bestPoint.toLocaleString() });
  };

  /** ---------------------------
   *  퇴직금 vs 절세 누적(근사)
   *  - 퇴직금: (월급여 * 근속연수) 단순 근사
   *  - 절세누적: savingOutflow * 12 * years
   *  --------------------------- */
  const calcSeveranceVsSaving = (baseGross: number, afterGross: number, savingOutflow: number, years: number) => {
    const y = Math.max(Number(years) || 0, 0);
    const sev0 = Math.max(baseGross, 0) * y;
    const sev1 = Math.max(afterGross, 0) * y;
    const severanceLoss = Math.max(sev0 - sev1, 0);
    const savingTotal = Math.max(savingOutflow, 0) * 12 * y;
    const netBenefit = savingTotal - severanceLoss;

    return { sev0, sev1, severanceLoss, savingTotal, netBenefit };
  };

  /** ---------------------------
   *  Bulk CSV (엑셀→CSV 업로드)
   *  --------------------------- */
  function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let cur = '';
    let inQuotes = false;
    const row: string[] = [];

    const pushCell = () => { row.push(cur); cur = ''; };
    const pushRow = () => { rows.push([...row]); row.length = 0; };

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        pushCell();
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && next === '\n') i++;
        pushCell();
        if (row.some(c => c.trim() !== '')) pushRow();
        else row.length = 0;
      } else {
        cur += ch;
      }
    }
    if (cur.length || row.length) {
      pushCell();
      if (row.some(c => c.trim() !== '')) pushRow();
    }
    return rows;
  }

  function downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function bulkTemplateCSV(): string {
    return [
      'role,name,netMonthly,bracketRate,welfarePointMonthly',
      'DOCTOR,홍길동,10000000,0.35,300000',
      'STAFF,김간호,4000000,0.15,200000',
      'STAFF,박원무,3500000,0.15,200000'
    ].join('\n');
  }

  const runBulk = (rows: BulkRow[]) => {
    // 합산
    let totalBaseOut = 0;
    let totalAfterOut = 0;
    let totalSaving = 0;

    let doctorBase = 0, doctorAfter = 0, doctorSaving = 0;
    let staffBase = 0, staffAfter = 0, staffSaving = 0;

    const outputs: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const base = payDoctorNetSimulation({
        yearPreset: preset,
        netMonthly: r.netMonthly,
        taxMode: inputs.net_taxMode || 'advanced',
        bracketRate: Number(r.bracketRate || 0.35),
        ownerTaxBaseAnnual: parseNumber(inputs.ownerTaxBaseAnnual),
        addedExpenseAnnualOverride: inputs.addedExpenseAnnualOverride ? parseNumber(inputs.addedExpenseAnnualOverride) : null
      });

      const after = payDoctorNetSimulation({
        yearPreset: preset,
        netMonthly: Math.max(r.netMonthly - r.welfarePointMonthly, 0),
        taxMode: inputs.net_taxMode || 'advanced',
        bracketRate: Number(r.bracketRate || 0.35),
        ownerTaxBaseAnnual: parseNumber(inputs.ownerTaxBaseAnnual),
        addedExpenseAnnualOverride: inputs.addedExpenseAnnualOverride ? parseNumber(inputs.addedExpenseAnnualOverride) : null
      });

      const baseOut = base.payroll.employer.ownerCashOutMonthly || 0;
      const afterOut = after.payroll.employer.ownerCashOutMonthly || 0;
      const saving = baseOut - afterOut;

      totalBaseOut += baseOut;
      totalAfterOut += afterOut;
      totalSaving += saving;

      if (r.role === 'DOCTOR') {
        doctorBase += baseOut;
        doctorAfter += afterOut;
        doctorSaving += saving;
      } else {
        staffBase += baseOut;
        staffAfter += afterOut;
        staffSaving += saving;
      }

      outputs.push({
        idx: i + 1,
        role: r.role,
        name: r.name,
        bracketRate: r.bracketRate,
        welfarePointMonthly: r.welfarePointMonthly,
        baseOut,
        afterOut,
        saving,
        baseGross: base.payroll.grossMonthly || 0,
        afterGross: after.payroll.grossMonthly || 0
      });
    }

    setBulkSummary({
      count: rows.length,
      total: { totalBaseOut, totalAfterOut, totalSaving },
      doctor: { doctorBase, doctorAfter, doctorSaving },
      staff: { staffBase, staffAfter, staffSaving }
    });
    setBulkRowOutputs(outputs);
  };

  const onBulkUpload = async (file: File) => {
    const text = await file.text();
    const grid = parseCSV(text);
    if (!grid.length) return;

    const header = grid[0].map(h => (h || '').trim());
    const idxOf = (k: string) => header.findIndex(h => h.toLowerCase() === k.toLowerCase());

    const rows: BulkRow[] = [];
    for (let i = 1; i < grid.length; i++) {
      const r = grid[i];
      const get = (k: string) => {
        const j = idxOf(k);
        return j >= 0 ? (r[j] ?? '').trim() : '';
      };

      const role = (get('role') || 'STAFF').toUpperCase() === 'DOCTOR' ? 'DOCTOR' : 'STAFF';
      const name = get('name') || `${role}-${i}`;
      const netMonthly = parseNumber(get('netMonthly'));
      if (!netMonthly) continue;

      const bracketRate = Number(get('bracketRate') || inputs.bulkDefaultBracketRate || inputs.bracketRate || 0.35);
      const welfarePointMonthly = parseNumber(get('welfarePointMonthly')) || parseNumber(inputs.bulkDefaultWelfarePointMonthly || 0);

      rows.push({ role, name, netMonthly, bracketRate, welfarePointMonthly });
    }

    setBulkRows(rows);
    runBulk(rows);
  };

  const latest = calcResults.find(r => r.module === ModuleType.PAYDOCTOR_NET);

  /** ---------------------------
   *  UI
   *  --------------------------- */
  const TabButton = ({ k, label }: { k: TabKey; label: string }) => (
    <button
      onClick={() => setTab(k)}
      className={`px-7 py-4 rounded-2xl font-black text-lg lg:text-xl transition-all border-2
        ${tab === k ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
    >
      {label}
    </button>
  );

  const KpiCard = ({ title, value, sub, tone }: { title: string; value: string; sub?: string; tone?: 'dark'|'blue'|'red'|'gray' }) => {
    const base = 'p-8 lg:p-10 rounded-[40px] space-y-4 border-2 shadow-sm';
    const toneClass =
      tone === 'dark' ? 'bg-slate-900 text-white border-slate-800 shadow-xl' :
      tone === 'blue' ? 'bg-[#f0f7ff] text-blue-800 border-blue-100' :
      tone === 'red' ? 'bg-[#7f1d1d] text-white border-red-900 shadow-xl' :
      'bg-[#f8fafc] text-slate-900 border-slate-100';
    return (
      <div className={`${base} ${toneClass}`}>
        <div className={`text-sm lg:text-base font-black uppercase tracking-widest ${tone === 'dark' ? 'text-slate-400' : tone === 'blue' ? 'text-blue-400' : tone === 'red' ? 'text-red-300' : 'text-slate-400'}`}>
          {title}
        </div>
        <div className="text-3xl lg:text-4xl xl:text-5xl font-black leading-none break-all tracking-tighter">{value}</div>
        {sub ? <div className={`text-lg lg:text-xl font-bold ${tone === 'dark' ? 'text-slate-400' : tone === 'blue' ? 'text-blue-500' : tone === 'red' ? 'text-red-300' : 'text-slate-400'}`}>{sub}</div> : null}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="space-y-4">
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">네트급여계산기</h1>
        <p className="text-2xl lg:text-3xl text-slate-500 font-bold leading-relaxed">
          페이닥터 네트 계약을 위한 실수령액 기반 총급여(Gross-up) 역계산 시스템입니다.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 flex-wrap">
        <TabButton k="single" label="단일 역산" />
        <TabButton k="compare" label="사근복 연동 전/후 비교" />
        <TabButton k="bulk" label="전직원 일괄 분석" />
      </div>

      {/* =======================
          TAB: SINGLE
          ======================= */}
      {tab === 'single' && (
        <>
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
                  onChange={(e) => setInputs({ ...inputs, netTargetMonthly: formatNumber(e.target.value) })}
                  className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-2xl lg:text-4xl font-black outline-none transition-all shadow-inner tracking-tighter"
                  placeholder="10,000,000"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xl lg:text-2xl font-black text-slate-700 block">세금 계산 모드</label>
                <select
                  value={inputs.net_taxMode || 'advanced'}
                  onChange={(e) => setInputs({ ...inputs, net_taxMode: e.target.value })}
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
                  onChange={(e) => setInputs({ ...inputs, ownerTaxBaseAnnual: formatNumber(e.target.value) })}
                  className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-xl lg:text-3xl font-black outline-none shadow-sm transition-all shadow-inner"
                  placeholder="300,000,000"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xl lg:text-2xl font-black text-slate-700 block">적용 소득세율 구간 (근사용)</label>
                <select
                  disabled={inputs.net_taxMode !== 'bracket'}
                  value={inputs.bracketRate || '0.35'}
                  onChange={(e) => setInputs({ ...inputs, bracketRate: e.target.value })}
                  className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner appearance-none disabled:opacity-30 disabled:cursor-not-allowed bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1.5rem_center]"
                >
                  {INCOME_TAX_BRACKETS.map((b: any) => (
                    <option key={b.rate} value={b.rate}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={calculateSingle}
              className="w-full bg-[#1a5f7a] text-white text-3xl lg:text-5xl font-black py-10 rounded-[48px] hover:bg-[#0f2e44] shadow-2xl transition-all transform active:scale-[0.98] group"
            >
              <span>역산 시뮬레이션 실행</span>
              <span className="ml-6 group-hover:animate-bounce inline-block">🧮</span>
            </button>
          </div>

          {/* 결과 리스트 */}
          <div className="pt-10 space-y-10">
            <div className="flex justify-between items-end border-b-4 border-slate-100 pb-8">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">역산 결과 리포트</h2>
              <span className="text-lg font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-6 py-2 rounded-full">
                Medical Net Analytics
              </span>
            </div>

            {calcResults.filter(r => r.module === ModuleType.PAYDOCTOR_NET).map((res) => (
              <div key={res.timestamp} className="bg-white p-10 lg:p-14 rounded-[60px] border border-slate-100 shadow-2xl space-y-12 relative overflow-hidden animate-in slide-in-from-bottom-8">
                <button
                  onClick={() => setCalcResults(prev => prev.filter(x => x.timestamp !== res.timestamp))}
                  className="absolute top-10 right-10 w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center text-3xl font-black hover:bg-red-500 hover:text-white transition-all z-20 shadow-sm"
                >
                  ✕
                </button>
                <div className="absolute top-0 left-0 w-6 h-full bg-blue-500"></div>

                <div className="space-y-4 relative z-10 px-4">
                  <div className="text-xl font-black text-blue-500 uppercase tracking-widest border-b-2 border-blue-100 inline-block pb-1">
                    페이닥터 네트 계약 분석
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-black text-slate-900 break-keep leading-tight">
                    월 실수령액 ₩{res.result.payroll.netMonthly.toLocaleString()} 보장 시
                  </h3>
                </div>

                <div className="space-y-12 px-2">
                  <div className="bg-[#0f2e44] text-white rounded-[60px] p-10 lg:p-14 shadow-2xl space-y-10 relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10">
                      <span className="text-lg lg:text-xl font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-700 pb-1">
                        Gross-up Analysis
                      </span>
                      <span className="px-5 py-2 bg-blue-500 text-xs font-black rounded-2xl uppercase shadow-lg shadow-blue-500/30">
                        Reverse Calculation
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/10 pb-10 relative z-10">
                      <div className="space-y-3">
                        <div className="text-lg lg:text-xl font-black text-slate-400">필요 총급여액 (Gross Monthly)</div>
                        <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-blue-400 break-words leading-none tracking-tighter">
                          ₩{res.result.payroll.grossMonthly.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="text-lg lg:text-xl font-black text-slate-400">원장 보전 금액 (대납 합계)</div>
                        <div className="text-3xl lg:text-4xl xl:text-5xl font-black text-red-400 break-words leading-none tracking-tighter">
                          ₩{res.result.payroll.ownerCoverMonthly.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
                      <div className="text-2xl lg:text-3xl font-black text-slate-300">원장 총 현금 유출액</div>
                      <div className="text-left lg:text-right space-y-2 max-w-full overflow-hidden">
                        <div className="text-4xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-none text-white break-words">
                          ₩{res.result.payroll.employer.ownerCashOutMonthly.toLocaleString()}
                        </div>
                        <div className="text-lg font-bold text-slate-500 opacity-60">Gross + 사업주 4대보험 포함</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                    <KpiCard
                      title="원장 세금 절감 (누진 연환산)"
                      value={`₩${fmt(Math.round(res.result.ownerTaxEffect.ownerTotalTaxSavingAnnual / 12))}`}
                      sub="월 평균 세금 절감액"
                      tone="gray"
                    />
                    <KpiCard
                      title="원장 실질 세후 부담 (월)"
                      value={`₩${fmt(res.result.ownerTaxEffect.ownerAfterTaxCostMonthly_est)}`}
                      sub="현금유출 - 세금절감"
                      tone="blue"
                    />
                    <KpiCard
                      title="직원 4대보험 부담분"
                      value={`₩${fmt(res.result.payroll.employee.insuranceMonthly)}`}
                      sub="원장 대납 항목"
                      tone="dark"
                    />
                    <KpiCard
                      title="직원 소득세 부담분"
                      value={`₩${fmt(res.result.payroll.employee.incomeTaxMonthly)}`}
                      sub="원장 대납 항목"
                      tone="red"
                    />
                  </div>

                  {/* Risk */}
                  <div className="mt-12 bg-red-50 rounded-[48px] p-10 lg:p-14 border-4 border-red-100 space-y-8 relative overflow-hidden">
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
                          <div className="text-sm font-black text-red-400 uppercase tracking-widest border-b border-red-50 pb-2">
                            리스크 조건: 건보료 0.1%p ↑ + 세율상향
                          </div>
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
                          <div className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">
                            대응 전략 가이드
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-slate-300">필요 GROSS 상향분</span>
                              <span className="text-2xl font-black text-white">₩{riskResult.delta.grossMonthly.toLocaleString()} / 월</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                              네트 계약 시 고정비 인상 리스크는 전액 원장이 부담합니다. 사근복(복지포인트) 전환은
                              과세급여 및 보험료 기반을 줄이는 방어 기제가 될 수 있습니다.
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
        </>
      )}

      {/* =======================
          TAB: COMPARE
          ======================= */}
      {tab === 'compare' && (
        <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-10">
          <h3 className="text-slate-900 font-black text-3xl lg:text-4xl">사근복 연동 전/후 비교(근사)</h3>

          <div className="text-slate-500 font-bold text-lg leading-relaxed">
            ✅ 네트급여 지급방식은 외부 비공개 전제로, 원장/행정이 <b>셀프 시뮬</b>해서 "사근복 설립/복지포인트 전환 효과"를 확인하는 탭입니다.
            <br />
            ※ 전/후 비교는 "복지포인트만큼 과세급여를 줄이고 비과세 포인트로 전환"하는 <b>근사</b> 모델입니다.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-xl lg:text-2xl font-black text-slate-700 block">목표 실수령액 (NET, 월, 원)</label>
              <input
                type="text"
                value={inputs.netTargetMonthly || ''}
                onChange={(e) => setInputs({ ...inputs, netTargetMonthly: formatNumber(e.target.value) })}
                className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-2xl lg:text-4xl font-black outline-none transition-all shadow-inner tracking-tighter"
                placeholder="10,000,000"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xl lg:text-2xl font-black text-slate-700 block">복지포인트 전환액 (월, 원)</label>
              <input
                type="text"
                value={inputs.welfarePointMonthly || ''}
                onChange={(e) => setInputs({ ...inputs, welfarePointMonthly: formatNumber(e.target.value) })}
                className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-xl lg:text-3xl font-black outline-none shadow-sm transition-all shadow-inner"
                placeholder="300,000"
              />
              <button
                onClick={autoRecommendPoint}
                className="w-full bg-slate-900 text-white text-xl font-black py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.99]"
              >
                추천 복지포인트 자동 산정
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-xl lg:text-2xl font-black text-slate-700 block">원장 종합소득 과세표준 (연, 원)</label>
              <input
                type="text"
                value={inputs.ownerTaxBaseAnnual || ''}
                onChange={(e) => setInputs({ ...inputs, ownerTaxBaseAnnual: formatNumber(e.target.value) })}
                className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-xl lg:text-3xl font-black outline-none shadow-sm transition-all shadow-inner"
                placeholder="300,000,000"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xl lg:text-2xl font-black text-slate-700 block">적용 소득세율 구간 (근사용)</label>
              <select
                value={inputs.bracketRate || '0.35'}
                onChange={(e) => setInputs({ ...inputs, bracketRate: e.target.value })}
                className="w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-7 text-xl lg:text-3xl font-black outline-none transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1.5rem_center]"
              >
                {INCOME_TAX_BRACKETS.map((b: any) => (
                  <option key={b.rate} value={b.rate}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={runCompare}
            className="w-full bg-[#1a5f7a] text-white text-3xl lg:text-5xl font-black py-10 rounded-[48px] hover:bg-[#0f2e44] shadow-2xl transition-all transform active:scale-[0.98]"
          >
            전/후 비교 분석 실행
          </button>

          {compareResult && (
            <div className="space-y-10 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <KpiCard title="총유출(전)" value={`₩${fmt(compareResult.base.payroll.employer.ownerCashOutMonthly)}`} sub="원장 월 현금유출" />
                <KpiCard title="총유출(후)" value={`₩${fmt(compareResult.after.payroll.employer.ownerCashOutMonthly)}`} sub="포인트 전환 후" tone="blue" />
                <KpiCard title="총유출 절감" value={`₩${fmt(compareResult.savingOutflow)}`} sub="전 - 후" tone="dark" />
              </div>

              {/* 퇴직금 vs 절세 누적 */}
              <div className="bg-slate-50 border-2 border-slate-100 rounded-[40px] p-8 lg:p-10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-2xl font-black text-slate-900">퇴직금 vs 절세 누적(근사)</div>
                    <div className="text-slate-500 font-bold">"퇴직금 손해?"를 숫자로 종결하는 설득용 블록</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-700">근속연수</span>
                    <input
                      className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 font-black text-slate-900 w-[140px]"
                      value={inputs.tenureYears ?? '10'}
                      onChange={(e) => setInputs({ ...inputs, tenureYears: e.target.value })}
                    />
                  </div>
                </div>

                {(() => {
                  const years = Number(inputs.tenureYears ?? 10) || 0;
                  const out = calcSeveranceVsSaving(
                    compareResult.base.payroll.grossMonthly || 0,
                    compareResult.after.payroll.grossMonthly || 0,
                    compareResult.savingOutflow || 0,
                    years
                  );

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <KpiCard title="퇴직금(전, 근사)" value={`₩${fmt(out.sev0)}`} sub="월급여×근속연수" />
                      <KpiCard title="퇴직금(후, 근사)" value={`₩${fmt(out.sev1)}`} sub="과세급여 감소 반영" />
                      <KpiCard title="퇴직금 감소(근사)" value={`₩${fmt(out.severanceLoss)}`} sub="손해로 느끼는 구간" tone="red" />

                      <KpiCard title="절세/절감 누적" value={`₩${fmt(out.savingTotal)}`} sub="절감×12×근속연수" tone="blue" />
                      <KpiCard title="순이익(절감-퇴직금)" value={`₩${fmt(out.netBenefit)}`} sub="결론 KPI" tone="dark" />
                      <KpiCard title="근속연수" value={`${years}년`} sub="가정치" />
                    </div>
                  );
                })()}

                <div className="text-xs text-slate-400 font-bold leading-relaxed">
                  ※ 실제 퇴직금(평균임금×30일×근속연수)과 차이가 있을 수 있습니다. 고급모드에서 "최근3개월 평균임금/상여"를 반영하면 더 정확해집니다.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================
          TAB: BULK
          ======================= */}
      {tab === 'bulk' && (
        <div className="bg-white rounded-[60px] border-4 border-slate-50 p-12 lg:p-16 shadow-2xl space-y-10">
          <h3 className="text-slate-900 font-black text-3xl lg:text-4xl">전직원 일괄 분석 (엑셀→CSV 업로드)</h3>

          <div className="text-slate-500 font-bold text-lg leading-relaxed">
            ✅ 병원 "페이닥터(의사) + 직원" 전체를 업로드해서 <b>회사 총유출 / 사근복 전환 절감</b>을 한 번에 뽑습니다.<br/>
            ✅ 네트급여 지급방식은 외부 비공개 전제로, 병원 내부에서만 "셀프 시뮬"하도록 설계된 탭입니다.
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => downloadTextFile('netpay_bulk_template.csv', bulkTemplateCSV())}
              className="px-8 py-4 rounded-2xl font-black text-lg bg-slate-900 text-white hover:bg-slate-800 transition-all"
            >
              CSV 템플릿 다운로드
            </button>

            <div className="flex items-center gap-3">
              <span className="font-black text-slate-700">기본 복지포인트(월)</span>
              <input
                className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-black text-slate-900 w-[180px]"
                value={inputs.bulkDefaultWelfarePointMonthly ?? '0'}
                onChange={(e) => setInputs({ ...inputs, bulkDefaultWelfarePointMonthly: formatNumber(e.target.value) })}
                placeholder="예: 200,000"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="font-black text-slate-700">기본 세율</span>
              <select
                className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-black text-slate-900"
                value={inputs.bulkDefaultBracketRate ?? (inputs.bracketRate || '0.35')}
                onChange={(e) => setInputs({ ...inputs, bulkDefaultBracketRate: e.target.value })}
              >
                <option value={0.06}>6%</option>
                <option value={0.15}>15%</option>
                <option value={0.24}>24%</option>
                <option value={0.35}>35%</option>
                <option value={0.38}>38%</option>
                <option value={0.40}>40%</option>
                <option value={0.42}>42%</option>
                <option value={0.45}>45%</option>
              </select>
            </div>
          </div>

          <div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onBulkUpload(f);
              }}
              className="block w-full text-sm text-slate-500
              file:mr-4 file:py-3 file:px-6
              file:rounded-2xl file:border-0
              file:text-lg file:font-black
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700"
            />
            <div className="mt-2 text-xs text-slate-400 font-bold">
              엑셀에서 "다른 이름으로 저장 → CSV UTF-8" 권장
            </div>
          </div>

          {bulkSummary && (
            <div className="space-y-10 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <KpiCard title="전체 총유출(전)" value={`₩${fmt(bulkSummary.total.totalBaseOut)}`} />
                <KpiCard title="전체 총유출(후)" value={`₩${fmt(bulkSummary.total.totalAfterOut)}`} tone="blue" />
                <KpiCard title="전체 절감" value={`₩${fmt(bulkSummary.total.totalSaving)}`} tone="dark" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <KpiCard title="의사 합계(전)" value={`₩${fmt(bulkSummary.doctor.doctorBase)}`} />
                <KpiCard title="의사 합계(후)" value={`₩${fmt(bulkSummary.doctor.doctorAfter)}`} tone="blue" />
                <KpiCard title="의사 절감" value={`₩${fmt(bulkSummary.doctor.doctorSaving)}`} tone="dark" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <KpiCard title="직원 합계(전)" value={`₩${fmt(bulkSummary.staff.staffBase)}`} />
                <KpiCard title="직원 합계(후)" value={`₩${fmt(bulkSummary.staff.staffAfter)}`} tone="blue" />
                <KpiCard title="직원 절감" value={`₩${fmt(bulkSummary.staff.staffSaving)}`} tone="dark" />
              </div>

              {/* Row table */}
              <div className="overflow-x-auto border-2 border-slate-100 rounded-[28px]">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-600 text-sm font-black uppercase tracking-widest">
                      <th className="px-5 py-4">#</th>
                      <th className="px-5 py-4">구분</th>
                      <th className="px-5 py-4">이름</th>
                      <th className="px-5 py-4">세율</th>
                      <th className="px-5 py-4">포인트(월)</th>
                      <th className="px-5 py-4">총유출(전)</th>
                      <th className="px-5 py-4">총유출(후)</th>
                      <th className="px-5 py-4">절감</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRowOutputs.slice(0, 300).map((r) => (
                      <tr key={r.idx} className="border-t border-slate-100">
                        <td className="px-5 py-4 font-black text-slate-500">{r.idx}</td>
                        <td className="px-5 py-4 font-black">{r.role}</td>
                        <td className="px-5 py-4 font-bold text-slate-700">{r.name}</td>
                        <td className="px-5 py-4 font-black">{Math.round(r.bracketRate * 100)}%</td>
                        <td className="px-5 py-4 font-black">{fmt(r.welfarePointMonthly)}</td>
                        <td className="px-5 py-4 font-black">{fmt(r.baseOut)}</td>
                        <td className="px-5 py-4 font-black">{fmt(r.afterOut)}</td>
                        <td className={`px-5 py-4 font-black ${r.saving >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {fmt(r.saving)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-slate-400 font-bold leading-relaxed">
                ※ 전직원 탭도 "복지포인트 전환=과세급여 감소" 근사 모델입니다.  
                ※ 엔진 정교화(근로소득공제/세액공제/4대보험 한도/퇴직연금) 반영은 utils 엔진 확장으로 다음 단계에서 진행하면 됩니다.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetPayCalculator;
