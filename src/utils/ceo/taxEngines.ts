// src/utils/ceo/taxEngines.ts
export type ProgressiveBracket = { upto: number; rate: number; base: number };

// income: 과세표준(연)
export const calcProgressiveTax = (income: number, brackets: ProgressiveBracket[]) => {
  const x = Math.max(0, income || 0);
  let prevUpto = 0;

  for (const b of brackets) {
    if (x <= b.upto) {
      const taxableInBand = x - prevUpto;
      // base + (x - prev)*rate 방식(테이블이 그렇게 설계되어 있어야 함)
      // base는 해당 구간에 들어왔을 때 누적세액
      const tax = b.base + taxableInBand * b.rate;
      return Math.max(0, tax);
    }
    prevUpto = b.upto;
  }
  return 0;
};
