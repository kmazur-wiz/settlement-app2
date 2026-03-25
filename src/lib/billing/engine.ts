import type {
  ModelType,
  ModelAParams,
  ModelBParams,
  ModelCParams,
  ModelCOPLParams,
  ModelDParams,
  ModelEParams,
  ModelFParams,
  VisitData,
  ScheduleProration,
} from "@/lib/types";

export interface BillingResult {
  total: number;
  breakdown: Record<string, number>;
  // Model E extras
  invoice_to_client?: number;
  invoice_to_telemedi?: number;
}

// ─── Model A — Per consultation / prescription ───────────────────────────────
export function calculateModelA(params: ModelAParams, data: VisitData): BillingResult {
  const ended_day = data.ended_day * params.rate_ended;
  const ended_night = data.ended_night * (params.rate_ended_night ?? params.rate_ended);
  const failed = data.failed * params.rate_failed;
  const presc = data.prescriptions * (params.rate_presc ?? 0);
  const night_shifts = data.night_shifts * (params.rate_night_shift ?? 0);
  const extra_ended_night = data.extra_ended_night * (params.rate_extra_ended_night ?? 0);
  const extra_failed_night = data.extra_failed_night * (params.rate_extra_failed_night ?? 0);
  const rempe = params.rempe ?? 0;

  const total = ended_day + ended_night + failed + presc + night_shifts + extra_ended_night + extra_failed_night + rempe;
  return {
    total,
    breakdown: { ended_day, ended_night, failed, presc, night_shifts, extra_ended_night, extra_failed_night, rempe },
  };
}

// ─── Model B — Base fee + threshold ──────────────────────────────────────────
export function calculateModelB(
  params: ModelBParams,
  data: VisitData,
  proration: ScheduleProration
): BillingResult {
  const base = params.proration_if_not_met
    ? params.base_fee * proration.factor
    : params.base_fee;

  const consultations = params.count_failed_as_consultations
    ? data.ended + data.failed
    : data.ended;

  const above_threshold = Math.max(0, consultations - params.threshold) * params.rate_above;
  const presc = data.prescriptions * (params.rate_presc ?? 0);
  const rxwhizz = data.rxwhizz_count * (params.rxwhizz_rate ?? 0);

  const total = base + above_threshold + presc + rxwhizz;
  return {
    total,
    breakdown: { base, above_threshold, presc, rxwhizz },
  };
}

// ─── Model C — Base fee + tiered + prescriptions ─────────────────────────────
export function calculateModelC(
  params: ModelCParams,
  data: VisitData,
  proration: ScheduleProration
): BillingResult {
  const bResult = calculateModelB(params, data, proration);
  const prescription_fee = data.prescriptions * (params.prescription_rate ?? 0);

  let night_base = 0;
  let night_above = 0;
  if (params.night_included && params.night_base_fee != null) {
    const night_threshold = params.night_threshold ?? 0;
    const night_rate = params.night_rate_above ?? 0;
    if (data.ended_night <= night_threshold) {
      night_base = params.night_base_fee;
    } else {
      night_base = params.night_base_fee;
      night_above = (data.ended_night - night_threshold) * night_rate;
    }
  }

  const total = bResult.total + prescription_fee + night_base + night_above;
  return {
    total,
    breakdown: { ...bResult.breakdown, prescription_fee, night_base, night_above },
  };
}

// ─── Model C/OPL — Czech OPL tiered ──────────────────────────────────────────
export function calculateModelCOPL(
  params: ModelCOPLParams,
  data: VisitData,
  proration: ScheduleProration
): BillingResult {
  const cons_day = data.ended_day + (data.failed_day ?? 0);

  let day_raw: number;
  if (cons_day <= params.tier1_threshold) {
    day_raw = params.base_day;
  } else if (cons_day <= params.tier2_threshold) {
    day_raw = params.base_day + (cons_day - params.tier1_threshold) * params.tier1_rate;
  } else {
    day_raw =
      params.base_day +
      (params.tier2_threshold - params.tier1_threshold) * params.tier1_rate +
      (cons_day - params.tier2_threshold) * params.tier2_rate;
  }
  const day_total = day_raw * proration.factor;

  const cons_night = data.ended_night;
  let night_raw: number;
  if (cons_night <= params.night_threshold) {
    night_raw = params.night_base_fee;
  } else {
    night_raw = params.night_base_fee + (cons_night - params.night_threshold) * params.night_rate_above;
  }
  const night_total = night_raw * proration.factor;

  const presc_total = data.prescriptions * params.prescription_rate;
  const total = day_total + night_total + presc_total;

  return {
    total,
    breakdown: { day_total, night_total, presc_total, proration_factor: proration.factor },
  };
}

// ─── Model D — Standby (Portugal) ────────────────────────────────────────────
export function calculateModelD(params: ModelDParams, data: VisitData): BillingResult {
  const presc = data.prescriptions * (params.rate_presc ?? 0);

  if (!params.has_base_fee) {
    // Andreia / Juliano: simple standby
    const standby = data.extra_hours * params.rate_hour;
    const cons_ended = data.extra_ended * params.rate_ended;
    const cons_failed = data.extra_failed * params.rate_failed;
    const deduction = data.hours_with_consultations * params.rate_hour;
    const total = standby + cons_ended + cons_failed - deduction + presc;
    return {
      total,
      breakdown: { standby, cons_ended, cons_failed, deduction: -deduction, presc },
    };
  }

  // Jorge / Maria / Nádia / Sarah: with base fee
  const threshold = params.threshold ?? 0;
  const cons_total = data.ended + data.failed;

  let base_part: number;
  if (cons_total <= threshold) {
    base_part = params.base_fee ?? 0;
  } else {
    const ended_above = Math.max(0, data.ended - threshold);
    const failed_above = Math.max(0, data.failed - Math.max(0, threshold - data.ended));
    base_part =
      (params.base_fee ?? 0) +
      ended_above * params.rate_ended +
      failed_above * params.rate_failed;
  }

  const standby = data.extra_hours * params.rate_hour;
  const extra_cons_ended = data.extra_ended * params.rate_ended;
  const extra_cons_failed = data.extra_failed * params.rate_failed;
  const deduction = data.hours_with_consultations * params.rate_hour;
  const standby_part = standby + extra_cons_ended + extra_cons_failed - deduction;

  const total = base_part + standby_part + presc;
  return {
    total,
    breakdown: { base_part, standby_part, presc, deduction: -deduction },
  };
}

// ─── Model E — Group pool (Serbia) ───────────────────────────────────────────
export function calculateModelE(params: ModelEParams, totalGroupEnded: number): BillingResult {
  const invoice_to_client = totalGroupEnded * params.rate_per_cons;
  const invoice_to_telemedi = params.pool_amount - invoice_to_client;
  return {
    total: params.pool_amount,
    breakdown: { pool_amount: params.pool_amount, invoice_to_client, invoice_to_telemedi },
    invoice_to_client,
    invoice_to_telemedi,
  };
}

// ─── Model F — Austria standby ───────────────────────────────────────────────
export function calculateModelF(params: ModelFParams, data: VisitData): BillingResult {
  let total = 0;
  const breakdown: Record<string, number> = {};

  // DS1 (standby_in_first_cons = true → deduct 1 standby_rate per day with cons)
  if (params.ds1?.enabled) {
    const p = params.ds1;
    const s = data.shift_counts["DS1"] ?? { shifts: 0, consultations: 0, days_with_cons: 0 };
    const t = (s.shifts * (p.standby_rate ?? 0)) + (s.consultations * (p.cons_rate ?? 0)) - (s.days_with_cons * (p.standby_rate ?? 0));
    breakdown.ds1 = t;
    total += t;
  }

  // DS2 (same formula as DS1)
  if (params.ds2?.enabled) {
    const p = params.ds2;
    const s = data.shift_counts["DS2"] ?? { shifts: 0, consultations: 0, days_with_cons: 0 };
    const t = (s.shifts * (p.standby_rate ?? 0)) + (s.consultations * (p.cons_rate ?? 0)) - (s.days_with_cons * (p.standby_rate ?? 0));
    breakdown.ds2 = t;
    total += t;
  }

  // DS3 (NO standby deduction)
  if (params.ds3?.enabled) {
    const p = params.ds3;
    const s = data.shift_counts["DS3"] ?? { shifts: 0, consultations: 0, days_with_cons: 0 };
    const t = (s.shifts * (p.standby_rate ?? 0)) + (s.consultations * (p.cons_rate ?? 0));
    breakdown.ds3 = t;
    total += t;
  }

  // Weekend/Holiday (same as DS1)
  if (params.wh?.enabled) {
    const p = params.wh;
    const s = data.shift_counts["WH"] ?? { shifts: 0, consultations: 0, days_with_cons: 0 };
    const included = p.included_cons ?? 1;
    const extra_cons = Math.max(0, s.consultations - included * s.shifts);
    const t = (s.shifts * (p.standby_rate ?? 0)) + (extra_cons * (p.cons_rate ?? 0));
    breakdown.wh = t;
    total += t;
  }

  // Monthly standby
  if (params.monthly?.enabled) {
    const p = params.monthly;
    const actual = data.shift_counts["MONTHLY"]?.shifts ?? 0;
    const required = p.required_shifts ?? 0;
    const monthly_t = required > 0
      ? (actual / required) * (p.fixed_amount ?? 0)
      : (p.fixed_amount ?? 0);
    breakdown.monthly = monthly_t;
    total += monthly_t;
  }

  return { total, breakdown };
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────
export function calculate(
  model: ModelType,
  params: unknown,
  data: VisitData,
  proration: ScheduleProration,
  totalGroupEnded?: number
): BillingResult {
  switch (model) {
    case "A":
      return calculateModelA(params as ModelAParams, data);
    case "B":
      return calculateModelB(params as ModelBParams, data, proration);
    case "C":
      return calculateModelC(params as ModelCParams, data, proration);
    case "C_OPL":
      return calculateModelCOPL(params as ModelCOPLParams, data, proration);
    case "D":
      return calculateModelD(params as ModelDParams, data);
    case "E":
      return calculateModelE(params as ModelEParams, totalGroupEnded ?? 0);
    case "F":
      return calculateModelF(params as ModelFParams, data);
    default:
      return { total: 0, breakdown: {} };
  }
}
