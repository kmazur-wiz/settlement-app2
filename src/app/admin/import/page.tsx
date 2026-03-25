import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const recentImports = await db.importLog.findMany({
    orderBy: { importedAt: "desc" },
    take: 10,
  });

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import danych</h1>
      <p className="text-gray-500 mb-8">Wgraj plik XLSX z danymi rozliczeniowymi (7 arkuszy).</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <ImportForm />
      </div>

      {/* Import history */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">Historia importów</h2>
        {recentImports.length === 0 ? (
          <p className="text-gray-400 text-sm">Brak importów</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b text-xs uppercase tracking-wide">
                <th className="pb-2">Miesiąc</th>
                <th className="pb-2">Plik</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Wiersze</th>
                <th className="pb-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentImports.map((imp) => {
                const counts = imp.rowCounts ? JSON.parse(imp.rowCounts) : {};
                return (
                  <tr key={imp.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 font-medium">{imp.month}</td>
                    <td className="py-2 text-gray-500 max-w-[180px] truncate text-xs">{imp.filename}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        imp.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                        imp.status === "PARTIAL" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {imp.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500 text-xs">
                      {Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </td>
                    <td className="py-2 text-gray-400 text-xs">
                      {new Date(imp.importedAt).toLocaleDateString("pl-PL")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
