"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Settings,
  Users,
  Upload,
  LogOut,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface NavProps {
  role: string;
  name: string;
  email: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "ACCOUNTING"] },
  { href: "/settlements", label: "Rozliczenia", icon: FileText, roles: ["DOCTOR", "MAIN_DOCTOR", "ADMIN", "ACCOUNTING"] },
  { href: "/invoices", label: "Faktury", icon: Receipt, roles: ["ADMIN", "ACCOUNTING"] },
  { href: "/admin/import", label: "Import danych", icon: Upload, roles: ["ADMIN"] },
  { href: "/admin/users", label: "Użytkownicy", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/settings", label: "Ustawienia modeli", icon: Settings, roles: ["ADMIN"] },
];

export function Nav({ role, name, email }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    toast.success("Wylogowano");
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Telemedi</p>
            <p className="text-xs text-gray-500">Rozliczenia</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", userMenuOpen && "rotate-180")} />
        </button>
        {userMenuOpen && (
          <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Wyloguj
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
