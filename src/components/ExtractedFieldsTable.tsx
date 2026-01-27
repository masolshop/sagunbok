import React, { useState } from "react";

/**
 * ExtractedFieldsTable.tsx
 * PDF에서 추출된 8개 필드를 테이블 형태로 표시
 * - 신뢰도 점수 시각화
 * - 근거 보기 토글 기능
 * - 복사하기 버튼
 */

type ExtractedField = {
  value: string;
  confidence: number; // 0.0 ~ 1.0
  page_number: number;
  snippet: string;
  method: string;
  unit?: string;
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

export default function ExtractedFieldsTable({ data, onCopy }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (fieldName: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(fieldName)) {
      newExpanded.delete(fieldName);
    } else {
      newExpanded.add(fieldName);
    }
    setExpandedRows(newExpanded);
  };

  const renderConfidenceBar = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    const barColor =
      confidence >= 0.9
        ? "bg-green-500"
        : confidence >= 0.7
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
        <span className="text-sm font-bold text-gray-600">{percentage}%</span>
      </div>
    );
  };

  const formatTextTable = () => {
    let text = "=" + "=".repeat(79) + "\n";
    text += "재무제표 자동 추출 결과\n";
    text += "=" + "=".repeat(79) + "\n\n";

    Object.entries(FIELD_LABELS).forEach(([key, label]) => {
      const field = data[key as keyof ExtractedData];
      if (field) {
        const confidenceBar = "■".repeat(Math.round(field.confidence * 10));
        text += `${label.padEnd(15, " ")} : ${field.value}\n`;
        text += `${"".padEnd(15, " ")}   신뢰도: ${confidenceBar} ${Math.round(
          field.confidence * 100
        )}%\n`;
        text += `${"".padEnd(15, " ")}   출처: ${field.page_number}페이지\n`;
        text += `${"".padEnd(15, " ")}   근거: ${field.snippet}\n\n`;
      } else {
        text += `${label.padEnd(15, " ")} : [추출 실패]\n\n`;
      }
    });

    text += "=" + "=".repeat(79) + "\n";
    return text;
  };

  const handleCopyToClipboard = () => {
    const text = formatTextTable();
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ 텍스트 표가 클립보드에 복사되었습니다!");
      onCopy?.();
    });
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
        <h3 className="flex items-center gap-3 text-blue-700 font-black text-2xl lg:text-3xl">
          <span className="text-3xl lg:text-4xl">📊</span> 추출 결과
        </h3>
        <button
          onClick={handleCopyToClipboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
        >
          📋 복사하기
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-sm">항목</th>
              <th className="px-4 py-3 text-left font-bold text-sm">값</th>
              <th className="px-4 py-3 text-left font-bold text-sm">신뢰도</th>
              <th className="px-4 py-3 text-center font-bold text-sm">근거</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(FIELD_LABELS).map(([key, label]) => {
              const field = data[key as keyof ExtractedData];
              const isExpanded = expandedRows.has(key);

              return (
                <React.Fragment key={key}>
                  <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-700">
                      <span className="mr-2">{FIELD_ICONS[key as keyof typeof FIELD_ICONS]}</span>
                      {label}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {field ? (
                        <span className="font-semibold">{field.value}</span>
                      ) : (
                        <span className="text-gray-400 italic">추출 실패</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {field && renderConfidenceBar(field.confidence)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {field && (
                        <button
                          onClick={() => toggleRow(key)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs hover:bg-blue-200 transition-all"
                        >
                          {isExpanded ? "▲ 숨기기" : "▼ 보기"}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Evidence Row */}
                  {field && isExpanded && (
                    <tr className="bg-blue-50">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold text-sm min-w-[80px]">
                              📄 출처:
                            </span>
                            <span className="text-gray-700 text-sm">
                              {field.page_number}페이지
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold text-sm min-w-[80px]">
                              📝 원문:
                            </span>
                            <span className="text-gray-700 text-sm bg-white px-3 py-2 rounded-lg border border-blue-200">
                              "{field.snippet}"
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold text-sm min-w-[80px]">
                              🔍 방법:
                            </span>
                            <span className="text-gray-600 text-sm">
                              {field.method === "regex"
                                ? "정규식 패턴 매칭"
                                : field.method === "vision_api"
                                ? "Vision API 분석"
                                : field.method === "keyword"
                                ? "키워드 검색"
                                : field.method === "table"
                                ? "표 구조 분석"
                                : "기본값"}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h4 className="font-bold text-gray-700 mb-2 text-sm">신뢰도 범례</h4>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">90% 이상 (높음)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">70~89% (보통)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">70% 미만 (낮음)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
