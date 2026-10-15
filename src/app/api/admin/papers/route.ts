import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deletePdf, storePdf } from "@/lib/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Unable to read the upload form." }, { status: 400 });
  }

  const paperCode = String(form.get("paperCode") || "").trim();
  const title = String(form.get("title") || "").trim();
  const branch = String(form.get("branch") || "").trim();
  const semester = Number(form.get("semester"));
  const examYear = Number(form.get("examYear"));
  const file = form.get("file");

  if (
    paperCode.length < 2 || paperCode.length > 40 ||
    !/^[A-Za-z0-9_-]+$/.test(paperCode) ||
    title.length < 2 || title.length > 160 ||
    branch.length < 2 || branch.length > 100 ||
    !Number.isInteger(semester) || semester < 1 || semester > 8 ||
    !Number.isInteger(examYear) || examYear < 2000 || examYear > new Date().getFullYear() + 1 ||
    !(file instanceof File)
  ) {
    return NextResponse.json({ error: "Check each field and attach a valid PDF." }, { status: 400 });
  }

  const existing = await prisma.paper.findUnique({ where: { paperCode } });
  if (existing) {
    return NextResponse.json({ error: "A paper with that paper code already exists." }, { status: 409 });
  }

  let stored: { storageName: string; fileSize: number };
  try {
    stored = await storePdf(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the uploaded PDF.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const paper = await prisma.paper.create({
      data: { paperCode, title, branch, semester, examYear, ...stored, fileName: file.name },
    });
    return NextResponse.json({ paper }, { status: 201 });
  } catch (error) {
    await deletePdf(stored.storageName).catch((cleanupError: unknown) => {
      console.error("Failed to remove orphaned uploaded paper:", cleanupError);
    });
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "A paper with that paper code already exists." }, { status: 409 });
    }
    console.error("Failed to save paper metadata:", error);
    return NextResponse.json({ error: "Unable to save paper details." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Paper ID is required." }, { status: 400 });

  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });

  await prisma.paper.delete({ where: { id } });
  try {
    await deletePdf(paper.storageName);
  } catch (error) {
    console.error("Paper record was deleted, but its PDF could not be removed:", error);
    return NextResponse.json({ error: "Paper deleted, but its file needs cleanup." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
