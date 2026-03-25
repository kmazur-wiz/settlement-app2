import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["ADMIN", "ACCOUNTING"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { note } = await req.json();

  const settlement = await db.settlement.findUnique({ where: { id }, include: { invoice: true } });
  if (!settlement?.invoice) return NextResponse.json({ error: "No invoice" }, { status: 404 });

  await db.invoice.update({
    where: { id: settlement.invoice.id },
    data: { status: "REJECTED", rejectionNote: note },
  });
  // Reset to accepted_doctor so doctor can reupload
  await db.settlement.update({ where: { id }, data: { status: "ACCEPTED_DOCTOR" } });

  return NextResponse.json({ ok: true });
}
