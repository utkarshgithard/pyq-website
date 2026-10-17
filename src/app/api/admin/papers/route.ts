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
    console.error("Failed to save paper metadata:", error);
    return NextResponse.json({ error: "Unable to save paper details." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Unable to read the paper details." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Paper details are required." }, { status: 400 });
  }

  const details = body as Record<string, unknown>;
  const id = typeof details.id === "string" ? details.id.trim() : "";
  const paperCode = typeof details.paperCode === "string" ? details.paperCode.trim() : "";
  const title = typeof details.title === "string" ? details.title.trim() : "";
  const branch = typeof details.branch === "string" ? details.branch.trim() : "";
  const semester = details.semester;
  const examYear = details.examYear;

  if (
    !id ||
    paperCode.length < 2 || paperCode.length > 40 ||
    !/^[A-Za-z0-9_-]+$/.test(paperCode) ||
    title.length < 2 || title.length > 160 ||
    branch.length < 2 || branch.length > 100 ||
    typeof semester !== "number" || !Number.isInteger(semester) || semester < 1 || semester > 8 ||
    typeof examYear !== "number" || !Number.isInteger(examYear) ||
    examYear < 2000 || examYear > new Date().getFullYear() + 1
  ) {
    return NextResponse.json({ error: "Check each paper detail and try again." }, { status: 400 });
  }

  try {
    const paper = await prisma.paper.update({
      where: { id },
      data: { paperCode, title, branch, semester, examYear },
    });
    return NextResponse.json({ paper });
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Paper not found." }, { status: 404 });
      }
    }
    console.error("Failed to update paper metadata:", error);
    return NextResponse.json({ error: "Unable to update paper details." }, { status: 500 });
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
