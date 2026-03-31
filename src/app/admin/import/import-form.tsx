"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

export function ImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    matched: number;
    unmatched: string[];
    stored: Record<string, number>;
    errors: string[];
  } | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      setFile(f);
    } else if (f) {
      toast.error("Wybierz plik XLSX");
    }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
      toast.success("Import zakończony pomyślnie");
      router.refresh();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Plik XLSX</label>
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-colors cursor-pointer
            ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
          onClick={() => document.getElementById("xlsx-file-input")?.click()}
        >
          <Upload className="w-6 h-6 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">
            {file ? file.name : "Kliknij lub przeciągnij plik XLSX"}
          </span>
          <input
            id="xlsx-file-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Importowanie...
          </>
        ) : (
          "Importuj dane"
        )}
      </button>

      {result && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm">Wynik importu</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-green-50 rounded p-2">
              <p className="text-green-700 font-medium text-lg">{result.matched}</p>
              <p className="text-green-600 text-xs">dopasowanych lekarzy</p>
            </div>
            <div className={`${result.unmatched.length ? "bg-orange-50" : "bg-gray-50"} rounded p-2`}>
              <p className={`${result.unmatched.length ? "text-orange-700" : "text-gray-400"} font-medium text-lg`}>
                {result.unmatched.length}
              </p>
              <p className="text-xs text-gray-500">niezidentyfikowanych</p>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            {Object.entries(result.stored).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="font-medium">{v} wierszy</span>
              </div>
            ))}
          </div>

          {result.unmatched.length > 0 && (
            <div className="bg-orange-50 rounded p-3">
              <p className="text-xs font-medium text-orange-700 mb-1">Nieznane emaile:</p>
              {result.unmatched.slice(0, 5).map((e) => (
                <p key={e} className="text-xs text-orange-600">{e}</p>
              ))}
              {result.unmatched.length > 5 && (
                <p className="text-xs text-orange-400">...i {result.unmatched.length - 5} więcej</p>
              )}
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-red-700 mb-1">Błędy ({result.errors.length}):</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
