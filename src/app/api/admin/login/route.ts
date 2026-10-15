import { createAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("username" in body) || !("password" in body)) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const { username, password } = body as { username: unknown; password: unknown };
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid username or password format." }, { status: 400 });
  }

  const trimmedUsername = username.trim();
  const admin = await prisma.admin.findUnique({
    where: { username: trimmedUsername },
  });

  if (!admin) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordMatches) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  await createAdminSession(admin.id);
  return NextResponse.json({ success: true });
}
