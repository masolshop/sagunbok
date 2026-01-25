// src/utils/ceo/math.ts
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const safeNum = (x: any, fallback = 0) => {
  const n = typeof x === 'string' ? Number(x.replace(/[^0-9.-]/g, '')) : Number(x);
  return Number.isFinite(n) ? n : fallback;
};

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export const formatWon = (n: number) => {
  const v = Math.round(n || 0);
  return v.toLocaleString();
};
