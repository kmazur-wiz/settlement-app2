import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UserActions } from "./user-actions";
import { UsersList } from "@/components/users-list";

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

      <UsersList users={users} />
    </div>
  );
}
