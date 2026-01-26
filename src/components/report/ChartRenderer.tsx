// 차트 렌더러 - 모든 차트 타입 지원
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Area,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";
import { SectionCard } from "./ui";

type ChartSpec = {
  id: string;
  title: string;
  type: string;
  data: any[];
  config?: {
    x_key?: string;
    y_key?: string;
    value_key?: string;
    series?: string[];
    y_domain?: any[];
    colors?: string[];
  };
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function ChartRenderer({ chart }: { chart: ChartSpec }) {
  const xKey = chart.config?.x_key ?? "x";
  const yKey = chart.config?.y_key ?? "y";
  const valueKey = chart.config?.value_key ?? "value";
  const series = chart.config?.series ?? [];
  const colors = chart.config?.colors ?? COLORS;

  return (
    <SectionCard title={chart.title}>
      <div style={{ height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "line" ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {series.map((k, i) => (
                <Line key={k} dataKey={k} stroke={colors[i % colors.length]} />
              ))}
            </LineChart>
          ) : chart.type === "bar" || chart.type === "bar_group" ? (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} interval={0} angle={-10} height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {series.map((k, i) => (
                <Bar key={k} dataKey={k} fill={colors[i % colors.length]} />
              ))}
            </BarChart>
          ) : chart.type === "radar" ? (
            <RadarChart data={chart.data}>
              <PolarGrid />
              <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <PolarRadiusAxis
                angle={90}
                domain={chart.config?.y_domain ?? [0, 5]}
                tick={{ fontSize: 11 }}
              />
              {series.length ? (
                series.map((k, i) => (
                  <Radar
                    key={k}
                    dataKey={k}
                    stroke={colors[i % colors.length]}
                    fill={colors[i % colors.length]}
                    fillOpacity={0.6}
                  />
                ))
              ) : (
                <Radar dataKey={valueKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
              )}
            </RadarChart>
          ) : chart.type === "waterfall" ? (
            <WaterfallChart data={chart.data} xKey={xKey} valueKey={valueKey} />
          ) : chart.type === "heatmap" ? (
            <HeatmapChart data={chart.data} xKey={xKey} yKey={yKey} valueKey={valueKey} />
          ) : chart.type === "matrix" ? (
            <MatrixChart data={chart.data} xKey={xKey} yKey={yKey} />
          ) : chart.type === "gauge_cards" ? (
            <GaugeCards data={chart.data} valueKey={valueKey} />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
              ⚠️ {chart.type} 차트 타입은 아직 구현되지 않았습니다.
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

// Waterfall Chart (출연 시나리오)
function WaterfallChart({ data, xKey, valueKey }: any) {
  const waterfallData = data.map((item: any, i: number) => {
    const value = item[valueKey] || 0;
    const prevSum = data.slice(0, i).reduce((sum: number, d: any) => sum + (d[valueKey] || 0), 0);
    return {
      ...item,
      start: prevSum,
      end: prevSum + value,
      value: Math.abs(value),
      isPositive: value >= 0,
    };
  });

  return (
    <ComposedChart data={waterfallData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} />
      <Tooltip />
      <Bar dataKey="start" stackId="a" fill="transparent" />
      <Bar dataKey="value" stackId="a">
        {waterfallData.map((entry: any, index: number) => (
          <Cell key={`cell-${index}`} fill={entry.isPositive ? "#10b981" : "#ef4444"} />
        ))}
      </Bar>
    </ComposedChart>
  );
}

// Heatmap Chart (복지 태그)
function HeatmapChart({ data, xKey, yKey, valueKey }: any) {
  const maxValue = Math.max(...data.map((d: any) => d[valueKey] || 0));

  return (
    <ScatterChart>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} tick={{ fontSize: 11 }} type="category" />
      <YAxis dataKey={yKey} tick={{ fontSize: 11 }} type="category" />
      <Tooltip />
      <Scatter data={data}>
        {data.map((entry: any, index: number) => {
          const intensity = (entry[valueKey] || 0) / maxValue;
          const color = `rgba(59, 130, 246, ${intensity})`;
          return <Cell key={`cell-${index}`} fill={color} />;
        })}
      </Scatter>
    </ScatterChart>
  );
}

// Risk-Impact Matrix (리스크 매트릭스)
function MatrixChart({ data, xKey, yKey }: any) {
  return (
    <ScatterChart>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} tick={{ fontSize: 11 }} domain={[0, 5]} label={{ value: '가능성', position: 'bottom' }} />
      <YAxis dataKey={yKey} tick={{ fontSize: 11 }} domain={[0, 5]} label={{ value: '영향도', angle: -90, position: 'left' }} />
      <Tooltip content={({ payload }: any) => {
        if (payload && payload.length) {
          const data = payload[0].payload;
          return (
            <div style={{ background: 'white', border: '1px solid #ccc', padding: 8, borderRadius: 4 }}>
              <div style={{ fontWeight: 600 }}>{data.risk || data.label}</div>
              <div>가능성: {data[xKey]}</div>
              <div>영향도: {data[yKey]}</div>
            </div>
          );
        }
        return null;
      }} />
      <Scatter data={data}>
        {data.map((entry: any, index: number) => {
          const severity = (entry[xKey] + entry[yKey]) / 2;
          const color = severity > 3.5 ? "#ef4444" : severity > 2.5 ? "#f59e0b" : "#10b981";
          return <Cell key={`cell-${index}`} fill={color} />;
        })}
      </Scatter>
    </ScatterChart>
  );
}

// Gauge Cards (스코어보드)
function GaugeCards({ data, valueKey }: any) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
      gap: '12px',
      padding: '16px 0'
    }}>
      {data.map((item: any, index: number) => {
        const score = item[valueKey] || 0;
        const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
        
        return (
          <div
            key={index}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: 'white',
            }}
          >
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              {item.metric || item.label}
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color,
              }}
            >
              {score}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              / 100
            </div>
          </div>
        );
      })}
    </div>
  );
}
