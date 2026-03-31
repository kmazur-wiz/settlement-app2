/**
 * XLSX import pipeline.
 * Parses the 7-sheet workbook and returns structured data for DB insertion.
 */

import * as XLSX from "xlsx";
import { parseISO, parse as dateParse, isValid } from "date-fns";

export interface ParseError {
  sheet: string;
  row?: number;
  message: string;
}

export interface ParsedVisitPL {
  email: string;
  doctorId: string;
  month: string;
  visitDate: Date;
  startDate?: Date;
  endDate?: Date;
  specialization?: string;
  visitType?: string;
  bu?: string;
  clinic?: string;
  patient?: string;
  language?: string;
  noShow: boolean;
  directBooking: boolean;
  delayMinutes: number;
  hasPenalty: boolean;
  penaltyAmount: number;
  baseRate?: number;
}

export interface ParsedSlot {
  email: string;
  doctorId: string;
  month: string;
  externalId: string;
  createdAt: Date;
  startAt: Date;
  endAt: Date;
  visitDate?: Date;
  source: "PL" | "GLOBAL";
  country?: string;
}

export interface ParsedPrescription {
  email: string;
  doctorId: string;
  month: string;
  count: number;
  source: "PL" | "GLOBAL";
  country?: string;
}

export interface ParsedRating {
  email: string;
  doctorId: string;
  month: string;
  specialization?: string;
  avgRating: number;
}

export interface ParsedVisitGlobal {
  email: string;
  doctorId: string;
  month: string;
  country: string;
  visitDate: Date;
  visitStatus: string;
  dayType?: string;
  language?: string;
}

export interface ParseResult {
  visitsPL: ParsedVisitPL[];
  slotsPL: ParsedSlot[];
  prescriptionsPL: ParsedPrescription[];
  ratings: ParsedRating[];
  visitsGlobal: ParsedVisitGlobal[];
  slotsGlobal: ParsedSlot[];
  prescriptionsGlobal: ParsedPrescription[];
  errors: ParseError[];
  rowCounts: Record<string, number>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s/[\]()]+/g, "_").replace(/_+/g, "_").replace(/_$/, "");
}

function toDate(val: unknown): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isValid(val) ? val : undefined;
  if (typeof val === "number") {
    // Excel serial number
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d, d.H ?? 0, d.M ?? 0, d.S ?? 0);
  }
  if (typeof val === "string") {
    const formats = ["yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm", "yyyy-MM-dd", "dd.MM.yyyy"];
    for (const fmt of formats) {
      try {
        const d = dateParse(val, fmt, new Date());
        if (isValid(d)) return d;
      } catch { /* ignore */ }
    }
    const iso = parseISO(val);
    if (isValid(iso)) return iso;
  }
  return undefined;
}

function toBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  const s = String(val ?? "").toLowerCase().trim();
  return s === "tak" || s === "yes" || s === "true" || s === "1";
}

function toNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function toString(val: unknown): string {
  return val != null ? String(val).trim() : "";
}

function sheetToRows(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
  // Normalize headers
  return rows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[normalizeHeader(k)] = v;
    }
    return normalized;
  });
}

function getRequiredFields(row: Record<string, unknown>, fields: string[]): string[] {
  return fields.filter((f) => !row[f] && row[f] !== 0);
}

// ─── Sheet parsers ────────────────────────────────────────────────────────────

function parseVisitsPL(sheet: XLSX.WorkSheet, errors: ParseError[]): ParsedVisitPL[] {
  const rows = sheetToRows(sheet);
  const results: ParsedVisitPL[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const missing = getRequiredFields(row, ["email_lekarza", "id_lekarza", "miesiąc_rozliczenia"]);
    if (missing.length) {
      errors.push({ sheet: "1_Wizyty_PL", row: i + 2, message: `Missing required: ${missing.join(", ")}` });
      continue;
    }

    const visitDate = toDate(row["data_wizyty"]);
    if (!visitDate) {
      errors.push({ sheet: "1_Wizyty_PL", row: i + 2, message: "Invalid data_wizyty" });
      continue;
    }

    results.push({
      email: toString(row["email_lekarza"]).toLowerCase(),
      doctorId: toString(row["id_lekarza"]),
      month: toString(row["miesiąc_rozliczenia"]),
      visitDate,
      startDate: toDate(row["data_rozpoczęcia_wizyty"]),
      endDate: toDate(row["data_zamknięcia_wizyty"]),
      specialization: toString(row["specjalizacja"]) || undefined,
      visitType: toString(row["rodzaj"]) || undefined,
      bu: toString(row["bu"]) || undefined,
      clinic: toString(row["klinika"]) || undefined,
      patient: toString(row["pacjent"]) || undefined,
      language: toString(row["język_wizyty"]) || undefined,
      noShow: toBool(row["pacjent_nie_zgłosił_się"]),
      directBooking: toBool(row["umówienie_bezpośrednie"]),
      delayMinutes: toNum(row["opóźnienie_min."]),
      hasPenalty: toBool(row["kara"]),
      penaltyAmount: toNum(row["kwota_kary"]),
      baseRate: toNum(row["stawka_pln"]) || undefined,
    });
  }
  return results;
}

function parseSlots(sheet: XLSX.WorkSheet, source: "PL" | "GLOBAL", errors: ParseError[]): ParsedSlot[] {
  const rows = sheetToRows(sheet);
  const results: ParsedSlot[] = [];
  const sheetName = source === "PL" ? "2_Sloty_PL" : "6_Sloty_GLOBAL";

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const missing = getRequiredFields(row, ["email_lekarza", "id_lekarza", "miesiąc_rozliczenia"]);
    if (missing.length) {
      errors.push({ sheet: sheetName, row: i + 2, message: `Missing required: ${missing.join(", ")}` });
      continue;
    }

    const startAt = toDate(row["data_godzina_startu_slotu"] ?? row["data/godzina_startu_slotu"]);
    const endAt = toDate(row["data_godzina_końca_slotu"] ?? row["data/godzina_końca_slotu"]);
    const createdAt = toDate(row["data_godzina_utworzenia_slotu"] ?? row["data/godzina_utworzenia_slotu"]) ?? startAt;

    if (!startAt || !endAt || !createdAt) {
      errors.push({ sheet: sheetName, row: i + 2, message: "Invalid slot datetime" });
      continue;
    }

    results.push({
      email: toString(row["email_lekarza"]).toLowerCase(),
      doctorId: toString(row["id_lekarza"]),
      month: toString(row["miesiąc_rozliczenia"]),
      externalId: toString(row["id_slotu"]) || `${source}-${i}`,
      createdAt,
      startAt,
      endAt,
      visitDate: toDate(row["data_wizyty"]),
      source,
      country: toString(row["kraj_lekarza"]) || undefined,
    });
  }
  return results;
}

function parsePrescriptions(
  sheet: XLSX.WorkSheet,
  source: "PL" | "GLOBAL",
  errors: ParseError[]
): ParsedPrescription[] {
  const rows = sheetToRows(sheet);
  const results: ParsedPrescription[] = [];
  const sheetName = source === "PL" ? "3_Recepty_PL" : "7_Recepty_GLOBAL";

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const missing = getRequiredFields(row, ["email_lekarza", "id_lekarza", "miesiąc_rozliczenia"]);
    if (missing.length) {
      errors.push({ sheet: sheetName, row: i + 2, message: `Missing required: ${missing.join(", ")}` });
      continue;
    }
    results.push({
      email: toString(row["email_lekarza"]).toLowerCase(),
      doctorId: toString(row["id_lekarza"]),
      month: toString(row["miesiąc_rozliczenia"]),
      count: toNum(row["liczba_recept"]),
      source,
      country: toString(row["kraj_lekarza"]) || undefined,
    });
  }
  return results;
}

function parseRatings(sheet: XLSX.WorkSheet, errors: ParseError[]): ParsedRating[] {
  const rows = sheetToRows(sheet);
  const results: ParsedRating[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const missing = getRequiredFields(row, ["email_lekarza", "id_lekarza", "miesiąc_rozliczenia"]);
    if (missing.length) {
      errors.push({ sheet: "4_Oceny", row: i + 2, message: `Missing required: ${missing.join(", ")}` });
      continue;
    }
    results.push({
      email: toString(row["email_lekarza"]).toLowerCase(),
      doctorId: toString(row["id_lekarza"]),
      month: toString(row["miesiąc_rozliczenia"]),
      specialization: toString(row["specjalizacja"]) || undefined,
      avgRating: toNum(row["średnia_ocen"]),
    });
  }
  return results;
}

function parseVisitsGlobal(sheet: XLSX.WorkSheet, errors: ParseError[]): ParsedVisitGlobal[] {
  const rows = sheetToRows(sheet);
  const results: ParsedVisitGlobal[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const missing = getRequiredFields(row, ["email_lekarza", "id_lekarza", "miesiąc_rozliczenia"]);
    if (missing.length) {
      errors.push({ sheet: "5_Wizyty_GLOBAL", row: i + 2, message: `Missing required: ${missing.join(", ")}` });
      continue;
    }
    const visitDate = toDate(row["data_wizyty"]);
    if (!visitDate) {
      errors.push({ sheet: "5_Wizyty_GLOBAL", row: i + 2, message: "Invalid data_wizyty" });
      continue;
    }
    results.push({
      email: toString(row["email_lekarza"]).toLowerCase(),
      doctorId: toString(row["id_lekarza"]),
      month: toString(row["miesiąc_rozliczenia"]),
      country: toString(row["kraj_lekarza"]),
      visitDate,
      visitStatus: toString(row["status_wizyty"]) || "ended",
      dayType: toString(row["typ_dnia"]) || undefined,
      language: toString(row["język_wizyty"]) || undefined,
    });
  }
  return results;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function parseWorkbook(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const errors: ParseError[] = [];

  const findSheet = (names: string[]): XLSX.WorkSheet | null => {
    for (const name of workbook.SheetNames) {
      if (names.some((n) => name.toLowerCase().includes(n.toLowerCase()))) {
        return workbook.Sheets[name];
      }
    }
    return null;
  };

  const s1 = findSheet(["wizyty_pl", "1_wizyty"]);
  const s2 = findSheet(["sloty_pl", "2_sloty"]);
  const s3 = findSheet(["recepty_pl", "3_recepty"]);
  const s4 = findSheet(["oceny", "4_oceny"]);
  const s5 = findSheet(["wizyty_global", "5_wizyty"]);
  const s6 = findSheet(["sloty_global", "6_sloty", "dyżury"]);
  const s7 = findSheet(["recepty_global", "7_recepty"]);

  const visitsPL = s1 ? parseVisitsPL(s1, errors) : [];
  const slotsPL = s2 ? parseSlots(s2, "PL", errors) : [];
  const prescriptionsPL = s3 ? parsePrescriptions(s3, "PL", errors) : [];
  const ratings = s4 ? parseRatings(s4, errors) : [];
  const visitsGlobal = s5 ? parseVisitsGlobal(s5, errors) : [];
  const slotsGlobal = s6 ? parseSlots(s6, "GLOBAL", errors) : [];
  const prescriptionsGlobal = s7 ? parsePrescriptions(s7, "GLOBAL", errors) : [];

  return {
    visitsPL,
    slotsPL,
    prescriptionsPL,
    ratings,
    visitsGlobal,
    slotsGlobal,
    prescriptionsGlobal,
    errors,
    rowCounts: {
      visitsPL: visitsPL.length,
      slotsPL: slotsPL.length,
      prescriptionsPL: prescriptionsPL.length,
      ratings: ratings.length,
      visitsGlobal: visitsGlobal.length,
      slotsGlobal: slotsGlobal.length,
      prescriptionsGlobal: prescriptionsGlobal.length,
    },
  };
}
