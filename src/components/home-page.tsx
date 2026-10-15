"use client";

import { STUDENT_BRANCH_GROUPS } from "@/lib/constants";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  Code2,
  Cog,
  Cpu,
  FileText,
  GraduationCap,
  Radio,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
  Network,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Paper = {
  id: string;
  paperCode: string;
  title: string;
  branch: string;
  semester: number;
  examYear: number;
  fileSize: number;
};

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getBranchIcon(branchLabel: string) {
  switch (branchLabel) {
    case "Computer Science & Engineering":
      return <Code2 className="size-6 text-[#145c42]" />;
    case "Civil Engineering":
      return <Building2 className="size-6 text-[#145c42]" />;
    case "Electrical Engineering":
      return <Zap className="size-6 text-[#145c42]" />;
    case "Electronics & Communication":
      return <Radio className="size-6 text-[#145c42]" />;
    case "Mechanical Engineering":
      return <Cog className="size-6 text-[#145c42]" />;
    case "Information Technology":
      return <Network className="size-6 text-[#145c42]" />;
    default:
      return <Cpu className="size-6 text-[#145c42]" />;
  }
}

export function HomePage() {
  const [selectedGroupLabel, setSelectedGroupLabel] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch papers when branch-group and semester are selected
  useEffect(() => {
    if (!selectedGroupLabel || !selectedSemester) {
      setPapers([]);
      return;
    }

    const group = STUDENT_BRANCH_GROUPS.find((g) => g.label === selectedGroupLabel);
    if (!group) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("semester", String(selectedSemester));
    // Send each branch variant as branches[]
    group.matches.forEach((b) => params.append("branches[]", b));
    if (search.trim()) params.set("search", search.trim());

    setLoading(true);
    fetch(`/api/papers?${params}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unable to load papers right now.");
        return (await r.json()) as { papers: Paper[] };
      })
      .then((data) => {
        setPapers(data.papers);
        setError("");
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") {
          setError(reason.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [selectedGroupLabel, selectedSemester, search]);

  // Group papers by their exact branch name for display
  const papersByBranch = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? papers.filter(
          (p) =>
            p.title.toLowerCase().includes(q) || p.paperCode.toLowerCase().includes(q)
        )
      : papers;

    const map = new Map<string, Paper[]>();
    for (const p of filtered) {
      if (!map.has(p.branch)) map.set(p.branch, []);
      map.get(p.branch)!.push(p);
    }
    return map;
  }, [papers, search]);

  function handleReset() {
    setSelectedGroupLabel(null);
    setSelectedSemester(null);
    setSearch("");
    setPapers([]);
  }

  const currentStep = !selectedGroupLabel ? 1 : !selectedSemester ? 2 : 3;
  const totalFiltered = Array.from(papersByBranch.values()).reduce((s, a) => s + a.length, 0);

  return (
    <main className="min-h-screen bg-[#fafbf9] text-[#1b261f]">
      {/* Header */}
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-5 sm:px-8">
        <button onClick={handleReset} className="flex items-center gap-2.5 text-left transition hover:opacity-90">
          <span className="grid size-10 place-items-center rounded-xl bg-[#145c42] text-[#d8f36a] shadow-sm">
            <GraduationCap size={22} strokeWidth={2.2} />
          </span>
          <div>
            <span className="text-xl font-black tracking-[-0.06em]">
              beu<span className="text-[#77934a]">pyq</span>
            </span>
            <span className="ml-2 hidden rounded-full bg-[#e8eee4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4d5e49] sm:inline-block">
              Bihar Engineering University
            </span>
          </div>
        </button>
        <nav className="flex items-center gap-2">
          <Link href="/contributors" className="rounded-full border border-[#dfe4dc] bg-white px-4 py-2 text-xs font-semibold text-[#4e5b52] shadow-xs transition hover:border-[#145c42] hover:text-[#145c42]">
            Contributors
          </Link>
          <Link href="/admin" className="rounded-full border border-[#dfe4dc] bg-white px-4 py-2 text-xs font-semibold text-[#4e5b52] shadow-xs transition hover:border-[#145c42] hover:text-[#145c42]">
            Admin portal
          </Link>
        </nav>
      </header>

      {/* Hero Banner */}
      <section className="mx-auto max-w-[1240px] px-6 pb-8 pt-3 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#145c42] px-7 py-9 text-white shadow-xl sm:px-12 sm:py-11">
          <div className="pointer-events-none absolute -right-20 -top-40 size-[420px] rounded-full border border-white/10">
            <div className="absolute inset-10 rounded-full border border-white/10" />
          </div>

          <div className="relative z-10 max-w-[720px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#e4f8a4]">
              <Sparkles size={14} /> EXAM QUESTION PAPER PORTAL
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Get your previous year papers in 3 easy steps.
            </h1>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              Select your engineering branch, pick your semester, and download your question papers instantly.
            </p>
          </div>

          {/* Stepper */}
          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-2 border-t border-white/15 pt-5 text-xs font-semibold text-white/90">
            <button
              onClick={() => { setSelectedGroupLabel(null); setSelectedSemester(null); }}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition ${currentStep === 1 ? "bg-[#d8f36a] text-[#145c42] font-bold" : selectedGroupLabel ? "bg-white/20 text-white hover:bg-white/30" : "bg-white/10 text-white/60"}`}
            >
              <span>1</span> {selectedGroupLabel ?? "Select Branch"}
              {selectedGroupLabel && <Check size={14} className="ml-1" />}
            </button>

            <span className="text-white/40">→</span>

            <button
              onClick={() => { if (selectedGroupLabel) setSelectedSemester(null); }}
              disabled={!selectedGroupLabel}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition ${currentStep === 2 ? "bg-[#d8f36a] text-[#145c42] font-bold" : selectedSemester ? "bg-white/20 text-white hover:bg-white/30" : "bg-white/10 text-white/50 cursor-not-allowed"}`}
            >
              <span>2</span> {selectedSemester ? `Semester ${selectedSemester}` : "Select Semester"}
              {selectedSemester && <Check size={14} className="ml-1" />}
            </button>

            <span className="text-white/40">→</span>

            <div className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${currentStep === 3 ? "bg-[#d8f36a] text-[#145c42] font-bold" : "bg-white/10 text-white/50"}`}>
              <span>3</span> Download Papers
            </div>

            {(selectedGroupLabel || selectedSemester) && (
              <button onClick={handleReset} className="ml-auto inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white">
                <RotateCcw size={13} /> Start over
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main flow */}
      <section className="mx-auto max-w-[1240px] px-6 pb-20 sm:px-8">

        {/* STEP 1: Branch Selection */}
        {currentStep === 1 && (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78914e]">Step 1 of 3</span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Choose your Engineering Branch</h2>
              <p className="mt-1 text-sm text-[#6f7e74]">Click on your department to see semesters and papers.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {STUDENT_BRANCH_GROUPS.map((group) => (
                <button
                  key={group.label}
                  onClick={() => setSelectedGroupLabel(group.label)}
                  className="group flex flex-col justify-between rounded-2xl border border-[#e4e9df] bg-white p-6 text-left shadow-xs transition hover:-translate-y-1 hover:border-[#145c42] hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f0f5ec] transition group-hover:bg-[#145c42] [&>svg]:group-hover:text-[#d8f36a]">
                      {getBranchIcon(group.label)}
                    </span>
                    <div>
                      <h3 className="font-bold leading-snug text-[#1b261f] group-hover:text-[#145c42]">{group.label}</h3>
                      <p className="mt-1 text-xs text-[#7d8b80]">
                        {group.matches.length > 1 ? `${group.matches.length} specialisations · ` : ""}8 Semesters
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#f1f4ee] pt-3 text-xs font-semibold text-[#145c42]">
                    <span>Select branch</span>
                    <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Semester Selection */}
        {currentStep === 2 && (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <button onClick={() => setSelectedGroupLabel(null)} className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#5a6b5f] hover:text-[#145c42]">
                  <ArrowLeft size={14} /> Change branch
                </button>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#eaf1e7] px-2.5 py-1 text-xs font-bold text-[#145c42]">{selectedGroupLabel}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#78914e]">· Step 2 of 3</span>
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Select your Semester</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-[#e4e9df] bg-white p-6 text-center shadow-xs transition hover:-translate-y-1 hover:border-[#145c42] hover:bg-[#f3f7f0] hover:shadow-md"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-[#f0f5ec] text-lg font-black text-[#145c42] transition group-hover:bg-[#145c42] group-hover:text-[#d8f36a]">
                    {sem}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-[#1b261f]">Semester {sem}</h3>
                  <p className="mt-1 text-[11px] text-[#7d8b80]">
                    {sem <= 2 ? "First Year" : sem <= 4 ? "Second Year" : sem <= 6 ? "Third Year" : "Final Year"}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#145c42]">
                    View papers <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Papers grouped by exact branch */}
        {currentStep === 3 && (
          <div>
            {/* Header + breadcrumbs */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e7ece3] pb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setSelectedGroupLabel(null)} className="inline-flex items-center gap-1 rounded-lg bg-[#eaf1e7] px-2.5 py-1 text-xs font-semibold text-[#145c42] hover:bg-[#dbe7d7]">
                    {selectedGroupLabel} <span className="text-[10px]">✕</span>
                  </button>
                  <span className="text-xs text-[#87968c]">/</span>
                  <button onClick={() => setSelectedSemester(null)} className="inline-flex items-center gap-1 rounded-lg bg-[#eaf1e7] px-2.5 py-1 text-xs font-semibold text-[#145c42] hover:bg-[#dbe7d7]">
                    Semester {selectedSemester} <span className="text-[10px]">✕</span>
                  </button>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Available Question Papers</h2>
                <p className="mt-1 text-sm text-[#6f7e74]">
                  {loading
                    ? "Loading…"
                    : `${totalFiltered} ${totalFiltered === 1 ? "paper" : "papers"} found · Semester ${selectedSemester}`}
                </p>
              </div>
              <button onClick={() => setSelectedSemester(null)} className="inline-flex items-center gap-2 rounded-xl border border-[#dfe4dc] bg-white px-4 py-2.5 text-xs font-semibold text-[#4e5b52] hover:border-[#145c42]">
                <ArrowLeft size={15} /> Another semester
              </button>
            </div>

            {/* Search */}
            <div className="mb-7">
              <label className="flex items-center gap-3 rounded-2xl border border-[#e4e9df] bg-white px-4 py-3 shadow-xs focus-within:border-[#145c42]">
                <Search size={18} className="shrink-0 text-[#87928a]" />
                <input
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#99a29c]"
                  placeholder="Search by subject name or paper code…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-xs text-[#87928a] hover:text-[#1b261f]">Clear</button>
                )}
              </label>
            </div>

            {/* Loading */}
            {loading && (
              <div className="rounded-2xl border border-[#e4e9df] bg-white p-12 text-center text-sm text-[#7d8b80]">
                Loading question papers…
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
            )}

            {/* Empty state */}
            {!loading && !error && totalFiltered === 0 && (
              <div className="rounded-3xl border border-dashed border-[#d8e0d4] bg-white p-12 text-center">
                <BookOpen size={36} className="mx-auto text-[#9eac9f]" />
                <h3 className="mt-4 text-lg font-bold">No papers uploaded yet for Semester {selectedSemester}</h3>
                <p className="mt-2 mx-auto max-w-[420px] text-sm text-[#75827b]">
                  Question papers for {selectedGroupLabel} (Semester {selectedSemester}) haven't been uploaded yet.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={() => setSelectedSemester(null)} className="rounded-xl bg-[#145c42] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#104d37]">
                    Try another semester
                  </button>
                  <button onClick={handleReset} className="rounded-xl border border-[#dfe4dc] bg-white px-5 py-2.5 text-xs font-semibold text-[#4e5b52]">
                    Change branch
                  </button>
                </div>
              </div>
            )}

            {/* Papers grouped by exact branch */}
            {!loading && !error && totalFiltered > 0 && (
              <div className="space-y-10">
                {Array.from(papersByBranch.entries()).map(([exactBranch, branchPapers]) => (
                  <div key={exactBranch}>
                    {/* Branch section header — always visible */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0f5ec]">
                        <FileText size={17} className="text-[#145c42]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-[#145c42]">{exactBranch}</h3>
                        <p className="text-[11px] text-[#87968c]">{branchPapers.length} {branchPapers.length === 1 ? "paper" : "papers"}</p>
                      </div>
                      <div className="ml-3 h-px flex-1 bg-[#e4e9df]" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {branchPapers.map((paper) => (
                        <article
                          key={paper.id}
                          className="group flex flex-col justify-between gap-4 rounded-2xl border border-[#e4e9df] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#145c42] hover:shadow-md sm:p-6"
                        >
                          <div className="flex gap-4">
                            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f0f5ec] text-[#145c42] transition group-hover:bg-[#145c42] group-hover:text-[#d8f36a]">
                              <FileText size={22} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-base font-bold leading-snug text-[#1b261f]">{paper.title}</h4>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-[#f1f4ee] px-2 py-0.5 font-mono text-[11px] font-bold text-[#3d5042]">
                                  {paper.paperCode}
                                </span>
                                <span className="text-[11px] font-medium text-[#7d8b80]">Exam: {paper.examYear}</span>
                                <span className="text-[11px] text-[#93a096]">· {formatSize(paper.fileSize)}</span>
                              </div>
                            </div>
                          </div>
                          <a
                            href={`/api/papers/${paper.id}/download`}
                            download
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#145c42] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#104d37]"
                            aria-label={`Download ${paper.title}`}
                          >
                            <ArrowDownToLine size={16} /> Download PDF
                          </a>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-center text-xs text-[#839087]">
          <ShieldCheck size={15} /> All papers are verified for Bihar Engineering University students.
        </div>
      </section>

      <footer className="border-t border-[#e7eae3] bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-[#87928a] sm:px-8">
          <span>BEU PYQ · Bihar Engineering University</span>
          <span>Made to make exam preparation easier for engineering students.</span>
        </div>
      </footer>
    </main>
  );
}
