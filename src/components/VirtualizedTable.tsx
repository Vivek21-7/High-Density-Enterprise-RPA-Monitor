/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useMemo, UIEvent, MouseEvent, memo } from 'react';
import { RpaRow, SortConfig } from '../types';
import { formatCurrency, formatNumber, formatPercentage } from '../utils';
import { ArrowUp, ArrowDown, ShieldAlert, Cpu } from 'lucide-react';

interface VirtualizedTableProps {
  rows: RpaRow[];
  sortConfig: SortConfig[];
  handleSort: (key: keyof RpaRow, isMulti: boolean) => void;
  flashedRows: Record<string, number>;
}

const COLUMNS = [
  { key: 'project_id', label: 'ID', width: 100, align: 'left', sortable: true },
  { key: 'project_status', label: 'Status', width: 120, align: 'center', sortable: true },
  { key: 'roi_percent', label: 'ROI %', width: 100, align: 'right', sortable: true },
  { key: 'budget_usd', label: 'Budget', width: 110, align: 'right', sortable: true },
  { key: 'annual_savings_usd', label: 'Savings', width: 120, align: 'right', sortable: true },
  { key: 'robots_deployed', label: 'Robots', width: 90, align: 'right', sortable: true },
  { key: 'employee_hours_saved', label: 'Hours Saved', width: 110, align: 'right', sortable: true },
  { key: 'project_name', label: 'Project Name', width: 180, align: 'left', sortable: true },
  { key: 'company_id', label: 'Company', width: 140, align: 'left', sortable: true },
  { key: 'department', label: 'Department', width: 110, align: 'left', sortable: true },
  { key: 'industry', label: 'Industry', width: 110, align: 'left', sortable: true },
  { key: 'implementation_partner', label: 'Partner', width: 130, align: 'left', sortable: true },
  { key: 'country', label: 'Country', width: 90, align: 'left', sortable: true },
  { key: 'start_date', label: 'Start Date', width: 100, align: 'center', sortable: true },
] as const;

function VirtualizedTable({
  rows,
  sortConfig,
  handleSort,
  flashedRows,
}: VirtualizedTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Virtual scroll scroll state
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480); // baseline viewport height
  
  const rowHeight = 44; // fixed row height
  const totalHeight = rows.length * rowHeight;

  // Track dynamic container height changes securely
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height || 480);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute visible items indices
  const { startIndex, endIndex, translateY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 3); // 3-row buffer above
    const end = Math.min(rows.length - 1, Math.floor((scrollTop + viewportHeight) / rowHeight) + 3); // 3-row buffer below
    
    return {
      startIndex: start,
      endIndex: end,
      translateY: start * rowHeight,
    };
  }, [scrollTop, viewportHeight, rows.length]);

  // Handle onScroll cleanly
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Click sort handler with Shift support (Feature 9)
  const onHeaderClick = (e: MouseEvent, key: keyof RpaRow) => {
    handleSort(key, e.shiftKey);
  };

  // Find sort key position and direction for multi-sort visualization (Feature 9)
  const getSortMeta = (key: keyof RpaRow) => {
    const index = sortConfig.findIndex((s) => s.key === key);
    if (index === -1) return null;
    return {
      index: index + 1, // 1-based index showing priority
      direction: sortConfig[index].direction,
    };
  };

  const visibleRows = useMemo(() => {
    const slice: { item: RpaRow; index: number }[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (rows[i]) {
        slice.push({ item: rows[i], index: i });
      }
    }
    return slice;
  }, [rows, startIndex, endIndex]);

  return (
    <div id="grid-window-panel" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-md h-full min-h-[400px]">
      {/* Header Info Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-300">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Real-time Telemetry Data Grid</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          Tip: Hold <span className="text-slate-300 border border-slate-800 bg-slate-900 px-1 rounded">Shift</span> to click headers for multi-column sorting
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div 
        id="table-scroller-parent"
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto relative select-none bg-slate-950"
        style={{ height: '500px' }}
      >
        {/* Table representation */}
        <div className="min-w-[1600px] flex flex-col">
          {/* Sticky Header Row */}
          <div className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 flex text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[1600px] h-10 select-none">
            {COLUMNS.map((col) => {
              const sortMeta = getSortMeta(col.key);
              const isSorted = !!sortMeta;
              
              return (
                <div
                  key={col.key}
                  id={`header-${col.key}`}
                  onClick={(e) => col.sortable && onHeaderClick(e, col.key)}
                  style={{ width: `${col.width}px` }}
                  className={`flex items-center px-4 py-2.5 h-10 border-r border-slate-800/50 cursor-pointer select-none transition-colors group ${
                    col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                  } ${isSorted ? 'text-blue-400 bg-blue-500/5' : 'hover:bg-slate-800/80 hover:text-slate-200'}`}
                >
                  <span className="truncate">{col.label}</span>
                  {col.sortable && (
                    <span className="inline-flex items-center ml-1">
                      {isSorted ? (
                        sortMeta.direction === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-blue-400 animate-fade-in" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-blue-400 animate-fade-in" />
                        )
                      ) : (
                        <ArrowUp className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      
                      {/* Priority Rank Indicator for multi-sorting (Feature 9) */}
                      {isSorted && sortConfig.length > 1 && (
                        <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1 rounded-sm ml-0.5 font-bold font-mono">
                          {sortMeta.index}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Body Container Spacer for scrollbar size */}
          {rows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 min-w-[1600px]">
              <ShieldAlert className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-400">No telemetry data matching filters</p>
              <p className="text-xs text-slate-600 font-mono">Incoming firehose is active; clear filter criteria to resume displays.</p>
            </div>
          ) : (
            <div 
              id="recycled-rows-container-spacer"
              className="relative w-full" 
              style={{ height: `${totalHeight}px` }}
            >
              {/* Recycled row nodes translation block */}
              <div 
                className="absolute left-0 right-0" 
                style={{ transform: `translateY(${translateY}px)` }}
              >
                {visibleRows.map(({ item, index }) => {
                  const isFlashed = flashedRows[item.project_id] !== undefined;
                  const isFailed = item.project_status === 'Failed';
                  const isNegativeRoi = item.roi_percent < 0;
                  
                  // Alert condition check (Feature 3)
                  const hasAlert = isFailed || isNegativeRoi;

                  return (
                    <div
                      key={index} // Key by layout/visible index to swap values inside the DOM node seamlessly (Feature 8!)
                      id={`row-${item.project_id}`}
                      className={`flex border-b border-slate-900/60 min-w-[1600px] hover:bg-slate-900/40 transition-colors duration-150 text-xs font-mono select-none ${
                        isFlashed 
                          ? 'animate-flash-alert text-red-200' 
                          : hasAlert
                            ? 'bg-red-950/20 text-red-300/90 border-l-2 border-l-red-500 shadow-[inset_1px_0_0_#ef4444]'
                            : 'text-slate-300'
                      }`}
                      style={{ height: `${rowHeight}px`, contain: 'strict' }}
                    >
                      {/* Cell: ID */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 truncate font-semibold" style={{ width: `${COLUMNS[0].width}px` }}>
                        {item.project_id}
                      </div>

                      {/* Cell: Status */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 justify-center" style={{ width: `${COLUMNS[1].width}px` }}>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                          item.project_status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.project_status === 'Failed'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                              : item.project_status === 'On Hold'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {item.project_status}
                        </span>
                      </div>

                      {/* Cell: ROI % */}
                      <div className={`flex items-center px-4 py-2 border-r border-slate-900/40 justify-end font-bold ${
                        item.roi_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`} style={{ width: `${COLUMNS[2].width}px` }}>
                        {formatPercentage(item.roi_percent)}
                      </div>

                      {/* Cell: Budget */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 justify-end text-slate-400" style={{ width: `${COLUMNS[3].width}px` }}>
                        {formatCurrency(item.budget_usd)}
                      </div>

                      {/* Cell: Savings */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 justify-end text-emerald-400" style={{ width: `${COLUMNS[4].width}px` }}>
                        {formatCurrency(item.annual_savings_usd)}
                      </div>

                      {/* Cell: Robots */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 justify-end text-amber-400" style={{ width: `${COLUMNS[5].width}px` }}>
                        {formatNumber(item.robots_deployed)}
                      </div>

                      {/* Cell: Hours Saved */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 justify-end text-slate-400" style={{ width: `${COLUMNS[6].width}px` }}>
                        {formatNumber(item.employee_hours_saved)}
                      </div>

                      {/* Cell: Project Name */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 truncate text-slate-100 font-sans font-medium" style={{ width: `${COLUMNS[7].width}px` }}>
                        {item.project_name}
                      </div>

                      {/* Cell: Company */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 truncate font-sans text-slate-400" style={{ width: `${COLUMNS[8].width}px` }}>
                        {item.company_id}
                      </div>

                      {/* Cell: Department */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 truncate text-slate-400" style={{ width: `${COLUMNS[9].width}px` }}>
                        {item.department}
                      </div>

                      {/* Cell: Industry */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 truncate text-slate-400" style={{ width: `${COLUMNS[10].width}px` }}>
                        {item.industry}
                      </div>

                      {/* Cell: Partner */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 truncate text-slate-500" style={{ width: `${COLUMNS[11].width}px` }}>
                        {item.implementation_partner}
                      </div>

                      {/* Cell: Country */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 truncate text-slate-400" style={{ width: `${COLUMNS[12].width}px` }}>
                        {item.country}
                      </div>

                      {/* Cell: Start Date */}
                      <div className="flex items-center px-4 py-2 border-r border-slate-900/40 justify-center text-slate-500" style={{ width: `${COLUMNS[13].width}px` }}>
                        {item.start_date}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid footer stat indicators */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between items-center select-none">
        <span>Rows rendering in current scroll window: {visibleRows.length} nodes</span>
        <span>Virtual window performance: 100% optimized</span>
      </div>
    </div>
  );
}

const MemoizedVirtualizedTable = memo(VirtualizedTable, (prev, next) => {
  return prev.rows === next.rows &&
         prev.sortConfig === next.sortConfig &&
         prev.flashedRows === next.flashedRows;
});

export default MemoizedVirtualizedTable;
