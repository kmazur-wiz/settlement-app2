import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { InvoiceActions } from "./invoice-actions";
import { InvoiceFilters } from "@/components/invoice-filters";

const OCR_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Oczekuje",    cls: "bg-gray-100 text-gray-600" },
  MATCH:      { label: "Zgodny",      cls: "bg-green-100 text-green-700" },
  MISMATCH:   { label: "Niezgodny",   cls: "bg-red-100 text-red-700" },
  UNREADABLE: { label: "Nieczytelny", cls: "bg-orange-100 text-orange-700" },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  UPLOADED: { label: "Przesłana",    cls: "bg-blue-100 text-blue-700" },
  ACCEPTED: { label: "Zatwierdzono", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Odrzucono",    cls: "bg-red-100 text-red-700" },
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ ocr?: string; status?: string; month?: string }>;
}) {
  const session = await getSession();
  if (!session || !["ADMIN", "ACCOUNTING"].includes(session.role)) redirect("/dashboard");

  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.ocr) where.ocrStatus = sp.ocr;
  if (sp.status) where.status = sp.status;
  if (sp.month) where.settlement = { month: sp.month };

  const invoices = await db.invoice.findMany({
    where,
    include: {
      settlement: {
        include: { doctor: { include: { user: { select: { name: true, email: true } } } } },
      },
    },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>
          <p className="text-gray-500 mt-1">{invoices.length} faktur</p>
        </div>
      </div>

      <Suspense>
        <InvoiceFilters currentOcr={sp.ocr} currentStatus={sp.status} currentMonth={sp.month} />
      </Suspense>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Lekarz</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Miesiąc</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Plik</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kwota OCR</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Status OCR</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Przesłano</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">Brak faktur</td>
              </tr>
            )}
            {invoices.map((inv) => {
              const ocr = OCR_BADGE[inv.ocrStatus] ?? OCR_BADGE.PENDING;
              const st = STATUS_BADGE[inv.status] ?? STATUS_BADGE.UPLOADED;
              return (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{inv.settlement.doctor.user.name}</p>
                    <p className="text-xs text-gray-400">{inv.settlement.doctor.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.settlement.month}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/invoices/${inv.id}/file`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-xs truncate max-w-[150px] block"
                    >
                      {inv.filename}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {inv.ocrAmount != null ? `${inv.ocrAmount.toFixed(2)} ${inv.settlement.currency}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ocr.cls}`}>{ocr.label}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(inv.uploadedAt).toLocaleDateString("pl-PL")}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === "UPLOADED" && (
                      <InvoiceActions
                        invoiceId={inv.id}
                        settlementId={inv.settlementId}
                        ocrStatus={inv.ocrStatus}
                        ocrAmount={inv.ocrAmount}
                        expectedAmount={inv.settlement.totalLocal}
                        currency={inv.settlement.currency}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
