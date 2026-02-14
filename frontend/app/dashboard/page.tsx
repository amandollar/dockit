"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FileText, FolderOpen, ArrowRight, BarChart3 } from "lucide-react";

const cards = [
  {
    href: "/dashboard/workspaces",
    title: "Workspaces",
    description: "Create workspaces and invite your team. Organize documents by project.",
    cta: "View workspaces",
    icon: FolderOpen,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    borderColor: "hover:border-amber-200",
  },
  {
    href: "/dashboard/summarize",
    title: "Summarize",
    description: "Upload a PDF or doc and get an AI summary you can copy in seconds.",
    cta: "Summarize a document",
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    borderColor: "hover:border-blue-200",
  },
  {
    href: "/dashboard/analytics",
    title: "Analytics",
    description: "Track your activity streak and see how often you're in the flow.",
    cta: "View analytics",
    icon: BarChart3,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
    borderColor: "hover:border-violet-200",
  },
];

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <main className="min-h-screen bg-neutral-50">
      <DashboardHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 max-w-6xl">
        {/* Welcome block */}
        <div className="mb-10 lg:mb-12">
          <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Dashboard
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
            Welcome back,{" "}
            <span className="relative inline-block font-hand text-3xl md:text-4xl text-neutral-800">
              <span className="relative z-10">{user.name?.split(" ")[0] ?? user.name}</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-amber-200/80 -z-10 rotate-[-0.5deg] rounded-sm" aria-hidden />
            </span>
          </h1>
          <p className="text-neutral-600 mt-2 max-w-xl">
            Upload docs, get AI summaries, and ask questions—all in one place.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex flex-col p-6 rounded-2xl bg-white border-2 border-neutral-200 ${item.borderColor} shadow-sm hover:shadow-lg transition-all duration-200 text-left`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <span
                    className={`flex w-12 h-12 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor} transition-transform group-hover:scale-105`}
                  >
                    <Icon className="w-6 h-6" />
                  </span>
                  <h2 className="font-semibold text-lg text-neutral-900">{item.title}</h2>
                </div>
                <p className="text-neutral-600 text-sm leading-relaxed flex-1 mb-5">
                  {item.description}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 group-hover:text-neutral-900 transition-colors">
                  {item.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>

        {/* Subtle tip */}
        <p className="mt-8 text-center text-sm text-neutral-400">
          Use the nav above to jump to Workspaces, Summarize, or Analytics anytime.
        </p>
      </div>
    </main>
  );
}
