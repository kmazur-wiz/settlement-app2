import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StatusChart } from "./status-chart";
import { SETTLEMENT_STATUS_LABELS, formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "DOCTOR" || session.role === "MAIN_DOCTOR") {
    redirect("/settlements");
  }

  // Aggregate settlement statuses
  const settlements = await db.settlement.findMany({
    include: { doctor: { include: { user: true } } },
    orderBy: { month: "desc" },
  });

  // Group by month
  const months = Array.from(new Set(settlements.map((s) => s.month))).sort().reverse().slice(0, 6);

  const chartData = months.map((month) => {
    const monthSettlements = settlements.filter((s) => s.month === month);
    const entry: Record<string, unknown> = { month };
    for (const status of ["PENDING_DOCTOR", "ACCEPTED_DOCTOR", "INVOICE_UPLOADED", "ACCEPTED", "PAYMENT_SENT"]) {
      entry[status] = monthSettlements.filter((s) => s.status === status).length;
    }
    return entry;
  });

  // Stats for current month
  const currentMonth = months[0] ?? "";
  const currentSettlements = settlements.filter((s) => s.month === currentMonth);
  const totalPln = currentSettlements.reduce((s, x) => s + x.totalPln, 0);
  const pending = currentSettlements.filter((s) => s.status === "PENDING_DOCTOR").length;
  const done = currentSettlements.filter((s) => s.status === "PAYMENT_SENT").length;

  // Recent imports
  const recentImports = await db.importLog.findMany({
    orderBy: { importedAt: "desc" },
    take: 5,
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Przegląd rozliczeń — {currentMonth}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard label="Suma rozliczeń (PLN)" value={formatCurrency(totalPln)} sub={currentMonth} />
        <StatCard label="Oczekuje na akceptację" value={String(pending)} sub="lekarzy" color="blue" />
        <StatCard label="Przelew wysłany" value={String(done)} sub={`z ${currentSettlements.length}`} color="green" />
      </div>

      {/* Status chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Statusy rozliczeń wg miesiąca</h2>
        <StatusChart data={chartData} />
      </div>

      {/* Recent imports */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Ostatnie importy</h2>
        {recentImports.length === 0 ? (
          <p className="text-gray-400 text-sm">Brak importów</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Miesiąc</th>
                <th className="pb-2">Plik</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentImports.map((imp) => (
                <tr key={imp.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{imp.month}</td>
                  <td className="py-2 text-gray-600 max-w-[200px] truncate">{imp.filename}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      imp.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                      imp.status === "PARTIAL" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {imp.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">
                    {new Date(imp.importedAt).toLocaleDateString("pl-PL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = "gray" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color === "blue" ? "text-blue-600" : color === "green" ? "text-green-600" : "text-gray-900"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
