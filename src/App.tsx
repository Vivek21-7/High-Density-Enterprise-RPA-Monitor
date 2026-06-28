/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { useRpaState } from './useRpaState';
import KPIStrip from './components/KPIStrip';
import ControlPanel from './components/ControlPanel';
import VirtualizedTable from './components/VirtualizedTable';
import DepartmentChart from './components/DepartmentChart';
import SystemDiagnostics from './components/SystemDiagnostics';
import FrozenAnalyticsDashboard from './components/FrozenAnalyticsDashboard';
import { Cpu, Calendar, Clock, Terminal } from 'lucide-react';

export default function App() {
  const {
    rows,
    totalCount,
    kpis,
    isPaused,
    pendingQueueSize,
    togglePause,
    sortConfig,
    handleSort,
    clearSorting,
    filters,
    toggleFilter,
    clearFilters,
    searchQuery,
    setSearchQuery,
    flashedRows,
    layout,
    togglePanel,
    sysMetrics,
    categories,
    handleIncomingBatch,
  } = useRpaState();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showFrozenAnalytics, setShowFrozenAnalytics] = useState<boolean>(false);

  // Auto-dismiss analytics when stream is resumed
  useEffect(() => {
    if (!isPaused) {
      setShowFrozenAnalytics(false);
    }
  }, [isPaused]);

  // Live UTC Clock at top for military telemetry feel
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleIncomingBatchRef = useRef(handleIncomingBatch);
  useEffect(() => {
    handleIncomingBatchRef.current = handleIncomingBatch;
  }, [handleIncomingBatch]);

  // Initialize stream
  useEffect(() => {
    const win = window as any;
    
    const startStream = () => {
      if (typeof win.initializerRpaStream === 'function') {
        win.initializerRpaStream((incomingBatch: any) => {
          handleIncomingBatchRef.current(incomingBatch);
        });
        console.log('Stream initialized via global window binding.');
      }
    };

    if (typeof win.initializerRpaStream === 'function') {
      startStream();
    } else {
      // Load simulator automatically if not injected by the environment
      import('./dataStreamSim').then((sim) => {
        sim.initSim();
        startStream();
      });
    }

    return () => {
      if (typeof win.__stopRpaStream === 'function') {
        win.__stopRpaStream();
      }
    };
  }, []);

  // Determine grid template based on active layout states
  const showAnalytics = layout.analyticsChart;
  const showDiagnostics = layout.systemMetrics;
  const showUpperSection = showAnalytics || showDiagnostics;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased selection:bg-blue-500/30">
      {/* Top Header Bar */}
      <header className="border-b border-slate-900 bg-slate-900/60 backdrop-blur px-6 py-4 sticky top-0 z-40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/30 text-blue-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-slate-100 uppercase flex items-center gap-2">
              High-Density RPA Monitor
              <span className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono animate-pulse">
                PHASE 2 DEPLOY
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Technical Architecture & Client-Side Telemetry Orchestration Terminal
            </p>
          </div>
        </div>

        {/* Telemetry Clock & Metadata */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>28 JUNE 2026</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-lg text-slate-300 font-bold">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentTime || 'Syncing clock...'}</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Space */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* KPI strip (Feature 1) */}
        <KPIStrip kpis={kpis} sysMetrics={sysMetrics} isPaused={isPaused} />

        {/* Control panel & filters (Feature 5, 7, 10, 6 layout options) */}
        {layout.controlPanel && (
          <ControlPanel
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isPaused={isPaused}
            togglePause={togglePause}
            pendingQueueSize={pendingQueueSize}
            filters={filters}
            toggleFilter={toggleFilter}
            clearFilters={clearFilters}
            categories={categories}
            layout={layout}
            togglePanel={togglePanel}
            totalFiltered={totalCount}
            totalAll={kpis.uniqueProjectsCount}
            showFrozenAnalytics={showFrozenAnalytics}
            setShowFrozenAnalytics={setShowFrozenAnalytics}
          />
        )}

        {/* Middle widget blocks section (Feature 6 operator options) */}
        {showUpperSection && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {showAnalytics && (
              <div className="h-[320px]">
                <DepartmentChart rows={rows} />
              </div>
            )}
            {showDiagnostics && (
              <div className="h-[320px]">
                <SystemDiagnostics rows={rows} sysMetrics={sysMetrics} isPaused={isPaused} />
              </div>
            )}
          </div>
        )}

        {/* Bottom grid window (Feature 8 main virtualized table, Feature 3, 4, 9) */}
        {layout.gridWindow && (
          <div className="flex flex-col">
            <VirtualizedTable
              rows={rows}
              sortConfig={sortConfig}
              handleSort={handleSort}
              flashedRows={flashedRows}
            />
          </div>
        )}

        {/* Clean fallbacks when all widgets are hidden */}
        {!layout.gridWindow && !showAnalytics && !showDiagnostics && !layout.controlPanel && (
          <div className="text-center py-24 bg-slate-900 border border-slate-800 rounded-2xl">
            <Terminal className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">Workspace Terminals Inactive</h4>
            <p className="text-xs text-slate-500 font-mono max-w-md mx-auto mt-1">
              All display panels have been toggled off by the operator. Use the layout switcher in the top right of control panels or click below to restore.
            </p>
            <button
              onClick={() => {
                togglePanel('gridWindow');
                togglePanel('analyticsChart');
                togglePanel('systemMetrics');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              RESTORE ALL PANELS
            </button>
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-[10px] text-slate-600 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-900/10">
        <span>SECURITY LEVEL: CONFIDENTIAL RPA OPERATIONAL PORTAL</span>
        <span>CRAFTED FOR CLIENT-SIDE TELEMETRY ORCHESTRATION</span>
        <span>CORE VERSION 2.0.4 - ACTIVE INGRESS SECURE</span>
      </footer>

      {/* Analytics Overlay Dashboard (Bounty Requirement) */}
      {showFrozenAnalytics && isPaused && (
        <FrozenAnalyticsDashboard
          rows={rows}
          onClose={() => setShowFrozenAnalytics(false)}
        />
      )}
    </div>
  );
}
