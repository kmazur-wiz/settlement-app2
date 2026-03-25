import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_COLORS,
  formatCurrency,
  formatMonth,
  parseAmounts,
} from "@/lib/utils";
import { SettlementActions } from "./actions";

export default async function SettlementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const settlement = await db.settlement.findUnique({
    where: { id },
    include: {
      doctor: { include: { user: true, contractModel: true } },
      invoice: true,
    },
  });

  if (!settlement) notFound();

  // Doctors can only see their own settlements
  if (session.role === "DOCTOR" || session.role === "MAIN_DOCTOR") {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { doctor: true },
    });
    if (user?.doctor?.id !== settlement.doctorId) notFound();
  }

  const visits = await db.visit.findMany({
    where: { doctorId: settlement.doctorId, month: settlement.month },
    orderBy: { visitDate: "asc" },
  });

  const prescriptions = await db.prescription.findMany({
    where: { doctorId: settlement.doctorId, month: settlement.month },
  });

  const slots = await db.slot.findMany({
    where: { doctorId: settlement.doctorId, month: settlement.month },
    orderBy: { startAt: "asc" },
  });

  const isAdmin = session.role === "ADMIN" || session.role === "ACCOUNTING";
  const amounts = parseAmounts(settlement.amounts);

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/settlements" className="hover:text-blue-600">Rozliczenia</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">{settlement.doctor.user.name} — {formatMonth(settlement.month)}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {settlement.doctor.user.name}
          </h1>
          <p className="text-gray-500 mt-1">{settlement.doctor.user.email}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${SETTLEMENT_STATUS_COLORS[settlement.status]}`}>
              {SETTLEMENT_STATUS_LABELS[settlement.status]}
            </span>
            <span className="text-sm text-gray-500">{formatMonth(settlement.month)}</span>
            {settlement.doctor.type === "GLOBAL" && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">GLOBAL</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(settlement.totalLocal, settlement.currency)}
          </p>
          {settlement.currency !== "PLN" && (
            <p className="text-gray-400 text-sm mt-1">
              = {formatCurrency(settlement.totalPln, "PLN")}
            </p>
          )}
        </div>
      </div>

      {/* Breakdown */}
      {Object.keys(amounts).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Rozliczenie szczegółowe</h2>
          <div className="space-y-2">
            {Object.entries(amounts).map(([key, val]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{key.replace(/_/g, " ")}</span>
                <span className="font-mono font-medium">
                  {formatCurrency(Number(val), settlement.currency)}
                </span>
              </div>
            ))}
            {settlement.additionalCosts > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Additional costs</span>
                <span className="font-mono font-medium text-green-600">
                  +{formatCurrency(settlement.additionalCosts, settlement.currency)}
                </span>
              </div>
            )}
            {settlement.deductions > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Deductions</span>
                <span className="font-mono font-medium text-red-600">
                  -{formatCurrency(settlement.deductions, settlement.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-2 border-t">
              <span>Razem</span>
              <span className="font-mono">{formatCurrency(settlement.totalLocal, settlement.currency)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <SettlementActions settlement={settlement} isAdmin={isAdmin} isDoctor={!isAdmin} />

      {/* Visits tab */}
      {visits.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold">Wizyty ({visits.length})</h2>
            <span className="text-sm text-gray-400">
              {visits.filter(v => v.source === "PL").length} PL · {visits.filter(v => v.source === "GLOBAL").length} GLOBAL
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Data</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Specjalizacja</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium">Typ dnia</th>
                  {isAdmin && <th className="px-4 py-2 text-left text-gray-500 font-medium">BU</th>}
                  <th className="px-4 py-2 text-center text-gray-500 font-medium">Kara</th>
                  {isAdmin && <th className="px-4 py-2 text-right text-gray-500 font-medium">Stawka</th>}
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">
                      {new Date(v.visitDate).toLocaleDateString("pl-PL")}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{v.specialization ?? "—"}</td>
                    <td className="px-4 py-2">
                      {v.source === "GLOBAL" ? (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          v.visitStatus === "ended" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {v.visitStatus}
                        </span>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          v.noShow ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"
                        }`}>
                          {v.noShow ? "no-show" : "ended"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{v.dayType ?? "—"}</td>
                    {isAdmin && <td className="px-4 py-2 text-gray-500 text-xs">{v.bu ?? "—"}</td>}
                    <td className="px-4 py-2 text-center">
                      {v.hasPenalty && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                          Kara {v.penaltyAmount > 0 ? formatCurrency(v.penaltyAmount, "PLN") : ""}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2 text-right text-gray-600 font-mono text-xs">
                        {v.baseRate != null ? formatCurrency(v.baseRate, "PLN") : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescriptions */}
      {prescriptions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold mb-3">Recepty</h2>
          <div className="flex gap-8">
            {prescriptions.map((p) => (
              <div key={p.id}>
                <p className="text-3xl font-bold text-gray-900">{p.count}</p>
                <p className="text-xs text-gray-500">{p.source}{p.country ? ` · ${p.country}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slots summary */}
      {slots.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-3">Sloty ({slots.length})</h2>
          <p className="text-sm text-gray-500">
            Zajęte: {slots.filter(s => s.visitDate).length} ·
            Wolne: {slots.filter(s => !s.visitDate).length}
          </p>
        </div>
      )}
    </div>
  );
}
