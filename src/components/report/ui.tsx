// 공통 UI 컴포넌트 (배지/스코어/섹션 카드)
import React from "react";

export function SectionCard({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{title}</div>
        <div>{right}</div>
      </div>
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "good" | "warn" | "bad" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    good: {
      border: '1px solid #d1fae5',
      backgroundColor: '#ecfdf5',
      color: '#065f46',
    },
    warn: {
      border: '1px solid #fde68a',
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
    bad: {
      border: '1px solid #fecaca',
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    neutral: {
      border: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      color: '#374151',
    },
  };

  const style = styles[tone];

  return (
    <span style={{
      ...style,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      borderRadius: '9999px',
      padding: '4px 8px',
      fontSize: '12px',
    }}>
      {children}
    </span>
  );
}

export function ScorePill({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      padding: '12px',
    }}>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

export function toneFromRisk(risk?: string): "good" | "warn" | "bad" | "neutral" {
  if (!risk) return "neutral";
  const r = risk.toLowerCase();
  if (r === "high" || r === "위험") return "bad";
  if (r === "medium" || r === "주의") return "warn";
  if (r === "low" || r === "우수" || r === "양호") return "good";
  return "neutral";
}
