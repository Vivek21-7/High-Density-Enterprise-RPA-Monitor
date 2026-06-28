/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RpaRow {
  project_id: string;
  project_name: string;
  company_id: string;
  project_status: 'Completed' | 'In Progress' | 'Failed' | 'On Hold';
  automation_type: 'RPA' | 'Cognitive' | 'AI-Agent' | 'Workflow';
  department: 'Finance' | 'HR' | 'Operations' | 'IT' | 'Legal' | 'Sales';
  industry: 'Banking' | 'Healthcare' | 'Retail' | 'Manufacturing' | 'Logistics' | 'Legal';
  implementation_partner: 'Accenture' | 'Infosys' | 'Wipro' | 'Tata' | 'Cognizant';
  country: 'USA' | 'India' | 'UK' | 'Germany' | 'Singapore' | 'Japan';
  robots_deployed: number;
  budget_usd: number;
  annual_savings_usd: number;
  roi_percent: number; // calculated from budget and savings, can be negative
  start_date: string;
  employee_hours_saved: number;
  last_updated: number; // Epoch timestamp for freshness tracking
}

export interface SortConfig {
  key: keyof RpaRow;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  automation_types: string[];
  departments: string[];
  industries: string[];
}

export interface LayoutVisibility {
  gridWindow: boolean;
  analyticsChart: boolean;
  systemMetrics: boolean;
  controlPanel: boolean;
}
