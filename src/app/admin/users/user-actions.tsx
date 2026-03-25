"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  doctor: { type: string; country: string | null; currency: string } | null;
}

export function UserActions({
  mode,
  user,
}: {
  mode: "create" | "edit";
  user?: User;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "DOCTOR",
    isActive: user?.isActive ?? true,
    doctorType: user?.doctor?.type ?? "GLOBAL",
    country: user?.doctor?.country ?? "",
    currency: user?.doctor?.currency ?? "EUR",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: user ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: user?.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(user ? "Zaktualizowano użytkownika" : "Utworzono użytkownika");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  const isDoctor = form.role === "DOCTOR" || form.role === "MAIN_DOCTOR";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
          mode === "create"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "text-blue-600 hover:bg-blue-50"
        }`}
      >
        {mode === "create" ? "+ Nowy użytkownik" : "Edytuj"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-6">
              {mode === "create" ? "Nowy użytkownik" : `Edytuj: ${user?.name}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rola</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              {isDoctor && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                      <select
                        value={form.doctorType}
                        onChange={(e) => setForm({ ...form, doctorType: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="PL">PL</option>
                        <option value="GLOBAL">GLOBAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Waluta</label>
                      <select
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="PLN">PLN</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                  {form.doctorType === "GLOBAL" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kraj</label>
                      <input
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        placeholder="np. Austria, Czechy..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </>
              )}
              {mode === "edit" && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Konto aktywne
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "..." : mode === "create" ? "Utwórz" : "Zapisz"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
