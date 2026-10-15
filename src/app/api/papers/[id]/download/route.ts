import { prisma } from "@/lib/db";
import { readPdf } from "@/lib/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });

  try {
    const content = await readPdf(paper.storageName);
    return new Response(new Uint8Array(content), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(content.byteLength),
        "Content-Disposition": `attachment; filename="${paper.paperCode}.pdf"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Failed to read uploaded paper:", error);
    return NextResponse.json({ error: "The paper file is currently unavailable." }, { status: 500 });
  }
}
