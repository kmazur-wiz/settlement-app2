/**
 * Recalculate settlements for given doctor IDs and month.
 * Called after import, and also on-demand from admin.
 */

import { db } from "@/lib/db";
import { calculate } from "./engine";
import { classifySlot, calculateProration, getDaysInMonth } from "./slots";
import type { VisitData, ScheduleProration, ModelFParams } from "@/lib/types";
import { differenceInDays } from "date-fns";

const FULL_PRORATION: ScheduleProration = {
  factor: 1,
  days_covered: 1,
  total_days: 1,
  schedule_met: true,
};

export async function recalculateSettlements(doctorIds: string[], month: string) {
  const exchangeRates = await getExchangeRates();

  for (const doctorId of doctorIds) {
    try {
      await recalculateOne(doctorId, month, exchangeRates);
    } catch (e) {
      console.error(`Failed to recalculate settlement for ${doctorId}/${month}:`, e);
    }
  }
}

async function getExchangeRates(): Promise<Record<string, number>> {
  const rates = await db.exchangeRate.findMany({
    orderBy: { validFrom: "desc" },
  });
  const result: Record<string, number> = { PLN: 1 };
  // Take most recent rate per currency
  for (const r of rates) {
    if (!result[r.currency]) result[r.currency] = r.rate;
  }
  return result;
}

async function recalculateOne(
  doctorId: string,
  month: string,
  exchangeRates: Record<string, number>
) {
  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    include: { contractModel: true },
  });
  if (!doctor) return;

  const visits = await db.visit.findMany({ where: { doctorId, month } });
  const slots = await db.slot.findMany({ where: { doctorId, month } });
  const prescriptions = await db.prescription.findMany({ where: { doctorId, month } });

  const currency = doctor.currency;

  // ── Aggregate visit data ─────────────────────────────────────────────────
  const data: VisitData = {
    ended_day: 0,
    ended_night: 0,
    failed_day: 0,
    failed_night: 0,
    ended: 0,
    failed: 0,
    prescriptions: prescriptions.reduce((s, p) => s + p.count, 0),
    night_shifts: 0,
    extra_ended_night: 0,
    extra_failed_night: 0,
    rxwhizz_count: 0,
    extra_hours: 0,
    extra_ended: 0,
    extra_failed: 0,
    hours_with_consultations: 0,
    shift_counts: {},
  };

  for (const v of visits) {
    if (v.source === "GLOBAL") {
      const status = v.visitStatus ?? "ended";
      const dayType = v.dayType ?? "day";
      const isNight = dayType === "night";
      if (status === "ended") {
        data.ended++;
        if (isNight) data.ended_night++; else data.ended_day++;
      } else {
        data.failed++;
        if (isNight) data.failed_night++; else data.failed_day++;
      }
    } else {
      // PL — each row is one visit
      if (!v.noShow) data.ended++;
      else data.failed++;
      data.ended_day++;
    }
  }

  // ── Schedule proration (for B/C models) ──────────────────────────────────
  let proration = FULL_PRORATION;
  const totalDays = getDaysInMonth(month);

  if (doctor.contractModel) {
    const modelType = doctor.contractModel.model;
    const params = JSON.parse(doctor.contractModel.params);

    // Classify slots for Model F
    if (modelType === "F") {
      const fParams = params as ModelFParams;
      const shiftMap: Record<string, { shifts: number; consultations: number; daysWithCons: Set<string> }> = {};

      for (const slot of slots) {
        const type = classifySlot(slot.startAt, fParams);
        if (type === "UNASSIGNED") continue;
        if (!shiftMap[type]) shiftMap[type] = { shifts: 0, consultations: 0, daysWithCons: new Set() };
        shiftMap[type].shifts++;
        if (slot.visitDate) {
          shiftMap[type].consultations++;
          shiftMap[type].daysWithCons.add(slot.visitDate.toISOString().slice(0, 10));
        }
      }

      for (const [type, s] of Object.entries(shiftMap)) {
        data.shift_counts[type] = {
          shifts: s.shifts,
          consultations: s.consultations,
          days_with_cons: s.daysWithCons.size,
        };
      }
    }

    // Proration for B/C/D
    if (["B", "C", "C_OPL"].includes(modelType) && params.proration_if_not_met) {
      const coverage = params.required_slot_coverage as string | undefined;
      if (coverage) {
        proration = calculateProration(slots.map(s => ({ startAt: s.startAt, endAt: s.endAt })), coverage, totalDays);
      }
    }

    // Slots PL — bonus RPL-05 check (doctor created slot ≥7 days before visit)
    if (doctor.type === "PL") {
      const bonusVisits = countBonusEligibleVisits(visits, slots);
      (data as unknown as Record<string, unknown>)["bonus_eligible_visits"] = bonusVisits;
    }

    // Calculate
    const result = calculate(
      modelType as Parameters<typeof calculate>[0],
      params,
      data,
      proration,
      data.ended // for Model E group — simplified, proper group calculation done separately
    );

    const totalLocal = result.total;
    const rate = exchangeRates[currency] ?? 1;
    const totalPln = totalLocal * rate;

    // Upsert settlement
    await db.settlement.upsert({
      where: { doctorId_month: { doctorId, month } },
      create: {
        doctorId,
        month,
        status: "PENDING_DOCTOR",
        amounts: JSON.stringify(result.breakdown),
        currency,
        totalLocal,
        totalPln,
      },
      update: {
        amounts: JSON.stringify(result.breakdown),
        currency,
        totalLocal,
        totalPln,
      },
    });
  } else {
    // No contract model — create empty settlement
    await db.settlement.upsert({
      where: { doctorId_month: { doctorId, month } },
      create: { doctorId, month, status: "PENDING_DOCTOR", currency, amounts: "{}" },
      update: {},
    });
  }
}

function countBonusEligibleVisits(
  visits: Array<{ visitDate: Date; source: string; noShow: boolean }>,
  slots: Array<{ createdAt: Date; visitDate: Date | null; source: string }>
): number {
  const slotsByVisitDate = new Map<string, Date>();
  for (const s of slots) {
    if (s.source === "PL" && s.visitDate) {
      const key = s.visitDate.toISOString().slice(0, 10);
      // keep earliest creation date for that visit day
      const existing = slotsByVisitDate.get(key);
      if (!existing || s.createdAt < existing) {
        slotsByVisitDate.set(key, s.createdAt);
      }
    }
  }

  let count = 0;
  for (const v of visits) {
    if (v.source !== "PL" || v.noShow) continue;
    const key = v.visitDate.toISOString().slice(0, 10);
    const slotCreated = slotsByVisitDate.get(key);
    if (slotCreated) {
      const diff = differenceInDays(v.visitDate, slotCreated);
      if (diff >= 7) count++;
    }
  }
  return count;
}
