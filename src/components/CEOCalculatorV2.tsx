// src/components/CEOCalculatorV2.tsx
import React, { useMemo, useState } from 'react';
import { DEFAULT_PRESETS, YearKey } from '../utils/ceo/presets';
import { runCeoSimulation, CeoInputs } from '../utils/ceo/ceoEngine';
import { formatWon, safeNum, clamp } from '../utils/ceo/math';

const parseNumber = (val: string | number) => safeNum(val, 0);

const numFmt = (x: any) => {
  const n = parseNumber(x);
  return n ? Math.round(n).toLocaleString() : '';
};

const CeoCalculatorV2: React.FC = () => {
  const [year, setYear] = useState<YearKey>(2026);

  const [inputs, setInputs] = useState<CeoInputs>({
    year: 2026,

    issuedShares: 100_000,
    targetShares: 30_000,

    netAsset: 500_000_000,
    eps1: 20_000,
    eps2: 18_000,
    eps3: 16_000,
    realEstateHeavy: false,

    retainedEarnings: 300_000_000,
    officerLoan: 100_000_000,

    treasurySharesQty: 0,
    treasurySharesBookValue: 0,

    realEstateBookValue: 0,
    realEstateMarketValue: 0,

    nomineeSharesQty: 0,
    nomineeSharesEstValue: 0,

    successionType: 'gift',
    successionShares: 10_000,
    useFamilyBizRelief: false,
    familyBizReliefCap: 0,

    ownerTaxBaseAnnual: 300_000_000,

    contributionActor: 'corp',
    contributionAssetType: 'cash',
    contributionAmount: 200_000_000,

    deductibilityRate: 1.0,
    payModeFactor: 1.0
  });

  const preset = useMemo(() => DEFAULT_PRESETS[year], [year]);

  const result = useMemo(() => {
    try {
      return runCeoSimulation({ ...inputs, year });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [inputs, year]);

  const setField = (k: keyof CeoInputs, v: any) => setInputs(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="space-y-4">
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight">CEO 절세계산기</h1>
        <p className="text-xl lg:text-2xl text-slate-500 font-bold leading-relaxed">
          보충적 평가(주식가치) + 잉여금/가지급금/차명 리스크 + 사내근로복지기금 출연 연동 "총효과" 시뮬레이션
        </p>

        <div className="flex gap-3 items-center">
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">YEAR</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value) as YearKey)}
            className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-black text-slate-800"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <span className="text-xs font-bold text-slate-400">
            * 세율/한도는 프리셋으로 관리(연도별 업데이트 가능)
          </span>
        </div>
      </header>

      {/* INPUT CARD */}
      <div className="bg-white rounded-[56px] border-4 border-slate-50 p-10 lg:p-14 shadow-2xl space-y-10">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-2xl lg:text-3xl font-black text-blue-700 flex items-center gap-3">
            <span>👑</span> 자산 및 주식 평가 데이터
          </h3>
          <div className="text-xs font-bold text-slate-400">
            * 숫자 단위: 원(₩), 주식수: 주
          </div>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Field
            label="발행주식수(주)"
            value={numFmt(inputs.issuedShares)}
            onChange={(v) => setField('issuedShares', parseNumber(v))}
            placeholder="100,000"
          />
          <Field
            label="평가(증여/상속) 주식수(주)"
            value={numFmt(inputs.targetShares)}
            onChange={(v) => setField('targetShares', parseNumber(v))}
            placeholder="30,000"
          />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Field
            label="순자산(자산-부채, 원)"
            value={numFmt(inputs.netAsset)}
            onChange={(v) => setField('netAsset', parseNumber(v))}
            placeholder="500,000,000"
          />
          <Field
            label="연 사근복 출연 예정액(원)"
            value={numFmt(inputs.contributionAmount)}
            onChange={(v) => setField('contributionAmount', parseNumber(v))}
            placeholder="200,000,000"
          />
        </div>

        {/* EPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Field
            label="EPS1(최근 1년, 원)"
            value={numFmt(inputs.eps1)}
            onChange={(v) => setField('eps1', parseNumber(v))}
            placeholder="20,000"
          />
          <Field
            label="EPS2(최근 2년, 원)"
            value={numFmt(inputs.eps2)}
            onChange={(v) => setField('eps2', parseNumber(v))}
            placeholder="18,000"
          />
          <Field
            label="EPS3(최근 3년, 원)"
            value={numFmt(inputs.eps3)}
            onChange={(v) => setField('eps3', parseNumber(v))}
            placeholder="16,000"
          />
        </div>

        {/* Toggles */}
        <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-lg font-black text-slate-800">자산/리스크 확장 입력</div>
            <label className="flex items-center gap-3 text-sm font-black text-slate-700">
              <input
                type="checkbox"
                checked={!!inputs.realEstateHeavy}
                onChange={(e) => setField('realEstateHeavy', e.target.checked)}
              />
              부동산 과다보유(순자산가치 비중 ↑ 자동 힌트)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="미처분이익잉여금(원)"
              value={numFmt(inputs.retainedEarnings)}
              onChange={(v) => setField('retainedEarnings', parseNumber(v))}
              placeholder="300,000,000"
            />
            <Field
              label="가지급금 잔액(원)"
              value={numFmt(inputs.officerLoan)}
              onChange={(v) => setField('officerLoan', parseNumber(v))}
              placeholder="100,000,000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="부동산 장부가(원)"
              value={numFmt(inputs.realEstateBookValue)}
              onChange={(v) => setField('realEstateBookValue', parseNumber(v))}
              placeholder="0"
            />
            <Field
              label="부동산 시가/감정가(원)"
              value={numFmt(inputs.realEstateMarketValue)}
              onChange={(v) => setField('realEstateMarketValue', parseNumber(v))}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="자기주식 보유수량(주)"
              value={numFmt(inputs.treasurySharesQty)}
              onChange={(v) => setField('treasurySharesQty', parseNumber(v))}
              placeholder="0"
            />
            <Field
              label="자기주식 장부가/취득가 합계(원)"
              value={numFmt(inputs.treasurySharesBookValue)}
              onChange={(v) => setField('treasurySharesBookValue', parseNumber(v))}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="차명주식 수량(주, 합산)"
              value={numFmt(inputs.nomineeSharesQty)}
              onChange={(v) => setField('nomineeSharesQty', parseNumber(v))}
              placeholder="0"
            />
            <Field
              label="차명주식 추정가치(원, 합산)"
              value={numFmt(inputs.nomineeSharesEstValue)}
              onChange={(v) => setField('nomineeSharesEstValue', parseNumber(v))}
              placeholder="0"
            />
          </div>
        </div>

        {/* Succession */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 space-y-6">
          <div className="text-lg font-black text-slate-800">승계 설정(증여/상속)</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">승계 유형</label>
              <select
                value={inputs.successionType}
                onChange={(e) => setField('successionType', e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black"
              >
                <option value="gift">증여</option>
                <option value="inherit">상속</option>
                <option value="both">둘다(비교)</option>
              </select>
            </div>

            <Field
              label="승계 예정 주식수(주)"
              value={numFmt(inputs.successionShares)}
              onChange={(v) => setField('successionShares', parseNumber(v))}
              placeholder="10,000"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-3 font-black text-slate-700">
              <input
                type="checkbox"
                checked={!!inputs.useFamilyBizRelief}
                onChange={(e) => setField('useFamilyBizRelief', e.target.checked)}
              />
              가업승계 특례(공제) 사용
            </label>

            <div className="w-full md:w-[360px]">
              <Field
                label="가업승계 공제 한도(원, 옵션)"
                value={numFmt(inputs.familyBizReliefCap)}
                onChange={(v) => setField('familyBizReliefCap', parseNumber(v))}
                placeholder="0"
                disabled={!inputs.useFamilyBizRelief}
              />
            </div>
          </div>
        </div>

        {/* Owner Tax */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 space-y-6">
          <div className="text-lg font-black text-slate-800">대표 종합소득세(고급 엔진) 입력</div>
          <Field
            label="대표 종합소득 과세표준(연, 원)"
            value={numFmt(inputs.ownerTaxBaseAnnual)}
            onChange={(v) => setField('ownerTaxBaseAnnual', parseNumber(v))}
            placeholder="300,000,000"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">
                비용인정률(세무조정 반영, {Math.round(inputs.deductibilityRate * 100)}%)
              </label>
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={Math.round(inputs.deductibilityRate * 100)}
                onChange={(e) => setField('deductibilityRate', Number(e.target.value) / 100)}
                className="w-full"
              />
              <div className="text-xs text-slate-400 font-bold">
                * 출연/복지지급이 비용으로 인정되는 수준(증빙/규정/계정과목) 반영
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">
                지급방식 계수(리스크 반영, {Math.round(inputs.payModeFactor * 100)}%)
              </label>
              <input
                type="range"
                min={60}
                max={100}
                step={5}
                value={Math.round(inputs.payModeFactor * 100)}
                onChange={(e) => setField('payModeFactor', Number(e.target.value) / 100)}
                className="w-full"
              />
              <div className="text-xs text-slate-400 font-bold">
                * 카드/현금 등 지급방식에 따른 비용부인 가능성(보수적으로 반영)
              </div>
            </div>
          </div>
        </div>

        {/* Contribution scenario */}
        <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 p-6 space-y-6">
          <div className="text-lg font-black text-slate-800">출연 시나리오</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">출연 주체</label>
              <select
                value={inputs.contributionActor}
                onChange={(e) => setField('contributionActor', e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 font-black"
              >
                <option value="corp">법인 출연</option>
                <option value="owner">대표 개인 출연</option>
                <option value="thirdparty">제3자(명의자 등) 출연</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">출연 자산 유형</label>
              <select
                value={inputs.contributionAssetType}
                onChange={(e) => setField('contributionAssetType', e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 font-black"
              >
                <option value="cash">현금</option>
                <option value="stock_treasury">자기주식</option>
                <option value="stock_owner">대표 보유 주식</option>
                <option value="stock_nominee">차명 주식</option>
                <option value="realestate">부동산</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-bold leading-relaxed">
            * MVP에서는 "법인 출연"일 때 회사 순자산(NAV)이 감소하는 효과를 반영합니다.  
            개인/제3자 출연은 회사 순자산에 직접 영향이 없을 수 있어 주식가치 변화가 제한적일 수 있습니다(별도 확장 가능).
          </div>
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="space-y-10">
          <div className="flex justify-between items-end border-b-4 border-slate-100 pb-6">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">결과 요약(CEO 한 장)</h2>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Total Benefit = Corp + Owner + Succession − RiskBuffer
            </span>
          </div>

          <div className="bg-[#0f2e44] text-white rounded-[56px] p-10 lg:p-14 shadow-2xl space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Kpi
                title="법인세 절감(연)"
                value={`₩${formatWon(result.corpTaxSavingAnnual)}`}
                sub={`유효세율 ${Math.round(preset.corp.corpEffectiveRate * 100)}% (프리셋)`}
              />
              <Kpi
                title="대표 종합소득세 절감(연)"
                value={`₩${formatWon(result.ownerIncomeTaxSavingAnnual)}`}
                sub={`월 환산 ₩${formatWon(result.ownerIncomeTaxSavingMonthly)}`}
              />
              <Kpi
                title="승계세 절감(증여/상속)"
                value={`₩${formatWon(result.successionTaxSaving)}`}
                sub={`출연 전 ₩${formatWon(result.successionTaxBefore)} → 후 ₩${formatWon(result.successionTaxAfter)}`}
              />
            </div>

            <div className="border-t border-white/10 pt-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div className="space-y-2">
                <div className="text-sm font-black text-slate-300 uppercase tracking-widest">1주 평가액(전 → 후)</div>
                <div className="text-3xl lg:text-4xl font-black tracking-tighter">
                  ₩{formatWon(result.valuationBefore.perShareFinal)} → ₩{formatWon(result.valuationAfter.perShareFinal)}
                </div>
                <div className="text-xs text-slate-400 font-bold">
                  순자산가치 ₩{formatWon(result.valuationBefore.perShareNetAsset)} / 수익가치 ₩{formatWon(result.valuationBefore.perShareEarnings)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-black text-slate-300 uppercase tracking-widest">평가대상 주식가치(전 → 후)</div>
                <div className="text-3xl lg:text-4xl font-black tracking-tighter">
                  ₩{formatWon(result.valuationBefore.targetValue)} → ₩{formatWon(result.valuationAfter.targetValue)}
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="text-sm font-black text-slate-300 uppercase tracking-widest">총효과(연)</div>
                <div className="text-4xl lg:text-6xl font-black tracking-tighter">
                  ₩{formatWon(result.totalBenefitAnnual)}
                </div>
                <div className="text-xs text-slate-400 font-bold">
                  리스크 버퍼 차감 ₩{formatWon(result.riskBufferAnnual)}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Panel */}
          <div className="bg-amber-50 border-4 border-amber-100 rounded-[40px] p-8 lg:p-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-2xl font-black text-amber-800">세무·승계 리스크 진단</div>
                <div className="text-amber-700 font-bold text-sm">
                  잉여금/가지급금/차명/부동산 비중을 기반으로 보수적으로 점수화(시뮬레이션)
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-amber-600 uppercase tracking-widest">Risk Level</div>
                <div className="text-4xl font-black text-amber-900">{result.riskProfile.level}</div>
                <div className="text-xs font-bold text-amber-700">score {result.riskProfile.score}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border-2 border-amber-200">
                <div className="text-sm font-black text-amber-600 uppercase tracking-widest mb-3">주요 이슈</div>
                <ul className="space-y-2 text-slate-700 font-bold">
                  {result.riskProfile.flags.map((x, i) => <li key={i}>• {x}</li>)}
                </ul>
              </div>
              <div className="bg-slate-900 rounded-3xl p-6 border-2 border-slate-800">
                <div className="text-sm font-black text-slate-300 uppercase tracking-widest mb-3">추천 액션</div>
                <ul className="space-y-2 text-slate-100 font-bold">
                  {result.riskProfile.actions.map((x, i) => <li key={i}>• {x}</li>)}
                </ul>
              </div>
            </div>

            <div className="text-xs text-amber-700 font-bold leading-relaxed">
              * 본 결과는 "의사결정용 시뮬레이션"입니다. 실제 세액·요건은 법령/예규/사실관계/증빙에 따라 달라질 수 있습니다.  
              → 사근복 출연/현물출연/승계 실행 전에는 세무·법무 검토를 권장합니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({
  label, value, onChange, placeholder, disabled
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-black text-slate-700">{label}</label>
      <input
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9,.-]/g, ''))}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border-4 border-transparent focus:border-blue-500 rounded-2xl p-5 text-xl font-black outline-none transition-all shadow-inner ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
};

const Kpi = ({ title, value, sub }: { title: string; value: string; sub?: string }) => (
  <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
    <div className="text-xs font-black text-slate-300 uppercase tracking-widest">{title}</div>
    <div className="text-3xl lg:text-4xl font-black tracking-tighter mt-2">{value}</div>
    {sub && <div className="text-xs text-slate-300/70 font-bold mt-2">{sub}</div>}
  </div>
);

export default CeoCalculatorV2;
