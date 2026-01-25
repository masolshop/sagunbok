// src/utils/ceo/valuation.ts
import { ValuationPreset } from './presets';
import { sum } from './math';

export type ValuationInputs = {
  issuedShares: number;         // 발행주식수
  targetShares: number;         // 평가(증여/상속) 주식수
  netAsset: number;             // 순자산(자산-부채)
  eps1: number;                 // 최근 1년 EPS(또는 주당순이익)
  eps2: number;                 // 최근 2년 EPS
  eps3: number;                 // 최근 3년 EPS
  // 부동산 과다보유 여부(선택): 가중치 조정 힌트용
  realEstateHeavy?: boolean;
};

export type ValuationOutput = {
  perShareNetAsset: number;
  perShareEarnings: number;
  perShareFinal: number;
  targetValue: number;          // 평가대상 주식가치(= perShareFinal * targetShares)
  debug: {
    weightedEps: number;
    weights: [number, number, number];
    multiple: number;
    weightNetAsset: number;
    weightEarnings: number;
  }
};

export const calcValuationSupplementary = (inp: ValuationInputs, preset: ValuationPreset): ValuationOutput => {
  const issued = Math.max(1, inp.issuedShares || 1);
  const target = Math.max(0, inp.targetShares || 0);

  const perShareNetAsset = (inp.netAsset || 0) / issued;

  const [w1, w2, w3] = preset.earningsWeights;
  const weightedEps = (inp.eps1 * w1 + inp.eps2 * w2 + inp.eps3 * w3) / Math.max(1, (w1 + w2 + w3));

  const perShareEarnings = weightedEps * preset.earningsMultiple;

  // 부동산 과다보유면 순자산 비중을 높이도록 자동 힌트(강제 아님)
  let weightNetAsset = preset.weightNetAsset;
  let weightEarnings = preset.weightEarnings;

  if (inp.realEstateHeavy) {
    // 자동 보수조정(원하면 UI에서 끌 수 있음)
    weightNetAsset = Math.min(0.7, Math.max(0.4, weightNetAsset + 0.1));
    weightEarnings = 1 - weightNetAsset;
  }

  const perShareFinal = perShareNetAsset * weightNetAsset + perShareEarnings * weightEarnings;
  const targetValue = perShareFinal * target;

  return {
    perShareNetAsset,
    perShareEarnings,
    perShareFinal,
    targetValue,
    debug: {
      weightedEps,
      weights: [w1, w2, w3],
      multiple: preset.earningsMultiple,
      weightNetAsset,
      weightEarnings
    }
  };
};
