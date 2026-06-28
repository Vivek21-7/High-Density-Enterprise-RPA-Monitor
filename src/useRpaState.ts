/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RpaRow, SortConfig, FilterConfig, LayoutVisibility } from './types';

export function useRpaState() {
  // We use a ref for the full dataset map to enable fast lookup and avoid stale closure issues
  const rowsMapRef = useRef<Map<string, RpaRow>>(new Map());
  
  // React state for triggering UI updates
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [totalProcessedCount, setTotalProcessedCount] = useState<number>(0);
  
  // High performance pre-calculated KPIs to avoid O(N) loops on each 200ms frame
  const [activeRobots, setActiveRobots] = useState<number>(0);
  const [cumulativeSavings, setCumulativeSavings] = useState<number>(0);
  const [uniqueProjectsCount, setUniqueProjectsCount] = useState<number>(0);
  
  // Pipeline Buffer controls (Feature 5)
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const pausedQueueRef = useRef<RpaRow[][]>([]);
  const [pendingQueueSize, setPendingQueueSize] = useState<number>(0);

  // Sorting state (Features 4 & 9)
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([
    { key: 'last_updated', direction: 'desc' } // default sort
  ]);

  // Filtering states (Feature 7)
  const [filters, setFilters] = useState<FilterConfig>({
    automation_types: [],
    departments: [],
    industries: [],
  });

  // Fuzzy search query (Feature 10)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active flashes for alarms (Feature 3)
  const [flashedRows, setFlashedRows] = useState<Record<string, number>>({});

  // Operator Workspace Layout Persistence (Feature 6)
  const [layout, setLayout] = useState<LayoutVisibility>(() => {
    try {
      const saved = localStorage.getItem('rpa_monitor_layout');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading layout from localStorage:', e);
    }
    return {
      gridWindow: true,
      analyticsChart: true,
      systemMetrics: true,
      controlPanel: true,
    };
  });

  // Save layout changes to local storage
  const togglePanel = useCallback((panel: keyof LayoutVisibility) => {
    setLayout((prev) => {
      const updated = { ...prev, [panel]: !prev[panel] };
      localStorage.setItem('rpa_monitor_layout', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // System statistics for diagnostics (helps with "Infrastructure Toggles" and diagnostic aesthetic)
  const [sysMetrics, setSysMetrics] = useState({
    fps: 60,
    processingRate: 0, // items per second
    lastTickDurationMs: 0,
    memoryUsageMb: 85.4,
  });

  // Performance monitoring variables
  const lastSecRowsProcessedRef = useRef<number>(0);
  const lastSecTimestampRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Clean up expired flashes every 500ms (Feature 3 auto-expire)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setFlashedRows((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        for (const [id, timestamp] of Object.entries(prev)) {
          if (now - (timestamp as number) < 1500) {
            next[id] = timestamp as number;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Calculate FPS & processing rates in a lightweight loop
  useEffect(() => {
    let animId: number;
    const tick = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      
      if (delta >= 1000) {
        const calculatedFps = Math.min(60, Math.round((frameCountRef.current * 1000) / delta));
        
        // Update sys metrics
        const nowUnix = Date.now();
        const secondsDelta = (nowUnix - lastSecTimestampRef.current) / 1000;
        const rate = Math.round(lastSecRowsProcessedRef.current / (secondsDelta || 1));
        
        // Mock a natural memory usage fluctuations
        const memGrowth = (Math.random() - 0.5) * 1.5;
        
        setSysMetrics((prev) => ({
          fps: calculatedFps,
          processingRate: rate,
          lastTickDurationMs: prev.lastTickDurationMs,
          memoryUsageMb: Math.max(40, Math.min(256, Number((prev.memoryUsageMb + memGrowth).toFixed(1)))),
        }));
        
        // Reset counters
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
        lastSecRowsProcessedRef.current = 0;
        lastSecTimestampRef.current = nowUnix;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Process a batch of rows
  const processBatch = useCallback((batch: RpaRow[]) => {
    const start = performance.now();
    const rowsMap = rowsMapRef.current;
    const now = Date.now();
    const newFlashed: Record<string, number> = {};
    let flashUpdated = false;

    let robotsDelta = 0;
    let savingsDelta = 0;
    let newProjectsCount = 0;

    for (const row of batch) {
      const existing = rowsMap.get(row.project_id);
      
      // Determine if we should trigger an alert flash
      // Condition: status is 'Failed' or negative ROI
      const isAnomalous = row.project_status === 'Failed' || row.roi_percent < 0;
      
      if (isAnomalous) {
        // Only flash if it's new, or status/metrics changed
        const isNewFailure = !existing || 
                            existing.project_status !== row.project_status || 
                            existing.roi_percent !== row.roi_percent;
        
        if (isNewFailure) {
          newFlashed[row.project_id] = now;
          flashUpdated = true;
        }
      }

      if (existing) {
        robotsDelta += row.robots_deployed - existing.robots_deployed;
        savingsDelta += row.annual_savings_usd - existing.annual_savings_usd;
      } else {
        robotsDelta += row.robots_deployed;
        savingsDelta += row.annual_savings_usd;
        newProjectsCount++;
      }

      // Update in our map
      rowsMap.set(row.project_id, row);
    }

    if (flashUpdated) {
      setFlashedRows((prev) => ({ ...prev, ...newFlashed }));
    }

    // Keep track of total raw telemetry updates processed
    setTotalProcessedCount((prev) => prev + batch.length);
    lastSecRowsProcessedRef.current += batch.length;

    // Update precalculated KPIs incrementally
    setActiveRobots((prev) => prev + robotsDelta);
    setCumulativeSavings((prev) => prev + savingsDelta);
    setUniqueProjectsCount((prev) => prev + newProjectsCount);

    // Trigger state refresh for UI components
    setDataVersion((prev) => prev + 1);

    const end = performance.now();
    setSysMetrics((prev) => ({
      ...prev,
      lastTickDurationMs: Number((end - start).toFixed(2)),
    }));
  }, []);

  // Accumulate incoming batches in a ref buffer to throttle updates
  const pendingBufferRef = useRef<RpaRow[]>([]);

  // Periodically flush the buffer to React state (every 800ms) for high performance
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (pendingBufferRef.current.length > 0) {
        const batchToProcess = pendingBufferRef.current;
        pendingBufferRef.current = [];
        processBatch(batchToProcess);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isPaused, processBatch]);

  // Handler for incoming real-time batch stream
  const handleIncomingBatch = useCallback((batch: RpaRow[]) => {
    if (isPaused) {
      pausedQueueRef.current.push(batch);
      setPendingQueueSize((prev) => prev + batch.length);
    } else {
      // If we don't have any rows yet (initial load), process immediately for instant rendering
      if (rowsMapRef.current.size === 0) {
        processBatch(batch);
      } else {
        // Push into our high-performance rendering buffer
        pendingBufferRef.current.push(...batch);
      }
    }
  }, [isPaused, processBatch]);

  // Handle play/pause toggle
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const nextPaused = !prev;
      if (!nextPaused) {
        // Flush queue immediately upon resume (Feature 5 play toggle)
        const queuedBatches = pausedQueueRef.current;
        pausedQueueRef.current = [];
        setPendingQueueSize(0);
        
        if (queuedBatches.length > 0) {
          // Combine all queued batches into one large batch for speed
          const flattened = queuedBatches.flat();
          processBatch(flattened);
        }
      }
      return nextPaused;
    });
  }, [processBatch]);

  // Sort interaction handler
  const handleSort = useCallback((key: keyof RpaRow, isMulti: boolean) => {
    setSortConfig((prev) => {
      // Find existing config for this key
      const existingIndex = prev.findIndex((s) => s.key === key);
      
      if (isMulti) {
        // Multi-column sorting (Feature 9)
        if (existingIndex > -1) {
          const existing = prev[existingIndex];
          if (existing.direction === 'asc') {
            // toggle to desc
            const next = [...prev];
            next[existingIndex] = { key, direction: 'desc' };
            return next;
          } else {
            // remove this key from sort chain
            return prev.filter((s) => s.key !== key);
          }
        } else {
          // Add to the end of sort chain
          return [...prev, { key, direction: 'asc' }];
        }
      } else {
        // Single-column sorting (Feature 4)
        if (existingIndex > -1 && prev.length === 1) {
          const currentDir = prev[0].direction;
          return [{ key, direction: currentDir === 'asc' ? 'desc' : 'asc' }];
        } else {
          // Reset all other sort keys and set this as sole sort key
          return [{ key, direction: 'asc' }];
        }
      }
    });
  }, []);

  // Clear all sorting
  const clearSorting = useCallback(() => {
    setSortConfig([{ key: 'last_updated', direction: 'desc' }]);
  }, []);

  // Update specific categorical filters
  const toggleFilter = useCallback((category: keyof FilterConfig, value: string) => {
    setFilters((prev) => {
      const currentList = prev[category];
      const isSelected = currentList.includes(value);
      const updatedList = isSelected
        ? currentList.filter((item) => item !== value)
        : [...currentList, value];
      
      return {
        ...prev,
        [category]: updatedList,
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      automation_types: [],
      departments: [],
      industries: [],
    });
    setSearchQuery('');
  }, []);

  // Extract unique category values for filters
  const categories = useMemo(() => {
    const list = Array.from(rowsMapRef.current.values()) as RpaRow[];
    const automationTypes = new Set<string>();
    const departments = new Set<string>();
    const industries = new Set<string>();

    list.forEach((row) => {
      automationTypes.add(row.automation_type);
      departments.add(row.department);
      industries.add(row.industry);
    });

    return {
      automation_types: Array.from(automationTypes).sort(),
      departments: Array.from(departments).sort(),
      industries: Array.from(industries).sort(),
    };
  }, [uniqueProjectsCount]);

  // Compute filtered & sorted rows
  const computedRows = useMemo(() => {
    const allItems = Array.from(rowsMapRef.current.values()) as RpaRow[];
    
    // 1. Apply multi-choice categorical filters (Feature 7)
    let filtered = allItems.filter((row) => {
      if (filters.automation_types.length > 0 && !filters.automation_types.includes(row.automation_type)) {
        return false;
      }
      if (filters.departments.length > 0 && !filters.departments.includes(row.department)) {
        return false;
      }
      if (filters.industries.length > 0 && !filters.industries.includes(row.industry)) {
        return false;
      }
      return true;
    });

    // 2. Apply Fuzzy Search (Feature 10)
    if (searchQuery.trim()) {
      const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter((row) => {
        return tokens.every((token) => {
          return (
            row.project_name.toLowerCase().includes(token) ||
            row.company_id.toLowerCase().includes(token) ||
            row.implementation_partner.toLowerCase().includes(token) ||
            row.country.toLowerCase().includes(token) ||
            row.project_id.toLowerCase().includes(token) ||
            row.project_status.toLowerCase().includes(token) ||
            row.automation_type.toLowerCase().includes(token) ||
            row.department.toLowerCase().includes(token) ||
            row.industry.toLowerCase().includes(token)
          );
        });
      });
    }

    // 3. Apply Multi-Column Sorting (Features 4 & 9)
    if (sortConfig.length > 0) {
      filtered.sort((a, b) => {
        for (const { key, direction } of sortConfig) {
          const valA = a[key];
          const valB = b[key];

          if (valA === valB) continue;

          if (typeof valA === 'number' && typeof valB === 'number') {
            return direction === 'asc' ? valA - valB : valB - valA;
          }

          if (typeof valA === 'string' && typeof valB === 'string') {
            const cmp = valA.localeCompare(valB);
            return direction === 'asc' ? cmp : -cmp;
          }
        }
        return 0;
      });
    }

    return filtered;
  }, [dataVersion, sortConfig, filters, searchQuery]);

  // Compute High-Density KPIs (Feature 1) over the current fully unified database
  // Highly optimized: returned in O(1) time using precalculated incremental state
  const kpis = useMemo(() => {
    return {
      totalRowsProcessed: totalProcessedCount,
      activeRobots,
      cumulativeSavings,
      uniqueProjectsCount,
    };
  }, [totalProcessedCount, activeRobots, cumulativeSavings, uniqueProjectsCount]);

  return {
    rows: computedRows,
    totalCount: computedRows.length,
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
  };
}
