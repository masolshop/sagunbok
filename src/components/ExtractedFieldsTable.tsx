import React, { useState, useEffect } from "react";

/**
 * ExtractedFieldsTable.tsx
 * PDF에서 추출된 9개 필드를 테이블 형태로 표시
 * - 신뢰도 점수 시각화
 * - 단위 뱃지 표시 (천원, 백만원, 억원, 원)
 * - 스케일 경고 배지 (천원 단위 → ×1,000 적용됨)
 * - 근거 팝업 모달 (페이지/원문/단위/변환값)
 * - 복사하기 버튼 (JSON 형식)
 */

// ============= Types =============
type Evidence = {
  page?: number;
  quote?: string;
};

type ExtractedField = {
  value: string;
  confidence: number; // 0.0 ~ 1.0
  page_number: number;
  snippet: string;
  method: string;
  unit?: string;
  original_text?: string;
  multiplier_to_won?: number;
};

type ExtractedData = {
  company_name?: ExtractedField | null;
  ceo_name?: ExtractedField | null;
  business_number?: ExtractedField | null;
  industry?: ExtractedField | null;
  statement_year?: ExtractedField | null;
  revenue?: ExtractedField | null;
  retained_earnings?: ExtractedField | null;
  loans_to_officers?: ExtractedField | null;
  welfare_expenses?: ExtractedField | null;
};

type Props = {
  data: ExtractedData;
  onCopy?: () => void;
};

// ============= Constants =============
const FIELD_LABELS = {
  company_name: "회사명",
  ceo_name: "대표자",
  business_number: "사업자등록번호",
  industry: "업종",
  statement_year: "재무제표 연도",
  revenue: "매출액",
  retained_earnings: "이익잉여금",
  loans_to_officers: "가지급금(대여금)",
  welfare_expenses: "복리후생비",
};

const FIELD_ICONS = {
  company_name: "🏢",
  ceo_name: "👤",
  business_number: "🔢",
  industry: "🏭",
  statement_year: "📅",
  revenue: "💰",
  retained_earnings: "📈",
  loans_to_officers: "💸",
  welfare_expenses: "🎁",
};

// ============= Utilities =============
const numberToKorean = (num: number): string => {
  if (num === 0) return '0';
  
  const units = ['', '만', '억', '조', '경'];
  const numStr = Math.abs(num).toString();
  const parts: string[] = [];
  
  let unitIndex = 0;
  for (let i = numStr.length; i > 0; i -= 4) {
    const start = Math.max(0, i - 4);
    const part = parseInt(numStr.substring(start, i));
    if (part > 0) {
      parts.unshift(part.toLocaleString() + units[unitIndex]);
    }
    unitIndex++;
  }
  
  const result = parts.join(' ');
  return num < 0 ? '-' + result : result;
};

const isMoneyField = (key: string): boolean => {
  return ['revenue', 'retained_earnings', 'loans_to_officers', 'welfare_expenses'].includes(key);
};

const pct = (conf: number): number => {
  const n = Math.round((conf ?? 0) * 100);
  return Math.max(0, Math.min(100, n));
};

const confTone = (conf: number): "good" | "warn" | "bad" => {
  const p = pct(conf);
  if (p >= 90) return "good";
  if (p >= 70) return "warn";
  return "bad";
};

const formatWon = (n: number): string => {
  return new Intl.NumberFormat("ko-KR").format(n);
};

const getUnitInfo = (field: ExtractedField | null): { unit: string; multiplier: number; displayUnit: string } => {
  if (!field) return { unit: "원", multiplier: 1, displayUnit: "원" };
  
  // Extract unit from field
  let unit = field.unit || "원";
  let multiplier = 1;
  
  // Determine multiplier based on unit
  if (unit === "천원") {
    multiplier = 1000;
  } else if (unit === "백만원") {
    multiplier = 1000000;
  } else if (unit === "억원") {
    multiplier = 100000000;
  }
  
  // Create display unit with multiplier
  let displayUnit = unit;
  if (multiplier !== 1) {
    displayUnit = `${unit} (×${multiplier.toLocaleString()})`;
  }
  
  return { unit, multiplier, displayUnit };
};

const getScaleWarning = (unit: string, multiplier: number): string => {
  if (unit === "천원" && multiplier === 1000) return "천원 단위 감지: 원화 변환(×1,000) 적용됨";
  if (unit === "백만원" && multiplier === 1000000) return "백만원 단위 감지: 원화 변환(×1,000,000) 적용됨";
  if (unit === "억원" && multiplier === 100000000) return "억원 단위 감지: 원화 변환(×100,000,000) 적용됨";
  if (unit === "unknown") return "단위 미확인: 스케일 오류 가능";
  return "";
};

// ============= UI Components =============
function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "good" | "warn" | "bad" | "neutral";
  children: React.ReactNode;
}) {
  const cls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "bad"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-bold text-gray-800">{title}</div>
          <button 
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-semibold hover:bg-gray-100 transition-colors" 
            onClick={onClose}
          >
            닫기
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ============= Main Component =============
export default function ExtractedFieldsTable({ data, onCopy }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<{ key: string; field: ExtractedField } | null>(null);

  const openEvidence = (key: string, field: ExtractedField) => {
    setSelectedField({ key, field });
    setOpen(true);
  };

  const safeRenderValue = (field: any, fieldKey: string): string => {
    if (field == null) return "-";
    if (typeof field === "object") {
      if ("value" in field) {
        const val = field.value;
        if (val == null) return "-";
        
        if (isMoneyField(fieldKey)) {
          const numVal = Number(String(val).replace(/,/g, ''));
          if (!isNaN(numVal)) {
            const formatted = numVal.toLocaleString('ko-KR');
            const korean = numberToKorean(numVal);
            return `${formatted}원 (${korean}원)`;
          }
        }
        
        return String(val);
      }
      return JSON.stringify(field);
    }
    return String(field);
  };

  const renderConfidenceBar = (confidence: number) => {
    const percentage = pct(confidence);
    const tone = confTone(confidence);
    const barColor =
      tone === "good"
        ? "bg-green-500"
        : tone === "warn"
        ? "bg-yellow-500"
        : "bg-red-500";

    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <Badge tone={tone}>{percentage}%</Badge>
      </div>
    );
  };

  const handleCopyToClipboard = async () => {
    const jsonData = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(jsonData);
      alert("✅ 추출 결과(JSON)가 클립보드에 복사되었습니다!");
      onCopy?.();
    } catch (err) {
      console.error('Copy failed:', err);
      alert("❌ 복사에 실패했습니다.");
    }
  };

  const hasData = Object.values(data).some((field) => field !== null && field !== undefined);

  if (!hasData) {
    return (
      <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6 text-center">
        <p className="text-lg text-gray-600 font-semibold">
          📄 PDF를 업로드하면 자동으로 데이터가 추출됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 p-6 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="flex items-center gap-3 text-blue-700 font-black text-2xl lg:text-3xl">
            <span className="text-3xl lg:text-4xl">📊</span> 추출 결과
          </h3>
          <Badge tone="neutral">단위/스케일 자동검증</Badge>
        </div>
        <button
          onClick={handleCopyToClipboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
        >
          📋 복사하기(JSON)
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-sm">항목</th>
              <th className="px-4 py-3 text-left font-bold text-sm">값</th>
              <th className="px-4 py-3 text-left font-bold text-sm">단위</th>
              <th className="px-4 py-3 text-left font-bold text-sm">신뢰도</th>
              <th className="px-4 py-3 text-center font-bold text-sm">근거</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(FIELD_LABELS).map(([key, label]) => {
              const field = data[key as keyof ExtractedData];
              const unitInfo = getUnitInfo(field);
              const scaleWarn = getScaleWarning(unitInfo.unit, unitInfo.multiplier);
              const hasWarn = !!scaleWarn || unitInfo.unit === "unknown";

              return (
                <tr key={key} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-700">
                    <span className="mr-2">{FIELD_ICONS[key as keyof typeof FIELD_ICONS]}</span>
                    {label}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {field ? (
                        <>
                          <span className="font-semibold text-gray-800">{safeRenderValue(field, key)}</span>
                          
                          {/* Scale Warning Badge */}
                          {isMoneyField(key) && hasWarn && (
                            <div className="mt-1">
                              <Badge tone={unitInfo.unit === "unknown" ? "warn" : "good"}>
                                {scaleWarn || "단위 확인 필요"}
                              </Badge>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">추출 실패</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isMoneyField(key) && field ? (
                      <Badge tone={unitInfo.unit === "unknown" ? "warn" : "neutral"}>
                        {unitInfo.displayUnit}
                      </Badge>
                    ) : (
                      <span className="text-gray-500 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {field && renderConfidenceBar(field.confidence)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {field && (
                      <button
                        onClick={() => openEvidence(key, field)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs hover:bg-blue-200 transition-all"
                      >
                        보기
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h4 className="font-bold text-gray-700 mb-2 text-sm">신뢰도 범례</h4>
        <div className="flex flex-wrap gap-3 text-xs">
          <Badge tone="good">90% 이상 (높음)</Badge>
          <Badge tone="warn">70~89% (보통)</Badge>
          <Badge tone="bad">70% 미만 (낮음)</Badge>
        </div>
      </div>

      {/* Evidence Modal */}
      <EvidenceModal
        open={open}
        onClose={() => setOpen(false)}
        fieldKey={selectedField?.key || ""}
        field={selectedField?.field || null}
      />
    </div>
  );
}

// ============= Evidence Modal Component =============
function EvidenceModal({
  open,
  onClose,
  fieldKey,
  field,
}: {
  open: boolean;
  onClose: () => void;
  fieldKey: string;
  field: ExtractedField | null;
}) {
  if (!field) return null;

  const label = FIELD_LABELS[fieldKey as keyof typeof FIELD_LABELS] || fieldKey;
  const unitInfo = getUnitInfo(field);
  const isMoneyType = isMoneyField(fieldKey);

  return (
    <Modal open={open} title="근거(원문/단위/페이지)" onClose={onClose}>
      <div className="grid gap-3 text-sm">
        {/* Field Name */}
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3">
          <div className="text-xs text-blue-600 font-semibold mb-1">항목</div>
          <div className="font-bold text-gray-800">{label}</div>
        </div>

        {/* Original Text & Unit */}
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-gray-300 bg-gray-50 p-3">
            <div className="text-xs text-gray-600 mb-1">원문(Original Text)</div>
            <div className="font-semibold text-gray-800">
              {field.snippet || field.value || "—"}
            </div>
          </div>

          {isMoneyType && (
            <div className="rounded-xl border border-gray-300 bg-gray-50 p-3">
              <div className="text-xs text-gray-600 mb-1">단위 / 배수</div>
              <div className="font-semibold text-gray-800">
                {unitInfo.unit} / ×{unitInfo.multiplier.toLocaleString()}
              </div>
              {field.value && (
                <div className="mt-1 text-xs text-gray-600">
                  변환값: {safeRenderValue(field, fieldKey)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evidence Location */}
        <div className="rounded-xl border border-gray-300 bg-gray-50 p-3">
          <div className="text-xs text-gray-600 mb-1">근거 위치</div>
          <div className="space-y-1">
            <div className="text-gray-800">
              <span className="font-semibold">페이지:</span> {field.page_number || "—"}
            </div>
            <div className="text-gray-800">
              <span className="font-semibold">추출 방법:</span> {field.method || "—"}
            </div>
          </div>
          {field.snippet && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-white p-2 text-xs text-gray-700 whitespace-pre-wrap">
              {field.snippet}
            </div>
          )}
        </div>

        {/* Tip */}
        {isMoneyType && unitInfo.multiplier !== 1 && (
          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            💡 <strong>팁:</strong> 여기서 단위({unitInfo.unit})와 원문 숫자를 확인하면 "1,000배 오류"를 즉시 잡을 수 있어요.
          </div>
        )}
      </div>
    </Modal>
  );
}

// Helper for rendering value in modal
function safeRenderValue(field: any, fieldKey: string): string {
  if (field == null) return "-";
  if (typeof field === "object") {
    if ("value" in field) {
      const val = field.value;
      if (val == null) return "-";
      
      if (isMoneyField(fieldKey)) {
        const numVal = Number(String(val).replace(/,/g, ''));
        if (!isNaN(numVal)) {
          const formatted = numVal.toLocaleString('ko-KR');
          const korean = numberToKorean(numVal);
          return `${formatted}원 (${korean}원)`;
        }
      }
      
      return String(val);
    }
    return JSON.stringify(field);
  }
  return String(field);
}
