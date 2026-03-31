"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function InvoiceFilters({
  currentOcr,
  currentStatus,
  currentMonth,
}: {
  currentOcr?: string;
  currentStatus?: string;
  currentMonth?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={currentOcr ?? ""}
        onChange={(e) => set("ocr", e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
      >
        <option value="">Wszystkie OCR</option>
        <option value="PENDING">Oczekuje</option>
        <option value="MATCH">Zgodny</option>
        <option value="MISMATCH">Niezgodny</option>
        <option value="UNREADABLE">Nieczytelny</option>
      </select>
      <select
        value={currentStatus ?? ""}
        onChange={(e) => set("status", e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
      >
        <option value="">Wszystkie statusy</option>
        <option value="UPLOADED">Przesłana</option>
        <option value="ACCEPTED">Zatwierdzono</option>
        <option value="REJECTED">Odrzucono</option>
      </select>
      <input
        type="month"
        value={currentMonth ?? ""}
        onChange={(e) => set("month", e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
      />
    </div>
  );
}
