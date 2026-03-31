import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { parseWorkbook } from "@/lib/import/parser";
import { processImport } from "@/lib/import/processor";

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAuth(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseWorkbook(buffer);

  if (!parsed.monthConsistent) {
    return NextResponse.json({
      error: "Plik zawiera dane z różnych miesięcy rozliczeniowych. Sprawdź kolumnę 'miesiąc_rozliczenia' — wszystkie wiersze muszą mieć ten sam miesiąc.",
    }, { status: 422 });
  }

  if (!parsed.detectedMonth) {
    return NextResponse.json({
      error: "Nie można odczytać miesiąca rozliczeniowego z pliku. Sprawdź czy kolumna 'miesiąc_rozliczenia' zawiera dane w formacie YYYY-MM.",
    }, { status: 422 });
  }

  if (!parsed.detectedMonth.match(/^\d{4}-\d{2}$/)) {
    return NextResponse.json({
      error: `Nieprawidłowy format miesiąca: "${parsed.detectedMonth}". Oczekiwany format: YYYY-MM (np. 2026-01).`,
    }, { status: 422 });
  }

  const summary = await processImport(parsed, parsed.detectedMonth, session.userId, file.name);

  return NextResponse.json(summary);
}
