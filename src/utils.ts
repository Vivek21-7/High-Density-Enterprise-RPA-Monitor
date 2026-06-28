/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number as USD currency without decimal cents, keeping the display neat.
 * e.g. 15000 -> $15,000
 */
export function formatCurrency(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats a general number with comma separators.
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Clamps and formats percentages strictly to 2 decimal places.
 * e.g. 12.345 -> 12.35%
 */
export function formatPercentage(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  // Clamping to reasonable bounds just to be safe from visual overflows
  const clamped = Math.max(-9999.99, Math.min(9999.99, value));
  return `${clamped >= 0 ? '+' : ''}${clamped.toFixed(2)}%`;
}
