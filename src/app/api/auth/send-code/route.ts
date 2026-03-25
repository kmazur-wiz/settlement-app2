import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCode, sendAuthCode } from "@/lib/auth";
import { addMinutes } from "date-fns";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Don't reveal if user exists — but still respond as if sent
    return NextResponse.json({ firstLogin: false });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: "Konto nieaktywne" }, { status: 403 });
  }

  // Invalidate old codes
  await db.authCode.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const code = generateCode();
  await db.authCode.create({
    data: {
      userId: user.id,
      code,
      expiresAt: addMinutes(new Date(), 15),
    },
  });

  await sendAuthCode(email, code);

  const firstLogin = !user.passwordHash && !user.prefersEmailCode;
  return NextResponse.json({ firstLogin });
}
