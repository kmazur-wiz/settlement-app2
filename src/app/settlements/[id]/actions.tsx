"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SettlementActionsProps {
  settlement: {
    id: string;
    status: string;
    invoice: {
      id: string;
      filename: string;
      ocrStatus: string;
      status: string;
      ocrAmount: number | null;
    } | null;
    totalLocal: number;
    currency: string;
  };
  isAdmin: boolean;
  isDoctor: boolean;
}

export function SettlementActions({ settlement, isAdmin, isDoctor }: SettlementActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function accept() {
    setLoading(true);
    try {
      const res = await fetch(`/api/settlements/${settlement.id}/accept`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Rozliczenie zaakceptowane");
      router.refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function uploadInvoice() {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/settlements/${settlement.id}/invoice`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Faktura wgrana");
      setShowUpload(false);
      router.refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function approveInvoice() {
    setLoading(true);
    try {
      const res = await fetch(`/api/settlements/${settlement.id}/invoice/approve`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Faktura zaakceptowana");
      router.refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function rejectInvoice() {
    setLoading(true);
    try {
      const res = await fetch(`/api/settlements/${settlement.id}/invoice/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: rejectionNote }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Faktura odrzucona");
      setShowReject(false);
      router.refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Akcje</h2>
      <div className="flex flex-wrap gap-3">
        {/* Doctor: accept settlement */}
        {isDoctor && settlement.status === "PENDING_DOCTOR" && (
          <button
            onClick={accept}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Zaakceptuj rozliczenie
          </button>
        )}

        {/* Doctor: upload invoice */}
        {isDoctor && settlement.status === "ACCEPTED_DOCTOR" && !settlement.invoice && (
          <>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Prześlij fakturę
            </button>
            {showUpload && (
              <div className="w-full mt-3 flex gap-3 items-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <button
                  onClick={uploadInvoice}
                  disabled={!file || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Wyślij
                </button>
              </div>
            )}
          </>
        )}

        {/* Show invoice info */}
        {settlement.invoice && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">Faktura: <strong>{settlement.invoice.filename}</strong></span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              settlement.invoice.ocrStatus === "MATCH" ? "bg-green-100 text-green-700" :
              settlement.invoice.ocrStatus === "MISMATCH" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {settlement.invoice.ocrStatus === "MATCH" ? "Kwota zgodna" :
               settlement.invoice.ocrStatus === "MISMATCH" ? `Kwota się różni (OCR: ${settlement.invoice.ocrAmount})` :
               "Przetwarzanie..."}
            </span>
          </div>
        )}

        {/* Admin: approve/reject invoice */}
        {isAdmin && settlement.invoice && settlement.invoice.status === "UPLOADED" && (
          <>
            <button
              onClick={approveInvoice}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Zatwierdź fakturę
            </button>
            <button
              onClick={() => setShowReject(!showReject)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Usuń fakturę
            </button>
            {showReject && (
              <div className="w-full mt-3 flex gap-3 items-center">
                <input
                  type="text"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Powód odrzucenia..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <button
                  onClick={rejectInvoice}
                  disabled={loading || !rejectionNote}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  Potwierdź usunięcie
                </button>
              </div>
            )}
          </>
        )}

        {settlement.status === "PENDING_DOCTOR" && isAdmin && (
          <span className="text-sm text-gray-400">Oczekuje na akceptację lekarza</span>
        )}
        {(settlement.status === "ACCEPTED" || settlement.status === "PAYMENT_SENT") && (
          <span className="text-sm text-green-600 font-medium">
            {settlement.status === "PAYMENT_SENT" ? "✓ Przelew wysłany" : "✓ Zatwierdzone"}
          </span>
        )}
      </div>
    </div>
  );
}
