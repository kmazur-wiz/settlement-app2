import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try { await requireAuth(["ADMIN"]); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const { name, email, role, doctorType, country, currency } = await req.json();
  if (!name || !email || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Email już istnieje" }, { status: 409 });

  const user = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      role,
    },
  });

  if (role === "DOCTOR" || role === "MAIN_DOCTOR") {
    await db.doctor.create({
      data: {
        userId: user.id,
        type: doctorType ?? "GLOBAL",
        country: country || null,
        currency: currency ?? "EUR",
      },
    });
  }

  return NextResponse.json({ id: user.id });
}

export async function PUT(req: NextRequest) {
  try { await requireAuth(["ADMIN"]); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const { id, name, email, role, isActive, doctorType, country, currency } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.user.update({
    where: { id },
    data: { name, email: email?.toLowerCase(), role, isActive },
  });

  const user = await db.user.findUnique({ where: { id }, include: { doctor: true } });
  if (user?.doctor) {
    await db.doctor.update({
      where: { id: user.doctor.id },
      data: { type: doctorType, country: country || null, currency },
    });
  } else if (role === "DOCTOR" || role === "MAIN_DOCTOR") {
    await db.doctor.create({
      data: { userId: id, type: doctorType ?? "GLOBAL", country: country || null, currency: currency ?? "EUR" },
    });
  }

  return NextResponse.json({ ok: true });
}
