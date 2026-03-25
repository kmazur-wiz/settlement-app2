import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "PLN"): string {
  const locale = currency === "PLN" ? "pl-PL" : "en-GB";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMonth(month: string): string {
  // "2026-01" -> "January 2026" or "styczeń 2026"
  try {
    const d = parse(month, "yyyy-MM", new Date());
    return format(d, "MMMM yyyy");
  } catch {
    return month;
  }
}

export function currentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export function prevMonth(month: string): string {
  const d = parse(month, "yyyy-MM", new Date());
  d.setMonth(d.getMonth() - 1);
  return format(d, "yyyy-MM");
}

export const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_DOCTOR: "Czeka na akceptację",
  ACCEPTED_DOCTOR: "Zaakceptowane przez lekarza",
  INVOICE_UPLOADED: "Faktura wysłana",
  ACCEPTED: "Zaakceptowane",
  PAYMENT_SENT: "Przelew wysłany",
};

export const SETTLEMENT_STATUS_COLORS: Record<string, string> = {
  PENDING_DOCTOR: "bg-blue-100 text-blue-800",
  ACCEPTED_DOCTOR: "bg-indigo-100 text-indigo-800",
  INVOICE_UPLOADED: "bg-orange-100 text-orange-800",
  ACCEPTED: "bg-purple-100 text-purple-800",
  PAYMENT_SENT: "bg-pink-100 text-pink-800",
};

export const SETTLEMENT_STATUS_CHART_COLORS: Record<string, string> = {
  PENDING_DOCTOR: "#3b82f6",
  ACCEPTED_DOCTOR: "#6366f1",
  INVOICE_UPLOADED: "#f97316",
  ACCEPTED: "#a855f7",
  PAYMENT_SENT: "#ec4899",
};

export const ROLE_LABELS: Record<string, string> = {
  DOCTOR: "Lekarz",
  MAIN_DOCTOR: "Główny Lekarz",
  ADMIN: "Admin",
  ACCOUNTING: "Księgowość",
};

export const MODEL_LABELS: Record<string, string> = {
  A: "Model A — Per consultation",
  B: "Model B — Base fee + threshold",
  C: "Model C — Base fee + tiered",
  C_OPL: "Model C/G — Czech OPL",
  D: "Model D — Standby (Portugal)",
  E: "Model E — Group pool (Serbia)",
  F: "Model F — Austria standby",
};

export const OCR_STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje",
  MATCH: "Kwota zgodna",
  MISMATCH: "Kwota się różni",
  UNREADABLE: "Nie odczytano",
};

export const OCR_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  MATCH: "bg-green-100 text-green-800",
  MISMATCH: "bg-red-100 text-red-800",
  UNREADABLE: "bg-yellow-100 text-yellow-800",
};

export function parseAmounts(json: string): Record<string, number> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}
