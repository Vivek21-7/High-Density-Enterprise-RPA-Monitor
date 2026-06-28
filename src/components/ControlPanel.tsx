/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, memo } from 'react';
import { Play, Pause, Search, SlidersHorizontal, RefreshCw, Eye, EyeOff, CheckSquare, Square, BarChart3 } from 'lucide-react';
import { FilterConfig, LayoutVisibility } from '../types';

interface ControlPanelProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isPaused: boolean;
  togglePause: () => void;
  pendingQueueSize: number;
  filters: FilterConfig;
  toggleFilter: (category: keyof FilterConfig, value: string) => void;
  clearFilters: () => void;
  categories: {
    automation_types: string[];
    departments: string[];
    industries: string[];
  };
  layout: LayoutVisibility;
  togglePanel: (panel: keyof LayoutVisibility) => void;
  totalFiltered: number;
  totalAll: number;
  showFrozenAnalytics: boolean;
  setShowFrozenAnalytics: (val: boolean) => void;
}

function ControlPanel({
  searchQuery,
  setSearchQuery,
  isPaused,
  togglePause,
  pendingQueueSize,
  filters,
  toggleFilter,
  clearFilters,
  categories,
  layout,
  togglePanel,
  totalFiltered,
  totalAll,
  showFrozenAnalytics,
  setShowFrozenAnalytics,
}: ControlPanelProps) {
  const [openDropdown, setOpenDropdown] = useState<'automation' | 'department' | 'industry' | 'layout' | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: 'automation' | 'department' | 'industry' | 'layout') => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <div id="control-panel" ref={dropdownRef} className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Play/Pause & Search Field */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Pause/Play controller (Feature 5) */}
          <button
            id="pause-play-btn"
            onClick={togglePause}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 shadow-sm cursor-pointer shrink-0 ${
              isPaused
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME PIPELINE</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>FREEZE PIPELINE</span>
              </>
            )}
          </button>

          {/* Analytics View Action Toggle (Bounty Requirement) */}
          {isPaused && (
            <button
              id="analytics-view-toggle"
              onClick={() => setShowFrozenAnalytics(!showFrozenAnalytics)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs font-mono tracking-wider transition-all duration-300 shadow-sm cursor-pointer shrink-0 border ${
                showFrozenAnalytics
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>ANALYTICS VIEW</span>
            </button>
          )}

          {/* Fuzzy Search Bar (Feature 10) */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="fuzzy-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search partial keywords (e.g. 'Tata completed cognitive US')..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filters and Layout Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Categorical filter dropdown: Automation Type (Feature 7) */}
          <div className="relative">
            <button
              id="filter-dropdown-automation"
              onClick={() => toggleDropdown('automation')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                filters.automation_types.length > 0
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>Automation ({filters.automation_types.length || 'All'})</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            </button>
            {openDropdown === 'automation' && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-800 rounded-lg shadow-xl z-50 p-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider border-b border-slate-900 mb-1">
                  Filter Automation Type
                </p>
                {categories.automation_types.map((type) => {
                  const checked = filters.automation_types.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleFilter('automation_types', type)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs text-slate-300 hover:bg-slate-900 transition-colors"
                    >
                      {checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>{type}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Categorical filter dropdown: Department (Feature 7) */}
          <div className="relative">
            <button
              id="filter-dropdown-department"
              onClick={() => toggleDropdown('department')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                filters.departments.length > 0
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>Department ({filters.departments.length || 'All'})</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            </button>
            {openDropdown === 'department' && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-800 rounded-lg shadow-xl z-50 p-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider border-b border-slate-900 mb-1">
                  Filter Department
                </p>
                {categories.departments.map((dept) => {
                  const checked = filters.departments.includes(dept);
                  return (
                    <button
                      key={dept}
                      onClick={() => toggleFilter('departments', dept)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs text-slate-300 hover:bg-slate-900 transition-colors"
                    >
                      {checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>{dept}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Categorical filter dropdown: Industry (Feature 7) */}
          <div className="relative">
            <button
              id="filter-dropdown-industry"
              onClick={() => toggleDropdown('industry')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                filters.industries.length > 0
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>Industry ({filters.industries.length || 'All'})</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            </button>
            {openDropdown === 'industry' && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-800 rounded-lg shadow-xl z-50 p-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider border-b border-slate-900 mb-1">
                  Filter Industry
                </p>
                {categories.industries.map((ind) => {
                  const checked = filters.industries.includes(ind);
                  return (
                    <button
                      key={ind}
                      onClick={() => toggleFilter('industries', ind)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs text-slate-300 hover:bg-slate-900 transition-colors"
                    >
                      {checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>{ind}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Operator Workspace Layout Switches Dropdown (Feature 6) */}
          <div className="relative">
            <button
              id="workspace-layout-toggle"
              onClick={() => toggleDropdown('layout')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 text-xs font-medium cursor-pointer"
            >
              <span>Workspace Toggles</span>
              <Eye className="w-3.5 h-3.5 text-slate-500" />
            </button>
            {openDropdown === 'layout' && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-slate-800 rounded-lg shadow-xl z-50 p-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider border-b border-slate-900 mb-1">
                  Show/Hide Widgets
                </p>
                <button
                  onClick={() => togglePanel('gridWindow')}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs text-slate-300 hover:bg-slate-900 transition-colors"
                >
                  <span>Data Grid Grid</span>
                  {layout.gridWindow ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <button
                  onClick={() => togglePanel('analyticsChart')}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs text-slate-300 hover:bg-slate-900 transition-colors"
                >
                  <span>Department Analytics</span>
                  {layout.analyticsChart ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <button
                  onClick={() => togglePanel('systemMetrics')}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs text-slate-300 hover:bg-slate-900 transition-colors"
                >
                  <span>System Diagnostics</span>
                  {layout.systemMetrics ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Reset Filters button */}
          {(filters.automation_types.length > 0 ||
            filters.departments.length > 0 ||
            filters.industries.length > 0 ||
            searchQuery) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual queue buffer overlays / stats under pause (Feature 5) */}
      {(isPaused || pendingQueueSize > 0) && (
        <div className="mt-3 flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
            <span>
              {isPaused ? (
                <span>
                  Ingress Stream is frozen in viewport. Background queue active.{' '}
                  <button
                    onClick={() => setShowFrozenAnalytics(!showFrozenAnalytics)}
                    className="underline text-amber-300 hover:text-amber-200 font-bold ml-1 cursor-pointer font-mono text-[10px]"
                  >
                    [CLICK TO TOGGLE DETAILED SNAPSHOT ANALYTICS]
                  </button>
                </span>
              ) : (
                'Processing high volume burst.'
              )}
            </span>
          </div>
          <span className="font-mono font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded text-[10px]">
            {pendingQueueSize} Rows Buffered
          </span>
        </div>
      )}

      {/* Results summary text */}
      <div className="mt-3 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>Viewing {totalFiltered} of {totalAll} active projects</span>
        <span>Filter isolation state: active</span>
      </div>
    </div>
  );
}

export default memo(ControlPanel);
