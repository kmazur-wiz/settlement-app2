/**
 * Import processor: takes parsed data, matches to doctors in DB,
 * stores visits/slots/prescriptions/ratings, then triggers settlement recalculation.
 */

import { db } from "@/lib/db";
import type { ParseResult } from "./parser";
import { recalculateSettlements } from "@/lib/billing/recalculate";

export interface ImportSummary {
  matched: number;
  unmatched: string[];
  stored: Record<string, number>;
  errors: string[];
}

export async function processImport(
  parsed: ParseResult,
  month: string,
  importedBy: string,
  filename: string
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    matched: 0,
    unmatched: [],
    stored: {},
    errors: parsed.errors.map((e) => `[${e.sheet}${e.row ? `:${e.row}` : ""}] ${e.message}`),
  };

  // ── Upsert GLOBAL doctors from sheet 0 ───────────────────────────────────
  for (const d of parsed.doctorsGlobal) {
    const existing = await db.user.findUnique({ where: { email: d.email }, include: { doctor: true } });
    if (existing) {
      // Update doctor record if it exists
      if (existing.doctor) {
        await db.doctor.update({
          where: { userId: existing.id },
          data: { externalId: d.externalId, country: d.country || undefined, currency: d.currency },
        });
      } else {
        await db.doctor.create({
          data: { userId: existing.id, type: "GLOBAL", externalId: d.externalId, country: d.country || undefined, currency: d.currency },
        });
      }
      // Update name if provided
      if (d.name && d.name !== d.email) {
        await db.user.update({ where: { id: existing.id }, data: { name: d.name } });
      }
    } else {
      // Create new user + doctor
      const newUser = await db.user.create({
        data: { email: d.email, name: d.name, role: "DOCTOR", isActive: true },
      });
      await db.doctor.create({
        data: { userId: newUser.id, type: "GLOBAL", externalId: d.externalId, country: d.country || undefined, currency: d.currency },
      });
    }
  }

  // Build email → doctor mapping
  const allEmails = new Set([
    ...parsed.visitsPL.map((v) => v.email),
    ...parsed.visitsGlobal.map((v) => v.email),
    ...parsed.slotsPL.map((s) => s.email),
    ...parsed.slotsGlobal.map((s) => s.email),
    ...parsed.prescriptionsPL.map((p) => p.email),
    ...parsed.prescriptionsGlobal.map((p) => p.email),
    ...parsed.ratings.map((r) => r.email),
  ]);

  const users = await db.user.findMany({
    where: { email: { in: Array.from(allEmails) } },
    include: { doctor: true },
  });

  const emailToDoctor = new Map<string, string>(); // email → doctor.id
  for (const u of users) {
    if (u.doctor) emailToDoctor.set(u.email.toLowerCase(), u.doctor.id);
  }

  summary.matched = emailToDoctor.size;

  // Identify unmatched
  for (const email of Array.from(allEmails)) {
    if (!emailToDoctor.has(email)) summary.unmatched.push(email);
  }

  // Helper: get doctorId or skip
  const getDoctorId = (email: string): string | null =>
    emailToDoctor.get(email.toLowerCase()) ?? null;

  // ── Clear existing data for this month ────────────────────────────────────
  const doctorIds = [...emailToDoctor.values()];
  await db.visit.deleteMany({ where: { doctorId: { in: doctorIds }, month } });
  await db.slot.deleteMany({ where: { doctorId: { in: doctorIds }, month } });
  await db.prescription.deleteMany({ where: { doctorId: { in: doctorIds }, month } });
  await db.rating.deleteMany({ where: { doctorId: { in: doctorIds }, month } });

  // ── Visits PL ─────────────────────────────────────────────────────────────
  let storedVisitsPL = 0;
  for (const v of parsed.visitsPL) {
    const did = getDoctorId(v.email);
    if (!did) continue;
    await db.visit.create({
      data: {
        doctorId: did,
        month,
        visitDate: v.visitDate,
        startDate: v.startDate,
        endDate: v.endDate,
        specialization: v.specialization,
        visitType: v.visitType,
        bu: v.bu,
        clinic: v.clinic,
        patient: v.patient,
        language: v.language,
        noShow: v.noShow,
        directBooking: v.directBooking,
        delayMinutes: v.delayMinutes,
        hasPenalty: v.hasPenalty,
        penaltyAmount: v.penaltyAmount,
        baseRate: v.baseRate,
        source: "PL",
        visitStatus: "ended",
      },
    });
    storedVisitsPL++;
  }
  summary.stored.visitsPL = storedVisitsPL;

  // ── Slots PL ──────────────────────────────────────────────────────────────
  let storedSlotsPL = 0;
  for (const s of parsed.slotsPL) {
    const did = getDoctorId(s.email);
    if (!did) continue;
    await db.slot.create({
      data: {
        doctorId: did,
        month,
        externalId: s.externalId,
        createdAt: s.createdAt,
        startAt: s.startAt,
        endAt: s.endAt,
        visitDate: s.visitDate,
        source: "PL",
      },
    });
    storedSlotsPL++;
  }
  summary.stored.slotsPL = storedSlotsPL;

  // ── Prescriptions PL ──────────────────────────────────────────────────────
  let storedPrescPL = 0;
  for (const p of parsed.prescriptionsPL) {
    const did = getDoctorId(p.email);
    if (!did) continue;
    await db.prescription.create({
      data: { doctorId: did, month, count: p.count, source: "PL" },
    });
    storedPrescPL++;
  }
  summary.stored.prescriptionsPL = storedPrescPL;

  // ── Ratings ───────────────────────────────────────────────────────────────
  let storedRatings = 0;
  for (const r of parsed.ratings) {
    const did = getDoctorId(r.email);
    if (!did) continue;
    await db.rating.create({
      data: { doctorId: did, month, specialization: r.specialization, avgRating: r.avgRating },
    });
    storedRatings++;
  }
  summary.stored.ratings = storedRatings;

  // ── Visits GLOBAL ─────────────────────────────────────────────────────────
  let storedVisitsGlobal = 0;
  for (const v of parsed.visitsGlobal) {
    const did = getDoctorId(v.email);
    if (!did) continue;
    await db.visit.create({
      data: {
        doctorId: did,
        month,
        visitDate: v.visitDate,
        source: "GLOBAL",
        visitStatus: v.visitStatus,
        dayType: v.dayType,
        visitLanguage: v.language,
      },
    });
    storedVisitsGlobal++;
  }
  summary.stored.visitsGlobal = storedVisitsGlobal;

  // ── Slots GLOBAL ──────────────────────────────────────────────────────────
  let storedSlotsGlobal = 0;
  for (const s of parsed.slotsGlobal) {
    const did = getDoctorId(s.email);
    if (!did) continue;
    await db.slot.create({
      data: {
        doctorId: did,
        month,
        externalId: s.externalId,
        createdAt: s.createdAt,
        startAt: s.startAt,
        endAt: s.endAt,
        visitDate: s.visitDate,
        source: "GLOBAL",
        country: s.country,
      },
    });
    storedSlotsGlobal++;
  }
  summary.stored.slotsGlobal = storedSlotsGlobal;

  // ── Prescriptions GLOBAL ──────────────────────────────────────────────────
  let storedPrescGlobal = 0;
  for (const p of parsed.prescriptionsGlobal) {
    const did = getDoctorId(p.email);
    if (!did) continue;
    await db.prescription.create({
      data: { doctorId: did, month, count: p.count, source: "GLOBAL", country: p.country },
    });
    storedPrescGlobal++;
  }
  summary.stored.prescriptionsGlobal = storedPrescGlobal;

  // ── Recalculate settlements ───────────────────────────────────────────────
  await recalculateSettlements(doctorIds, month);

  // ── Log import ────────────────────────────────────────────────────────────
  await db.importLog.create({
    data: {
      month,
      filename,
      status: summary.errors.length > 0 ? "PARTIAL" : "SUCCESS",
      rowCounts: JSON.stringify(summary.stored),
      errors: JSON.stringify(summary.errors.slice(0, 50)),
      importedBy,
    },
  });

  return summary;
}
