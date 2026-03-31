import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";
import {
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_COLORS,
  formatCurrency,
  formatMonth,
} from "@/lib/utils";
import { FilterSelect } from "@/components/filter-select";

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const isDoctor = session.role === "DOCTOR" || session.role === "MAIN_DOCTOR";

  const where: Record<string, unknown> = {};
  if (params.month) where.month = params.month;
  if (params.status) where.status = params.status;

  if (isDoctor) {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { doctor: true },
    });
    if (!user?.doctor) return <div className="p-8 text-gray-500">Brak konta lekarza</div>;
    where.doctorId = user.doctor.id;
  }

  const settlements = await db.settlement.findMany({
    where,
    include: {
      doctor: { include: { user: true } },
      invoice: true,
    },
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const months = await db.settlement.findMany({
    select: { month: true },
    distinct: ["month"],
    orderBy: { month: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rozliczenia</h1>
          <p className="text-gray-500 mt-1">{settlements.length} rekordów</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex gap-4 flex-wrap">
        <Suspense>
          <FilterSelect
            name="month"
            label="Miesiąc"
            options={months.map((m) => ({ value: m.month, label: formatMonth(m.month) }))}
            current={params.month}
          />
          <FilterSelect
            name="status"
            label="Status"
            options={Object.entries(SETTLEMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            current={params.status}
          />
        </Suspense>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {!isDoctor && <th className="px-4 py-3 text-left font-medium text-gray-600">Lekarz</th>}
              <th className="px-4 py-3 text-left font-medium text-gray-600">Miesiąc</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Kwota (waluta)</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Kwota (PLN)</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Faktura</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Data przelewu</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  Brak rozliczeń
                </td>
              </tr>
            )}
            {settlements.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {!isDoctor && (
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.doctor.user.name}</p>
                    <p className="text-xs text-gray-400">{s.doctor.user.email}</p>
                  </td>
                )}
                <td className="px-4 py-3 font-medium">{formatMonth(s.month)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${SETTLEMENT_STATUS_COLORS[s.status]}`}>
                    {SETTLEMENT_STATUS_LABELS[s.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(s.totalLocal, s.currency)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-500">
                  {formatCurrency(s.totalPln, "PLN")}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.invoice ? (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      s.invoice.ocrStatus === "MATCH" ? "bg-green-100 text-green-700" :
                      s.invoice.ocrStatus === "MISMATCH" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {s.invoice.ocrStatus === "MATCH" ? "Zgodna" :
                       s.invoice.ocrStatus === "MISMATCH" ? "Niezgodna" : "Wgrana"}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {s.transferDate ? new Date(s.transferDate).toLocaleDateString("pl-PL") : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/settlements/${s.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                    Szczegóły →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
