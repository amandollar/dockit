"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { FileText, LogOut, User } from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-[#FDFBF7]/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl h-14 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-bold text-lg flex items-center gap-2 text-neutral-900"
        >
          <FileText className="w-5 h-5" />
          DOCIT
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Analytics
          </Link>
          <Link
            href="/"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Home
          </Link>
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
            <Link
              href="/dashboard/profile"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-[#FDFBF7]"
              aria-label="Profile"
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt=""
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-neutral-200 object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-xs font-medium border-2 border-neutral-100"
                  aria-hidden
                >
                  {getInitials(user.name) || <User className="w-4 h-4" />}
                </div>
              )}
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1" />
              Log out
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
