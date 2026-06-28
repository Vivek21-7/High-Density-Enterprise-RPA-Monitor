/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useMemo, memo } from 'react';
import { RpaRow } from '../types';
import { Terminal, ShieldAlert, Cpu, HardDrive, RefreshCw } from 'lucide-react';

interface SystemDiagnosticsProps {
  rows: RpaRow[];
  sysMetrics: {
    fps: number;
    processingRate: number;
    lastTickDurationMs: number;
    memoryUsageMb: number;
  };
  isPaused: boolean;
}

interface DiagnosticLog {
  timestamp: string;
  message: string;
  type: 'info' | 'warn' | 'success';
}

function SystemDiagnostics({ rows, sysMetrics, isPaused }: SystemDiagnosticsProps) {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Keep a ref to the latest rows to avoid restarting the interval when rows update
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Listen to row changes and emit real-time logs (simulates diagnostic logging)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const currentRows = rowsRef.current;
      if (currentRows.length === 0) return;

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

      // Look for anomalies (Failed status) in current dataset to emit alerts
      const failedRows = currentRows.filter(r => r.project_status === 'Failed');
      
      setLogs((prev) => {
        const nextLogs = [...prev];
        
        if (failedRows.length > 0 && Math.random() < 0.25) {
          const randomFailed = failedRows[Math.floor(Math.random() * failedRows.length)];
          nextLogs.push({
            timestamp: timeStr,
            message: `ALERT: Project ${randomFailed.project_id} (${randomFailed.company_id}) is in FAILURE state!`,
            type: 'warn',
          });
        } else {
          const randomActive = currentRows[Math.floor(Math.random() * currentRows.length)];
          nextLogs.push({
            timestamp: timeStr,
            message: `Processing core frame: ${randomActive.project_id} - status '${randomActive.project_status}'`,
            type: randomActive.project_status === 'Completed' ? 'success' : 'info',
          });
        }

        // Limit logs to last 35 entries for performance
        if (nextLogs.length > 35) {
          nextLogs.shift();
        }
        return nextLogs;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Keep logs scrolled to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Compute aggregate stats for diagnostic visual depth
  const stats = useMemo(() => {
    let failedCount = 0;
    let completedCount = 0;
    let onHoldCount = 0;
    let totalSavings = 0;

    rows.forEach((row) => {
      totalSavings += row.annual_savings_usd;
      if (row.project_status === 'Failed') failedCount++;
      if (row.project_status === 'Completed') completedCount++;
      if (row.project_status === 'On Hold') onHoldCount++;
    });

    return {
      failedCount,
      completedCount,
      onHoldCount,
      efficiencyIndex: rows.length > 0 ? ((completedCount / rows.length) * 100).toFixed(1) : '0.0',
    };
  }, [rows]);

  return (
    <div id="system-diagnostics-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Infrastructure Toggles & Diagnostics</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
          isPaused
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`}></span>
          <span>{isPaused ? 'PIPELINE PAUSED' : 'STREAM ACTIVE'}</span>
        </span>
      </div>

      {/* Dials & Progress Bars */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Memory allocation dial */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5 text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-cyan-400" /> Allocated Memory
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">{sysMetrics.memoryUsageMb} MB</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${(sysMetrics.memoryUsageMb / 256) * 100}%` }}
            ></div>
          </div>
          <p className="text-[8px] text-slate-600 font-mono mt-1">Virtual process limits: 256.0 MB maximum</p>
        </div>

        {/* Processing Efficiency dial */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5 text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" /> Success Rate
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">{stats.efficiencyIndex}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${stats.efficiencyIndex}%` }}
            ></div>
          </div>
          <p className="text-[8px] text-slate-600 font-mono mt-1">Ratio of completed tasks over active pool</p>
        </div>
      </div>

      {/* Active failure anomaly indicator box */}
      <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${stats.failedCount > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-900 text-slate-500'}`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Failure Incidents</p>
            <p className="text-xs font-mono text-slate-500">Currently in alarm state</p>
          </div>
        </div>
        <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
          stats.failedCount > 0 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-900 text-slate-600'
        }`}>
          {stats.failedCount} FAILS
        </span>
      </div>

      {/* Real-time Diagnostics Terminal Logs (Feature 8 rendering proof) */}
      <div className="flex-1 min-h-[120px] flex flex-col bg-slate-950 border border-slate-800 rounded-lg p-2.5 overflow-hidden">
        <p className="text-[10px] font-mono font-bold text-slate-500 border-b border-slate-900 pb-1.5 mb-1.5 flex items-center justify-between">
          <span>OPERATIONAL LOGS PIPELINE</span>
          <RefreshCw className={`w-3 h-3 text-slate-600 ${!isPaused ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </p>
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 pr-1 select-none"
          style={{ maxHeight: '140px' }}
        >
          {logs.length === 0 ? (
            <p className="text-slate-600 italic">Waiting for telemetry frame ingress...</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-1.5 border-b border-slate-900/40 pb-0.5">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={
                  log.type === 'warn' 
                    ? 'text-red-400 font-bold' 
                    : log.type === 'success' 
                      ? 'text-emerald-400' 
                      : 'text-slate-400'
                }>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-3 border-t border-slate-800/60 pt-2">
        <span>Hardware Acceleration: Enabled</span>
        <span>SYS LOGS 2026.06</span>
      </div>
    </div>
  );
}

const MemoizedSystemDiagnostics = memo(SystemDiagnostics, (prev, next) => {
  return prev.rows === next.rows &&
         prev.isPaused === next.isPaused &&
         prev.sysMetrics.fps === next.sysMetrics.fps &&
         prev.sysMetrics.processingRate === next.sysMetrics.processingRate &&
         prev.sysMetrics.lastTickDurationMs === next.sysMetrics.lastTickDurationMs &&
         prev.sysMetrics.memoryUsageMb === next.sysMetrics.memoryUsageMb;
});

export default MemoizedSystemDiagnostics;
