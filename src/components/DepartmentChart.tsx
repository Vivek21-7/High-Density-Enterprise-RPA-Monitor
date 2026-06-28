/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState, memo } from 'react';
import { RpaRow } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { BarChart3, TrendingUp, Cpu } from 'lucide-react';

interface DepartmentChartProps {
  rows: RpaRow[];
}

type MetricType = 'savings' | 'robots';

function DepartmentChart({ rows }: DepartmentChartProps) {
  const [metric, setMetric] = useState<MetricType>('savings');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // Group and aggregate data dynamically
  const chartData = useMemo(() => {
    const departments: Record<string, { savings: number; robots: number; count: number }> = {
      Finance: { savings: 0, robots: 0, count: 0 },
      HR: { savings: 0, robots: 0, count: 0 },
      Operations: { savings: 0, robots: 0, count: 0 },
      IT: { savings: 0, robots: 0, count: 0 },
      Legal: { savings: 0, robots: 0, count: 0 },
      Sales: { savings: 0, robots: 0, count: 0 },
    };

    rows.forEach((row) => {
      if (departments[row.department]) {
        departments[row.department].savings += row.annual_savings_usd;
        departments[row.department].robots += row.robots_deployed;
        departments[row.department].count += 1;
      }
    });

    return Object.entries(departments).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [rows]);

  // Find max value for scaling
  const maxValue = useMemo(() => {
    const values = chartData.map((d) => (metric === 'savings' ? d.savings : d.robots));
    const max = Math.max(...values);
    return max > 0 ? max : 1;
  }, [chartData, metric]);

  // SVG dimensions
  const width = 600;
  const height = 240;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  return (
    <div id="department-analytics-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md h-full flex flex-col justify-between">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Department Analytics</h3>
        </div>

        {/* Metric Selector */}
        <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setMetric('savings')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all duration-200 ${
              metric === 'savings'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : 'border border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Savings</span>
          </button>
          <button
            onClick={() => setMetric('robots')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all duration-200 ${
              metric === 'robots'
                ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
                : 'border border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Robots</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas for High Performance */}
      <div className="flex-1 min-h-[160px] flex items-center justify-center relative">
        {rows.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-500 font-mono">No telemetry matching active filters</p>
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
            <defs>
              {/* Gradients */}
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="robotsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0e7490" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const yVal = paddingTop + chartHeight * (1 - ratio);
              const gridLabel = metric === 'savings' 
                ? formatCurrency(maxValue * ratio) 
                : formatNumber(Math.round(maxValue * ratio));
              return (
                <g key={idx} className="opacity-40">
                  <line
                    x1={paddingLeft}
                    y1={yVal}
                    x2={width - paddingRight}
                    y2={yVal}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={yVal + 3}
                    textAnchor="end"
                    className="fill-slate-500 font-mono text-[9px]"
                  >
                    {gridLabel}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {chartData.map((d, idx) => {
              const val = metric === 'savings' ? d.savings : d.robots;
              const barHeight = (val / maxValue) * chartHeight;
              const barWidth = chartWidth / chartData.length * 0.65;
              const colWidth = chartWidth / chartData.length;
              const barX = paddingLeft + (idx * colWidth) + (colWidth - barWidth) / 2;
              const barY = paddingTop + chartHeight - barHeight;

              const isHovered = hoveredBar === d.name;

              return (
                <g
                  key={d.name}
                  onMouseEnter={() => setHoveredBar(d.name)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="cursor-pointer group"
                >
                  {/* Invisible broad hitbox bar for easier hovering */}
                  <rect
                    x={paddingLeft + (idx * colWidth)}
                    y={paddingTop}
                    width={colWidth}
                    height={chartHeight}
                    fill="transparent"
                  />

                  {/* The actual SVG bar bar */}
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={Math.max(4, barHeight)} // minimum 4px height for visual feedback
                    rx="4"
                    fill={metric === 'savings' ? 'url(#savingsGrad)' : 'url(#robotsGrad)'}
                    className="transition-all duration-300 origin-bottom"
                    stroke={isHovered ? (metric === 'savings' ? '#34d399' : '#22d3ee') : 'transparent'}
                    strokeWidth="1.5"
                    style={{
                      filter: isHovered ? 'drop-shadow(0px 0px 6px rgba(16,185,129,0.3))' : 'none',
                    }}
                  />

                  {/* Department Name labels */}
                  <text
                    x={barX + barWidth / 2}
                    y={height - paddingBottom + 18}
                    textAnchor="middle"
                    className={`font-sans text-[10px] font-semibold transition-colors ${
                      isHovered ? 'fill-slate-200' : 'fill-slate-500'
                    }`}
                  >
                    {d.name}
                  </text>

                  {/* Hover values directly above the bar */}
                  {isHovered && (
                    <g>
                      <rect
                        x={barX + barWidth / 2 - 50}
                        y={barY - 30}
                        width="100"
                        height="22"
                        rx="4"
                        fill="#020617"
                        stroke="#1e293b"
                        strokeWidth="1"
                      />
                      <text
                        x={barX + barWidth / 2}
                        y={barY - 15}
                        textAnchor="middle"
                        className="fill-slate-200 font-mono text-[10px] font-bold"
                      >
                        {metric === 'savings' ? formatCurrency(val) : `${val} Bots`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Bottom coordinate line */}
            <line
              x1={paddingLeft}
              y1={height - paddingBottom}
              x2={width - paddingRight}
              y2={height - paddingBottom}
              stroke="#334155"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-2 border-t border-slate-800/60 pt-2">
        <span>Active viewport data points</span>
        <span>AGGREGATE METRICS</span>
      </div>
    </div>
  );
}

const MemoizedDepartmentChart = memo(DepartmentChart, (prev, next) => {
  return prev.rows === next.rows;
});

export default MemoizedDepartmentChart;
