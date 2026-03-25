/**
 * Slot classification: given a slot's start datetime and a doctor's Model F config,
 * determine which standby type it belongs to.
 *
 * Also handles schedule proration calculation for Models B/C/D.
 */

import { parseISO, getDay, getHours } from "date-fns";
import type { ModelFParams, ScheduleProration } from "@/lib/types";

export type StandbyType = "DS1" | "DS2" | "DS3" | "WH" | "MONTHLY" | "UNASSIGNED";

// Parse "07:00-12:00" → { start: 7, end: 12 }
function parseTimeWindow(schedule: string): { start: number; end: number } | null {
  const m = schedule.match(/(\d{1,2}):(\d{2})[\s\-–to]+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { start: parseInt(m[1]), end: parseInt(m[3]) };
}

function isWeekend(date: Date): boolean {
  const day = getDay(date); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

function slotInWindow(slotHour: number, schedule: string): boolean {
  const w = parseTimeWindow(schedule);
  if (!w) return false;
  return slotHour >= w.start && slotHour < w.end;
}

export function classifySlot(slotStart: Date, params: ModelFParams): StandbyType {
  const hour = getHours(slotStart);
  const weekend = isWeekend(slotStart);

  if (weekend && params.wh?.enabled && params.wh.schedule) {
    if (slotInWindow(hour, params.wh.schedule)) return "WH";
  }

  if (!weekend) {
    if (params.ds1?.enabled && params.ds1.schedule && slotInWindow(hour, params.ds1.schedule)) {
      return "DS1";
    }
    if (params.ds2?.enabled && params.ds2.schedule && slotInWindow(hour, params.ds2.schedule)) {
      return "DS2";
    }
    if (params.ds3?.enabled && params.ds3.schedule && slotInWindow(hour, params.ds3.schedule)) {
      return "DS3";
    }
  }

  if (params.monthly?.enabled && params.monthly.schedule) {
    if (slotInWindow(hour, params.monthly.schedule)) return "MONTHLY";
  }

  return "UNASSIGNED";
}

/**
 * Calculate schedule proration factor given a slot coverage requirement
 * and the actual slots present.
 *
 * required_coverage: "daily 8:00-22:00 UTC+3" — describes the window
 * We compare days with full slot coverage vs total days in month.
 */
export function calculateProration(
  slots: Array<{ startAt: Date; endAt: Date }>,
  requiredCoverage: string,
  totalDaysInMonth: number
): ScheduleProration {
  if (!requiredCoverage || slots.length === 0) {
    return { factor: 0, days_covered: 0, total_days: totalDaysInMonth, schedule_met: false };
  }

  const window = parseTimeWindow(requiredCoverage);
  if (!window) {
    return { factor: 1, days_covered: totalDaysInMonth, total_days: totalDaysInMonth, schedule_met: true };
  }

  // Group slots by date
  const byDate = new Map<string, Set<number>>();
  for (const slot of slots) {
    const dateKey = slot.startAt.toISOString().slice(0, 10);
    if (!byDate.has(dateKey)) byDate.set(dateKey, new Set());
    const hour = getHours(slot.startAt);
    byDate.get(dateKey)!.add(hour);
  }

  // Check each day: has slots covering every required hour?
  let covered = 0;
  for (const [, hours] of Array.from(byDate)) {
    let ok = true;
    for (let h = window.start; h < window.end; h++) {
      if (!hours.has(h)) { ok = false; break; }
    }
    if (ok) covered++;
  }

  const factor = totalDaysInMonth > 0 ? covered / totalDaysInMonth : 0;
  return {
    factor: Math.min(1, factor),
    days_covered: covered,
    total_days: totalDaysInMonth,
    schedule_met: covered >= totalDaysInMonth,
  };
}

export function getDaysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m, 0).getDate();
}
