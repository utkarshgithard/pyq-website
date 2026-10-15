"use client";

import { ArrowLeft, Check, FileUp, GraduationCap, KeyRound, LogOut, Trash2, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Paper = {
  id: string;
  paperCode: string;
  title: string;
  branch: string;
  semester: number;
  examYear: number;
};

import { CSE_SPECIALIZATIONS, OTHER_BRANCHES } from "@/lib/constants";

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  async function loadPapers() {
    const response = await fetch("/api/papers");
    if (!response.ok) throw new Error("Unable to load the paper library.");
    const data = (await response.json()) as { papers: Paper[] };
    setPapers(data.papers);
  }

  useEffect(() => {
    fetch("/api/admin/session")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to verify your admin session.");
        const data = (await response.json()) as { authenticated: boolean };
        setAuthenticated(data.authenticated);
        if (data.authenticated) return loadPapers();
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unable to load admin.");
        setAuthenticated(false);
      });
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      setAuthenticated(true);
      await loadPapers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/papers", {
        method: "POST",
        body: new FormData(formElement),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to upload paper.");
      formElement.reset();
      setMessage("Paper uploaded successfully. It is now available in the library.");
      await loadPapers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload paper.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(paper: Paper) {
    if (!window.confirm(`Delete ${paper.paperCode} — ${paper.title}?`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/papers?id=${encodeURIComponent(paper.id)}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to delete paper.");
      setMessage("Paper deleted.");
      await loadPapers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete paper.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setPapers([]);
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordError("");
    setPasswordSuccess("");

    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to change password.");
      }
      setPasswordSuccess("Password changed successfully!");
      (event.target as HTMLFormElement).reset();
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 1500);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setPasswordBusy(false);
    }
  }

  if (authenticated === null) {
    return <main className="grid min-h-screen place-items-center text-sm text-[#75827b]">Loading admin…</main>;
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center px-5 py-12">
        <div className="w-full max-w-[430px]">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#607066]">
            <ArrowLeft size={16} /> Back to library
          </Link>
          <div className="rounded-3xl border border-[#e7eae3] bg-white p-7 shadow-[0_24px_60px_-40px_#145c4260] sm:p-9">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#145c42] text-[#d8f36a]">
              <GraduationCap size={25} />
            </span>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.15em] text-[#78914e]">BEU PYQ · ADMIN</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em]">Welcome back.</h1>
            <p className="mt-2 text-sm leading-6 text-[#75827b]">Sign in to upload and manage question papers.</p>
            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <label className="block text-sm font-semibold">
                Username
                <input name="username" required autoComplete="username" defaultValue="admin" className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 outline-none focus:border-[#145c42]" />
              </label>
              <label className="block text-sm font-semibold">
                Password
                <input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 outline-none focus:border-[#145c42]" />
              </label>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button disabled={busy} className="w-full rounded-xl bg-[#145c42] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#104d37] disabled:opacity-60">
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1120px] px-5 py-8 sm:px-8 sm:py-12">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-[#145c42] text-[#d8f36a]"><GraduationCap size={23} /></span>
          <span className="text-lg font-extrabold tracking-[-0.06em]">beu<span className="text-[#77934a]">pyq</span></span>
          <span className="ml-1 rounded-full bg-[#edf1e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#61715d]">Admin</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordError("");
              setPasswordSuccess("");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#e1e6df] bg-white px-4 py-2 text-sm font-semibold text-[#607066] transition hover:border-[#145c42] hover:text-[#145c42]"
          >
            <KeyRound size={15} /> Change password
          </button>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-[#e1e6df] bg-white px-4 py-2 text-sm font-semibold text-[#607066] hover:text-[#145c42]">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </header>

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#78914e]">PAPER MANAGEMENT</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Your library, in good hands.</h1>
        <p className="mt-2 text-sm text-[#75827b]">Upload a previous year paper or manage what students can find.</p>
      </div>

      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-[#d8e7c9] bg-[#f1f7e9] px-4 py-3 text-sm text-[#3f6a40]"><Check size={16} />{message}</p>}

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[#e7eae3] bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#f0f4eb] text-[#497150]"><UploadCloud size={20} /></span>
            <div>
              <h2 className="font-bold">Upload a paper</h2>
              <p className="mt-0.5 text-xs text-[#87928a]">PDF only · up to 20 MB</p>
            </div>
          </div>
          <form onSubmit={handleUpload} className="space-y-4">
            <label className="block text-sm font-semibold">
              Paper title
              <input name="title" required maxLength={160} placeholder="e.g. Engineering Mathematics - I" className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Paper code
                <input name="paperCode" required maxLength={40} pattern="[A-Za-z0-9_-]+" title="Use letters, numbers, hyphens, or underscores." placeholder="e.g. BCS101" className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]" />
              </label>
              <label className="block text-sm font-semibold">
                Branch
                <select name="branch" required defaultValue="" className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]">
                  <option value="" disabled>Select exact branch</option>
                  <optgroup label="── Computer Science & Allied ──">
                    {CSE_SPECIALIZATIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── Other Engineering ──">
                    {OTHER_BRANCHES.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </optgroup>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Semester
                <select name="semester" required defaultValue="" className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]">
                  <option value="" disabled>Select semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Exam year
                <input name="examYear" type="number" required min={2000} max={new Date().getFullYear() + 1} defaultValue={new Date().getFullYear()} className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]" />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              PDF file
              <input name="file" type="file" required accept="application/pdf" className="mt-2 block w-full text-xs text-[#75827b] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f0f4eb] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#385b3f] hover:file:bg-[#e4ebd9]" />
            </label>
            <button disabled={busy} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#145c42] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#104d37] disabled:opacity-60">
              <FileUp size={17} /> {busy ? "Uploading paper…" : "Upload to library"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-[#e7eae3] bg-white p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Recently added</h2>
              <p className="mt-1 text-xs text-[#87928a]">{papers.length} papers in the library</p>
            </div>
            <Link href="/" className="text-xs font-semibold text-[#557454] hover:text-[#145c42]">View library</Link>
          </div>
          {papers.length === 0 ? (
            <div className="rounded-xl bg-[#f7f8f5] px-4 py-10 text-center text-sm text-[#87928a]">No papers have been uploaded yet.</div>
          ) : (
            <ul className="divide-y divide-[#edf0eb]">
              {papers.slice(0, 12).map((paper) => (
                <li key={paper.id} className="flex items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{paper.title}</p>
                    <p className="mt-1 text-[11px] text-[#87928a]">{paper.paperCode} · Sem {paper.semester} · {paper.examYear}</p>
                  </div>
                  <button onClick={() => handleDelete(paper)} disabled={busy} aria-label={`Delete ${paper.paperCode}`} className="grid size-9 shrink-0 place-items-center rounded-lg text-[#98a29b] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[420px] rounded-3xl border border-[#e7eae3] bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#f0f4eb] text-[#145c42]">
                  <KeyRound size={18} />
                </span>
                <h3 className="text-lg font-bold">Change Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="grid size-8 place-items-center rounded-lg text-[#87928a] hover:bg-[#f1f3ef] hover:text-[#2d3830]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs text-[#75827b]">
              Your password hash will be updated directly in your Supabase database.
            </p>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-3.5">
              <label className="block text-xs font-semibold text-[#4e5b52]">
                Current Password
                <input
                  name="currentPassword"
                  type="password"
                  required
                  placeholder="Enter current password"
                  className="mt-1.5 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-3.5 py-2.5 text-sm outline-none focus:border-[#145c42]"
                />
              </label>

              <label className="block text-xs font-semibold text-[#4e5b52]">
                New Password (at least 12 characters)
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength={12}
                  placeholder="Enter new password"
                  className="mt-1.5 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-3.5 py-2.5 text-sm outline-none focus:border-[#145c42]"
                />
              </label>

              <label className="block text-xs font-semibold text-[#4e5b52]">
                Confirm New Password
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={12}
                  placeholder="Confirm new password"
                  className="mt-1.5 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-3.5 py-2.5 text-sm outline-none focus:border-[#145c42]"
                />
              </label>

              {passwordError && (
                <p role="alert" className="text-xs text-red-600 font-medium">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p role="status" className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <Check size={14} /> {passwordSuccess}
                </p>
              )}

              <div className="mt-5 flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-xl border border-[#e1e6df] px-4 py-2.5 text-xs font-semibold text-[#607066] hover:bg-[#f7f8f5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordBusy}
                  className="rounded-xl bg-[#145c42] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#104d37] disabled:opacity-60"
                >
                  {passwordBusy ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
