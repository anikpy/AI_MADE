/**
 * Currency formatting utilities.
 * Uses string-based Decimal arithmetic — never float.
 */
import Decimal from 'decimal.js';

/** Format a string amount as currency, e.g. "1234.56" → "$1,234.56" */
export function formatCurrency(amount: string | number, currency = 'USD', locale = 'en-US'): string {
  const d = new Decimal(amount);
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(d.toNumber());
}

/** Format compact, e.g. 12345 → "$12.3K" */
export function formatCurrencyCompact(amount: string | number): string {
  const n = new Decimal(amount).toNumber();
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
}

/** Add two decimal string amounts safely */
export function addAmounts(a: string, b: string): string {
  return new Decimal(a).plus(new Decimal(b)).toFixed(2);
}

/** Format a date string to human-readable */
export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', ...opts
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateStr));
}

/** Format account number with spaces: "1234567890" → "1234 5678 90" */
export function formatAccountNumber(num: string): string {
  return num.replace(/(.{4})/g, '$1 ').trim();
}

/** Return abbreviated full name or username */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Map transaction type → CSS class for amount sign */
export function amountClass(type: string): string {
  return ['deposit', 'transfer_in'].includes(type) ? 'amount-positive' : 'amount-negative';
}

/** Map transaction type → sign prefix */
export function amountSign(type: string): string {
  return ['deposit', 'transfer_in'].includes(type) ? '+' : '-';
}

/** Map status → badge CSS class */
export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    active: 'badge-success',
    completed: 'badge-success',
    pending: 'badge-warning',
    scheduled: 'badge-info',
    suspended: 'badge-warning',
    failed: 'badge-danger',
    closed: 'badge-gray',
  };
  return map[status] ?? 'badge-gray';
}
