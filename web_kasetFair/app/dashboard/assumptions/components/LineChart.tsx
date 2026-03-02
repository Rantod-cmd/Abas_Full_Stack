import React from "react";
import type { ChartPoint } from "../helpers";

type Props = {
  data: ChartPoint[];
  height?: number;
  onPointClick?: (point: ChartPoint) => void;
};

export function LineChart({ data, height = 200, onPointClick }: Props) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const points = data || [];
  const width = Math.max(320, points.length * 80);
  const padding = 48;

  const allYs = points.flatMap((p) => [p.foot]);
  const minY = Math.min(...allYs, 0);
  const maxY = Math.max(...allYs, 1);
  const range = maxY - minY || 1;

  const toX = (i: number) => padding + (i * (width - padding * 2)) / Math.max(1, points.length - 1);
  const toY = (v: number) => padding + (height - padding * 2) * (1 - (v - minY) / range);

  const buildPath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(v).toFixed(2)}`).join(" ");

  const pathFoot = buildPath(points.map((p) => p.foot));

  const yLabels: number[] = [];
  const step = range > 1500 ? 500 : 100;
  for (let y = Math.ceil(minY / step) * step; y <= maxY; y += step) {
    yLabels.push(y);
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find closest point
    let closestIndex = -1;
    let minDiff = Infinity;

    points.forEach((_, i) => {
      const x = toX(i);
      const diff = Math.abs(mouseX - x);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });

    // Only activate if within reasonable distance (e.g. half stride)
    if (minDiff < 40) {
      setActiveIndex(closestIndex);
    } else {
      setActiveIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const handleClick = () => {
    if (activeIndex !== null && points[activeIndex] && onPointClick) {
      onPointClick(points[activeIndex]);
    }
  };

  return (
    <div className="overflow-x-auto relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-crosshair"
      >
        <defs>
          <linearGradient id="footGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4c4bd6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
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
            d={`${pathFoot} L ${toX(points.length - 1).toFixed(2)} ${height - padding} L ${toX(0).toFixed(2)} ${height - padding
              } Z`}
            fill="url(#footGradient)"
            opacity={0.8}
            className="pointer-events-none"
          />
        )}

        <path d={pathFoot} fill="none" stroke="#4c4bd6" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" className="pointer-events-none" />

        {points.map((pt, i) => (
          <g key={`pt-${i}`} className="pointer-events-none">
            <circle cx={toX(i)} cy={toY(pt.foot)} r={activeIndex === i ? 6 : 4} fill="#fff" stroke="#4c4bd6" strokeWidth={2} />
            <text x={toX(i)} y={height - 10} fontSize={10} textAnchor="middle" fill="#94a3b8">
              {pt.x}
            </text>
          </g>
        ))}

        {/* Tooltip Overlay */}
        {activeIndex !== null && points[activeIndex] && (
          <g transform={`translate(${toX(activeIndex)}, ${toY(points[activeIndex].foot) - 10})`}>
            <rect x="-40" y="-35" width="80" height="30" rx="6" fill="#1e1e54" />
            <text x="0" y="-16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              {points[activeIndex].x}: {points[activeIndex].foot.toLocaleString()}
            </text>
            <polygon points="0,0 -5,-5 5,-5" fill="#1e1e54" transform="translate(0, -5)" />
          </g>
        )}
      </svg>
    </div>
  );
}