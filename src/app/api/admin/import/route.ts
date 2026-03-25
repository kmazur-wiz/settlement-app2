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
  const month = formData.get("month") as string;

  if (!file || !month) {
    return NextResponse.json({ error: "File and month required" }, { status: 400 });
  }

  if (!month.match(/^\d{4}-\d{2}$/)) {
    return NextResponse.json({ error: "Invalid month format (YYYY-MM)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseWorkbook(buffer);
  const summary = await processImport(parsed, month, session.userId, file.name);

  return NextResponse.json(summary);
}
