import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UserActions } from "./user-actions";
import { ROLE_LABELS } from "@/lib/utils";

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const users = await db.user.findMany({
    include: { doctor: { include: { contractModel: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Użytkownicy</h1>
          <p className="text-gray-500 mt-1">{users.length} kont</p>
        </div>
        <UserActions mode="create" />
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
            {users.map((u) => (
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
