"use client";

import { useState, useMemo } from "react";

interface Doctor {
  id: string;
  type: string;
  country: string | null;
  currency: string;
  contractModel: { id: string; model: string; params: string } | null;
  user: { name: string; email: string };
}

export function SettingsDoctorList({
  doctors,
  renderForm,
}: {
  doctors: Doctor[];
  renderForm: (doctor: Doctor) => React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "PL" | "GLOBAL">("");

  const filtered = useMemo(() =>
    doctors.filter((d) => {
      if (typeFilter && d.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.user.name.toLowerCase().includes(q) ||
          d.user.email.toLowerCase().includes(q) ||
          (d.country ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    }),
    [doctors, typeFilter, search]
  );

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Szukaj po nazwisku, emailu, kraju..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-1">
          {(["", "PL", "GLOBAL"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t === "" ? "Wszyscy" : t}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 self-center">{filtered.length} lekarzy</span>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map((doctor) => (
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
              <div>
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
              {renderForm(doctor)}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">Brak lekarzy pasujących do filtrów</p>
        )}
      </div>
    </div>
  );
}
