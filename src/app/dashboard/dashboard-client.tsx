"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import {
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_CHART_COLORS,
  SETTLEMENT_STATUS_COLORS,
  formatCurrency,
  formatMonth,
} from "@/lib/utils";

const STATUSES = ["PENDING_DOCTOR", "ACCEPTED_DOCTOR", "INVOICE_UPLOADED", "ACCEPTED", "PAYMENT_SENT"];

export interface SettlementRow {
  id: string;
  doctorName: string;
  doctorEmail: string;
  doctorType: string;
  month: string;
  status: string;
  totalLocal: number;
  currency: string;
  totalPln: number;
}

type Period = "3m" | "6m" | "12m" | "custom";

function sliceMonths(allMonths: string[], period: Period, customSet: Set<string>): string[] {
  if (period === "custom") return allMonths.filter((m) => customSet.has(m));
  const n = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  return allMonths.slice(0, n);
}

export function DashboardClient({
  settlements,
  allMonths,
}: {
  settlements: SettlementRow[];
  allMonths: string[];
}) {
  const [period, setPeriod] = useState<Period>("12m");
  const [customMonths, setCustomMonths] = useState<Set<string>>(new Set(allMonths.slice(0, 3)));
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const visibleMonths = useMemo(
    () => sliceMonths(allMonths, period, customMonths),
    [allMonths, period, customMonths]
  );

  const chartData = useMemo(() =>
    [...visibleMonths].reverse().map((month) => {
      const ms = settlements.filter((s) => s.month === month);
      const entry: Record<string, unknown> = { month };
      for (const st of STATUSES) entry[st] = ms.filter((s) => s.status === st).length;
      return entry;
    }),
    [visibleMonths, settlements]
  );

  const tableRows = useMemo(() => {
    return settlements.filter((s) => {
      if (filterMonth && s.month !== filterMonth) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      if (!filterMonth && !filterStatus && !visibleMonths.includes(s.month)) return false;
      return true;
    });
  }, [settlements, filterMonth, filterStatus, visibleMonths]);

  function handleBarClick(data: Record<string, unknown>, statusKey: string) {
    const month = data.month as string;
    if (filterMonth === month && filterStatus === statusKey) {
      setFilterMonth(""); setFilterStatus("");
    } else {
      setFilterMonth(month); setFilterStatus(statusKey);
    }
  }

  function toggleCustomMonth(m: string) {
    const next = new Set(customMonths);
    if (next.has(m)) next.delete(m); else next.add(m);
    setCustomMonths(next);
  }

  const PERIOD_BTNS: { key: Period; label: string }[] = [
    { key: "3m", label: "3 miesiące" },
    { key: "6m", label: "6 miesięcy" },
    { key: "12m", label: "12 miesięcy" },
    { key: "custom", label: "Własny" },
  ];

  return (
    <div className="space-y-6">
      {/* Chart card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Statusy rozliczeń wg miesiąca</h2>
          <div className="flex gap-1">
            {PERIOD_BTNS.map((b) => (
              <button
                key={b.key}
                onClick={() => setPeriod(b.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === b.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            {allMonths.map((m) => (
              <label key={m} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={customMonths.has(m)}
                  onChange={() => toggleCustomMonth(m)}
                  className="rounded"
                />
                {formatMonth(m)}
              </label>
            ))}
          </div>
        )}

        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Brak danych</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [value, SETTLEMENT_STATUS_LABELS[name as string] ?? name]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(name) => SETTLEMENT_STATUS_LABELS[name] ?? name}
              />
              {STATUSES.map((st) => (
                <Bar
                  key={st}
                  dataKey={st}
                  fill={SETTLEMENT_STATUS_CHART_COLORS[st]}
                  stackId="a"
                  cursor="pointer"
                  onClick={(data) => handleBarClick(data as Record<string, unknown>, st)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {(filterMonth || filterStatus) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtr aktywny:</span>
            {filterMonth && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{formatMonth(filterMonth)}</span>
            )}
            {filterStatus && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">{SETTLEMENT_STATUS_LABELS[filterStatus]}</span>
            )}
            <button
              onClick={() => { setFilterMonth(""); setFilterStatus(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Wyczyść
            </button>
          </div>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            Lekarze — {tableRows.length} rekordów
          </h2>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-xs"
            >
              <option value="">Wszystkie miesiące</option>
              {allMonths.map((m) => (
                <option key={m} value={m}>{formatMonth(m)}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-xs"
            >
              <option value="">Wszystkie statusy</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{SETTLEMENT_STATUS_LABELS[s]}</option>
              ))}
            </select>
            {(filterMonth || filterStatus) && (
              <button
                onClick={() => { setFilterMonth(""); setFilterStatus(""); }}
                className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-2 py-1"
              >
                ✕ Wyczyść
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">Lekarz</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">Miesiąc</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs">Status</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-600 text-xs">Kwota</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-600 text-xs">PLN</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Brak rekordów dla wybranych filtrów
                  </td>
                </tr>
              )}
              {tableRows.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-900 text-xs">{s.doctorName}</p>
                    <p className="text-xs text-gray-400">{s.doctorEmail}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{formatMonth(s.month)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SETTLEMENT_STATUS_COLORS[s.status]}`}>
                      {SETTLEMENT_STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">
                    {formatCurrency(s.totalLocal, s.currency)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-500">
                    {formatCurrency(s.totalPln, "PLN")}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/settlements/${s.id}`} className="text-blue-600 hover:underline text-xs">
                      →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
