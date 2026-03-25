// Shared TypeScript types

export type Role = "DOCTOR" | "MAIN_DOCTOR" | "ADMIN" | "ACCOUNTING";
export type DoctorType = "PL" | "GLOBAL";
export type Currency = "PLN" | "EUR" | "GBP";
export type ModelType = "A" | "B" | "C" | "C_OPL" | "D" | "E" | "F";
export type SettlementStatus =
  | "PENDING_DOCTOR"
  | "ACCEPTED_DOCTOR"
  | "INVOICE_UPLOADED"
  | "ACCEPTED"
  | "PAYMENT_SENT";
export type OcrStatus = "PENDING" | "MATCH" | "MISMATCH" | "UNREADABLE";
export type InvoiceStatus = "UPLOADED" | "ACCEPTED" | "REJECTED";

// ─── Billing Model Parameters ────────────────────────────────────────────────

export interface ModelAParams {
  rate_ended: number;
  rate_ended_night?: number;
  rate_failed: number;
  rate_presc?: number;
  rempe?: number;
  rate_night_shift?: number;
  rate_extra_ended_night?: number;
  rate_extra_failed_night?: number;
}

export interface ModelBParams {
  base_fee: number;
  threshold: number;
  rate_above: number;
  count_failed_as_consultations: boolean;
  rate_presc?: number;
  rxwhizz_rate?: number;
  schedule_condition: boolean;
  required_slot_coverage?: string;
  proration_if_not_met: boolean;
}

export interface ModelCParams extends ModelBParams {
  prescription_rate: number;
  night_included: boolean;
  night_base_fee?: number;
  night_threshold?: number;
  night_rate_above?: number;
}

export interface ModelCOPLParams {
  base_day: number;
  tier1_threshold: number;
  tier1_rate: number;
  tier2_threshold: number;
  tier2_rate: number;
  night_base_fee: number;
  night_threshold: number;
  night_rate_above: number;
  prescription_rate: number;
  schedule_weekdays?: string;
  schedule_weekends?: string;
  proration_if_not_met: boolean;
}

export interface ModelDParams {
  rate_hour: number;
  rate_ended: number;
  rate_failed: number;
  rate_presc?: number;
  has_base_fee: boolean;
  base_fee?: number;
  threshold?: number;
  failed_count_inside_standby_first?: boolean;
}

export interface ModelEParams {
  pool_amount: number;
  rate_per_cons: number;
  client_name?: string;
}

export interface ModelFShift {
  enabled: boolean;
  schedule?: string;
  standby_rate?: number;
  cons_rate?: number;
  standby_in_first_cons?: boolean;
  included_cons?: number;
  fixed_amount?: number;
  required_shifts?: number;
  included_cons_fixed?: number;
}

export interface ModelFParams {
  monthly?: ModelFShift;
  ds1?: ModelFShift;
  ds2?: ModelFShift;
  ds3?: ModelFShift;
  wh?: ModelFShift;
}

export type ModelParams =
  | ModelAParams
  | ModelBParams
  | ModelCParams
  | ModelCOPLParams
  | ModelDParams
  | ModelEParams
  | ModelFParams;

// ─── Billing calculation input data ─────────────────────────────────────────

export interface VisitData {
  ended_day: number;
  ended_night: number;
  failed_day: number;
  failed_night: number;
  ended: number;    // total ended
  failed: number;   // total failed
  prescriptions: number;
  night_shifts: number;
  extra_ended_night: number;
  extra_failed_night: number;
  rxwhizz_count: number;
  extra_hours: number;
  extra_ended: number;
  extra_failed: number;
  hours_with_consultations: number;
  // for standby models
  shift_counts: Record<string, { shifts: number; consultations: number; days_with_cons: number }>;
}

export interface ScheduleProration {
  factor: number;         // 0.0 - 1.0
  days_covered: number;
  total_days: number;
  schedule_met: boolean;
}
