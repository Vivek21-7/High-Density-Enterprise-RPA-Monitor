/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { RpaRow } from '../types';
import { formatCurrency, formatNumber, formatPercentage } from '../utils';
import { X, BarChart3, PieChart, Info, ShieldAlert, Cpu, Award } from 'lucide-react';

// Register all necessary Chart.js components
Chart.register(...registerables);

interface FrozenAnalyticsDashboardProps {
  rows: RpaRow[];
  onClose: () => void;
}

type ChartTab = 'department' | 'status' | 'automation';

export default function FrozenAnalyticsDashboard({ rows, onClose }: FrozenAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>('department');

  // Refs for the charts
  const deptCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const autoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep track of Chart instances to destroy them on update/unmount
  const deptChartRef = useRef<Chart | null>(null);
  const statusChartRef = useRef<Chart | null>(null);
  const autoChartRef = useRef<Chart | null>(null);

  // Calculate Aggregated KPIS for the Frozen dataset
  const totalSavings = rows.reduce((acc, row) => acc + row.annual_savings_usd, 0);
  const totalBudget = rows.reduce((acc, row) => acc + row.budget_usd, 0);
  const totalRobots = rows.reduce((acc, row) => acc + row.robots_deployed, 0);
  const averageRoi = rows.length > 0 ? rows.reduce((acc, row) => acc + row.roi_percent, 0) / rows.length : 0;
  const hoursSaved = rows.reduce((acc, row) => acc + row.employee_hours_saved, 0);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Aggregate Data for Charts
  // 1. Department Savings
  const deptData = rows.reduce((acc, row) => {
    acc[row.department] = (acc[row.department] || 0) + row.annual_savings_usd;
    return acc;
  }, {} as Record<string, number>);

  // 2. Status Distribution
  const statusData = rows.reduce((acc, row) => {
    acc[row.project_status] = (acc[row.project_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. Automation Type Robots Deployed
  const autoData = rows.reduce((acc, row) => {
    acc[row.automation_type] = (acc[row.automation_type] || 0) + row.robots_deployed;
    return acc;
  }, {} as Record<string, number>);

  // Initialize and update Department Savings Chart
  useEffect(() => {
    if (!deptCanvasRef.current || activeTab !== 'department') return;

    if (deptChartRef.current) {
      deptChartRef.current.destroy();
    }

    const ctx = deptCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(deptData);
    const dataValues = Object.values(deptData);

    deptChartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Annual Savings (USD)',
            data: dataValues,
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)', // blue
              'rgba(16, 185, 129, 0.7)', // emerald
              'rgba(139, 92, 246, 0.7)', // purple
              'rgba(245, 158, 11, 0.7)', // amber
              'rgba(236, 72, 153, 0.7)', // pink
              'rgba(6, 182, 212, 0.7)',  // cyan
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(139, 92, 246, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(236, 72, 153, 1)',
              'rgba(6, 182, 212, 1)',
            ],
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Savings: ${formatCurrency(context.parsed.y)}`;
              },
            },
            titleFont: { family: 'JetBrains Mono, monospace' },
            bodyFont: { family: 'JetBrains Mono, monospace' },
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(51, 65, 85, 0.2)',
            },
            ticks: {
              color: 'rgba(148, 163, 184, 0.8)',
              font: {
                family: 'JetBrains Mono, monospace',
                size: 11,
              },
            },
          },
          y: {
            grid: {
              color: 'rgba(51, 65, 85, 0.2)',
            },
            ticks: {
              color: 'rgba(148, 163, 184, 0.8)',
              font: {
                family: 'JetBrains Mono, monospace',
                size: 10,
              },
              callback: function (value) {
                return `$${Number(value) / 1000}k`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (deptChartRef.current) {
        deptChartRef.current.destroy();
        deptChartRef.current = null;
      }
    };
  }, [rows, activeTab]);

  // Initialize and update Status Distribution Chart
  useEffect(() => {
    if (!statusCanvasRef.current || activeTab !== 'status') return;

    if (statusChartRef.current) {
      statusChartRef.current.destroy();
    }

    const ctx = statusCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(statusData);
    const dataValues = Object.values(statusData);

    const statusColors: Record<string, string> = {
      Completed: 'rgba(16, 185, 129, 0.7)',
      'In Progress': 'rgba(59, 130, 246, 0.7)',
      Failed: 'rgba(239, 68, 68, 0.7)',
      'On Hold': 'rgba(245, 158, 11, 0.7)',
    };

    const statusBorders: Record<string, string> = {
      Completed: 'rgba(16, 185, 129, 1)',
      'In Progress': 'rgba(59, 130, 246, 1)',
      Failed: 'rgba(239, 68, 68, 1)',
      'On Hold': 'rgba(245, 158, 11, 1)',
    };

    statusChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: labels.map(l => statusColors[l] || 'rgba(100, 116, 139, 0.7)'),
            borderColor: labels.map(l => statusBorders[l] || 'rgba(100, 116, 139, 1)'),
            borderWidth: 2,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'rgba(241, 245, 249, 0.9)',
              font: {
                family: 'JetBrains Mono, monospace',
                size: 11,
              },
              padding: 15,
            },
          },
          tooltip: {
            titleFont: { family: 'JetBrains Mono, monospace' },
            bodyFont: { family: 'JetBrains Mono, monospace' },
          },
        },
        cutout: '65%',
      },
    });

    return () => {
      if (statusChartRef.current) {
        statusChartRef.current.destroy();
        statusChartRef.current = null;
      }
    };
  }, [rows, activeTab]);

  // Initialize and update Automation Types Chart
  useEffect(() => {
    if (!autoCanvasRef.current || activeTab !== 'automation') return;

    if (autoChartRef.current) {
      autoChartRef.current.destroy();
    }

    const ctx = autoCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(autoData);
    const dataValues = Object.values(autoData);

    autoChartRef.current = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Robots Deployed',
            data: dataValues,
            backgroundColor: [
              'rgba(139, 92, 246, 0.6)', // purple
              'rgba(6, 182, 212, 0.6)',  // cyan
              'rgba(236, 72, 153, 0.6)', // pink
              'rgba(245, 158, 11, 0.6)', // amber
            ],
            borderColor: [
              'rgba(139, 92, 246, 1)',
              'rgba(6, 182, 212, 1)',
              'rgba(236, 72, 153, 1)',
              'rgba(245, 158, 11, 1)',
            ],
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            ticks: {
              color: 'rgba(148, 163, 184, 0.8)',
              backdropColor: 'transparent',
              font: {
                family: 'JetBrains Mono, monospace',
                size: 9,
              },
            },
            grid: {
              color: 'rgba(51, 65, 85, 0.3)',
            },
            angleLines: {
              color: 'rgba(51, 65, 85, 0.3)',
            },
          },
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'rgba(241, 245, 249, 0.9)',
              font: {
                family: 'JetBrains Mono, monospace',
                size: 11,
              },
              padding: 15,
            },
          },
          tooltip: {
            titleFont: { family: 'JetBrains Mono, monospace' },
            bodyFont: { family: 'JetBrains Mono, monospace' },
          },
        },
      },
    });

    return () => {
      if (autoChartRef.current) {
        autoChartRef.current.destroy();
        autoChartRef.current = null;
      }
    };
  }, [rows, activeTab]);

  return (
    <div
      id="frozen-analytics-overlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="frozen-analytics-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/55">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/30 text-amber-500 animate-pulse">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-widest text-slate-100 uppercase font-mono">
                Frozen Pipeline Telemetry Analytics
              </h2>
              <p className="text-[10px] text-slate-400 font-mono uppercase">
                Aggregate snapshot analysis of {rows.length} static pipeline items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-slate-100 border border-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Snapshots Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                Frozen Records
              </span>
              <span className="text-xl font-extrabold tracking-tight text-slate-100 font-mono mt-1">
                {rows.length}
              </span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                Aggregated Savings
              </span>
              <span className="text-xl font-extrabold tracking-tight text-emerald-400 font-mono mt-1">
                {formatCurrency(totalSavings)}
              </span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                Total Deployed Robots
              </span>
              <span className="text-xl font-extrabold tracking-tight text-blue-400 font-mono mt-1">
                {formatNumber(totalRobots)}
              </span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                Avg ROI Performance
              </span>
              <span className="text-xl font-extrabold tracking-tight text-amber-400 font-mono mt-1">
                {formatPercentage(averageRoi)}
              </span>
            </div>
          </div>

          {/* Dynamic Visualization Tab Panel utilizing Chart.js */}
          <div className="bg-slate-950/35 border border-slate-800/50 rounded-xl overflow-hidden flex flex-col">
            {/* Chart Sub-Tabs */}
            <div className="flex border-b border-slate-850 bg-slate-950/50 px-4">
              <button
                onClick={() => setActiveTab('department')}
                className={`px-4 py-3 text-xs font-semibold tracking-wider font-mono flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'department'
                    ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                DEPARTMENT SAVINGS
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`px-4 py-3 text-xs font-semibold tracking-wider font-mono flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'status'
                    ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                STATUS DISTRIBUTION
              </button>
              <button
                onClick={() => setActiveTab('automation')}
                className={`px-4 py-3 text-xs font-semibold tracking-wider font-mono flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'automation'
                    ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                AUTOMATION ROBOTS
              </button>
            </div>

            {/* Dynamic Visualization Container */}
            <div className="p-6 h-[280px] flex items-center justify-center relative">
              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <Info className="w-8 h-8 text-slate-600" />
                  <p className="text-xs text-slate-400 font-mono">No data points available to visualize.</p>
                </div>
              ) : (
                <>
                  {activeTab === 'department' && (
                    <div className="w-full h-full">
                      <canvas ref={deptCanvasRef} id="department-savings-chart"></canvas>
                    </div>
                  )}
                  {activeTab === 'status' && (
                    <div className="w-full h-full max-w-md mx-auto">
                      <canvas ref={statusCanvasRef} id="project-status-chart"></canvas>
                    </div>
                  )}
                  {activeTab === 'automation' && (
                    <div className="w-full h-full max-w-md mx-auto">
                      <canvas ref={autoCanvasRef} id="automation-type-chart"></canvas>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Context Advisory Notice */}
          <div className="flex gap-3 bg-blue-950/20 border border-blue-900/30 p-3.5 rounded-xl text-xs text-slate-300">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="font-mono space-y-1">
              <span className="font-bold text-blue-400 block uppercase text-[10px] tracking-wider">
                Telemetry Analytics Engine Notice
              </span>
              <p className="text-[10px] leading-relaxed text-slate-400">
                This dashboard dynamically compiles static records exactly as they were held when the Ingress Stream was frozen. Resume the stream anytime to unlock updating telemetry frames. This visualization is powered completely by the verified <strong>Chart.js</strong> library wrapper.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/30 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-mono text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            DISMISS ANALYTICS
          </button>
        </div>
      </div>
    </div>
  );
}
