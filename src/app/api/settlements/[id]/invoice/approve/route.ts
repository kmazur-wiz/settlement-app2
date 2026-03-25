import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["ADMIN", "ACCOUNTING"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const settlement = await db.settlement.findUnique({ where: { id }, include: { invoice: true } });
  if (!settlement?.invoice) return NextResponse.json({ error: "No invoice" }, { status: 404 });

  await db.invoice.update({ where: { id: settlement.invoice.id }, data: { status: "ACCEPTED" } });
  await db.settlement.update({ where: { id }, data: { status: "ACCEPTED" } });

  return NextResponse.json({ ok: true });
}
