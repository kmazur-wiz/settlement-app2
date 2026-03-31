"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function FilterSelect({
  name,
  label,
  options,
  current,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  current?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600 whitespace-nowrap">{label}:</label>
      <select
        value={current ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Wszystkie</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
