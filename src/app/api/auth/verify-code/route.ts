import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Nieprawidłowy kod" }, { status: 401 });
    }

    const authCode = await db.authCode.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!authCode) {
      return NextResponse.json({ error: "Nieprawidłowy lub wygasły kod" }, { status: 401 });
    }

    await db.authCode.update({ where: { id: authCode.id }, data: { used: true } });

    const needsSetup = !user.passwordHash && !user.prefersEmailCode;
    if (needsSetup) {
      return NextResponse.json({ needsSetup: true });
    }

    const token = await createSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Verify-code error:", e);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
