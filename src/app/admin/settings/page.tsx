import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ContractModelForm } from "./contract-model-form";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const doctors = await db.doctor.findMany({
    include: {
      user: { select: { name: true, email: true } },
      contractModel: true,
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia kontraktów</h1>
        <p className="text-gray-500 mt-1">Konfiguracja modeli rozliczeniowych dla lekarzy</p>
      </div>

      <div className="space-y-4">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                  {doctor.user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{doctor.user.name}</p>
                  <p className="text-xs text-gray-500">{doctor.user.email}</p>
                </div>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                  doctor.type === "GLOBAL" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                }`}>
                  {doctor.type}
                </span>
                {doctor.country && (
                  <span className="text-xs text-gray-400">{doctor.country}</span>
                )}
              </div>
              <div className="text-right">
                {doctor.contractModel ? (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                    Model {doctor.contractModel.model}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold">
                    Brak modelu
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              <ContractModelForm doctor={doctor} contractModel={doctor.contractModel} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
