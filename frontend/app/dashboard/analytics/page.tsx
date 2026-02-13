"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getAnalytics, type AnalyticsData } from "@/lib/api";
import { ArrowLeft, Flame, FileText, FolderOpen, Calendar } from "lucide-react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildGrid(days: Array<{ date: string; count: number }>): (number | undefined)[][] {
  const grid: (number | undefined)[][] = Array.from({ length: 7 }, () => Array(53).fill(undefined));
  for (let i = 0; i < days.length; i++) {
    const weekIndex = Math.floor(i / 7);
    const row = new Date(days[i].date + "T12:00:00").getDay();
    if (weekIndex < 53) grid[row][weekIndex] = days[i].count;
  }
  return grid;
}

export default function AnalyticsPage() {
  const { isAuthenticated, loading, getAccessToken, refreshAndGetToken } = useAuth();
  const auth = useMemo(() => ({ getAccessToken, refreshAndGetToken }), [getAccessToken, refreshAndGetToken]);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      setError(null);
      const res = await getAnalytics(auth);
      if (cancelled) return;
      setLoadingData(false);
      if (res.success) setData(res.data);
      else setError(res.error?.message ?? "Failed to load analytics");
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, auth]);

  const grid = useMemo(() => (data?.days ? buildGrid(data.days) : null), [data?.days]);

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

        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Analytics</h1>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : data ? (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{data.streak}</p>
                    <p className="text-sm text-neutral-500">Day streak</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{data.totalDocuments}</p>
                    <p className="text-sm text-neutral-500">Documents uploaded</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{data.totalWorkspaces}</p>
                    <p className="text-sm text-neutral-500">Workspaces</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity grid – LeetCode style */}
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-neutral-500" />
                Activity
              </h2>
              <p className="text-neutral-500 text-sm mb-4">
                Days you signed in, uploaded, or summarized. Green = activity.
              </p>
              {grid && (
                <div className="overflow-x-auto">
                  <div className="inline-flex gap-0.5">
                    <div className="flex flex-col gap-0.5 mr-1 shrink-0">
                      {DAY_LABELS.map((label, i) => (
                        <div key={label} className="h-3 text-[10px] text-neutral-400 leading-tight w-6" style={{ lineHeight: "12px" }}>
                          {i % 2 === 1 ? label : ""}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {grid.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-0.5">
                          {row.map((count, colIndex) => (
                            <div
                              key={colIndex}
                              title={
                                count !== undefined && count > 0
                                  ? `${count} activity`
                                  : "No activity"
                              }
                              className="w-3 h-3 rounded-sm shrink-0 border border-neutral-100 transition-colors"
                              style={{
                                backgroundColor:
                                  count === undefined || count === 0
                                    ? "var(--color-neutral-100, #f5f5f5)"
                                    : count === 1
                                      ? "#86efac"
                                      : count <= 3
                                        ? "#4ade80"
                                        : "#22c55e",
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span>Less</span>
                    <span className="flex gap-0.5">
                      <span className="w-3 h-3 rounded-sm bg-neutral-100" />
                      <span className="w-3 h-3 rounded-sm bg-[#86efac]" />
                      <span className="w-3 h-3 rounded-sm bg-[#4ade80]" />
                      <span className="w-3 h-3 rounded-sm bg-[#22c55e]" />
                    </span>
                    <span>More</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
