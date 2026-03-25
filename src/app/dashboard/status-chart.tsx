"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SETTLEMENT_STATUS_LABELS, SETTLEMENT_STATUS_CHART_COLORS } from "@/lib/utils";

const STATUSES = ["PENDING_DOCTOR", "ACCEPTED_DOCTOR", "INVOICE_UPLOADED", "ACCEPTED", "PAYMENT_SENT"];

export function StatusChart({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">Brak danych</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {STATUSES.map((s) => (
          <Bar
            key={s}
            dataKey={s}
            name={SETTLEMENT_STATUS_LABELS[s]}
            fill={SETTLEMENT_STATUS_CHART_COLORS[s]}
            stackId="a"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
