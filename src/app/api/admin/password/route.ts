import { getAdminSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const session = await getAdminSession();
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { currentPassword, newPassword } = body as {
    currentPassword?: unknown;
    newPassword?: unknown;
  };

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    newPassword.length < 12
  ) {
    return NextResponse.json(
      { error: "New password must be at least 12 characters." },
      { status: 400 }
    );
  }

  const admin = session?.id
    ? await prisma.admin.findUnique({ where: { id: session.id } })
    : await prisma.admin.findFirst();

  if (!admin) {
    return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
  }

  const currentMatches = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!currentMatches) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ success: true, message: "Password updated successfully." });
}
