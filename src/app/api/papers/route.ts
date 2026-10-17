import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const semesterValue = searchParams.get("semester");
  const semester = semesterValue ? Number(semesterValue) : undefined;

  // Support a single `branch` OR multiple `branches[]` for grouped student queries
  const singleBranch = searchParams.get("branch")?.trim();
  const multiBranches = searchParams.getAll("branches[]").map((b) => b.trim()).filter(Boolean);
  const branches = multiBranches.length > 0 ? multiBranches : singleBranch ? [singleBranch] : [];

  if (semester !== undefined && (!Number.isInteger(semester) || semester < 1 || semester > 8)) {
    return NextResponse.json({ error: "Semester must be between 1 and 8." }, { status: 400 });
  }

  try {
    const papers = await prisma.paper.findMany({
      where: {
        ...(branches.length === 1
          ? { branch: branches[0] }
          : branches.length > 1
          ? { branch: { in: branches } }
          : {}),
        ...(semester ? { semester } : {}),
        ...(search
          ? {
              OR: [
                { paperCode: { contains: search, mode: "insensitive" } },
                { title: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        paperCode: true,
        title: true,
        branch: true,
        semester: true,
        examYear: true,
        fileSize: true,
      },
      orderBy: [{ examYear: "desc" }, { branch: "asc" }, { createdAt: "desc" }],
      take: 200,
    });

    return NextResponse.json({ papers });
  } catch (error) {
    console.error("Error fetching papers:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch papers from database.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
