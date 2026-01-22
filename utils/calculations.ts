
import { TAX_PRESETS, INCOME_TAX_BRACKETS } from '../constants';
import * as XLSX from 'xlsx';

const money = (x: any) => Math.round(Number(x) || 0);
const roundDown10 = (n: number) => Math.floor(n / 10) * 10;

// 상증세 누진세율표 (간편 산식)
export function progressiveTaxKR(taxBase: number) {
  const x = Math.max(0, money(taxBase));
  if (x <= 100_000_000) return { rate: 0.10, credit: 0, tax: money(x * 0.10) };
  if (x <= 500_000_000) return { rate: 0.20, credit: 10_000_000, tax: money(x * 0.20 - 10_000_000) };
  if (x <= 1_000_000_000) return { rate: 0.30, credit: 60_000_000, tax: money(x * 0.30 - 60_000_000) };
  if (x <= 3_000_000_000) return { rate: 0.40, credit: 160_000_000, tax: money(x * 0.40 - 160_000_000) };
  return { rate: 0.50, credit: 460_000_000, tax: money(x * 0.50 - 460_000_000) };
}

// 비상장주식 보충적 평가액 계산
export function calculateSupplementaryValue({
  sharesOutstanding,
  assetsFair,
  liabilitiesFair,
  eps1, eps2, eps3,
  capitalizationRate = 0.10,
  isRealEstateHeavy = false
}: any) {
  const sh = money(sharesOutstanding);
  if (sh <= 0) return { finalPerShare: 0, navPerShare: 0, earningsValuePerShare: 0, weightedPerShare: 0, navFloor80PerShare: 0 };

  const nav = (money(assetsFair) - money(liabilitiesFair)) / sh;
  const weightedEps = (money(eps1) * 3 + money(eps2) * 2 + money(eps3) * 1) / 6;
  const ev = weightedEps / capitalizationRate;

  const weighted = isRealEstateHeavy
    ? (ev * 2 + nav * 3) / 5
    : (ev * 3 + nav * 2) / 5;

  const floor = nav * 0.8;
  const finalPerShare = Math.max(weighted, floor);

  return {
    navPerShare: Math.round(nav),
    earningsValuePerShare: Math.round(ev),
    weightedPerShare: Math.round(weighted),
    navFloor80PerShare: Math.round(floor),
    finalPerShare: Math.round(finalPerShare)
  };
}

// 가업승계 증여세 과세특례 고도화
export function computeBusinessSuccessionSpecial({
  eligibleValue,
  specialDeduction = 1_000_000_000,
  tier2Threshold = 12_000_000_000,
  rateTier1 = 0.10,
  rateTier2 = 0.20
}: any) {
  const v = money(eligibleValue);
  const base = Math.max(0, v - money(specialDeduction));
  const b1 = Math.min(base, money(tier2Threshold));
  const b2 = Math.max(0, base - money(tier2Threshold));
  const tax = money(b1 * rateTier1) + money(b2 * rateTier2);
  return { taxBase: base, tax, breakdown: { baseTier1: b1, baseTier2: b2 } };
}

// CEO 절세 시뮬레이션 통합 엔진
export function ceoTaxSimulation({
  sharesOutstanding,
  sharesToTransfer,
  assetsFair,
  liabilitiesFair,
  eps1, eps2, eps3,
  capitalizationRate = 0.1,
  isRealEstateHeavy = false,
  giftPrior10y = 0,
  giftDeduction = 50_000_000,
  giftOtherAssets = 0,
  inheritDeduction = 500_000_000,
  inheritOtherAssets = 0,
  contributionAnnual = 0,
  effectiveCorpTaxRate = 0.242,
  simulateContributionImpact = true,
  useBusinessSuccessionSpecial = false,
  specialDeduction = 1_000_000_000,
  specialTier2Threshold = 12_000_000_000,
  specialRate1 = 0.10,
  specialRate2 = 0.20
}: any) {
  const vBefore = calculateSupplementaryValue({
    sharesOutstanding, assetsFair, liabilitiesFair,
    eps1, eps2, eps3, capitalizationRate, isRealEstateHeavy
  });

  const eqValueBefore = vBefore.finalPerShare * money(sharesToTransfer);

  // 출연 전 세금
  const giftBefore = progressiveTaxKR(Math.max(0, eqValueBefore + money(giftOtherAssets) + money(giftPrior10y) - money(giftDeduction)));
  const inheritBefore = progressiveTaxKR(Math.max(0, eqValueBefore + money(inheritOtherAssets) - money(inheritDeduction)));
  let specialBefore = null;
  if (useBusinessSuccessionSpecial) {
    specialBefore = computeBusinessSuccessionSpecial({ 
      eligibleValue: eqValueBefore, specialDeduction, tier2Threshold: specialTier2Threshold, rateTier1: specialRate1, rateTier2: specialRate2 
    });
  }

  let linkedScenario = null;
  const corpTaxSaving = money(money(contributionAnnual) * Number(effectiveCorpTaxRate));

  if (simulateContributionImpact && contributionAnnual > 0) {
    const sh = money(sharesOutstanding);
    const deltaEps = sh > 0 ? (money(contributionAnnual) / sh) : 0;
    
    const vAfter = calculateSupplementaryValue({
      sharesOutstanding,
      assetsFair: money(assetsFair) - money(contributionAnnual),
      liabilitiesFair,
      eps1: money(eps1) - deltaEps,
      eps2: money(eps2) - deltaEps,
      eps3: money(eps3) - deltaEps,
      capitalizationRate,
      isRealEstateHeavy
    });

    const eqValueAfter = vAfter.finalPerShare * money(sharesToTransfer);

    // 출연 후 세금
    const giftAfter = progressiveTaxKR(Math.max(0, eqValueAfter + money(giftOtherAssets) + money(giftPrior10y) - money(giftDeduction)));
    const inheritAfter = progressiveTaxKR(Math.max(0, eqValueAfter + money(inheritOtherAssets) - money(inheritDeduction)));
    let specialAfter = null;
    if (useBusinessSuccessionSpecial) {
      specialAfter = computeBusinessSuccessionSpecial({ 
        eligibleValue: eqValueAfter, specialDeduction, tier2Threshold: specialTier2Threshold, rateTier1: specialRate1, rateTier2: specialRate2 
      });
    }

    const giftTaxReduction = Math.max(0, giftBefore.tax - giftAfter.tax);
    const inheritTaxReduction = Math.max(0, inheritBefore.tax - inheritAfter.tax);
    const specialTaxReduction = (specialBefore && specialAfter) ? Math.max(0, specialBefore.tax - specialAfter.tax) : 0;

    linkedScenario = {
      valuation: {
        perShareBefore: vBefore.finalPerShare,
        perShareAfter: vAfter.finalPerShare,
        deltaPerShare: vAfter.finalPerShare - vBefore.finalPerShare,
        equityValueBefore: eqValueBefore,
        equityValueAfter: eqValueAfter
      },
      taxReductions: {
        gift: giftTaxReduction,
        inheritance: inheritTaxReduction,
        special: specialTaxReduction
      },
      totals: {
        totalSavingGiftRoute: corpTaxSaving + giftTaxReduction,
        totalSavingInheritRoute: corpTaxSaving + inheritTaxReduction,
        totalSavingSpecialRoute: useBusinessSuccessionSpecial ? corpTaxSaving + specialTaxReduction : null
      }
    };
  }

  return {
    valuation: vBefore,
    totalTransferValue: eqValueBefore,
    gift: { tax: giftBefore.tax, rate: giftBefore.rate },
    inheritance: { tax: inheritBefore.tax, rate: inheritBefore.rate },
    specialSuccession: specialBefore,
    sagunbokSaving: corpTaxSaving,
    linkedScenario
  };
}

// --- 기존 기능 유지 ---
export function computeInsuranceMonthly(monthlyTaxable: number, preset: any) {
  const w = money(monthlyTaxable);
  const { healthRate, healthMin, healthMax, ltcRate, pensionRate, pensionMinBase, pensionMaxBase, empInsEmpRate, empInsErRate } = preset;
  let health = roundDown10(w * healthRate);
  if (health < healthMin) health = healthMin;
  if (health > healthMax) health = healthMax;
  let ltc = roundDown10(health * ltcRate);
  let pensionBase = w;
  if (pensionBase < pensionMinBase) pensionBase = pensionMinBase;
  if (pensionBase > pensionMaxBase) pensionBase = pensionMaxBase;
  const pension = roundDown10(pensionBase * pensionRate);
  const empInsEmp = roundDown10(w * empInsEmpRate);
  const empInsEr = roundDown10(w * empInsErRate);
  return {
    employee: { health, ltc, pension, employment: empInsEmp, total: health + ltc + pension + empInsEmp },
    employer: { health, ltc, pension, employment: empInsEr, total: health + ltc + pension + empInsEr }
  };
}

export function incrementalTaxByBrackets(baseAnnual: number, addAnnual: number) {
  const end = baseAnnual + addAnnual;
  let prev = 0, remainingStart = baseAnnual, total = 0;
  for (const b of INCOME_TAX_BRACKETS) {
    const bandStart = prev, bandEnd = b.upTo;
    const taxableInBand = Math.max(0, Math.min(end, bandEnd) - Math.max(remainingStart, bandStart));
    if (taxableInBand > 0) total += Math.round(taxableInBand * b.rate);
    prev = bandEnd;
    if (end <= bandEnd) break;
  }
  return { totalTax: total };
}

export function progressiveIncomeTaxKR(taxBaseAnnual: number) {
  const x = money(taxBaseAnnual);
  if (x <= 14000000) return Math.round(x * 0.06);
  if (x <= 50000000) return Math.round(840000 + (x - 14000000) * 0.15);
  if (x <= 88000000) return Math.round(6240000 + (x - 50000000) * 0.24);
  if (x <= 150000000) return Math.round(15360000 + (x - 88000000) * 0.35);
  if (x <= 300000000) return Math.round(37060000 + (x - 150000000) * 0.38);
  if (x <= 500000000) return Math.round(94060000 + (x - 300000000) * 0.40);
  if (x <= 1000000000) return Math.round(174060000 + (x - 500000000) * 0.42);
  return Math.round(384060000 + (x - 1000000000) * 0.45);
}

export function ownerTaxFromTaxBaseKR(taxBaseAnnual: number, localFactor = 0.10) {
  const base = Math.max(0, money(taxBaseAnnual));
  const incomeTax = progressiveIncomeTaxKR(base);
  const localTax = Math.round(incomeTax * localFactor);
  return { totalTaxAnnual: incomeTax + localTax };
}

export function ownerTaxSavingProgressiveKR({ ownerTaxBaseAnnual, addedExpenseAnnual, localFactor = 0.10 }: any) {
  const base = Math.max(0, money(ownerTaxBaseAnnual));
  const exp = Math.max(0, money(addedExpenseAnnual));
  const before = ownerTaxFromTaxBaseKR(base, localFactor);
  const after = ownerTaxFromTaxBaseKR(Math.max(0, base - exp), localFactor);
  return {
    before, after,
    saving: { totalTaxAnnual: Math.max(0, before.totalTaxAnnual - after.totalTaxAnnual), appliedExpenseAnnual: exp }
  };
}

export function payDoctorNetSimulation({
  yearPreset, netMonthly, taxMode = "advanced", bracketRate = 0, ownerTaxBaseAnnual = 0, ownerLocalTaxFactor = 0.10
}: any) {
  const preset = yearPreset || (TAX_PRESETS as any)[2025];
  const solved = solveGrossForNet({ netTargetMonthly: netMonthly, preset, taxCalcMode: taxMode, bracketRate });
  const d = solved.detail, grossM = money(solved.gross), netM = money(netMonthly);
  const erInsM = money(d.insuranceDetail?.employer?.total || 0), ownerCashOutM = grossM + erInsM;
  const ownerTax = ownerTaxSavingProgressiveKR({ ownerTaxBaseAnnual, addedExpenseAnnual: ownerCashOutM * 12, localFactor: ownerLocalTaxFactor });
  return {
    payroll: {
      grossMonthly: grossM, netMonthly: netM, ownerCoverMonthly: grossM - netM,
      employee: { insuranceMonthly: money(d.employeeInsuranceM), incomeTaxMonthly: money(d.incomeTaxM), localTaxMonthly: money(d.localTaxM) },
      employer: { insuranceMonthly: erInsM, ownerCashOutMonthly: ownerCashOutM }
    },
    ownerTaxEffect: {
      ownerTotalTaxSavingAnnual: ownerTax.saving.totalTaxAnnual,
      ownerAfterTaxCostMonthly_est: Math.round((ownerCashOutM * 12 - ownerTax.saving.totalTaxAnnual) / 12)
    }
  };
}

export function solveGrossForNet({ netTargetMonthly, preset, taxCalcMode, bracketRate }: any) {
  const target = money(netTargetMonthly);
  let lo = target, hi = Math.max(target * 5, target + 10_000_000), best = null;
  for (let i = 0; i < 60; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const ins = computeInsuranceMonthly(mid, preset), empIns = money(ins.employee.total);
    const incomeTaxM = taxCalcMode === "advanced" ? Math.round(incrementalTaxByBrackets(0, mid * 12).totalTax / 12) : Math.round((mid * 12) * (bracketRate || 0) / 12);
    const localTaxM = Math.round(incomeTaxM * 0.1), net = mid - empIns - incomeTaxM - localTaxM;
    best = { gross: mid, netM: net, employeeInsuranceM: empIns, incomeTaxM, localTaxM, insuranceDetail: ins };
    if (net >= target) hi = mid; else lo = mid + 1;
    if (hi - lo <= 1) break;
  }
  return { gross: best?.gross || hi, detail: best };
}

export function payDoctorRiskSimulation({ basePreset, basePayload, shock }: any) {
  const baseline = payDoctorNetSimulation({ yearPreset: basePreset, ...basePayload });
  const shockedPreset = JSON.parse(JSON.stringify(basePreset));
  if (shock.healthRateDeltaPp) shockedPreset.healthRate += (shock.healthRateDeltaPp / 100);
  const shocked = payDoctorNetSimulation({ yearPreset: shockedPreset, ...basePayload });
  return {
    delta: {
      ownerCashOutMonthly: shocked.payroll.employer.ownerCashOutMonthly - baseline.payroll.employer.ownerCashOutMonthly,
      grossMonthly: shocked.payroll.grossMonthly - baseline.payroll.grossMonthly
    }
  };
}

export function raiseToFundSimulation({ currentMonthlyTaxable, shiftMonthly, taxMode, bracketRate, currentTaxBaseAnnual, retirementType, affectsAvgWage, yearsToRetire, yearsServed }: any) {
  const preset = (TAX_PRESETS as any)[2025];
  const curW = money(currentMonthlyTaxable), shiftM = money(shiftMonthly);
  const curIns = computeInsuranceMonthly(curW, preset), newIns = computeInsuranceMonthly(Math.max(0, curW - shiftM), preset);
  const empInsSavingA = (curIns.employee.total - newIns.employee.total) * 12;
  const incomeTaxSavingA = taxMode === 'auto' ? incrementalTaxByBrackets(money(currentTaxBaseAnnual), shiftM * 12).totalTax : Math.round(shiftM * 12 * bracketRate);
  const empTotalSavingA = empInsSavingA + incomeTaxSavingA + Math.round(incomeTaxSavingA * 0.1);
  const severanceLoss = (retirementType === 'DB' && affectsAvgWage) ? Math.round(shiftM * (Number(yearsServed) + Number(yearsToRetire))) : 0;
  return { empTotalSavingA, netBenefit: (empTotalSavingA * Number(yearsToRetire)) - severanceLoss, cumulativeSaving: empTotalSavingA * Number(yearsToRetire), severanceLoss, breakEvenYears: empTotalSavingA > 0 ? (severanceLoss / empTotalSavingA) : 0 };
}

// ==============================
// NetPay + Fund Compare + Bulk CSV + Owner Income Tax Advanced (KR)
// No external deps
// ==============================

export type RetirementPlanType = 'DB' | 'DC' | 'IRP';

export interface BulkRowInput {
  name?: string;
  role?: 'DOCTOR' | 'STAFF';
  netTargetMonthly: number;
  welfarePointMonthly: number;
  tenureYears: number;
  retirementPlan: RetirementPlanType;
  bracketRate?: number;
}

export interface BulkRowResult {
  name?: string;
  role?: 'DOCTOR' | 'STAFF';

  before: {
    grossMonthly: number;
    empInsuranceMonthly: number;
    empTaxMonthly: number;
    coInsuranceMonthly: number;
    outflowMonthly: number;
  };

  after: {
    grossMonthly: number;
    empInsuranceMonthly: number;
    empTaxMonthly: number;
    coInsuranceMonthly: number;
    outflowMonthly: number;
  };

  savings: {
    empInsuranceMonthly: number;
    empTaxMonthly: number;
    empTotalMonthly: number;
    coInsuranceMonthly: number;
    outflowMonthly: number;
  };

  severanceVsSavings: {
    severanceLossEstimate: number;
    taxSavingsTotal: number;
    netBenefit: number;
  };
}

export interface BulkAggregate {
  headcount: number;
  doctorCount: number;
  staffCount: number;

  totalBeforeOutflowMonthly: number;
  totalAfterOutflowMonthly: number;
  totalOutflowSavingMonthly: number;

  totalEmpTaxSavingMonthly: number;
  totalEmpInsuranceSavingMonthly: number;
  totalEmpSavingMonthly: number;

  totalCoInsuranceSavingMonthly: number;

  totalSeveranceLossEstimate: number;
  totalTaxSavingsTotal: number;
  totalNetBenefit: number;

  totalWelfarePointMonthly: number;
}

function approxEmpInsurance(gross: number, empRate = 0.047): number {
  return gross * empRate;
}
function approxCoInsurance(gross: number, coRate = 0.055): number {
  return gross * coRate;
}
function approxWageTax(gross: number, bracketRate = 0.15): number {
  return gross * bracketRate;
}

export function solveGrossUp({
  netTarget,
  bracketRate = 0.15,
  empInsuranceRate = 0.047
}: {
  netTarget: number;
  bracketRate?: number;
  empInsuranceRate?: number;
}) {
  const rI = empInsuranceRate;
  const rT = bracketRate;

  const netOf = (g: number) => g - g * rI - g * rT;

  let lo = 0;
  let hi = Math.max(netTarget * 3, 1_000_000);

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (netOf(mid) >= netTarget) hi = mid;
    else lo = mid;
  }

  const gross = hi;
  return {
    grossMonthly: gross,
    empInsuranceMonthly: approxEmpInsurance(gross, rI),
    empTaxMonthly: approxWageTax(gross, rT),
    coInsuranceMonthly: (coRate = 0.055) => approxCoInsurance(gross, coRate),
    outflowMonthlyWithCo: (coRate = 0.055) => gross + approxCoInsurance(gross, coRate)
  };
}

export function compareNetPayWithWelfarePoint({
  netTargetMonthly,
  welfarePointMonthly,
  bracketRate = 0.15,
  empInsuranceRate = 0.047,
  coInsuranceRate = 0.055
}: {
  netTargetMonthly: number;
  welfarePointMonthly: number;
  bracketRate?: number;
  empInsuranceRate?: number;
  coInsuranceRate?: number;
}) {
  const before = solveGrossUp({ netTarget: netTargetMonthly, bracketRate, empInsuranceRate });
  const netCashTarget = Math.max(netTargetMonthly - welfarePointMonthly, 0);
  const after = solveGrossUp({ netTarget: netCashTarget, bracketRate, empInsuranceRate });

  const beforeCo = before.coInsuranceMonthly(coInsuranceRate);
  const afterCo = after.coInsuranceMonthly(coInsuranceRate);

  const beforeOutflow = before.grossMonthly + beforeCo;
  const afterOutflow = after.grossMonthly + afterCo + welfarePointMonthly; // 포인트 비용 포함(보수적)

  return {
    before: {
      grossMonthly: before.grossMonthly,
      empInsuranceMonthly: before.empInsuranceMonthly,
      empTaxMonthly: before.empTaxMonthly,
      coInsuranceMonthly: beforeCo,
      outflowMonthly: beforeOutflow
    },
    after: {
      grossMonthly: after.grossMonthly,
      empInsuranceMonthly: after.empInsuranceMonthly,
      empTaxMonthly: after.empTaxMonthly,
      coInsuranceMonthly: afterCo,
      outflowMonthly: afterOutflow
    }
  };
}

export function severanceVsTaxSavingsEstimate({
  grossBeforeMonthly,
  grossAfterMonthly,
  empTaxSavingMonthly,
  empInsuranceSavingMonthly,
  tenureYears,
  retirementPlan
}: {
  grossBeforeMonthly: number;
  grossAfterMonthly: number;
  empTaxSavingMonthly: number;
  empInsuranceSavingMonthly: number;
  tenureYears: number;
  retirementPlan: RetirementPlanType;
}) {
  const deltaGross = Math.max(grossBeforeMonthly - grossAfterMonthly, 0);
  const years = Math.max(tenureYears || 0, 0);

  // 보수적 단순화(추후 고도화 가능)
  // DB: 평균임금 영향이 크다고 가정(감소분 반영)
  // DC/IRP: 기여금 감소 방향으로 동일하게 보수적 처리
  const planFactor = retirementPlan === 'DB' ? 1.0 : retirementPlan === 'DC' ? 0.8 : 0.8;
  const severanceLoss = deltaGross * years * planFactor;

  const savingMonthly = Math.max(empTaxSavingMonthly, 0) + Math.max(empInsuranceSavingMonthly, 0);
  const taxSavingsTotal = savingMonthly * 12 * years;

  return {
    severanceLossEstimate: severanceLoss,
    taxSavingsTotal,
    netBenefit: taxSavingsTotal - severanceLoss
  };
}

// ---------------- CSV (no deps) ----------------
export function parseBulkCsv(text: string): BulkRowInput[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim());
  const idx = (key: string) => header.findIndex(h => h.toLowerCase() === key.toLowerCase());

  const get = (cols: string[], key: string) => {
    const i = idx(key);
    return i >= 0 ? (cols[i] ?? '').trim() : '';
  };

  const num = (s: string) => {
    const cleaned = (s || '').replace(/[^0-9.-]/g, '');
    const v = Number(cleaned);
    return Number.isFinite(v) ? v : 0;
  };

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const roleRaw = get(cols, 'role').toUpperCase();
    const planRaw = (get(cols, 'retirementPlan') || 'DB').toUpperCase();

    return {
      name: get(cols, 'name') || undefined,
      role: roleRaw === 'DOCTOR' ? 'DOCTOR' : 'STAFF',
      netTargetMonthly: num(get(cols, 'netTargetMonthly')),
      welfarePointMonthly: num(get(cols, 'welfarePointMonthly')),
      tenureYears: num(get(cols, 'tenureYears')),
      retirementPlan: (planRaw === 'DC' ? 'DC' : planRaw === 'IRP' ? 'IRP' : 'DB'),
      bracketRate: get(cols, 'bracketRate') ? num(get(cols, 'bracketRate')) : undefined
    };
  });
}

export function runBulkNetpayWithFundFromRows({
  rows,
  defaultBracketRate = 0.15,
  empInsuranceRate = 0.047,
  coInsuranceRate = 0.055
}: {
  rows: BulkRowInput[];
  defaultBracketRate?: number;
  empInsuranceRate?: number;
  coInsuranceRate?: number;
}) {
  const results: BulkRowResult[] = [];

  const agg: BulkAggregate = {
    headcount: 0,
    doctorCount: 0,
    staffCount: 0,

    totalBeforeOutflowMonthly: 0,
    totalAfterOutflowMonthly: 0,
    totalOutflowSavingMonthly: 0,

    totalEmpTaxSavingMonthly: 0,
    totalEmpInsuranceSavingMonthly: 0,
    totalEmpSavingMonthly: 0,

    totalCoInsuranceSavingMonthly: 0,

    totalSeveranceLossEstimate: 0,
    totalTaxSavingsTotal: 0,
    totalNetBenefit: 0,

    totalWelfarePointMonthly: 0
  };

  for (const r of rows) {
    const bracketRate = r.bracketRate ?? defaultBracketRate;

    const cmp = compareNetPayWithWelfarePoint({
      netTargetMonthly: r.netTargetMonthly,
      welfarePointMonthly: r.welfarePointMonthly,
      bracketRate,
      empInsuranceRate,
      coInsuranceRate
    });

    const savingEmpIns = cmp.before.empInsuranceMonthly - cmp.after.empInsuranceMonthly;
    const savingEmpTax = cmp.before.empTaxMonthly - cmp.after.empTaxMonthly;
    const savingCoIns = cmp.before.coInsuranceMonthly - cmp.after.coInsuranceMonthly;
    const savingOutflow = cmp.before.outflowMonthly - cmp.after.outflowMonthly;

    const sv = severanceVsTaxSavingsEstimate({
      grossBeforeMonthly: cmp.before.grossMonthly,
      grossAfterMonthly: cmp.after.grossMonthly,
      empTaxSavingMonthly: savingEmpTax,
      empInsuranceSavingMonthly: savingEmpIns,
      tenureYears: r.tenureYears,
      retirementPlan: r.retirementPlan
    });

    results.push({
      name: r.name,
      role: r.role,
      before: cmp.before,
      after: cmp.after,
      savings: {
        empInsuranceMonthly: savingEmpIns,
        empTaxMonthly: savingEmpTax,
        empTotalMonthly: savingEmpIns + savingEmpTax,
        coInsuranceMonthly: savingCoIns,
        outflowMonthly: savingOutflow
      },
      severanceVsSavings: sv
    });

    agg.headcount += 1;
    if (r.role === 'DOCTOR') agg.doctorCount += 1;
    else agg.staffCount += 1;

    agg.totalBeforeOutflowMonthly += cmp.before.outflowMonthly;
    agg.totalAfterOutflowMonthly += cmp.after.outflowMonthly;
    agg.totalOutflowSavingMonthly += savingOutflow;

    agg.totalEmpTaxSavingMonthly += savingEmpTax;
    agg.totalEmpInsuranceSavingMonthly += savingEmpIns;
    agg.totalEmpSavingMonthly += (savingEmpTax + savingEmpIns);

    agg.totalCoInsuranceSavingMonthly += savingCoIns;

    agg.totalSeveranceLossEstimate += sv.severanceLossEstimate;
    agg.totalTaxSavingsTotal += sv.taxSavingsTotal;
    agg.totalNetBenefit += sv.netBenefit;

    agg.totalWelfarePointMonthly += Math.max(r.welfarePointMonthly || 0, 0);
  }

  return { results, aggregate: agg };
}

export function buildBulkCsvTemplate(): string {
  return [
    'name,role,netTargetMonthly,welfarePointMonthly,tenureYears,retirementPlan,bracketRate',
    '홍길동,DOCTOR,10000000,300000,10,DB,0.24',
    '김철수,STAFF,3500000,200000,5,DC,0.15'
  ].join('\n');
}

// ---------------- Owner Income Tax Advanced (KR) ----------------
// 2025 기준 간편산식(누진 + 공제액). 반환: 국세(소득세)
export function incomeTaxProgressiveKR(taxBaseAnnual: number): number {
  const x = Math.max(taxBaseAnnual, 0);

  // 간편산식: 세액 = 과표*세율 - 누진공제
  // (2025 기준 8단계, 일반적인 국세청 표준 구간)
  if (x <= 14_000_000) return x * 0.06;
  if (x <= 50_000_000) return x * 0.15 - 1_260_000;
  if (x <= 88_000_000) return x * 0.24 - 5_760_000;
  if (x <= 150_000_000) return x * 0.35 - 15_440_000;
  if (x <= 300_000_000) return x * 0.38 - 19_940_000;
  if (x <= 500_000_000) return x * 0.40 - 25_940_000;
  if (x <= 1_000_000_000) return x * 0.42 - 35_940_000;
  return x * 0.45 - 65_940_000;
}

// 지방소득세(소득세의 10%) 포함 총세액
export function incomeTaxTotalWithLocalKR(taxBaseAnnual: number): number {
  const nat = incomeTaxProgressiveKR(taxBaseAnnual);
  const local = nat * 0.10;
  return nat + local;
}

// 원장 종소세 변화(공식화된 비용의 인정률 변화로 과표가 줄어드는 효과)
export function ownerIncomeTaxDeltaAdvancedKR({
  ownerTaxBaseAnnual,
  formalizedExpenseAnnual,
  beforeRecognizeRate,
  afterRecognizeRate
}: {
  ownerTaxBaseAnnual: number;
  formalizedExpenseAnnual: number;
  beforeRecognizeRate: number; // 0~100
  afterRecognizeRate: number;  // 0~100
}) {
  const br = Math.min(Math.max(beforeRecognizeRate, 0), 100) / 100;
  const ar = Math.min(Math.max(afterRecognizeRate, 0), 100) / 100;

  const beforeBase = Math.max(ownerTaxBaseAnnual - formalizedExpenseAnnual * br, 0);
  const afterBase = Math.max(ownerTaxBaseAnnual - formalizedExpenseAnnual * ar, 0);

  const beforeTotalTax = incomeTaxTotalWithLocalKR(beforeBase);
  const afterTotalTax = incomeTaxTotalWithLocalKR(afterBase);

  return {
    beforeBase,
    afterBase,
    beforeTotalTax,
    afterTotalTax,
    saving: beforeTotalTax - afterTotalTax // +면 절세, -면 증세
  };
}

// ============================================================================
// UPDATE 2: XLSX Support + Precise Insurance/Tax Engine + Role-based KPI
// ============================================================================

// ---- XLSX template + parser ----
export function buildBulkXlsxTemplate(): Blob {
  const header = ['name','role','netTargetMonthly','welfarePointMonthly','tenureYears','retirementPlan','bracketRate'];
  const rows = [
    header,
    ['홍길동','DOCTOR',10000000,300000,10,'DB',0.24],
    ['김철수','STAFF',3500000,200000,5,'DC',0.15]
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'netpay');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function parseBulkXlsx(arrayBuffer: ArrayBuffer): BulkRowInput[] {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const wsName = wb.SheetNames[0];
  const ws = wb.Sheets[wsName];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

  const num = (v: any) => {
    const s = String(v ?? '').replace(/[^0-9.-]/g,'');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  return json.map(row => {
    const roleRaw = String(row.role ?? row.Role ?? '').toUpperCase();
    const planRaw = String(row.retirementPlan ?? row.RetirementPlan ?? 'DB').toUpperCase();
    return {
      name: String(row.name ?? row.Name ?? '') || undefined,
      role: roleRaw === 'DOCTOR' ? 'DOCTOR' : 'STAFF',
      netTargetMonthly: num(row.netTargetMonthly),
      welfarePointMonthly: num(row.welfarePointMonthly),
      tenureYears: num(row.tenureYears),
      retirementPlan: (planRaw === 'DC' ? 'DC' : planRaw === 'IRP' ? 'IRP' : 'DB'),
      bracketRate: row.bracketRate !== '' ? num(row.bracketRate) : undefined
    } as BulkRowInput;
  });
}

// ---- Precise gross-up using TAX_PRESETS ----
type TaxMode = 'advanced' | 'bracket';

export function solveGrossForNetPrecise({
  netTargetMonthly,
  preset,
  taxMode,
  bracketRate
}: {
  netTargetMonthly: number;
  preset: any;
  taxMode: TaxMode;
  bracketRate: number;
}) {
  const target = Math.max(netTargetMonthly, 0);

  let lo = 0;
  let hi = Math.max(target * 3, 1_000_000);

  const calcNet = (gross: number) => {
    // insurance (precise) - computeInsuranceMonthly returns { employee: {..., total}, employer: {..., total} }
    const ins = computeInsuranceMonthly(gross, preset);
    const empIns = ins.employee.total;
    const erIns = ins.employer.total;

    // wage tax (monthly): use advanced engine if taxMode === 'advanced'
    let empTax = 0;
    if (taxMode === 'advanced') {
      // Use incrementalTaxByBrackets for precise calculation
      const annualTax = incrementalTaxByBrackets(0, gross * 12).totalTax;
      empTax = Math.round(annualTax / 12);
      // Add local tax (10%)
      empTax = Math.round(empTax * 1.10);
    } else {
      // bracket fallback (monthly)
      empTax = Math.round(gross * bracketRate);
      // add local tax 10%
      empTax = Math.round(empTax * 1.10);
    }

    const net = gross - empIns - empTax;
    return { net, empIns, empTax, erIns };
  };

  let last = calcNet(hi);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const cur = calcNet(mid);
    last = cur;
    if (cur.net >= target) hi = mid;
    else lo = mid;
  }

  const out = calcNet(hi);
  return {
    grossMonthly: Math.round(hi),
    empInsuranceMonthly: Math.round(out.empIns),
    empTaxMonthly: Math.round(out.empTax),
    coInsuranceMonthly: Math.round(out.erIns),
    netMonthly: Math.round(out.net)
  };
}

export function compareNetPayWithWelfarePointPrecise({
  netTargetMonthly,
  welfarePointMonthly,
  preset,
  taxMode,
  bracketRate
}: {
  netTargetMonthly: number;
  welfarePointMonthly: number;
  preset: any;
  taxMode: TaxMode;
  bracketRate: number;
}) {
  const before = solveGrossForNetPrecise({ netTargetMonthly, preset, taxMode, bracketRate });
  const netCash = Math.max(netTargetMonthly - welfarePointMonthly, 0);
  const after = solveGrossForNetPrecise({ netTargetMonthly: netCash, preset, taxMode, bracketRate });

  const beforeOutflow = before.grossMonthly + before.coInsuranceMonthly;
  const afterOutflow = after.grossMonthly + after.coInsuranceMonthly + welfarePointMonthly; // 포인트 비용 포함(보수적)

  return {
    before: { ...before, outflowMonthly: beforeOutflow },
    after: { ...after, outflowMonthly: afterOutflow }
  };
}

// ---- Bulk aggregate breakdown by role ----
export interface RoleAggregate {
  headcount: number;
  beforeOutflowMonthly: number;
  afterOutflowMonthly: number;
  savingOutflowMonthly: number;
  coInsuranceSavingMonthly: number;
  empSavingMonthly: number;
  welfarePointMonthly: number;
}

export interface AggregateByRole {
  doctor: RoleAggregate;
  staff: RoleAggregate;
  total: RoleAggregate;
}

export function runBulkNetpayWithFundPrecise({
  rows,
  preset,
  taxMode,
  defaultBracketRate
}: {
  rows: BulkRowInput[];
  preset: any;
  taxMode: TaxMode;
  defaultBracketRate: number;
}) {
  const results: BulkRowResult[] = [];

  const mkAgg = (): RoleAggregate => ({
    headcount: 0,
    beforeOutflowMonthly: 0,
    afterOutflowMonthly: 0,
    savingOutflowMonthly: 0,
    coInsuranceSavingMonthly: 0,
    empSavingMonthly: 0,
    welfarePointMonthly: 0
  });

  const doctor = mkAgg();
  const staff = mkAgg();
  const total = mkAgg();

  for (const r of rows) {
    const br = r.bracketRate ?? defaultBracketRate;

    const cmp = compareNetPayWithWelfarePointPrecise({
      netTargetMonthly: r.netTargetMonthly,
      welfarePointMonthly: r.welfarePointMonthly,
      preset,
      taxMode,
      bracketRate: br
    });

    const savingEmpIns = cmp.before.empInsuranceMonthly - cmp.after.empInsuranceMonthly;
    const savingEmpTax = cmp.before.empTaxMonthly - cmp.after.empTaxMonthly;
    const savingCoIns = cmp.before.coInsuranceMonthly - cmp.after.coInsuranceMonthly;
    const savingOutflow = cmp.before.outflowMonthly - cmp.after.outflowMonthly;

    const sv = severanceVsTaxSavingsEstimate({
      grossBeforeMonthly: cmp.before.grossMonthly,
      grossAfterMonthly: cmp.after.grossMonthly,
      empTaxSavingMonthly: savingEmpTax,
      empInsuranceSavingMonthly: savingEmpIns,
      tenureYears: r.tenureYears,
      retirementPlan: r.retirementPlan
    });

    results.push({
      name: r.name,
      role: r.role,
      before: {
        grossMonthly: cmp.before.grossMonthly,
        empInsuranceMonthly: cmp.before.empInsuranceMonthly,
        empTaxMonthly: cmp.before.empTaxMonthly,
        coInsuranceMonthly: cmp.before.coInsuranceMonthly,
        outflowMonthly: cmp.before.outflowMonthly
      },
      after: {
        grossMonthly: cmp.after.grossMonthly,
        empInsuranceMonthly: cmp.after.empInsuranceMonthly,
        empTaxMonthly: cmp.after.empTaxMonthly,
        coInsuranceMonthly: cmp.after.coInsuranceMonthly,
        outflowMonthly: cmp.after.outflowMonthly
      },
      savings: {
        empInsuranceMonthly: savingEmpIns,
        empTaxMonthly: savingEmpTax,
        empTotalMonthly: savingEmpIns + savingEmpTax,
        coInsuranceMonthly: savingCoIns,
        outflowMonthly: savingOutflow
      },
      severanceVsSavings: sv
    });

    const bucket = r.role === 'DOCTOR' ? doctor : staff;
    for (const b of [bucket, total]) {
      b.headcount += 1;
      b.beforeOutflowMonthly += cmp.before.outflowMonthly;
      b.afterOutflowMonthly += cmp.after.outflowMonthly;
      b.savingOutflowMonthly += savingOutflow;
      b.coInsuranceSavingMonthly += savingCoIns;
      b.empSavingMonthly += (savingEmpIns + savingEmpTax);
      b.welfarePointMonthly += Math.max(r.welfarePointMonthly || 0, 0);
    }
  }

  return { results, aggregateByRole: { doctor, staff, total } };
}
