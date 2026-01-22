
import { TAX_PRESETS, INCOME_TAX_BRACKETS } from '../constants';

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
