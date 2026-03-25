import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const settlement = await db.settlement.findUnique({
    where: { id },
    include: { doctor: { include: { user: true } } },
  });
  if (!settlement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.role === "DOCTOR" || session.role === "MAIN_DOCTOR") {
    if (settlement.doctor.user.id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (settlement.status !== "ACCEPTED_DOCTOR") {
    return NextResponse.json({ error: "Accept settlement first" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file || !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "PDF file required" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "uploads", "invoices", id);
  await mkdir(uploadDir, { recursive: true });
  const filename = `invoice_${Date.now()}.pdf`;
  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Simulate OCR: compare file size as proxy (in real app: call OCR service)
  // For demo: randomly assign OCR result
  const ocrStatuses = ["MATCH", "MISMATCH", "UNREADABLE"];
  const ocrStatus = ocrStatuses[Math.floor(Math.random() * ocrStatuses.length)];
  const ocrAmount = ocrStatus === "MATCH" ? settlement.totalLocal :
                    ocrStatus === "MISMATCH" ? settlement.totalLocal * 0.95 : null;

  await db.invoice.upsert({
    where: { settlementId: id },
    create: {
      settlementId: id,
      filename: file.name,
      filePath,
      ocrStatus,
      ocrAmount,
      status: "UPLOADED",
      processedAt: new Date(),
    },
    update: {
      filename: file.name,
      filePath,
      ocrStatus,
      ocrAmount,
      status: "UPLOADED",
      processedAt: new Date(),
    },
  });

  await db.settlement.update({ where: { id }, data: { status: "INVOICE_UPLOADED" } });

  return NextResponse.json({ ok: true, ocrStatus });
}
