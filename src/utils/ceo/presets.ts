// src/utils/ceo/presets.ts
export type YearKey = 2025 | 2026;

export type CorpTaxPreset = {
  year: YearKey;
  // 법인 유효세율(간편). 과세표준 엔진을 붙이고 싶으면 별도 구현 가능.
  corpEffectiveRate: number; // 예: 0.22
};

export type OwnerIncomeTaxPreset = {
  year: YearKey;
  // 종합소득세 누진(간편 엔진). 필요 시 구간/공제 추가 가능.
  brackets: Array<{ upto: number; rate: number; base: number }>; 
  localSurtaxRate: number; // 지방소득세(소득세의 10% 근사): 0.1
};

export type GiftInheritanceTaxPreset = {
  year: YearKey;
  // 증여/상속세 누진(간편 엔진). 실제 신고용이 아니라 시뮬레이션용.
  // 구조: 과세표준 x rate - base
  brackets: Array<{ upto: number; rate: number; base: number }>;
  // 가업승계/가업상속공제 등 한도/적용은 옵션으로 처리
  // (정확한 요건/한도는 연도별 변경 가능 → UI에서 수정 가능하도록 열어둠)
};

export type ValuationPreset = {
  year: YearKey;
  // 보충적 평가(간편) 가중치: 순자산 + 수익
  // 통상 "수익가치/순자산가치 가중" 형태를 쓰되, 회사 특성(부동산 과다 등)에 따라 조정 가능
  weightNetAsset: number;  // 예: 0.4
  weightEarnings: number;  // 예: 0.6
  // 수익가치 환원배수(간편): 평균 EPS * multiple
  earningsMultiple: number; // 예: 10 (환원율 10% 가정)
  // 최근 3개년 가중치(3년:2년:1년)
  earningsWeights: [number, number, number]; // 예: [3,2,1]
};

export const DEFAULT_PRESETS: Record<YearKey, {
  corp: CorpTaxPreset;
  owner: OwnerIncomeTaxPreset;
  gift: GiftInheritanceTaxPreset;
  valuation: ValuationPreset;
}> = {
  2025: {
    corp: { year: 2025, corpEffectiveRate: 0.22 },
    owner: {
      year: 2025,
      // ⚠️ 예시용 누진 테이블(시뮬레이션). 실제 연도별 세율표로 교체 가능.
      // 구조: tax = base + (income - prevUpto)*rate
      brackets: [
        { upto: 14_000_000, rate: 0.06, base: 0 },
        { upto: 50_000_000, rate: 0.15, base: 840_000 },
        { upto: 88_000_000, rate: 0.24, base: 6_240_000 },
        { upto: 150_000_000, rate: 0.35, base: 15_360_000 },
        { upto: 300_000_000, rate: 0.38, base: 37_460_000 },
        { upto: 500_000_000, rate: 0.40, base: 94_460_000 },
        { upto: 1_000_000_000, rate: 0.42, base: 174_460_000 },
        { upto: Infinity, rate: 0.45, base: 384_460_000 },
      ],
      localSurtaxRate: 0.1
    },
    gift: {
      year: 2025,
      // ⚠️ 예시용(시뮬레이션). 실제 증여세/상속세 누진표로 교체 가능.
      brackets: [
        { upto: 100_000_000, rate: 0.10, base: 0 },
        { upto: 500_000_000, rate: 0.20, base: 10_000_000 },
        { upto: 1_000_000_000, rate: 0.30, base: 60_000_000 },
        { upto: 3_000_000_000, rate: 0.40, base: 160_000_000 },
        { upto: Infinity, rate: 0.50, base: 460_000_000 },
      ]
    },
    valuation: {
      year: 2025,
      weightNetAsset: 0.4,
      weightEarnings: 0.6,
      earningsMultiple: 10,
      earningsWeights: [3, 2, 1]
    }
  },
  2026: {
    corp: { year: 2026, corpEffectiveRate: 0.22 },
    owner: {
      year: 2026,
      // 일단 2025와 동일(시뮬레이션). 필요 시 2026 세율표로 수정
      brackets: [
        { upto: 14_000_000, rate: 0.06, base: 0 },
        { upto: 50_000_000, rate: 0.15, base: 840_000 },
        { upto: 88_000_000, rate: 0.24, base: 6_240_000 },
        { upto: 150_000_000, rate: 0.35, base: 15_360_000 },
        { upto: 300_000_000, rate: 0.38, base: 37_460_000 },
        { upto: 500_000_000, rate: 0.40, base: 94_460_000 },
        { upto: 1_000_000_000, rate: 0.42, base: 174_460_000 },
        { upto: Infinity, rate: 0.45, base: 384_460_000 },
      ],
      localSurtaxRate: 0.1
    },
    gift: {
      year: 2026,
      brackets: [
        { upto: 100_000_000, rate: 0.10, base: 0 },
        { upto: 500_000_000, rate: 0.20, base: 10_000_000 },
        { upto: 1_000_000_000, rate: 0.30, base: 60_000_000 },
        { upto: 3_000_000_000, rate: 0.40, base: 160_000_000 },
        { upto: Infinity, rate: 0.50, base: 460_000_000 },
      ]
    },
    valuation: {
      year: 2026,
      weightNetAsset: 0.4,
      weightEarnings: 0.6,
      earningsMultiple: 10,
      earningsWeights: [3, 2, 1]
    }
  }
};
