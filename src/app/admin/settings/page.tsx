import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsDoctorList } from "@/components/settings-doctor-list";

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

      <SettingsDoctorList doctors={doctors} />
    </div>
  );
}
