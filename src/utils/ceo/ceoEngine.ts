// src/utils/ceo/ceoEngine.ts
import { DEFAULT_PRESETS, YearKey } from './presets';
import { calcProgressiveTax } from './taxEngines';
import { calcValuationSupplementary, ValuationInputs } from './valuation';
import { buildCeoRiskProfile } from './risk';
import { safeNum } from './math';

export type ContributionAssetType = 'cash' | 'stock_treasury' | 'stock_owner' | 'stock_nominee' | 'realestate';
export type ContributionActor = 'corp' | 'owner' | 'thirdparty';

export type CeoInputs = {
  year: YearKey;

  // 주식 기본
  issuedShares: number;
  targetShares: number;

  // 주식평가 입력
  netAsset: number; // 순자산
  eps1: number;
  eps2: number;
  eps3: number;
  realEstateHeavy?: boolean;

  // 리스크/확장 입력
  retainedEarnings: number; // 미처분이익잉여금
  officerLoan: number;      // 가지급금
  treasurySharesQty: number;
  treasurySharesBookValue: number; // 자기주식 장부가/취득가 등
  realEstateBookValue: number;
  realEstateMarketValue: number;

  // 차명주식(간단) - 합산
  nomineeSharesQty: number;
  nomineeSharesEstValue: number; // 차명주식 추정가치(모르면 0 → 리스크만)

  // 승계
  successionType: 'gift' | 'inherit' | 'both';
  successionShares: number; // 승계 예정 주식수
  useFamilyBizRelief: boolean;
  familyBizReliefCap: number; // 공제 한도(옵션)
  // 원장 종합소득 과표(선택)
  ownerTaxBaseAnnual: number;

  // 출연 시나리오
  contributionActor: ContributionActor;
  contributionAssetType: ContributionAssetType;
  contributionAmount: number; // 현금/부동산/주식가치 기준 "금액"
  // 비용인정률/지급방식 계수(CEO 모듈에서는 '세무조정 반영'용)
  deductibilityRate: number; // 0.5~1.0
  payModeFactor: number;     // 0.6~1.0 (카드/현금 등 리스크 반영)
};

export type CeoOutputs = {
  valuationBefore: ReturnType<typeof calcValuationSupplementary>;
  valuationAfter: ReturnType<typeof calcValuationSupplementary>;

  // 법인세 절감(연)
  corpTaxSavingAnnual: number;

  // 대표 종합소득세 절감(연): 비용인정률/지급방식 계수 반영
  ownerIncomeTaxSavingAnnual: number;
  ownerIncomeTaxSavingMonthly: number;

  // 승계세(증여/상속) 전/후
  successionTaxBefore: number;
  successionTaxAfter: number;
  successionTaxSaving: number;

  // 총효과
  totalBenefitAnnual: number; // (법인세 + 종소세 + 승계세절감) - (리스크버퍼)
  riskBufferAnnual: number;

  // 리스크 프로파일
  riskProfile: ReturnType<typeof buildCeoRiskProfile>;

  // 디버그
  meta: {
    year: YearKey;
    preset: typeof DEFAULT_PRESETS[YearKey];
  };
};

const applyContributionToNetAsset = (netAsset: number, contributionAmount: number, actor: ContributionActor) => {
  // 기본 가정: "법인 자산이 기금으로 출연"이면 순자산 감소
  // 개인/제3자 출연이면 회사 순자산에 직접 영향이 없을 수 있음(기금 자산 증가)
  // → MVP에서는 actor=corp 일 때만 순자산 감소 적용
  if (actor === 'corp') return Math.max(0, netAsset - Math.max(0, contributionAmount));
  return netAsset;
};

const calcSuccessionTax = (taxableBase: number, brackets: any[]) => {
  // 간단 누진: 과표×세율-누진공제(base)
  // 여기서는 calcProgressiveTax 엔진을 그대로 쓰되, bracket 테이블이 base형식이면 동일하게 적용됨
  return calcProgressiveTax(taxableBase, brackets);
};

export const runCeoSimulation = (raw: CeoInputs): CeoOutputs => {
  const year = raw.year;
  const preset = DEFAULT_PRESETS[year];

  const deductibilityRate = Math.max(0, Math.min(1, raw.deductibilityRate || 1));
  const payModeFactor = Math.max(0, Math.min(1, raw.payModeFactor || 1));

  // 1) 주식가치 평가(전)
  const vin: ValuationInputs = {
    issuedShares: Math.max(1, raw.issuedShares),
    targetShares: Math.max(0, raw.targetShares),
    netAsset: Math.max(0, raw.netAsset),
    eps1: safeNum(raw.eps1),
    eps2: safeNum(raw.eps2),
    eps3: safeNum(raw.eps3),
    realEstateHeavy: !!raw.realEstateHeavy
  };
  const valuationBefore = calcValuationSupplementary(vin, preset.valuation);

  // 2) 출연 반영(후): 순자산 변화(법인 출연일 때)
  const netAssetAfter = applyContributionToNetAsset(raw.netAsset, raw.contributionAmount, raw.contributionActor);

  const vinAfter: ValuationInputs = { ...vin, netAsset: netAssetAfter };
  const valuationAfter = calcValuationSupplementary(vinAfter, preset.valuation);

  // 3) 법인세 절감(연): 출연금액 × 유효세율 (MVP)
  const corpTaxSavingAnnual = Math.round(Math.max(0, raw.contributionAmount) * preset.corp.corpEffectiveRate);

  // 4) 대표 종합소득세 절감(연)
  // MVP: 출연/복지구조가 비용으로 인정될 때 과표 감소 = 출연액 × (비용인정률 × 지급방식계수)
  const ownerTaxBase = Math.max(0, raw.ownerTaxBaseAnnual || 0);
  const deductible = Math.max(0, raw.contributionAmount) * deductibilityRate * payModeFactor;

  const taxBefore = calcProgressiveTax(ownerTaxBase, preset.owner.brackets);
  const taxAfter = calcProgressiveTax(Math.max(0, ownerTaxBase - deductible), preset.owner.brackets);

  const incomeTaxSaving = Math.max(0, taxBefore - taxAfter);
  const localTaxSaving = Math.round(incomeTaxSaving * preset.owner.localSurtaxRate);

  const ownerIncomeTaxSavingAnnual = Math.round(incomeTaxSaving + localTaxSaving);
  const ownerIncomeTaxSavingMonthly = Math.round(ownerIncomeTaxSavingAnnual / 12);

  // 5) 승계세(증여/상속) 전/후: 승계 예정 주식수의 평가액 기준 과표 근사
  // 전/후: perShareFinal 기반
  const sharesToTransfer = Math.max(0, raw.successionShares || 0);

  const transferValueBefore = valuationBefore.perShareFinal * sharesToTransfer;
  const transferValueAfter = valuationAfter.perShareFinal * sharesToTransfer;

  // 가업승계 특례(공제) 근사: 과표에서 cap만큼 차감(옵션)
  const reliefCap = raw.useFamilyBizRelief ? Math.max(0, raw.familyBizReliefCap || 0) : 0;

  const taxableBefore = Math.max(0, transferValueBefore - reliefCap);
  const taxableAfter = Math.max(0, transferValueAfter - reliefCap);

  // 증여/상속/둘다: MVP에서는 동일 테이블 적용(시뮬레이션)
  const baseBefore = calcSuccessionTax(taxableBefore, preset.gift.brackets);
  const baseAfter = calcSuccessionTax(taxableAfter, preset.gift.brackets);

  let successionTaxBefore = 0;
  let successionTaxAfter = 0;

  if (raw.successionType === 'gift') {
    successionTaxBefore = baseBefore;
    successionTaxAfter = baseAfter;
  } else if (raw.successionType === 'inherit') {
    successionTaxBefore = baseBefore;
    successionTaxAfter = baseAfter;
  } else {
    // both: 둘 다 비교 KPI로 쓰고 싶다면 합산 대신 "최대값" 근사(보수)
    successionTaxBefore = Math.max(baseBefore, baseBefore);
    successionTaxAfter = Math.max(baseAfter, baseAfter);
  }

  const successionTaxSaving = Math.max(0, successionTaxBefore - successionTaxAfter);

  // 6) 리스크 버퍼(연): 잉여금/가지급금/차명/부동산 비중에 따라 "추정 비용"을 총효과에서 차감
  // MVP: 리스크 점수 기반 % 차감(보수)
  const riskProfile = buildCeoRiskProfile({
    retainedEarnings: raw.retainedEarnings,
    officerLoan: raw.officerLoan,
    nomineeSharesValue: raw.nomineeSharesEstValue,
    realEstateValue: raw.realEstateMarketValue,
    netAsset: raw.netAsset
  });

  const riskPct =
    riskProfile.level === '높음' ? 0.15 :
    riskProfile.level === '보통' ? 0.08 :
    0.03;

  const grossBenefit = corpTaxSavingAnnual + ownerIncomeTaxSavingAnnual + successionTaxSaving;
  const riskBufferAnnual = Math.round(grossBenefit * riskPct);

  const totalBenefitAnnual = Math.round(grossBenefit - riskBufferAnnual);

  return {
    valuationBefore,
    valuationAfter,
    corpTaxSavingAnnual,
    ownerIncomeTaxSavingAnnual,
    ownerIncomeTaxSavingMonthly,
    successionTaxBefore: Math.round(successionTaxBefore),
    successionTaxAfter: Math.round(successionTaxAfter),
    successionTaxSaving: Math.round(successionTaxSaving),
    totalBenefitAnnual,
    riskBufferAnnual,
    riskProfile,
    meta: { year, preset }
  };
};
