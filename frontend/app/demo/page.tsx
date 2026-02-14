"use client";

import Link from "next/link";
import { FileText, Sparkles, MessageCircle, ArrowLeft } from "lucide-react";

const DEMO_WORKSPACE = {
  name: "Q4 Policy Review",
  description: "Company policies and compliance docs for 2024 review.",
};

const DEMO_DOCS = [
  { title: "Policy 2024.pdf", size: "1.2 MB", date: "Nov 15, 2024", hasSummary: true },
  { title: "Travel Guidelines.docx", size: "890 KB", date: "Nov 10, 2024", hasSummary: false },
  { title: "Compliance Checklist.pdf", size: "456 KB", date: "Nov 5, 2024", hasSummary: false },
];

const DEMO_SUMMARY = `This policy document outlines the key updates for 2024, including revised remote work guidelines, updated travel and expense policies, and new compliance requirements. The main changes affect approval workflows for expenses over $500 and mandatory training deadlines by end of Q1.`;

const DEMO_QUESTION = "What are the key policy changes?";
const DEMO_ANSWER = `The key policy changes for 2024 are: (1) Revised remote work guidelines with a minimum of 2 days per week in office for hybrid roles; (2) Updated travel and expense policies—expenses over $500 now require pre-approval; (3) New compliance requirements including mandatory training to be completed by end of Q1 2024.`;

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      {/* Demo header — no auth required */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg flex items-center gap-2 text-neutral-900">
            <span className="flex w-8 h-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
              <FileText className="w-4 h-4" />
            </span>
            DOCIT
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Back to home
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm mb-6">
          <strong>Demo mode.</strong> This is a read-only preview. Sign up to create your own workspaces and upload documents.
        </p>

        {/* Workspace info */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-xl font-semibold text-neutral-900">{DEMO_WORKSPACE.name}</h1>
          <p className="text-neutral-600 text-sm mt-1">{DEMO_WORKSPACE.description}</p>
        </div>

        {/* Documents */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
              Documents
              <span className="font-normal normal-case text-neutral-500">({DEMO_DOCS.length})</span>
            </h2>
            <p className="text-neutral-500 text-sm mt-0.5">Upload PDFs, Word, Excel, and more. Get AI summaries and ask questions.</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {DEMO_DOCS.map((doc, i) => (
              <div
                key={doc.title}
                className={`px-5 py-4 ${i === 0 ? "bg-violet-50/40" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-600/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900">{doc.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {doc.size} · {doc.date}
                    </p>
                    {i === 0 && doc.hasSummary && (
                      <>
                        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-violet-700">
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Summary
                        </div>
                        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                          {DEMO_SUMMARY}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-violet-700">
                          <MessageCircle className="w-3.5 h-3.5" />
                          Ask about this doc
                        </div>
                        <div className="mt-2 rounded-lg bg-neutral-50 border border-neutral-100 p-3 space-y-2">
                          <p className="text-xs text-neutral-500 font-medium">Q: {DEMO_QUESTION}</p>
                          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{DEMO_ANSWER}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-xl border-2 border-dashed border-neutral-200 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-neutral-900">Ready to try it for real?</h2>
          <p className="text-neutral-600 text-sm mt-1 max-w-md mx-auto">
            Create your own workspace, upload documents, and get AI summaries and answers in seconds.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 px-6 py-3 text-sm font-medium mt-4 transition-colors"
          >
            Sign up with Google — it&apos;s free
          </Link>
        </div>
      </div>
    </main>
  );
}
