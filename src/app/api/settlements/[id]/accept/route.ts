import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const settlement = await db.settlement.findUnique({
    where: { id },
    include: { doctor: { include: { user: true } } },
  });
  if (!settlement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Doctors can only accept their own
  if (session.role === "DOCTOR" || session.role === "MAIN_DOCTOR") {
    if (settlement.doctor.user.id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (settlement.status !== "PENDING_DOCTOR") {
    return NextResponse.json({ error: "Cannot accept in current status" }, { status: 400 });
  }

  await db.settlement.update({
    where: { id },
    data: { status: "ACCEPTED_DOCTOR", acceptedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
