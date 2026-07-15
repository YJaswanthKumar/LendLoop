import type { CancellationPolicy } from "./types";

export const CANCELLATION_POLICY_LABELS: Record<CancellationPolicy, string> = {
  FLEXIBLE: "Flexible",
  MODERATE: "Moderate",
  STRICT: "Strict",
};

export const CANCELLATION_POLICY_DESCRIPTIONS: Record<CancellationPolicy, string> = {
  FLEXIBLE: "Full refund if cancelled 1+ day before pickup. 50% refund on the day of pickup.",
  MODERATE: "Full refund 3+ days before pickup, 50% within 3 days, no refund on the day of pickup.",
  STRICT: "Full refund 7+ days before pickup, 50% within 7 days, no refund within 3 days of pickup.",
};

// Mirrors CANCELLATION_REFUND_RULES in the backend (utils/constants.js) so
// the booking modal can preview the refund before the borrower confirms.
const REFUND_RULES: Record<CancellationPolicy, { minDaysBefore: number; refundPercent: number }[]> = {
  FLEXIBLE: [
    { minDaysBefore: 1, refundPercent: 100 },
    { minDaysBefore: 0, refundPercent: 50 },
  ],
  MODERATE: [
    { minDaysBefore: 3, refundPercent: 100 },
    { minDaysBefore: 1, refundPercent: 50 },
    { minDaysBefore: 0, refundPercent: 0 },
  ],
  STRICT: [
    { minDaysBefore: 7, refundPercent: 100 },
    { minDaysBefore: 3, refundPercent: 50 },
    { minDaysBefore: 0, refundPercent: 0 },
  ],
};

function daysUntil(dateStr: string, now = new Date()): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((target.getTime() - today.getTime()) / 86_400_000));
}

/** Estimated refund percentage for cancelling today, given the rental's start date. */
export function estimateRefundPercent(policy: CancellationPolicy, startDate: string): number {
  const daysBefore = daysUntil(startDate);
  const sorted = [...REFUND_RULES[policy]].sort((a, b) => b.minDaysBefore - a.minDaysBefore);
  const matched = sorted.find((rule) => daysBefore >= rule.minDaysBefore);
  return matched ? matched.refundPercent : 0;
}
