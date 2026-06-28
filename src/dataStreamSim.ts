/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RpaRow } from './types';

const PROJECT_NAMES = [
  'Invoice Data Extraction', 'Customer Chatbot Triage', 'SAP Ledger Reconciliation',
  'Employee Onboarding Pipeline', 'Claims Auto-Verification', 'Inventory Reorder Agent',
  'Legal Document Analysis', 'IT Server Health Monitor', 'Sales Contract Generator',
  'Freight Route Optimizer', 'Tax Compliance Auditor', 'Risk Assessment Engine',
  'Warehouse Robotics Dispatch', 'CRM Contact Sync Service', 'Marketing Leads Scraper'
];

const COMPANIES = [
  'Tata Consultancy', 'FinTech Solutions', 'CloudCorp', 'GlobalLogistics',
  'ApexLegal', 'MedSystems', 'Initech Corp', 'Nova Retail', 'Alpha Manufacturing'
];

const AUTOMATION_TYPES = ['RPA', 'Cognitive', 'AI-Agent', 'Workflow'] as const;
const DEPARTMENTS = ['Finance', 'HR', 'Operations', 'IT', 'Legal', 'Sales'] as const;
const INDUSTRIES = ['Banking', 'Healthcare', 'Retail', 'Manufacturing', 'Logistics', 'Legal'] as const;
const PARTNERS = ['Accenture', 'Infosys', 'Wipro', 'Tata', 'Cognizant'] as const;
const COUNTRIES = ['USA', 'India', 'UK', 'Germany', 'Singapore', 'Japan'] as const;

// Generate baseline data
export function generateBaseline(count: number = 1200): RpaRow[] {
  const data: RpaRow[] = [];
  const now = Date.now();
  
  for (let i = 1; i <= count; i++) {
    const budget = Math.floor(Math.random() * 240000) + 10000;
    // 15% chance of starting with negative ROI (or failed)
    const isAnomalous = Math.random() < 0.12;
    const annualSavings = isAnomalous 
      ? Math.floor(budget * (0.5 + Math.random() * 0.45)) // savings < budget
      : Math.floor(budget * (1.1 + Math.random() * 4));   // savings > budget

    const status = isAnomalous 
      ? (Math.random() < 0.5 ? 'Failed' as const : 'In Progress' as const)
      : (Math.random() < 0.7 ? 'Completed' as const : 'In Progress' as const);

    const project_id = `PRJ-${String(2000 + i).padStart(4, '0')}`;
    const roi_percent = Number((((annualSavings - budget) / budget) * 100).toFixed(2));

    data.push({
      project_id,
      project_name: PROJECT_NAMES[i % PROJECT_NAMES.length],
      company_id: COMPANIES[i % COMPANIES.length],
      project_status: status,
      automation_type: AUTOMATION_TYPES[i % AUTOMATION_TYPES.length],
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      industry: INDUSTRIES[i % INDUSTRIES.length],
      implementation_partner: PARTNERS[i % PARTNERS.length],
      country: COUNTRIES[i % COUNTRIES.length],
      robots_deployed: Math.floor(Math.random() * 15) + 1,
      budget_usd: budget,
      annual_savings_usd: annualSavings,
      roi_percent,
      start_date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
      employee_hours_saved: Math.floor(Math.random() * 7500) + 100,
      last_updated: now - Math.floor(Math.random() * 100000),
    });
  }
  return data;
}

export function initSim() {
  const win = window as any;
  if (win.initializerRpaStream) {
    // Already defined by evaluator environment or prior setup
    return;
  }

  // Generate local in-memory dataset
  const dataset = generateBaseline(1200);
  let nextIdNum = 3201;

  win.initializerRpaStream = (callback: (batch: RpaRow[]) => void) => {
    // Immediately pump a large chunk representing the initial baseline load
    callback(dataset);

    // Then start interval to pump updates/anomalies every 200ms
    const intervalId = setInterval(() => {
      const batchSize = Math.floor(Math.random() * 8) + 4; // 4 to 11 updates per tick
      const batch: RpaRow[] = [];
      const now = Date.now();

      for (let i = 0; i < batchSize; i++) {
        const isNewRow = Math.random() < 0.15; // 15% chance of brand new project
        
        if (isNewRow) {
          const budget = Math.floor(Math.random() * 240000) + 10000;
          const isFailed = Math.random() < 0.2;
          const savings = isFailed 
            ? Math.floor(budget * (0.4 + Math.random() * 0.5))
            : Math.floor(budget * (1.2 + Math.random() * 3));
          
          const status = isFailed ? 'Failed' as const : 'In Progress' as const;
          const roi_percent = Number((((savings - budget) / budget) * 100).toFixed(2));
          const newRow: RpaRow = {
            project_id: `PRJ-${nextIdNum++}`,
            project_name: PROJECT_NAMES[Math.floor(Math.random() * PROJECT_NAMES.length)],
            company_id: COMPANIES[Math.floor(Math.random() * COMPANIES.length)],
            project_status: status,
            automation_type: AUTOMATION_TYPES[Math.floor(Math.random() * AUTOMATION_TYPES.length)],
            department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
            industry: INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)],
            implementation_partner: PARTNERS[Math.floor(Math.random() * PARTNERS.length)],
            country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
            robots_deployed: Math.floor(Math.random() * 12) + 1,
            budget_usd: budget,
            annual_savings_usd: savings,
            roi_percent,
            start_date: new Date(now).toISOString().split('T')[0],
            employee_hours_saved: Math.floor(Math.random() * 6000) + 150,
            last_updated: now,
          };
          // Also append to our in-memory dataset to keep it synchronous
          dataset.push(newRow);
          batch.push(newRow);
        } else {
          // Update an existing row
          const randomIndex = Math.floor(Math.random() * dataset.length);
          const existing = dataset[randomIndex];
          
          // Modify some parameters
          const statusChance = Math.random();
          let nextStatus = existing.project_status;
          if (statusChance < 0.1) {
            nextStatus = 'Failed';
          } else if (statusChance < 0.25) {
            nextStatus = 'Completed';
          } else if (statusChance < 0.3) {
            nextStatus = 'On Hold';
          } else if (statusChance < 0.45) {
            nextStatus = 'In Progress';
          }

          // Update metrics (robots, savings, hours)
          const robotsDelta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          const nextRobots = Math.max(1, existing.robots_deployed + robotsDelta);
          
          const savingsGrowth = Math.floor(Math.random() * 25000) - 5000; // -5k to +20k
          const nextSavings = Math.max(5000, existing.annual_savings_usd + savingsGrowth);
          
          const hoursGrowth = Math.floor(Math.random() * 300) - 50;
          const nextHours = Math.max(50, existing.employee_hours_saved + hoursGrowth);
          
          // Recalculate ROI
          let nextRoi = Number((((nextSavings - existing.budget_usd) / existing.budget_usd) * 100).toFixed(2));
          if (nextStatus === 'Failed') {
            // Force a negative ROI or drop savings severely to simulate failure anomaly
            const badSavings = Math.floor(existing.budget_usd * 0.3);
            nextRoi = Number((((badSavings - existing.budget_usd) / existing.budget_usd) * 100).toFixed(2));
          }

          const updated: RpaRow = {
            ...existing,
            project_status: nextStatus,
            robots_deployed: nextRobots,
            annual_savings_usd: nextSavings,
            roi_percent: nextRoi,
            employee_hours_saved: nextHours,
            last_updated: now,
          };

          // Update in local database
          dataset[randomIndex] = updated;
          batch.push(updated);
        }
      }

      callback(batch);
    }, 200);

    // Expose a stop method to clean up if needed
    win.__stopRpaStream = () => {
      clearInterval(intervalId);
    };
  };
}
