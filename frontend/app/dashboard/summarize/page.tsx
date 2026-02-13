"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { summarizeFile } from "@/lib/api";
import { ArrowLeft, FileText, Sparkles, Loader2, Copy, Check } from "lucide-react";

export default function SummarizePage() {
  const { isAuthenticated, loading, getAccessToken, refreshAndGetToken } = useAuth();
  const auth = { getAccessToken, refreshAndGetToken };

  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [loading, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setSummary(null);
    const res = await summarizeFile(auth, file);
    setSubmitting(false);
    if (res.success) setSummary(res.data.summary);
    else setError(res.error?.message ?? "Summarization failed.");
  };

  const handleCopy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="max-w-2xl space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-neutral-500" />
              Summarize a document
            </h2>
            <p className="text-neutral-500 text-sm mb-4">
              Upload a PDF or text file. We’ll generate a short summary you can copy.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,.txt,text/plain,.csv,text/csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  aria-label="Choose file"
                />
                <div
                  className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center cursor-pointer hover:border-neutral-300 hover:bg-neutral-50/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) setFile(f);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {file ? (
                    <p className="text-neutral-900 font-medium">{file.name}</p>
                  ) : (
                    <p className="text-neutral-500 text-sm">Click or drop a PDF or text file</p>
                  )}
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!file || submitting} className="gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Summarizing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get summary
                    </>
                  )}
                </Button>
                {file && !submitting && (
                  <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                    Clear
                  </Button>
                )}
              </div>
            </form>
          </div>

          {summary && (
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                  Summary
                </h2>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-4">
                <p className="text-neutral-800 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={handleReset}>
                Summarize another
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
