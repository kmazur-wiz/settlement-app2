import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAuth(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { doctorId, model, params } = await req.json();
  if (!doctorId || !model) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await db.contractModel.upsert({
    where: { doctorId },
    create: {
      doctorId,
      model,
      params: JSON.stringify(params ?? {}),
      createdBy: session.userId,
    },
    update: {
      model,
      params: JSON.stringify(params ?? {}),
    },
  });

  return NextResponse.json({ ok: true });
}
