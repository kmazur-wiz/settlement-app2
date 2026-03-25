import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);
const COOKIE = "settlement_session";

export interface SessionPayload {
  userId: string;
  role: string;
  email: string;
  name: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendAuthCode(email: string, code: string) {
  const subject = "Twój kod dostępu do aplikacji rozliczeniowej Telemedi";
  const body = `
Twój jednorazowy kod dostępu:

  ${code}

Kod jest ważny przez 15 minut.
Jeśli to nie Ty próbowałeś/aś się zalogować, zignoruj tę wiadomość.
  `.trim();

  if (process.env.EMAIL_DEV_MODE === "true") {
    console.log(`\n📧 AUTH CODE for ${email}:\n  Code: ${code}\n  Subject: ${subject}\n`);
    return;
  }

  // Production: use nodemailer
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@telemedi.com",
    to: email,
    subject,
    text: body,
  });
}

export async function requireAuth(allowedRoles?: string[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  // Check user still active
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) throw new Error("UNAUTHORIZED");
  return session;
}
