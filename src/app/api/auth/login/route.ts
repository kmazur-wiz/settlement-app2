import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email i hasło są wymagane" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  // Use constant-time comparison to avoid timing attacks
  if (!user || !user.passwordHash || !user.isActive) {
    // Hash a dummy password to normalize timing
    await verifyPassword("dummy", "$2b$12$dummy.hash.to.normalize.timing");
    return NextResponse.json({ error: "Nieprawidłowy email lub hasło" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Nieprawidłowy email lub hasło" }, { status: 401 });
  }

  const token = await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
