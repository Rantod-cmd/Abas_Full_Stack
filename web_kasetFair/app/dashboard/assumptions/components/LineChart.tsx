import React from "react";
import type { ChartPoint } from "../helpers";

type Props = {
  data: ChartPoint[];
  height?: number;
};

export function LineChart({ data, height = 200 }: Props) {
  const points = data || [];
  const width = Math.max(320, points.length * 80);
  const padding = 48;

  const allYs = points.flatMap((p) => [p.foot, p.interest, p.conversion]);
  const minY = Math.min(...allYs, 0);
  const maxY = Math.max(...allYs, 1);
  const range = maxY - minY || 1;

  const toX = (i: number) => padding + (i * (width - padding * 2)) / Math.max(1, points.length - 1);
  const toY = (v: number) => padding + (height - padding * 2) * (1 - (v - minY) / range);

  const buildPath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(v).toFixed(2)}`).join(" ");

  const pathFoot = buildPath(points.map((p) => p.foot));
  const pathInterest = buildPath(points.map((p) => p.interest));
  const pathConversion = buildPath(points.map((p) => p.conversion));

  const yLabels: number[] = [];
  const step = range > 1500 ? 500 : 100;
  for (let y = Math.ceil(minY / step) * step; y <= maxY; y += step) {
    yLabels.push(y);
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <defs>
          <linearGradient id="footGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4c4bd6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yLabels.map((label) => {
          const y = toY(label);
          return (
            <g key={`grid-${label}`}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e7e9ff" strokeDasharray="3 3" strokeWidth={1} />
              <text x={padding - 10} y={y + 4} fontSize={11} textAnchor="end" fill="#94a3b8">
                {label}
              </text>
            </g>
          );
        })}

        <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#c7cce9" strokeWidth={1.5} />

        {points.length > 1 && (
          <path
            d={`${pathFoot} L ${toX(points.length - 1).toFixed(2)} ${height - padding} L ${toX(0).toFixed(2)} ${
              height - padding
            } Z`}
            fill="url(#footGradient)"
            opacity={0.6}
          />
        )}

        <path d={pathFoot} fill="none" stroke="#4c4bd6" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathInterest} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathConversion} fill="none" stroke="#10b981" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((pt, i) => (
          <g key={`pt-${i}`}>
            <circle cx={toX(i)} cy={toY(pt.foot)} r={3.2} fill="#fff" stroke="#4c4bd6" strokeWidth={1.8} />
            <circle cx={toX(i)} cy={toY(pt.interest)} r={2.6} fill="#fff" stroke="#0ea5e9" strokeWidth={1.2} />
            <circle cx={toX(i)} cy={toY(pt.conversion)} r={2.6} fill="#fff" stroke="#10b981" strokeWidth={1.2} />
            <text x={toX(i)} y={height - 10} fontSize={10} textAnchor="middle" fill="#94a3b8">
              {pt.x}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
