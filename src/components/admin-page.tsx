"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  FileUp,
  GraduationCap,
  KeyRound,
  Layers,
  LogOut,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { parsePaperFilename } from "@/lib/paper-parser";
import { CSE_SPECIALIZATIONS, OTHER_BRANCHES } from "@/lib/constants";

type Paper = {
  id: string;
  paperCode: string;
  title: string;
  branch: string;
  semester: number;
  examYear: number;
};

type PaperDetails = Omit<Paper, "id">;

interface SmartQueueItem {
  id: string;
  file: File;
  paperCode: string;
  title: string;
  examYear: number;
  branch: string;
  semester: number;
  isValid: boolean;
}

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PaperDetails | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Upload technique mode: "smart" (auto-detect) or "manual"
  const [uploadMode, setUploadMode] = useState<"smart" | "manual">("smart");

  // Smart upload state
  const [smartBranch, setSmartBranch] = useState("");
  const [smartSemester, setSmartSemester] = useState<number>(6);
  const [smartQueue, setSmartQueue] = useState<SmartQueueItem[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Manual upload form state
  const [manualTitle, setManualTitle] = useState("");
  const [manualPaperCode, setManualPaperCode] = useState("");
  const [manualBranch, setManualBranch] = useState("");
  const [manualSemester, setManualSemester] = useState<number>(6);
  const [manualExamYear, setManualExamYear] = useState<number>(new Date().getFullYear());
  const [manualAutoDetected, setManualAutoDetected] = useState(false);

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

  // Handle files selected for Smart Auto-Detect Upload
  function handleSmartFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: SmartQueueItem[] = Array.from(files).map((file) => {
      const parsed = parsePaperFilename(file.name);
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        paperCode: parsed.paperCode,
        title: parsed.title,
        examYear: parsed.examYear,
        branch: smartBranch,
        semester: smartSemester,
        isValid: parsed.isValid,
      };
    });

    setSmartQueue((prev) => [...prev, ...newItems]);
    e.target.value = "";
  }

  function updateQueueItem(id: string, updates: Partial<SmartQueueItem>) {
    setSmartQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }

  function removeQueueItem(id: string) {
    setSmartQueue((prev) => prev.filter((item) => item.id !== id));
  }

  // Upload all items in Smart Queue
  async function handleUploadSmartQueue(e: FormEvent) {
    e.preventDefault();
    if (!smartBranch) {
      setError("Please select a branch for the question papers.");
      return;
    }
    if (!smartSemester) {
      setError("Please select a semester.");
      return;
    }
    if (smartQueue.length === 0) {
      setError("Please select at least one PDF file.");
      return;
    }

    // Validate each item
    for (const item of smartQueue) {
      if (!item.paperCode || !item.title || !item.examYear) {
        setError(`Please fill in all details for "${item.file.name}".`);
        return;
      }
    }

    setBusy(true);
    setError("");
    setMessage("");

    let successCount = 0;
    const failedNames: string[] = [];

    for (let i = 0; i < smartQueue.length; i++) {
      setUploadingIndex(i);
      const item = smartQueue[i];

      const formData = new FormData();
      formData.append("paperCode", item.paperCode.trim());
      formData.append("title", item.title.trim());
      formData.append("branch", item.branch || smartBranch);
      formData.append("semester", String(item.semester || smartSemester));
      formData.append("examYear", String(item.examYear));
      formData.append("file", item.file);

      try {
        const response = await fetch("/api/admin/papers", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error || `Failed to upload ${item.paperCode}`);
        }
        successCount++;
      } catch (err) {
        failedNames.push(
          `${item.paperCode || item.file.name}: ${err instanceof Error ? err.message : "Error"}`
        );
      }
    }

    setUploadingIndex(null);
    setBusy(false);

    if (successCount > 0) {
      await loadPapers();
    }

    if (failedNames.length === 0) {
      setMessage(`Successfully uploaded ${successCount} ${successCount === 1 ? "paper" : "papers"} to the library!`);
      setSmartQueue([]);
    } else if (successCount > 0) {
      setMessage(`Uploaded ${successCount} papers. However, ${failedNames.length} had errors: ${failedNames.join(", ")}`);
      setSmartQueue((prev) =>
        prev.filter((_, idx) => failedNames.some((fn) => fn.includes(prev[idx]?.paperCode || "")))
      );
    } else {
      setError(`Failed to upload: ${failedNames.join(", ")}`);
    }
  }

  // Handle file select in manual form — auto-fills Title (<subjectName PYQ YEAR>), Code, Year
  function handleManualFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const parsed = parsePaperFilename(file.name);
    if (parsed.isValid) {
      setManualTitle(parsed.title);
      setManualPaperCode(parsed.paperCode);
      setManualExamYear(parsed.examYear);
      setManualAutoDetected(true);
    } else {
      setManualAutoDetected(false);
    }
  }

  // Submit manual form
  async function handleManualUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualBranch) {
      setError("Please select a branch.");
      return;
    }

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
      setManualTitle("");
      setManualPaperCode("");
      setManualAutoDetected(false);
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

  function startEditing(paper: Paper) {
    setEditingPaperId(paper.id);
    setEditDraft({
      paperCode: paper.paperCode,
      title: paper.title,
      branch: paper.branch,
      semester: paper.semester,
      examYear: paper.examYear,
    });
    setError("");
    setMessage("");
  }

  async function handleEditPaper(event: FormEvent<HTMLFormElement>, paperId: string) {
    event.preventDefault();
    if (!editDraft) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/papers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paperId, ...editDraft }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to update paper details.");

      setEditingPaperId(null);
      setEditDraft(null);
      setMessage("Paper details updated.");
      await loadPapers();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update paper details.");
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
    <main className="mx-auto min-h-screen max-w-[1180px] px-5 py-8 sm:px-8 sm:py-12">
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
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">Upload & Manage Papers</h1>
        <p className="mt-2 text-sm text-[#75827b]">Upload question papers using Smart Filename Auto-Detection or the manual form.</p>
      </div>

      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-[#d8e7c9] bg-[#f1f7e9] px-4 py-3 text-sm text-[#3f6a40]"><Check size={16} />{message}</p>}

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-[#e7eae3] bg-white p-6 sm:p-8">
          
          {/* Technique Tabs */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0ea] pb-5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode("smart")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  uploadMode === "smart"
                    ? "bg-[#145c42] text-white shadow-xs"
                    : "border border-[#e1e6df] bg-[#fafbf9] text-[#55665b] hover:bg-[#f1f4ee]"
                }`}
              >
                <Sparkles size={14} className={uploadMode === "smart" ? "text-[#d8f36a]" : ""} />
                Smart Filename Upload
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("manual")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  uploadMode === "manual"
                    ? "bg-[#145c42] text-white shadow-xs"
                    : "border border-[#e1e6df] bg-[#fafbf9] text-[#55665b] hover:bg-[#f1f4ee]"
                }`}
              >
                <Layers size={14} />
                Manual Form
              </button>
            </div>
            <span className="text-[11px] font-medium text-[#87928a]">PDF only · up to 20 MB</span>
          </div>

          {/* ────────────────── TECHNIQUE 1: SMART FILENAME AUTO-DETECT ────────────────── */}
          {uploadMode === "smart" && (
            <div className="space-y-5">
              {/* Naming Pattern Info Card */}
              <div className="rounded-xl border border-[#d8e7c9] bg-[#f7faf4] p-4 text-xs text-[#315739]">
                <div className="flex items-start gap-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#145c42] text-[11px] font-black text-[#d8f36a]">
                    ⚡
                  </span>
                  <div className="leading-relaxed">
                    <p className="font-bold text-[#145c42]">Smart Filename Format</p>
                    <p className="mt-1 text-[#506e57]">
                      Format: <code className="rounded bg-[#e8f1e2] px-1.5 py-0.5 font-mono font-bold text-[#1b3d2b]">papercode-subjectName-year.pdf</code>
                    </p>
                    <p className="mt-1 text-[11px] text-[#638069]">
                      Example: <span className="font-semibold text-[#145c42]">155612-Python-Programming-2024.pdf</span>
                      <br />
                      Auto-detects: Code: <span className="font-semibold text-[#145c42]">155612</span> · Year: <span className="font-semibold text-[#145c42]">2024</span> · Title: <span className="font-bold text-[#145c42]">Python Programming PYQ 2024</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Branch & Semester Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Branch
                  <select
                    value={smartBranch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSmartBranch(val);
                      // Update items in queue that haven't set branch yet
                      setSmartQueue((prev) => prev.map((item) => ({ ...item, branch: val })));
                    }}
                    required
                    className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]"
                  >
                    <option value="" disabled>Select branch</option>
                    <optgroup label="── Computer Science & Allied ──">
                      {CSE_SPECIALIZATIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </optgroup>
                    <optgroup label="── Other Engineering ──">
                      {OTHER_BRANCHES.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </optgroup>
                  </select>
                </label>

                <label className="block text-sm font-semibold">
                  Semester
                  <select
                    value={smartSemester}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSmartSemester(val);
                      setSmartQueue((prev) => prev.map((item) => ({ ...item, semester: val })));
                    }}
                    className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Multi-file dropzone */}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ccd9c7] bg-[#f9fbf8] p-6 text-center transition hover:border-[#145c42] hover:bg-[#f2f7ef]">
                <div className="grid size-12 place-items-center rounded-full bg-[#eef5e9] text-[#145c42]">
                  <UploadCloud size={24} />
                </div>
                <span className="mt-2 text-sm font-bold text-[#145c42]">Choose PDF files or drop them here</span>
                <span className="mt-0.5 text-xs text-[#7d8b80]">
                  Select one or multiple papers named <code className="font-mono text-[#385b3f]">code-subject-year.pdf</code>
                </span>
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  onChange={handleSmartFileSelect}
                  className="hidden"
                />
              </label>

              {/* Queue of Detected Papers */}
              {smartQueue.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#78914e]">
                      Detected Papers ({smartQueue.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => setSmartQueue([])}
                      className="text-xs font-semibold text-[#87928a] hover:text-red-600"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-3">
                    {smartQueue.map((item, index) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 transition ${
                          uploadingIndex === index
                            ? "border-[#145c42] bg-[#f3f8f0]"
                            : item.isValid
                            ? "border-[#e0e7dc] bg-[#fafbf9]"
                            : "border-amber-200 bg-amber-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={18} className="shrink-0 text-[#145c42]" />
                            <span className="truncate text-xs font-semibold text-[#253229]">
                              {item.file.name}
                            </span>
                            <span className="shrink-0 text-[10px] text-[#87928a]">
                              ({formatSize(item.file.size)})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.isValid ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#eaf1e7] px-2 py-0.5 text-[10px] font-bold text-[#145c42]">
                                <CheckCircle2 size={11} /> Auto-detected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <AlertCircle size={11} /> Check details
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeQueueItem(item.id)}
                              className="grid size-6 place-items-center rounded-md text-[#98a29b] hover:bg-[#eaece8] hover:text-red-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Editable parsed fields */}
                        <div className="mt-3 grid gap-3 sm:grid-cols-12">
                          <div className="sm:col-span-3">
                            <label className="text-[11px] font-semibold text-[#5a6b5f]">Paper Code</label>
                            <input
                              value={item.paperCode}
                              onChange={(e) => updateQueueItem(item.id, { paperCode: e.target.value })}
                              placeholder="e.g. 155612"
                              className="mt-1 w-full rounded-lg border border-[#dce2d9] bg-white px-2.5 py-1.5 font-mono text-xs outline-none focus:border-[#145c42]"
                            />
                          </div>

                          <div className="sm:col-span-7">
                            <label className="text-[11px] font-semibold text-[#5a6b5f]">
                              Title <span className="font-normal text-[#87928a]">(format: &lt;subjectName PYQ YEAR&gt;)</span>
                            </label>
                            <input
                              value={item.title}
                              onChange={(e) => updateQueueItem(item.id, { title: e.target.value })}
                              placeholder="e.g. Python Programming PYQ 2024"
                              className="mt-1 w-full rounded-lg border border-[#dce2d9] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1b261f] outline-none focus:border-[#145c42]"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-semibold text-[#5a6b5f]">Year</label>
                            <input
                              type="number"
                              value={item.examYear}
                              onChange={(e) => updateQueueItem(item.id, { examYear: Number(e.target.value) })}
                              className="mt-1 w-full rounded-lg border border-[#dce2d9] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#145c42]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submit Smart Upload button */}
                  <button
                    type="button"
                    onClick={handleUploadSmartQueue}
                    disabled={busy || smartQueue.length === 0}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#145c42] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#104d37] disabled:opacity-60 shadow-xs"
                  >
                    <FileUp size={17} />
                    {busy
                      ? `Uploading paper ${uploadingIndex !== null ? uploadingIndex + 1 : 1} of ${smartQueue.length}…`
                      : `Upload ${smartQueue.length} ${smartQueue.length === 1 ? "Paper" : "Papers"} to Library`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ────────────────── TECHNIQUE 2: MANUAL FORM UPLOAD ────────────────── */}
          {uploadMode === "manual" && (
            <form onSubmit={handleManualUpload} className="space-y-4">
              {manualAutoDetected && (
                <div className="flex items-center gap-2 rounded-xl border border-[#d8e7c9] bg-[#f1f7e9] px-3.5 py-2 text-xs font-semibold text-[#315739]">
                  <Sparkles size={14} className="text-[#145c42]" />
                  Auto-filled details from PDF filename! You can review or adjust below.
                </div>
              )}

              <label className="block text-sm font-semibold">
                Paper title
                <input
                  name="title"
                  required
                  maxLength={160}
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Python Programming PYQ 2024"
                  className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Paper code
                  <input
                    name="paperCode"
                    required
                    maxLength={40}
                    value={manualPaperCode}
                    onChange={(e) => setManualPaperCode(e.target.value)}
                    pattern="[A-Za-z0-9_-]+"
                    title="Use letters, numbers, hyphens, or underscores."
                    placeholder="e.g. 155612"
                    className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Branch
                  <select
                    name="branch"
                    required
                    value={manualBranch}
                    onChange={(e) => setManualBranch(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]"
                  >
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
                  <select
                    name="semester"
                    required
                    value={manualSemester}
                    onChange={(e) => setManualSemester(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold">
                  Exam year
                  <input
                    name="examYear"
                    type="number"
                    required
                    min={2000}
                    max={new Date().getFullYear() + 1}
                    value={manualExamYear}
                    onChange={(e) => setManualExamYear(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-[#e1e6df] bg-[#fafbf9] px-4 py-3 text-sm outline-none focus:border-[#145c42]"
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold">
                PDF file
                <input
                  name="file"
                  type="file"
                  required
                  accept="application/pdf"
                  onChange={handleManualFileSelect}
                  className="mt-2 block w-full text-xs text-[#75827b] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f0f4eb] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#385b3f] hover:file:bg-[#e4ebd9]"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#145c42] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#104d37] disabled:opacity-60 shadow-xs"
              >
                <FileUp size={17} /> {busy ? "Uploading paper…" : "Upload to library"}
              </button>
            </form>
          )}
        </div>

        {/* Recently Added Papers */}
        <div className="rounded-2xl border border-[#e7eae3] bg-white p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Recently added</h2>
              <p className="mt-1 text-xs text-[#87928a]">{papers.length} papers in the library</p>
            </div>
            <Link href="/" className="text-xs font-semibold text-[#557454] hover:text-[#145c42]">
              View library
            </Link>
          </div>
          {papers.length === 0 ? (
            <div className="rounded-xl bg-[#f7f8f5] px-4 py-10 text-center text-sm text-[#87928a]">
              No papers have been uploaded yet.
            </div>
          ) : (
            <ul className="divide-y divide-[#edf0eb]">
              {papers.slice(0, 15).map((paper) => (
                <li key={paper.id} className="py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1b261f]">{paper.title}</p>
                      <p className="mt-1 text-[11px] text-[#87928a]">
                        {paper.paperCode} · {paper.branch} · Sem {paper.semester} · {paper.examYear}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(paper)}
                        disabled={busy}
                        aria-label={`Edit ${paper.paperCode}`}
                        className="grid size-9 place-items-center rounded-lg text-[#87928a] transition hover:bg-[#f0f4eb] hover:text-[#145c42] disabled:opacity-50"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(paper)}
                        disabled={busy}
                        aria-label={`Delete ${paper.paperCode}`}
                        className="grid size-9 place-items-center rounded-lg text-[#98a29b] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {editingPaperId === paper.id && editDraft && (
                    <form onSubmit={(event) => handleEditPaper(event, paper.id)} className="mt-3 grid gap-3 rounded-xl bg-[#f8faf6] p-4 sm:grid-cols-2">
                      <label className="block text-xs font-semibold text-[#55665b]">
                        Paper name
                        <input
                          required
                          minLength={2}
                          maxLength={160}
                          value={editDraft.title}
                          onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })}
                          className="mt-1.5 w-full rounded-lg border border-[#e1e6df] bg-white px-3 py-2 text-sm outline-none focus:border-[#145c42]"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-[#55665b]">
                        Paper code
                        <input
                          required
                          minLength={2}
                          maxLength={40}
                          pattern="[A-Za-z0-9_-]+"
                          value={editDraft.paperCode}
                          onChange={(event) => setEditDraft({ ...editDraft, paperCode: event.target.value })}
                          className="mt-1.5 w-full rounded-lg border border-[#e1e6df] bg-white px-3 py-2 text-sm outline-none focus:border-[#145c42]"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-[#55665b]">
                        Branch
                        <input
                          required
                          minLength={2}
                          maxLength={100}
                          value={editDraft.branch}
                          onChange={(event) => setEditDraft({ ...editDraft, branch: event.target.value })}
                          className="mt-1.5 w-full rounded-lg border border-[#e1e6df] bg-white px-3 py-2 text-sm outline-none focus:border-[#145c42]"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block text-xs font-semibold text-[#55665b]">
                          Semester
                          <select
                            required
                            value={editDraft.semester}
                            onChange={(event) => setEditDraft({ ...editDraft, semester: Number(event.target.value) })}
                            className="mt-1.5 w-full rounded-lg border border-[#e1e6df] bg-white px-3 py-2 text-sm outline-none focus:border-[#145c42]"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                              <option key={semester} value={semester}>Semester {semester}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs font-semibold text-[#55665b]">
                          Exam year
                          <input
                            required
                            type="number"
                            min={2000}
                            max={new Date().getFullYear() + 1}
                            value={editDraft.examYear}
                            onChange={(event) => setEditDraft({ ...editDraft, examYear: Number(event.target.value) })}
                            className="mt-1.5 w-full rounded-lg border border-[#e1e6df] bg-white px-3 py-2 text-sm outline-none focus:border-[#145c42]"
                          />
                        </label>
                      </div>
                      <div className="flex justify-end gap-2 sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPaperId(null);
                            setEditDraft(null);
                          }}
                          disabled={busy}
                          className="rounded-lg border border-[#e1e6df] bg-white px-3 py-2 text-xs font-semibold text-[#607066] hover:bg-[#f1f4ee] disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#145c42] px-3 py-2 text-xs font-bold text-white hover:bg-[#104d37] disabled:opacity-50"
                        >
                          <Save size={14} /> {busy ? "Saving…" : "Save changes"}
                        </button>
                      </div>
                    </form>
                  )}
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
