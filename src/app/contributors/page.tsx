import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { contributors } from "@/lib/contributors";

export default function ContributorsPage() {
  return (
    <main className="min-h-screen bg-[#fafbf9] text-[#1b261f]">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <span className="grid size-10 place-items-center rounded-xl bg-[#145c42] text-[#d8f36a] shadow-sm">
            <GraduationCap size={22} strokeWidth={2.2} />
          </span>
          <span className="text-xl font-black tracking-[-0.06em]">
            beu<span className="text-[#77934a]">pyq</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[#dfe4dc] bg-white px-4 py-2 text-xs font-semibold text-[#4e5b52] shadow-xs transition hover:border-[#145c42] hover:text-[#145c42]"
        >
          <ArrowLeft size={14} /> Back to papers
        </Link>
      </header>

      <section className="mx-auto max-w-[1000px] px-6 pb-16 pt-8 sm:px-8">
        <div className="rounded-3xl bg-[#145c42] px-7 py-9 text-white shadow-xl sm:px-12 sm:py-11">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e4f8a4]">
            BEU PYQ community
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Our Contributors
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
            Thank you to the students and colleges helping make previous year
            papers easier to find.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[#e7eae3] bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-4 border-b border-[#e7eae3] bg-[#f5f7f3] px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#65736a] sm:px-7">
            <h2>Student</h2>
            <h2>College</h2>
          </div>
          {contributors.length > 0 ? (
            <ul className="divide-y divide-[#e7eae3]">
              {contributors.map((contributor, index) => (
                <li
                  key={`${contributor.studentName}-${contributor.collegeName}-${index}`}
                  className="grid grid-cols-2 gap-4 px-5 py-5 text-sm sm:px-7"
                >
                  <span className="font-semibold text-[#1b261f]">
                    {contributor.studentName}
                  </span>
                  <span className="text-[#65736a]">{contributor.collegeName}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-[#75827b] sm:px-7">
              Contributor details will appear here soon.
            </p>
          )}
        </div>
      </section>

      <footer className="border-t border-[#e7eae3] bg-white">
        <div className="mx-auto max-w-[1240px] px-6 py-6 text-xs text-[#87928a] sm:px-8">
          BEU PYQ · Bihar Engineering University
        </div>
      </footer>
    </main>
  );
}
