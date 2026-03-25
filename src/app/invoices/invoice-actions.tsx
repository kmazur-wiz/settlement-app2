"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function InvoiceActions({
  invoiceId,
  settlementId,
  ocrStatus,
  ocrAmount,
  expectedAmount,
  currency,
}: {
  invoiceId: string;
  settlementId: string;
  ocrStatus: string;
  ocrAmount: number | null;
  expectedAmount: number;
  currency: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");

  async function approve() {
    setLoading(true);
    try {
      const res = await fetch(`/api/settlements/${settlementId}/invoice/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Faktura zatwierdzona");
      router.refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    if (!note.trim()) {
      toast.error("Podaj powód odrzucenia");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/settlements/${settlementId}/invoice/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
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

  if (showReject) {
    return (
      <div className="flex flex-col gap-1 min-w-[200px]">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Powód odrzucenia..."
          className="border border-gray-200 rounded px-2 py-1 text-xs resize-none"
          rows={2}
        />
        <div className="flex gap-1">
          <button
            onClick={reject}
            disabled={loading}
            className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs"
          >
            {loading ? "..." : "Odrzuć"}
          </button>
          <button
            onClick={() => setShowReject(false)}
            className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs"
          >
            Anuluj
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {ocrStatus === "MISMATCH" && ocrAmount != null && (
        <span className="text-xs text-red-600 mr-1">
          OCR: {ocrAmount.toFixed(2)} vs {expectedAmount.toFixed(2)} {currency}
        </span>
      )}
      <button
        onClick={approve}
        disabled={loading}
        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "..." : "Zatwierdź"}
      </button>
      <button
        onClick={() => setShowReject(true)}
        className="px-2 py-1 border border-red-200 text-red-600 rounded text-xs hover:bg-red-50"
      >
        Odrzuć
      </button>
    </div>
  );
}
