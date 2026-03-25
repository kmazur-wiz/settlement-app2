import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Nav } from "@/components/nav";

export default async function SettlementsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Nav role={session.role} name={session.name} email={session.email} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
