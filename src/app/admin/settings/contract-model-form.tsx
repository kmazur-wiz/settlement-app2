"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ModelType } from "@/lib/types";

type ContractModel = {
  id: string;
  model: string;
  params: string;
} | null;

type Doctor = {
  id: string;
  type: string;
  country: string | null;
  currency: string;
  user: { name: string; email: string };
};

const MODEL_LABELS: Record<string, string> = {
  A: "A — Per konsultacja/recepta (Hiszpania, Czechy)",
  B: "B — Baza + próg",
  C: "C — Baza + tiers + recepty (Czechy)",
  C_OPL: "C/OPL — Czech OPL (dwupoziomowy)",
  D: "D — Dyżur (Portugalia)",
  E: "E — Pool grupowy (Serbia)",
  F: "F — Austria dyżur",
};

function NumInput({
  label,
  name,
  value,
  onChange,
  step = "0.01",
}: {
  label: string;
  name: string;
  value: number | string;
  onChange: (val: number) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function CheckInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded"
      />
      {label}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function ModelAForm({ params, onChange }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  const p = params as Record<string, number>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <NumInput label="Stawka zakończona (dzień)" name="rate_ended" value={p.rate_ended ?? 0} onChange={(v) => onChange({ ...p, rate_ended: v })} />
      <NumInput label="Stawka zakończona (noc)" name="rate_ended_night" value={p.rate_ended_night ?? 0} onChange={(v) => onChange({ ...p, rate_ended_night: v })} />
      <NumInput label="Stawka nieudana" name="rate_failed" value={p.rate_failed ?? 0} onChange={(v) => onChange({ ...p, rate_failed: v })} />
      <NumInput label="Stawka recepta" name="rate_presc" value={p.rate_presc ?? 0} onChange={(v) => onChange({ ...p, rate_presc: v })} />
      <NumInput label="REMPE" name="rempe" value={p.rempe ?? 0} onChange={(v) => onChange({ ...p, rempe: v })} />
      <NumInput label="Stawka dyżur nocny" name="rate_night_shift" value={p.rate_night_shift ?? 0} onChange={(v) => onChange({ ...p, rate_night_shift: v })} />
      <NumInput label="Extra zakończona noc" name="rate_extra_ended_night" value={p.rate_extra_ended_night ?? 0} onChange={(v) => onChange({ ...p, rate_extra_ended_night: v })} />
      <NumInput label="Extra nieudana noc" name="rate_extra_failed_night" value={p.rate_extra_failed_night ?? 0} onChange={(v) => onChange({ ...p, rate_extra_failed_night: v })} />
    </div>
  );
}

function ModelBForm({ params, onChange }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NumInput label="Baza" name="base_fee" value={(params.base_fee as number) ?? 0} onChange={(v) => onChange({ ...params, base_fee: v })} />
        <NumInput label="Próg konsultacji" name="threshold" value={(params.threshold as number) ?? 0} step="1" onChange={(v) => onChange({ ...params, threshold: v })} />
        <NumInput label="Stawka powyżej progu" name="rate_above" value={(params.rate_above as number) ?? 0} onChange={(v) => onChange({ ...params, rate_above: v })} />
        <NumInput label="Stawka recepta" name="rate_presc" value={(params.rate_presc as number) ?? 0} onChange={(v) => onChange({ ...params, rate_presc: v })} />
        <NumInput label="Rxwhizz stawka" name="rxwhizz_rate" value={(params.rxwhizz_rate as number) ?? 0} onChange={(v) => onChange({ ...params, rxwhizz_rate: v })} />
      </div>
      <div className="flex flex-wrap gap-4">
        <CheckInput label="Nieudane = konsultacje" checked={!!(params.count_failed_as_consultations)} onChange={(v) => onChange({ ...params, count_failed_as_consultations: v })} />
        <CheckInput label="Warunek grafiku" checked={!!(params.schedule_condition)} onChange={(v) => onChange({ ...params, schedule_condition: v })} />
        <CheckInput label="Prorate jeśli nie spełniony" checked={!!(params.proration_if_not_met)} onChange={(v) => onChange({ ...params, proration_if_not_met: v })} />
      </div>
      <TextInput label="Wymagane pokrycie grafiku (np. Mon-Fri 08:00-16:00)" value={(params.required_slot_coverage as string) ?? ""} onChange={(v) => onChange({ ...params, required_slot_coverage: v })} />
    </div>
  );
}

function ModelCForm({ params, onChange }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <ModelBForm params={params} onChange={onChange} />
      <div className="border-t pt-3">
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Noc</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumInput label="Stawka recepta" name="prescription_rate" value={(params.prescription_rate as number) ?? 0} onChange={(v) => onChange({ ...params, prescription_rate: v })} />
          <NumInput label="Baza nocna" name="night_base_fee" value={(params.night_base_fee as number) ?? 0} onChange={(v) => onChange({ ...params, night_base_fee: v })} />
          <NumInput label="Próg nocny" name="night_threshold" value={(params.night_threshold as number) ?? 0} step="1" onChange={(v) => onChange({ ...params, night_threshold: v })} />
          <NumInput label="Stawka nocna powyżej progu" name="night_rate_above" value={(params.night_rate_above as number) ?? 0} onChange={(v) => onChange({ ...params, night_rate_above: v })} />
        </div>
        <div className="mt-2">
          <CheckInput label="Uwzględnij noc" checked={!!(params.night_included)} onChange={(v) => onChange({ ...params, night_included: v })} />
        </div>
      </div>
    </div>
  );
}

function ModelCOPLForm({ params, onChange }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dzień</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NumInput label="Baza dzienna" name="base_day" value={(params.base_day as number) ?? 0} onChange={(v) => onChange({ ...params, base_day: v })} />
        <NumInput label="Próg tier 1" name="tier1_threshold" value={(params.tier1_threshold as number) ?? 0} step="1" onChange={(v) => onChange({ ...params, tier1_threshold: v })} />
        <NumInput label="Stawka tier 1" name="tier1_rate" value={(params.tier1_rate as number) ?? 0} onChange={(v) => onChange({ ...params, tier1_rate: v })} />
        <NumInput label="Próg tier 2" name="tier2_threshold" value={(params.tier2_threshold as number) ?? 0} step="1" onChange={(v) => onChange({ ...params, tier2_threshold: v })} />
        <NumInput label="Stawka tier 2" name="tier2_rate" value={(params.tier2_rate as number) ?? 0} onChange={(v) => onChange({ ...params, tier2_rate: v })} />
      </div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-2">Noc</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <NumInput label="Baza nocna" name="night_base_fee" value={(params.night_base_fee as number) ?? 0} onChange={(v) => onChange({ ...params, night_base_fee: v })} />
        <NumInput label="Próg nocny" name="night_threshold" value={(params.night_threshold as number) ?? 0} step="1" onChange={(v) => onChange({ ...params, night_threshold: v })} />
        <NumInput label="Stawka nocna powyżej" name="night_rate_above" value={(params.night_rate_above as number) ?? 0} onChange={(v) => onChange({ ...params, night_rate_above: v })} />
        <NumInput label="Stawka recepta" name="prescription_rate" value={(params.prescription_rate as number) ?? 0} onChange={(v) => onChange({ ...params, prescription_rate: v })} />
      </div>
      <CheckInput label="Prorate jeśli nie spełniony" checked={!!(params.proration_if_not_met)} onChange={(v) => onChange({ ...params, proration_if_not_met: v })} />
    </div>
  );
}

function ModelDForm({ params, onChange }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NumInput label="Stawka za godzinę" name="rate_hour" value={(params.rate_hour as number) ?? 0} onChange={(v) => onChange({ ...params, rate_hour: v })} />
        <NumInput label="Stawka zakończona" name="rate_ended" value={(params.rate_ended as number) ?? 0} onChange={(v) => onChange({ ...params, rate_ended: v })} />
        <NumInput label="Stawka nieudana" name="rate_failed" value={(params.rate_failed as number) ?? 0} onChange={(v) => onChange({ ...params, rate_failed: v })} />
        <NumInput label="Stawka recepta" name="rate_presc" value={(params.rate_presc as number) ?? 0} onChange={(v) => onChange({ ...params, rate_presc: v })} />
      </div>
      <div className="flex items-center gap-4">
        <CheckInput label="Baza" checked={!!(params.has_base_fee)} onChange={(v) => onChange({ ...params, has_base_fee: v })} />
      </div>
      {!!(params.has_base_fee) && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NumInput label="Kwota bazy" name="base_fee" value={(params.base_fee as number) ?? 0} onChange={(v) => onChange({ ...params, base_fee: v })} />
          <NumInput label="Próg" name="threshold" value={(params.threshold as number) ?? 0} step="1" onChange={(v) => onChange({ ...params, threshold: v })} />
        </div>
      )}
    </div>
  );
}

function ModelEForm({ params, onChange }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <NumInput label="Pool (łączna kwota)" name="pool_amount" value={(params.pool_amount as number) ?? 0} onChange={(v) => onChange({ ...params, pool_amount: v })} />
        <NumInput label="Stawka za konsultację" name="rate_per_cons" value={(params.rate_per_cons as number) ?? 0} onChange={(v) => onChange({ ...params, rate_per_cons: v })} />
        <TextInput label="Nazwa klienta" value={(params.client_name as string) ?? ""} onChange={(v) => onChange({ ...params, client_name: v })} />
      </div>
    </div>
  );
}

function ShiftBlock({
  label,
  shift,
  onChange,
  hasDeduction = false,
  isMonthly = false,
}: {
  label: string;
  shift: Record<string, unknown>;
  onChange: (s: Record<string, unknown>) => void;
  hasDeduction?: boolean;
  isMonthly?: boolean;
}) {
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={!!(shift.enabled)} onChange={(e) => onChange({ ...shift, enabled: e.target.checked })} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      {!!(shift.enabled) && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {!isMonthly && (
            <>
              <NumInput label="Stawka dyżur" name="standby_rate" value={(shift.standby_rate as number) ?? 0} onChange={(v) => onChange({ ...shift, standby_rate: v })} />
              <NumInput label="Stawka konsultacja" name="cons_rate" value={(shift.cons_rate as number) ?? 0} onChange={(v) => onChange({ ...shift, cons_rate: v })} />
              {!hasDeduction && (
                <NumInput label="Wliczone konsultacje" name="included_cons" value={(shift.included_cons as number) ?? 1} step="1" onChange={(v) => onChange({ ...shift, included_cons: v })} />
              )}
              <TextInput label="Harmonogram (np. 07:00-12:00)" value={(shift.schedule as string) ?? ""} onChange={(v) => onChange({ ...shift, schedule: v })} />
            </>
          )}
          {isMonthly && (
            <>
              <NumInput label="Kwota stała" name="fixed_amount" value={(shift.fixed_amount as number) ?? 0} onChange={(v) => onChange({ ...shift, fixed_amount: v })} />
              <NumInput label="Wymagane dyżury" name="required_shifts" value={(shift.required_shifts as number) ?? 0} step="1" onChange={(v) => onChange({ ...shift, required_shifts: v })} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ModelFForm({ params, onChange }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  const get = (key: string) => ((params[key] as Record<string, unknown>) ?? { enabled: false });
  const set = (key: string, val: Record<string, unknown>) => onChange({ ...params, [key]: val });

  return (
    <div className="space-y-3">
      <ShiftBlock label="Daily Standby 1 (DS1) — dedukcja" shift={get("ds1")} onChange={(v) => set("ds1", v)} hasDeduction />
      <ShiftBlock label="Daily Standby 2 (DS2) — dedukcja" shift={get("ds2")} onChange={(v) => set("ds2", v)} hasDeduction />
      <ShiftBlock label="Daily Standby 3 (DS3) — bez dedukcji" shift={get("ds3")} onChange={(v) => set("ds3", v)} />
      <ShiftBlock label="Weekend/Holiday (WH)" shift={get("wh")} onChange={(v) => set("wh", v)} />
      <ShiftBlock label="Monthly Standby" shift={get("monthly")} onChange={(v) => set("monthly", v)} isMonthly />
    </div>
  );
}

export function ContractModelForm({
  doctor,
  contractModel,
}: {
  doctor: Doctor;
  contractModel: ContractModel;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<ModelType>((contractModel?.model as ModelType) ?? "A");
  const [params, setParams] = useState<Record<string, unknown>>(
    contractModel?.params ? JSON.parse(contractModel.params) : {}
  );

  function handleModelChange(newModel: ModelType) {
    setModel(newModel);
    setParams({});
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctor.id, model, params }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Zapisano model kontraktu");
      router.refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model rozliczeniowy</label>
          <select
            value={model}
            onChange={(e) => handleModelChange(e.target.value as ModelType)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          >
            {Object.entries(MODEL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        {model === "A" && <ModelAForm params={params} onChange={setParams} />}
        {model === "B" && <ModelBForm params={params} onChange={setParams} />}
        {model === "C" && <ModelCForm params={params} onChange={setParams} />}
        {model === "C_OPL" && <ModelCOPLForm params={params} onChange={setParams} />}
        {model === "D" && <ModelDForm params={params} onChange={setParams} />}
        {model === "E" && <ModelEForm params={params} onChange={setParams} />}
        {model === "F" && <ModelFForm params={params} onChange={setParams} />}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Zapisywanie..." : "Zapisz model"}
        </button>
      </div>
    </div>
  );
}
