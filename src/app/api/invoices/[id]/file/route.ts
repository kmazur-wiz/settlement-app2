import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["ADMIN", "ACCOUNTING", "DOCTOR", "MAIN_DOCTOR"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invoice = await db.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const absolutePath = path.join(process.cwd(), invoice.filePath);
  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(absolutePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.filename}"`,
    },
  });
}
