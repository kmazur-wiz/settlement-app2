"use client";

import { useState, useMemo } from "react";
import { ROLE_LABELS } from "@/lib/utils";
import { UserActions } from "@/app/admin/users/user-actions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  doctor: {
    type: string;
    country: string | null;
    currency: string;
    contractModel: { model: string } | null;
  } | null;
}

export function UsersList({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "PL" | "GLOBAL" | "NON_DOCTOR">("");

  const filtered = useMemo(() =>
    users.filter((u) => {
      if (typeFilter === "NON_DOCTOR" && u.doctor) return false;
      if (typeFilter === "PL" && u.doctor?.type !== "PL") return false;
      if (typeFilter === "GLOBAL" && u.doctor?.type !== "GLOBAL") return false;
      if (search) {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    }),
    [users, typeFilter, search]
  );

  return (
    <div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Szukaj po nazwisku lub emailu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-1">
          {([
            { key: "" as const, label: "Wszyscy" },
            { key: "PL" as const, label: "PL" },
            { key: "GLOBAL" as const, label: "GLOBAL" },
            { key: "NON_DOCTOR" as const, label: "Nie-lekarze" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 self-center">{filtered.length} użytkowników</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Imię i nazwisko</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Rola</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Typ</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Model</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Brak użytkowników pasujących do filtrów
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.doctor ? (
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      u.doctor.type === "GLOBAL" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {u.doctor.type}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.doctor?.contractModel?.model ?? "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`w-2 h-2 rounded-full inline-block ${u.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                </td>
                <td className="px-4 py-3">
                  <UserActions mode="edit" user={u} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
