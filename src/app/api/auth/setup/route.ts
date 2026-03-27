import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, setSessionCookie, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
  const { email, code, useCode, password } = await req.json();

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });

  // Verify the code was recently validated (still valid and unused...
  // In practice we'd store a short-lived setup token, but for simplicity we reverify)
  const authCode = await db.authCode.findFirst({
    where: {
      userId: user.id,
      code,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!authCode) {
    return NextResponse.json({ error: "Sesja wygasła — zaloguj się ponownie" }, { status: 401 });
  }

  if (useCode) {
    await db.user.update({
      where: { id: user.id },
      data: { prefersEmailCode: true },
    });
  } else {
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Hasło musi mieć minimum 8 znaków" }, { status: 400 });
    }
    const hash = await hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, prefersEmailCode: false },
    });
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
    console.error("Setup error:", e);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
