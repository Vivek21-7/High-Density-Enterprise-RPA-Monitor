/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo } from 'react';
import { Cpu, DollarSign, Layers, Activity } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils';

interface KPIStripProps {
  kpis: {
    totalRowsProcessed: number;
    activeRobots: number;
    cumulativeSavings: number;
    uniqueProjectsCount: number;
  };
  sysMetrics: {
    fps: number;
    processingRate: number;
    lastTickDurationMs: number;
  };
  isPaused: boolean;
}

function KPIStrip({ kpis, sysMetrics, isPaused }: KPIStripProps) {
  return (
    <div id="kpi-strip" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Total Streamed Rows Processed */}
      <div 
        id="kpi-card-processed" 
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300"
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Streamed Rows Processed</p>
          <p className="text-3xl font-bold font-mono text-blue-400 tracking-tight transition-all duration-150">
            {formatNumber(kpis.totalRowsProcessed)}
          </p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Rate: {sysMetrics.processingRate} rows/s
          </p>
        </div>
        <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
          <Layers className="w-6 h-6" />
        </div>
        {/* Subtle background pulse when playing */}
        {!isPaused && (
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"></div>
        )}
      </div>

      {/* KPI 2: Active Robots Deployed Count */}
      <div 
        id="kpi-card-robots" 
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300"
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Active Robots Deployed</p>
          <p className="text-3xl font-bold font-mono text-amber-400 tracking-tight">
            {formatNumber(kpis.activeRobots)}
          </p>
          <p className="text-[10px] text-slate-500">
            Across {formatNumber(kpis.uniqueProjectsCount)} unique active engines
          </p>
        </div>
        <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
          <Cpu className="w-6 h-6" />
        </div>
        {!isPaused && (
          <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"></div>
        )}
      </div>

      {/* KPI 3: Global Cumulative Savings */}
      <div 
        id="kpi-card-savings" 
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300"
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Global Cumulative Savings</p>
          <p className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            {formatCurrency(kpis.cumulativeSavings)}
          </p>
          <p className="text-[10px] text-slate-500">
            Real-time financial cost reduction
          </p>
        </div>
        <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
          <DollarSign className="w-6 h-6" />
        </div>
        {!isPaused && (
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"></div>
        )}
      </div>

      {/* KPI 4: Render Performance & Status */}
      <div 
        id="kpi-card-performance" 
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md relative overflow-hidden group hover:border-pink-500/50 transition-all duration-300"
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Render Thread Health</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold font-mono text-pink-400 tracking-tight">
              {sysMetrics.fps} <span className="text-sm font-sans font-medium text-slate-500">FPS</span>
            </p>
          </div>
          <p className="text-[10px] text-slate-500">
            Tick processing time: {sysMetrics.lastTickDurationMs} ms
          </p>
        </div>
        <div className="bg-pink-500/10 p-3 rounded-lg border border-pink-500/20 text-pink-400 group-hover:scale-110 transition-transform">
          <Activity className="w-6 h-6" />
        </div>
        {!isPaused && (
          <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"></div>
        )}
      </div>
    </div>
  );
}

const MemoizedKPIStrip = memo(KPIStrip, (prev, next) => {
  return prev.isPaused === next.isPaused &&
         prev.kpis.totalRowsProcessed === next.kpis.totalRowsProcessed &&
         prev.kpis.activeRobots === next.kpis.activeRobots &&
         prev.kpis.cumulativeSavings === next.kpis.cumulativeSavings &&
         prev.kpis.uniqueProjectsCount === next.kpis.uniqueProjectsCount &&
         prev.sysMetrics.fps === next.sysMetrics.fps &&
         prev.sysMetrics.processingRate === next.sysMetrics.processingRate &&
         prev.sysMetrics.lastTickDurationMs === next.sysMetrics.lastTickDurationMs;
});

export default MemoizedKPIStrip;
