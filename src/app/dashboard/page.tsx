import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { DashboardClient, type SettlementRow } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "DOCTOR" || session.role === "MAIN_DOCTOR") redirect("/settlements");

  const rawSettlements = await db.settlement.findMany({
    include: { doctor: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { month: "desc" },
  });

  const allMonths = Array.from(new Set(rawSettlements.map((s) => s.month))).sort().reverse();

  const settlements: SettlementRow[] = rawSettlements.map((s) => ({
    id: s.id,
    doctorName: s.doctor.user.name,
    doctorEmail: s.doctor.user.email,
    doctorType: s.doctor.type,
    month: s.month,
    status: s.status,
    totalLocal: s.totalLocal,
    currency: s.currency,
    totalPln: s.totalPln,
  }));

  // Stats for latest month
  const latestMonth = allMonths[0] ?? "";
  const latestSettlements = rawSettlements.filter((s) => s.month === latestMonth);
  const totalPln = latestSettlements.reduce((acc, s) => acc + s.totalPln, 0);
  const pending = latestSettlements.filter((s) => s.status === "PENDING_DOCTOR").length;
  const done = latestSettlements.filter((s) => s.status === "PAYMENT_SENT").length;

  const recentImports = await db.importLog.findMany({
    orderBy: { importedAt: "desc" },
    take: 5,
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Przegląd rozliczeń</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <StatCard label={`Suma rozliczeń (PLN)`} value={formatCurrency(totalPln)} sub={latestMonth} />
        <StatCard label="Czeka na akceptację" value={String(pending)} sub="lekarzy" color="blue" />
        <StatCard label="Przelew wysłany" value={String(done)} sub={`z ${latestSettlements.length}`} color="green" />
      </div>

      {/* Interactive chart + table */}
      <DashboardClient settlements={settlements} allMonths={allMonths} />

      {/* Recent imports */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <h2 className="text-base font-semibold mb-4">Ostatnie importy</h2>
        {recentImports.length === 0 ? (
          <p className="text-gray-400 text-sm">Brak importów</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b text-xs">
                <th className="pb-2">Miesiąc</th>
                <th className="pb-2">Plik</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentImports.map((imp) => (
                <tr key={imp.id} className="border-b last:border-0">
                  <td className="py-2 font-medium text-xs">{imp.month}</td>
                  <td className="py-2 text-gray-600 text-xs max-w-[200px] truncate">{imp.filename}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      imp.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                      imp.status === "PARTIAL" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>{imp.status}</span>
                  </td>
                  <td className="py-2 text-gray-500 text-xs">
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
